#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--size", type=int, required=True)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()
    image_paths = sorted((args.data / "images").glob("*.jpg"))
    if args.limit:
        image_paths = image_paths[:args.limit]
    args.out.mkdir(parents=True, exist_ok=True)
    session = ort.InferenceSession(str(args.model), providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    latencies: list[float] = []
    maes: list[float] = []
    records = []
    for path in image_paths:
        mask_path = args.data / "masks" / f"{path.stem}.png"
        if not mask_path.exists():
            continue
        with Image.open(path) as original_image, Image.open(mask_path) as original_mask:
            original = original_image.convert("RGB")
            target = original_mask.convert("L")
            resized = original.resize((args.size, args.size), Image.Resampling.BILINEAR)
            tensor = np.asarray(resized, dtype=np.float32).transpose(2, 0, 1)[None] / 255.0
            start = time.perf_counter()
            output = session.run(None, {input_name: tensor})[0][0, 0]
            elapsed = time.perf_counter() - start
            prediction = Image.fromarray(np.clip(output * 255, 0, 255).astype(np.uint8), mode="L").resize(target.size, Image.Resampling.BILINEAR)
            pred = np.asarray(prediction, dtype=np.float32) / 255.0
            truth = np.asarray(target, dtype=np.float32) / 255.0
            mae = float(np.abs(pred - truth).mean())
            latencies.append(elapsed)
            maes.append(mae)
            if len(records) < 12:
                rgba = original.convert("RGBA")
                rgba.putalpha(prediction)
                rgba.save(args.out / f"{path.stem}.png")
            records.append({"image": path.name, "seconds": round(elapsed, 5), "mae": round(mae, 5)})
    summary = {
        "model": str(args.model),
        "model_bytes": args.model.stat().st_size,
        "data": str(args.data),
        "image_count": len(records),
        "mean_seconds": round(float(np.mean(latencies)), 5) if latencies else None,
        "median_seconds": round(float(np.median(latencies)), 5) if latencies else None,
        "mean_mae": round(float(np.mean(maes)), 5) if maes else None,
        "median_mae": round(float(np.median(maes)), 5) if maes else None,
        "records": records,
    }
    (args.out / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
