#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image


def preprocess(path: Path, size: int):
    original = Image.open(path).convert("RGB")
    resized = original.resize((size, size), Image.Resampling.BILINEAR)
    array = np.asarray(resized, dtype=np.float32).transpose(2, 0, 1)[None] / 255.0
    return original, array


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, default=Path("models/tiny-matting/tiny_matting_128.onnx"))
    parser.add_argument("--images", type=Path, default=Path("public"))
    parser.add_argument("--out", type=Path, default=Path("models/tiny-matting/eval"))
    parser.add_argument("--size", type=int, default=128)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    session = ort.InferenceSession(str(args.model), providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    image_paths = sorted(p for p in args.images.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".webp"})
    latencies = []
    records = []
    for path in image_paths:
        original, tensor = preprocess(path, args.size)
        start = time.perf_counter()
        output = session.run(None, {input_name: tensor})[0][0, 0]
        elapsed = time.perf_counter() - start
        latencies.append(elapsed)
        alpha = Image.fromarray(np.clip(output * 255, 0, 255).astype(np.uint8), mode="L").resize(original.size, Image.Resampling.BILINEAR)
        rgba = original.convert("RGBA")
        rgba.putalpha(alpha)
        out_path = args.out / f"{path.stem}.png"
        rgba.save(out_path)
        records.append({"image": path.name, "seconds": round(elapsed, 4), "output": str(out_path)})
    summary = {
        "model": str(args.model),
        "model_bytes": args.model.stat().st_size,
        "image_count": len(records),
        "mean_seconds": round(float(np.mean(latencies)), 4) if latencies else None,
        "median_seconds": round(float(np.median(latencies)), 4) if latencies else None,
        "records": records,
    }
    (args.out / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
