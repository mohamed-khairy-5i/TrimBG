#!/usr/bin/env python3
"""Evaluate an RMBG-1.4 ONNX model on images and alpha masks.

Usage:
  python3 scripts/evaluate_rmbg.py MODEL IMAGE_DIR MASK_DIR OUTPUT_DIR [--limit 100]
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image


def load_rgb(path: Path) -> Image.Image:
    return Image.open(path).convert("RGB")


def preprocess(image: Image.Image, size: int) -> np.ndarray:
    arr = np.asarray(image, dtype=np.float32)
    resized = Image.fromarray(arr.astype(np.uint8)).resize((size, size), Image.Resampling.BILINEAR)
    x = np.asarray(resized, dtype=np.float32) / 255.0
    x = (x - 0.5) / 1.0
    x = np.transpose(x, (2, 0, 1))[None, ...]
    return x.astype(np.float32)


def postprocess(output: np.ndarray, original_size: tuple[int, int]) -> np.ndarray:
    mask = np.squeeze(output).astype(np.float32)
    if mask.ndim != 2:
        raise ValueError(f"Unexpected model output shape after squeeze: {output.shape}")
    lo = float(mask.min())
    hi = float(mask.max())
    if hi > lo:
        mask = (mask - lo) / (hi - lo)
    else:
        mask = np.zeros_like(mask)
    mask_img = Image.fromarray(np.clip(mask * 255.0, 0, 255).astype(np.uint8), mode="L")
    mask_img = mask_img.resize(original_size, Image.Resampling.BILINEAR)
    return np.asarray(mask_img, dtype=np.float32) / 255.0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("model")
    parser.add_argument("image_dir")
    parser.add_argument("mask_dir")
    parser.add_argument("output_dir")
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--size", type=int, default=1024)
    args = parser.parse_args()

    image_dir = Path(args.image_dir)
    mask_dir = Path(args.mask_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    session = ort.InferenceSession(args.model, providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    records = []

    image_paths = sorted(
        p for p in image_dir.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )[: args.limit]

    for image_path in image_paths:
        mask_path = mask_dir / f"{image_path.stem}.png"
        if not mask_path.exists():
            continue
        image = load_rgb(image_path)
        target = np.asarray(Image.open(mask_path).convert("L"), dtype=np.float32) / 255.0
        start = time.perf_counter()
        output = session.run(None, {input_name: preprocess(image, args.size)})[0]
        seconds = time.perf_counter() - start
        predicted = postprocess(output, image.size)
        if predicted.shape != target.shape:
            target = np.asarray(Image.fromarray((target * 255).astype(np.uint8)).resize(image.size, Image.Resampling.BILINEAR), dtype=np.float32) / 255.0
        mae = float(np.mean(np.abs(predicted - target)))

        mask_img = Image.fromarray(np.clip(predicted * 255, 0, 255).astype(np.uint8), mode="L")
        rgba = image.copy()
        rgba.putalpha(mask_img)
        rgba.save(output_dir / f"{image_path.stem}.png")
        records.append({"image": image_path.name, "seconds": seconds, "mae": mae})

    if not records:
        raise SystemExit("No matching image/mask pairs found")
    seconds = [r["seconds"] for r in records]
    maes = [r["mae"] for r in records]
    summary = {
        "model": args.model,
        "model_bytes": Path(args.model).stat().st_size,
        "input_size": args.size,
        "image_count": len(records),
        "mean_seconds": float(np.mean(seconds)),
        "median_seconds": float(np.median(seconds)),
        "mean_mae": float(np.mean(maes)),
        "median_mae": float(np.median(maes)),
        "providers": session.get_providers(),
        "records": records,
    }
    (output_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({k: summary[k] for k in summary if k != "records"}, indent=2))


if __name__ == "__main__":
    main()
