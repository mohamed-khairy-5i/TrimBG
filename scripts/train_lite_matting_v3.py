#!/usr/bin/env python3
"""Train a lightweight RGB-only matting model with boundary-aware supervision.

This is an experiment for TrimBG. It is designed to be exportable to ONNX and
run through ONNX Runtime Web, while using real alpha mattes as validation.
"""
from __future__ import annotations

import argparse
import json
import random
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from torch import nn
from torch.utils.data import DataLoader, Dataset


IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp")


class DepthwiseBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, stride: int = 1, dilation: int = 1):
        super().__init__()
        padding = dilation
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, in_channels, 3, stride=stride, padding=padding, dilation=dilation, groups=in_channels, bias=False),
            nn.BatchNorm2d(in_channels),
            nn.ReLU6(inplace=True),
            nn.Conv2d(in_channels, out_channels, 1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU6(inplace=True),
        )
        self.skip = nn.Identity() if stride == 1 and in_channels == out_channels else nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 1, stride=stride, bias=False),
            nn.BatchNorm2d(out_channels),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x) + self.skip(x)


def scaled_channels(value: int, width_multiplier: float) -> int:
    """Scale channels in multiples of eight for efficient CPU/WASM kernels."""
    return max(8, int(round(value * width_multiplier / 8.0) * 8))


class LiteMattingV3(nn.Module):
    """Multi-scale RGB-to-alpha network with an explicit detail decoder."""

    def __init__(self, width_multiplier: float = 1.0):
        super().__init__()
        c_stem = scaled_channels(16, width_multiplier)
        c_e1 = scaled_channels(24, width_multiplier)
        c_e2 = scaled_channels(48, width_multiplier)
        c_e3 = scaled_channels(80, width_multiplier)
        c_ctx = scaled_channels(96, width_multiplier)
        c_d3 = scaled_channels(64, width_multiplier)
        c_d2 = scaled_channels(40, width_multiplier)
        c_d1 = scaled_channels(24, width_multiplier)
        c_detail = scaled_channels(16, width_multiplier)
        self.width_multiplier = width_multiplier
        self.stem = nn.Sequential(
            nn.Conv2d(3, c_stem, 3, padding=1, bias=False),
            nn.BatchNorm2d(c_stem),
            nn.ReLU6(inplace=True),
        )
        self.enc1 = DepthwiseBlock(c_stem, c_e1, stride=2)
        self.enc2 = DepthwiseBlock(c_e1, c_e2, stride=2)
        self.enc3 = DepthwiseBlock(c_e2, c_e3, stride=2)
        self.context1 = DepthwiseBlock(c_e3, c_ctx, stride=1, dilation=2)
        self.context2 = DepthwiseBlock(c_ctx, c_ctx, stride=1, dilation=3)

        self.dec3 = DepthwiseBlock(c_ctx + c_e2, c_d3)
        self.dec2 = DepthwiseBlock(c_d3 + c_e1, c_d2)
        self.dec1 = DepthwiseBlock(c_d2 + c_stem, c_d1)
        self.detail = nn.Sequential(
            nn.Conv2d(c_d1, c_d1, 3, padding=1, groups=c_d1, bias=False),
            nn.BatchNorm2d(c_d1),
            nn.ReLU6(inplace=True),
            nn.Conv2d(c_d1, c_detail, 1, bias=False),
            nn.BatchNorm2d(c_detail),
            nn.ReLU6(inplace=True),
        )
        self.head = nn.Conv2d(c_detail, 1, 1)

    @staticmethod
    def up_to(x: torch.Tensor, reference: torch.Tensor) -> torch.Tensor:
        return F.interpolate(x, size=reference.shape[-2:], mode="bilinear", align_corners=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        s = self.stem(x)
        e1 = self.enc1(s)
        e2 = self.enc2(e1)
        e3 = self.enc3(e2)
        c = self.context2(self.context1(e3))
        d3 = self.dec3(torch.cat([self.up_to(c, e2), e2], dim=1))
        d2 = self.dec2(torch.cat([self.up_to(d3, e1), e1], dim=1))
        d1 = self.dec1(torch.cat([self.up_to(d2, s), s], dim=1))
        refined = self.detail(d1)
        return torch.sigmoid(self.head(self.up_to(refined, x)))


def list_pairs(root: Path) -> list[tuple[Path, Path, str]]:
    image_dir, mask_dir = root / "images", root / "masks"
    pairs = []
    if not image_dir.exists():
        return pairs
    for image_path in sorted(image_dir.iterdir()):
        if image_path.suffix.lower() not in IMAGE_EXTS:
            continue
        mask_path = mask_dir / f"{image_path.stem}.png"
        if mask_path.exists():
            pairs.append((image_path, mask_path, root.name))
    return pairs


class MattingDataset(Dataset):
    def __init__(self, pairs: list[tuple[Path, Path, str]], size: int, augment: bool = False):
        self.pairs = pairs
        self.size = size
        self.augment = augment

    def __len__(self) -> int:
        return len(self.pairs)

    def __getitem__(self, index: int):
        image_path, mask_path, _ = self.pairs[index]
        with Image.open(image_path) as image_file, Image.open(mask_path) as mask_file:
            image = image_file.convert("RGB")
            mask = mask_file.convert("L")
        image = ImageOps.fit(image, (self.size, self.size), method=Image.Resampling.BILINEAR, centering=(0.5, 0.5))
        mask = ImageOps.fit(mask, (self.size, self.size), method=Image.Resampling.BILINEAR, centering=(0.5, 0.5))
        if self.augment:
            if random.random() < 0.5:
                image = ImageOps.mirror(image)
                mask = ImageOps.mirror(mask)
            if random.random() < 0.25:
                angle = random.uniform(-8.0, 8.0)
                image = image.rotate(angle, resample=Image.Resampling.BILINEAR, expand=False)
                mask = mask.rotate(angle, resample=Image.Resampling.BILINEAR, expand=False)
            if random.random() < 0.45:
                image = ImageEnhance.Brightness(image).enhance(random.uniform(0.78, 1.22))
                image = ImageEnhance.Contrast(image).enhance(random.uniform(0.78, 1.22))
                image = ImageEnhance.Color(image).enhance(random.uniform(0.75, 1.25))
            if random.random() < 0.25:
                image = image.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.15, 0.8)))
            if random.random() < 0.15:
                image = ImageEnhance.Sharpness(image).enhance(random.uniform(0.5, 1.8))
        x = torch.from_numpy(np.asarray(image, dtype=np.float32).copy()).permute(2, 0, 1) / 255.0
        y = torch.from_numpy(np.asarray(mask, dtype=np.float32).copy())[None] / 255.0
        return x, y


def collect_pairs(roots: list[Path], repeat: int = 1) -> list[tuple[Path, Path, str]]:
    result: list[tuple[Path, Path, str]] = []
    for root in roots:
        pairs = list_pairs(root)
        result.extend(pairs * max(1, repeat if "aim500" in str(root).lower() else 1))
    return result


def boundary_weight(target: torch.Tensor) -> torch.Tensor:
    local = F.avg_pool2d(target, kernel_size=5, stride=1, padding=2)
    transition = torch.abs(local - target)
    return 1.0 + 5.0 * transition


def gradient_map(x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
    gx = x[:, :, :, 1:] - x[:, :, :, :-1]
    gy = x[:, :, 1:, :] - x[:, :, :-1, :]
    return gx, gy


def boundary_aware_loss(
    pred: torch.Tensor,
    target: torch.Tensor,
    bce_weight: float = 0.35,
    grad_weight: float = 0.65,
    dice_weight: float = 0.25,
) -> tuple[torch.Tensor, dict[str, float]]:
    eps = 1e-6
    weights = boundary_weight(target)
    abs_loss = (weights * torch.abs(pred - target)).mean()
    pred_clamped = pred.clamp(eps, 1 - eps)
    bce = -(target * torch.log(pred_clamped) + (1 - target) * torch.log(1 - pred_clamped))
    bce_loss = (weights * bce).mean()
    px, py = gradient_map(pred)
    tx, ty = gradient_map(target)
    grad_loss = torch.abs(px - tx).mean() + torch.abs(py - ty).mean()
    intersection = (pred * target).sum(dim=(1, 2, 3))
    dice = 1.0 - ((2.0 * intersection + 1.0) / (pred.sum(dim=(1, 2, 3)) + target.sum(dim=(1, 2, 3)) + 1.0)).mean()
    total = 1.0 * abs_loss + bce_weight * bce_loss + grad_weight * grad_loss + dice_weight * dice
    return total, {"l1": float(abs_loss.detach()), "bce": float(bce_loss.detach()), "grad": float(grad_loss.detach()), "dice": float(dice.detach())}


def evaluate(
    model: nn.Module,
    loader: DataLoader,
    device: torch.device,
    bce_weight: float = 0.35,
    grad_weight: float = 0.65,
    dice_weight: float = 0.25,
) -> dict[str, float]:
    model.eval()
    total_loss = 0.0
    total_mae = 0.0
    total_grad = 0.0
    count = 0
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            pred = model(x)
            loss, _ = boundary_aware_loss(pred, y, bce_weight, grad_weight, dice_weight)
            gx_p, gy_p = gradient_map(pred)
            gx_y, gy_y = gradient_map(y)
            total_loss += float(loss) * x.size(0)
            total_mae += float(torch.abs(pred - y).mean()) * x.size(0)
            total_grad += float((torch.abs(gx_p - gx_y).mean() + torch.abs(gy_p - gy_y).mean())) * x.size(0)
            count += x.size(0)
    return {"loss": total_loss / max(1, count), "mae": total_mae / max(1, count), "grad": total_grad / max(1, count)}


def parse_roots(text: str | None) -> list[Path]:
    if not text:
        return []
    return [Path(part).expanduser() for part in text.split(",") if part.strip()]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--train-data", required=True, help="comma-separated roots containing images/ and masks/")
    parser.add_argument("--val-data", required=True, help="validation root containing images/ and masks/")
    parser.add_argument("--out", type=Path, default=Path("models/lite-matting-v3"))
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--size", type=int, default=256)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--real-repeat", type=int, default=4)
    parser.add_argument("--limit-train", type=int, default=0)
    parser.add_argument("--limit-val", type=int, default=0)
    parser.add_argument("--patience", type=int, default=6)
    parser.add_argument("--seed", type=int, default=123)
    parser.add_argument("--init", type=Path, default=None, help="optional LiteMattingV3 state_dict checkpoint")
    parser.add_argument("--width-multiplier", type=float, default=1.0, help="channel-width scale; 1.0 preserves the original V3")
    parser.add_argument("--resume", type=Path, default=None, help="resume from a last_checkpoint.pt created by this script")
    parser.add_argument("--threads", type=int, default=2, help="CPU torch threads")
    parser.add_argument("--bce-weight", type=float, default=0.35, help="BCE term weight")
    parser.add_argument("--grad-weight", type=float, default=0.65, help="gradient term weight")
    parser.add_argument("--dice-weight", type=float, default=0.25, help="Dice term weight")
    args = parser.parse_args()

    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    torch.set_num_threads(max(1, args.threads))
    device = torch.device("cpu")

    train_roots = parse_roots(args.train_data)
    val_roots = parse_roots(args.val_data)
    train_pairs = collect_pairs(train_roots, repeat=args.real_repeat)
    val_pairs = collect_pairs(val_roots)
    if args.limit_train:
        train_pairs = train_pairs[: args.limit_train]
    if args.limit_val:
        val_pairs = val_pairs[: args.limit_val]
    if len(train_pairs) < 20 or len(val_pairs) < 5:
        raise SystemExit(f"Not enough pairs: train={len(train_pairs)} val={len(val_pairs)}")

    train_loader = DataLoader(MattingDataset(train_pairs, args.size, augment=True), batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(MattingDataset(val_pairs, args.size, augment=False), batch_size=args.batch_size, shuffle=False, num_workers=0)
    if args.width_multiplier <= 0:
        raise SystemExit("--width-multiplier must be positive")
    args.out.mkdir(parents=True, exist_ok=True)
    model = LiteMattingV3(width_multiplier=args.width_multiplier).to(device)
    resume_checkpoint = None
    if args.resume:
        resume_checkpoint = torch.load(args.resume, map_location="cpu")
        model.load_state_dict(resume_checkpoint["model_state"], strict=True)
        print(json.dumps({"resuming_from": str(args.resume), "epoch": resume_checkpoint["epoch"]}), flush=True)
    elif args.init:
        checkpoint = torch.load(args.init, map_location="cpu")
        if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
            checkpoint = checkpoint["state_dict"]
        model.load_state_dict(checkpoint, strict=True)
        print(json.dumps({"initialized_from": str(args.init)}), flush=True)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=2, min_lr=1e-5)
    best_state = None
    best_loss = float("inf")
    best_epoch = 0
    stale = 0
    history = []
    start_epoch = 1
    if resume_checkpoint:
        optimizer.load_state_dict(resume_checkpoint["optimizer_state"])
        scheduler.load_state_dict(resume_checkpoint["scheduler_state"])
        best_state = resume_checkpoint["best_state"]
        best_loss = resume_checkpoint["best_loss"]
        best_epoch = resume_checkpoint["best_epoch"]
        stale = resume_checkpoint["stale"]
        history = resume_checkpoint["history"]
        start_epoch = resume_checkpoint["epoch"] + 1
    start = time.perf_counter()

    for epoch in range(start_epoch, args.epochs + 1):
        model.train()
        train_loss = 0.0
        train_count = 0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad(set_to_none=True)
            pred = model(x)
            loss, _ = boundary_aware_loss(pred, y, args.bce_weight, args.grad_weight, args.dice_weight)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 3.0)
            optimizer.step()
            train_loss += float(loss.detach()) * x.size(0)
            train_count += x.size(0)
        val = evaluate(model, val_loader, device, args.bce_weight, args.grad_weight, args.dice_weight)
        scheduler.step(val["loss"])
        metrics = {
            "epoch": epoch,
            "lr": optimizer.param_groups[0]["lr"],
            "train_loss": train_loss / max(1, train_count),
            "val_loss": val["loss"],
            "val_mae": val["mae"],
            "val_grad": val["grad"],
            "seconds": time.perf_counter() - start,
        }
        history.append(metrics)
        print(json.dumps(metrics), flush=True)
        if val["loss"] < best_loss:
            best_loss = val["loss"]
            best_epoch = epoch
            best_state = {key: value.detach().cpu().clone() for key, value in model.state_dict().items()}
            stale = 0
        else:
            stale += 1
        torch.save(
            {
                "epoch": epoch,
                "model_state": {key: value.detach().cpu().clone() for key, value in model.state_dict().items()},
                "optimizer_state": optimizer.state_dict(),
                "scheduler_state": scheduler.state_dict(),
                "best_state": best_state,
                "best_loss": best_loss,
                "best_epoch": best_epoch,
                "stale": stale,
                "history": history,
            },
            args.out / "last_checkpoint.pt",
        )
        if stale >= args.patience:
            print(json.dumps({"early_stop": True, "epoch": epoch}), flush=True)
            break

    if best_state is None:
        raise SystemExit("No checkpoint was produced")
    model.load_state_dict(best_state)
    model.eval()
    pt_path = args.out / "lite_matting_v3.pt"
    onnx_path = args.out / f"lite_matting_v3_{args.size}.onnx"
    torch.save(model.state_dict(), pt_path)
    dummy = torch.zeros(1, 3, args.size, args.size)
    torch.onnx.export(model, dummy, onnx_path, input_names=["image"], output_names=["alpha"], opset_version=17, dynamo=False)
    summary = {
        "train_roots": [str(p) for p in train_roots],
        "val_roots": [str(p) for p in val_roots],
        "train_pairs": len(train_pairs),
        "val_pairs": len(val_pairs),
        "size": args.size,
        "width_multiplier": args.width_multiplier,
        "loss_weights": {"bce": args.bce_weight, "grad": args.grad_weight, "dice": args.dice_weight},
        "epochs_requested": args.epochs,
        "best_epoch": best_epoch,
        "best_val_loss": best_loss,
        "parameters": sum(p.numel() for p in model.parameters()),
        "onnx_bytes": onnx_path.stat().st_size,
        "seconds": round(time.perf_counter() - start, 2),
        "history": history,
    }
    (args.out / "training_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({"weights": str(pt_path), "onnx": str(onnx_path), "summary": str(args.out / "training_summary.json")}, indent=2), flush=True)


if __name__ == "__main__":
    main()
