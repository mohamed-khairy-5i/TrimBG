#!/usr/bin/env python3
"""Train a tiny RGB-to-alpha model on generated image/mask pairs.

This is an experiment, not a replacement for a production matting model. It
exports a small fixed-resolution ONNX model for speed/quality comparison.
"""
from __future__ import annotations

import argparse
import json
import random
import time
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torch import nn
from torch.utils.data import DataLoader, Dataset


class MattingDataset(Dataset):
    def __init__(self, pairs: list[tuple[Path, Path]], size: int, augment: bool = False):
        self.pairs = pairs
        self.size = size
        self.augment = augment

    def __len__(self) -> int:
        return len(self.pairs)

    def __getitem__(self, index: int):
        image_path, mask_path = self.pairs[index]
        image = Image.open(image_path).convert("RGB").resize((self.size, self.size), Image.Resampling.BILINEAR)
        mask = Image.open(mask_path).convert("L").resize((self.size, self.size), Image.Resampling.BILINEAR)
        if self.augment:
            if random.random() < 0.5:
                image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                mask = mask.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            if random.random() < 0.35:
                # Mild photometric changes preserve the alpha target while varying capture conditions.
                from PIL import ImageEnhance
                image = ImageEnhance.Brightness(image).enhance(random.uniform(0.82, 1.18))
                image = ImageEnhance.Contrast(image).enhance(random.uniform(0.85, 1.15))
            if random.random() < 0.20:
                # Randomly soften the RGB input only; the target matte remains unchanged.
                from PIL import ImageFilter
                image = image.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.2, 0.7)))
        x = torch.from_numpy(np.asarray(image, dtype=np.float32).copy()).permute(2, 0, 1) / 255.0
        y = torch.from_numpy(np.asarray(mask, dtype=np.float32).copy())[None] / 255.0
        return x, y


class ConvBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.block(x)


class TinyMattingNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.enc1 = ConvBlock(3, 16)
        self.enc2 = ConvBlock(16, 32)
        self.enc3 = ConvBlock(32, 48)
        self.pool = nn.MaxPool2d(2)
        self.bottleneck = ConvBlock(48, 64)
        self.up3 = nn.ConvTranspose2d(64, 48, 2, stride=2)
        self.dec3 = ConvBlock(96, 48)
        self.up2 = nn.ConvTranspose2d(48, 32, 2, stride=2)
        self.dec2 = ConvBlock(64, 32)
        self.up1 = nn.ConvTranspose2d(32, 16, 2, stride=2)
        self.dec1 = ConvBlock(32, 16)
        self.head = nn.Conv2d(16, 1, 1)

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        b = self.bottleneck(self.pool(e3))
        d3 = self.dec3(torch.cat([self.up3(b), e3], dim=1))
        d2 = self.dec2(torch.cat([self.up2(d3), e2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))
        return torch.sigmoid(self.head(d1))


def weighted_bce(pred, target, positive_weight=4.0):
    eps = 1e-6
    pred = pred.clamp(eps, 1 - eps)
    loss = -(positive_weight * target * torch.log(pred) + (1 - target) * torch.log(1 - pred))
    return loss.mean()


def dice_loss(pred, target):
    smooth = 1.0
    intersection = (pred * target).sum(dim=(1, 2, 3))
    return 1 - ((2 * intersection + smooth) / (pred.sum(dim=(1, 2, 3)) + target.sum(dim=(1, 2, 3)) + smooth)).mean()


def pairs_from(root: Path) -> list[tuple[Path, Path]]:
    image_dir, mask_dir = root / "images", root / "masks"
    return [(p, mask_dir / f"{p.stem}.png") for p in sorted(image_dir.glob("*.jpg")) if (mask_dir / f"{p.stem}.png").exists()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path("training_data"), help="legacy single-folder dataset")
    parser.add_argument("--train-data", type=Path, default=None, help="dataset root containing images/ and masks/ for training")
    parser.add_argument("--val-data", type=Path, default=None, help="dataset root containing images/ and masks/ for validation")
    parser.add_argument("--out", type=Path, default=Path("models/tiny-matting"))
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--size", type=int, default=128)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    torch.set_num_threads(2)

    train_root = args.train_data or args.data
    val_root = args.val_data
    train_pairs = pairs_from(train_root)
    val_pairs = pairs_from(val_root) if val_root else []
    if len(train_pairs) < 10:
        raise SystemExit("Need at least 10 image/mask pairs for training")
    if not val_pairs:
        random.shuffle(train_pairs)
        val_count = max(1, int(len(train_pairs) * 0.2))
        val_pairs, train_pairs = train_pairs[:val_count], train_pairs[val_count:]
    if not val_pairs:
        raise SystemExit("Need at least 1 image/mask pair for validation")
    train_loader = DataLoader(MattingDataset(train_pairs, args.size, augment=True), batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(MattingDataset(val_pairs, args.size), batch_size=args.batch_size, shuffle=False, num_workers=0)

    device = torch.device("cpu")
    model = TinyMattingNet().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)
    bce = nn.BCELoss()
    history = []
    best_val_loss = float("inf")
    best_epoch = 0
    best_state = None
    start = time.perf_counter()

    for epoch in range(args.epochs):
        model.train()
        train_loss = 0.0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad(set_to_none=True)
            pred = model(x)
            loss = weighted_bce(pred, y) + dice_loss(pred, y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * x.size(0)
        model.eval()
        val_loss = 0.0
        mae = 0.0
        with torch.no_grad():
            for x, y in val_loader:
                pred = model(x)
                val_loss += (weighted_bce(pred, y) + dice_loss(pred, y)).item() * x.size(0)
                mae += torch.abs(pred - y).mean().item() * x.size(0)
        metrics = {"epoch": epoch + 1, "train_loss": train_loss / len(train_pairs), "val_loss": val_loss / len(val_pairs), "val_mae": mae / len(val_pairs)}
        history.append(metrics)
        if metrics["val_loss"] < best_val_loss:
            best_val_loss = metrics["val_loss"]
            best_epoch = epoch + 1
            best_state = {key: value.detach().cpu().clone() for key, value in model.state_dict().items()}
        print(json.dumps(metrics))

    args.out.mkdir(parents=True, exist_ok=True)
    weights_path = args.out / "tiny_matting.pt"
    onnx_path = args.out / f"tiny_matting_{args.size}.onnx"
    if best_state is not None:
        model.load_state_dict(best_state)
    torch.save(model.state_dict(), weights_path)
    model.eval()
    dummy = torch.zeros(1, 3, args.size, args.size)
    torch.onnx.export(model, dummy, onnx_path, input_names=["image"], output_names=["alpha"], opset_version=17, dynamo=False)
    summary = {"pairs": len(train_pairs) + len(val_pairs), "train_pairs": len(train_pairs), "val_pairs": len(val_pairs), "size": args.size, "epochs": args.epochs, "best_epoch": best_epoch, "best_val_loss": best_val_loss, "seconds": round(time.perf_counter() - start, 2), "parameters": sum(p.numel() for p in model.parameters()), "history": history}
    (args.out / "training_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({"weights": str(weights_path), "onnx": str(onnx_path), "summary": str(args.out / 'training_summary.json'), "seconds": summary["seconds"], "parameters": summary["parameters"]}))


if __name__ == "__main__":
    main()
