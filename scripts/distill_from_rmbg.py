#!/usr/bin/env python3
"""Generate student-training masks from the RMBG-1.4 ONNX teacher.

This is an isolated research experiment. It writes a flat dataset containing
JPEG inputs and PNG alpha masks so it can be consumed by train_tiny_matting.py
with --train-data. Validation should use an independent human-labelled set.

Example:
  python3 scripts/distill_from_rmbg.py \
    external_data/rmbg/model_quantized.onnx \
    training_data_distill/train \
    --synthetic-data training_data_large/train \
    --real-data external_data/aim500/extracted/train \
    --limit-synthetic 300 --limit-real 300
"""
from __future__ import annotations

import argparse
import json
import random
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def preprocess(image: Image.Image, size: int) -> np.ndarray:
    image = image.convert("RGB")
    resized = image.resize((size, size), Image.Resampling.BILINEAR)
    array = np.asarray(resized, dtype=np.float32) / 255.0
    array = (array - 0.5) / 1.0
    return np.transpose(array, (2, 0, 1))[None, ...].astype(np.float32)


def postprocess(output: np.ndarray, original_size: tuple[int, int]) -> np.ndarray:
    mask = np.squeeze(output).astype(np.float32)
    if mask.ndim != 2:
        raise ValueError(f"Unexpected teacher output shape: {output.shape}")
    lo, hi = float(mask.min()), float(mask.max())
    if hi > lo:
        mask = (mask - lo) / (hi - lo)
    else:
        mask = np.zeros_like(mask)
    mask_image = Image.fromarray(np.clip(mask * 255.0, 0, 255).astype(np.uint8), mode="L")
    mask_image = mask_image.resize(original_size, Image.Resampling.BILINEAR)
    return np.asarray(mask_image, dtype=np.uint8)


def collect(root: Path | None, limit: int, seed: int) -> list[Path]:
    if root is None or limit <= 0:
        return []
    image_dir = root / "images"
    paths = sorted(p for p in image_dir.iterdir() if p.suffix.lower() in IMAGE_EXTENSIONS)
    rng = random.Random(seed)
    if len(paths) > limit:
        paths = rng.sample(paths, limit)
    return sorted(paths)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("model", type=Path)
    parser.add_argument("output", type=Path, help="Output root containing images/ and masks/")
    parser.add_argument("--synthetic-data", type=Path, default=None)
    parser.add_argument("--real-data", type=Path, default=None)
    parser.add_argument("--limit-synthetic", type=int, default=300)
    parser.add_argument("--limit-real", type=int, default=300)
    parser.add_argument("--size", type=int, default=1024)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--threads", type=int, default=2)
    args = parser.parse_args()

    if not args.model.exists():
        raise SystemExit(f"Teacher model not found: {args.model}")
    synthetic = collect(args.synthetic_data, args.limit_synthetic, args.seed)
    real = collect(args.real_data, args.limit_real, args.seed + 1)
    sources = [("synthetic", p) for p in synthetic] + [("aim500", p) for p in real]
    if not sources:
        raise SystemExit("No source images selected")

    args.output.mkdir(parents=True, exist_ok=True)
    image_dir = args.output / "images"
    mask_dir = args.output / "masks"
    image_dir.mkdir(parents=True, exist_ok=True)
    mask_dir.mkdir(parents=True, exist_ok=True)

    session_options = ort.SessionOptions()
    session_options.intra_op_num_threads = max(1, args.threads)
    session_options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(args.model), sess_options=session_options, providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    records: list[dict[str, object]] = []
    total_start = time.perf_counter()

    for index, (source_type, source_path) in enumerate(sources, start=1):
        output_stem = f"{source_type}_{index:05d}"
        output_image = image_dir / f"{output_stem}.jpg"
        output_mask = mask_dir / f"{output_stem}.png"
        if output_image.exists() and output_mask.exists():
            continue

        image = Image.open(source_path).convert("RGB")
        start = time.perf_counter()
        raw_output = session.run(None, {input_name: preprocess(image, args.size)})[0]
        predicted = postprocess(raw_output, image.size)
        seconds = time.perf_counter() - start
        image.save(output_image, format="JPEG", quality=95, optimize=True)
        Image.fromarray(predicted, mode="L").save(output_mask)
        records.append({
            "source": str(source_path),
            "source_type": source_type,
            "image": output_image.name,
            "mask": output_mask.name,
            "width": image.width,
            "height": image.height,
            "teacher_seconds": round(seconds, 4),
        })
        if index == 1 or index % 25 == 0 or index == len(sources):
            print(json.dumps({"processed": index, "total": len(sources), "last_seconds": round(seconds, 3)}), flush=True)

    existing_records_path = args.output / "manifest.json"
    existing_records: list[dict[str, object]] = []
    if existing_records_path.exists():
        existing_records = json.loads(existing_records_path.read_text(encoding="utf-8"))
    all_records = existing_records + records
    summary = {
        "teacher": str(args.model),
        "teacher_bytes": args.model.stat().st_size,
        "input_size": args.size,
        "sources": {"synthetic": len(synthetic), "aim500": len(real)},
        "generated_now": len(records),
        "total_manifest_records": len(all_records),
        "mean_teacher_seconds": float(np.mean([float(r["teacher_seconds"]) for r in records])) if records else None,
        "elapsed_seconds": round(time.perf_counter() - total_start, 2),
        "providers": session.get_providers(),
        "records": all_records,
    }
    existing_records_path.write_text(json.dumps(all_records, indent=2), encoding="utf-8")
    (args.output / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({k: v for k, v in summary.items() if k != "records"}, indent=2))


if __name__ == "__main__":
    main()
