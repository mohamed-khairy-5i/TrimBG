#!/usr/bin/env python3
"""Benchmark MODNet ONNX on real validation images.

MODNet is intended for portrait matting. The script keeps preprocessing explicit
and records latency, output range, and saved RGBA previews for visual review.
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image


def preprocess(image: Image.Image, size: int) -> np.ndarray:
    resized = image.resize((size, size), Image.Resampling.BILINEAR)
    array = np.asarray(resized, dtype=np.float32) / 255.0
    mean = np.asarray([0.5, 0.5, 0.5], dtype=np.float32)
    std = np.asarray([0.5, 0.5, 0.5], dtype=np.float32)
    return ((array - mean) / std).transpose(2, 0, 1)[None].astype(np.float32)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, default=Path("public/models/modnet/model_quantized.onnx"))
    parser.add_argument("--images", type=Path, default=Path("external_data/aim500/val/images"))
    parser.add_argument("--masks", type=Path, default=Path("external_data/aim500/val/masks"))
    parser.add_argument("--out", type=Path, default=Path("experiments/modnet/eval-aim"))
    parser.add_argument("--size", type=int, default=256)
    parser.add_argument("--limit", type=int, default=100)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    session = ort.InferenceSession(str(args.model), providers=["CPUExecutionProvider"])
    input_meta = session.get_inputs()[0]
    output_meta = session.get_outputs()[0]
    paths = sorted(p for p in args.images.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})[: args.limit]
    records: list[dict] = []
    latencies: list[float] = []
    mae_values: list[float] = []

    for path in paths:
        original = Image.open(path).convert("RGB")
        tensor = preprocess(original, args.size)
        start = time.perf_counter()
        raw = session.run([output_meta.name], {input_meta.name: tensor})[0]
        elapsed = time.perf_counter() - start
        latencies.append(elapsed)
        output = np.asarray(raw).squeeze()
        if output.min() < 0.0 or output.max() > 1.0:
            output = 1.0 / (1.0 + np.exp(-np.clip(output, -30.0, 30.0)))
        output = np.clip(output, 0.0, 1.0)
        low, high = float(output.min()), float(output.max())
        alpha = Image.fromarray(np.round(output * 255.0).astype(np.uint8), "L").resize(original.size, Image.Resampling.BILINEAR)
        rgba = original.convert("RGBA")
        rgba.putalpha(alpha)
        out_path = args.out / f"{path.stem}.png"
        rgba.save(out_path)

        mask_path = args.masks / f"{path.stem}.png"
        mae = None
        if mask_path.exists():
            truth = np.asarray(Image.open(mask_path).convert("L").resize(original.size, Image.Resampling.BILINEAR), dtype=np.float32) / 255.0
            predicted = np.asarray(alpha, dtype=np.float32) / 255.0
            mae = float(np.mean(np.abs(predicted - truth)))
            mae_values.append(mae)
        records.append({"image": path.name, "seconds": round(elapsed, 4), "range": [round(low, 4), round(high, 4)], "mae": None if mae is None else round(mae, 6), "output": str(out_path)})

    summary = {
        "model": str(args.model),
        "model_bytes": args.model.stat().st_size,
        "input_size": args.size,
        "image_count": len(records),
        "mean_seconds": round(float(np.mean(latencies)), 4) if latencies else None,
        "median_seconds": round(float(np.median(latencies)), 4) if latencies else None,
        "mean_mae": round(float(np.mean(mae_values)), 6) if mae_values else None,
        "providers": session.get_providers(),
        "records": records,
    }
    (args.out / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
