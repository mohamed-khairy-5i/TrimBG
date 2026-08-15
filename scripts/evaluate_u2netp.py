#!/usr/bin/env python3
"""Evaluate the general-purpose U2NetP ONNX model on AIM-500."""
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
    return array.transpose(2, 0, 1)[None].astype(np.float32)


def normalize_mask(mask: np.ndarray) -> np.ndarray:
    mask = np.asarray(mask, dtype=np.float32).squeeze()
    if mask.min() < 0.0 or mask.max() > 1.0:
        mask = 1.0 / (1.0 + np.exp(-np.clip(mask, -30.0, 30.0)))
    low, high = float(mask.min()), float(mask.max())
    if high > low:
        mask = (mask - low) / (high - low)
    return np.clip(mask, 0.0, 1.0)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', type=Path, default=Path('external_models/u2netp/u2netp.onnx'))
    parser.add_argument('--images', type=Path, default=Path('external_data/aim500/val/images'))
    parser.add_argument('--masks', type=Path, default=Path('external_data/aim500/val/masks'))
    parser.add_argument('--out', type=Path, default=Path('experiments/u2netp/eval-aim'))
    parser.add_argument('--limit', type=int, default=100)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    session = ort.InferenceSession(str(args.model), providers=['CPUExecutionProvider'])
    input_meta = session.get_inputs()[0]
    output_metas = session.get_outputs()
    size = int(input_meta.shape[-1])
    paths = sorted(p for p in args.images.iterdir() if p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'})[:args.limit]
    records, latencies, maes = [], [], []

    for path in paths:
        original = Image.open(path).convert('RGB')
        tensor = preprocess(original, size)
        start = time.perf_counter()
        outputs = session.run(None, {input_meta.name: tensor})
        elapsed = time.perf_counter() - start
        latencies.append(elapsed)
        output = normalize_mask(outputs[0])
        alpha = Image.fromarray(np.round(output * 255.0).astype(np.uint8), 'L').resize(original.size, Image.Resampling.BILINEAR)
        rgba = original.convert('RGBA')
        rgba.putalpha(alpha)
        out_path = args.out / f'{path.stem}.png'
        rgba.save(out_path)

        mae = None
        mask_path = args.masks / f'{path.stem}.png'
        if mask_path.exists():
            truth = np.asarray(Image.open(mask_path).convert('L').resize(original.size, Image.Resampling.BILINEAR), dtype=np.float32) / 255.0
            predicted = np.asarray(alpha, dtype=np.float32) / 255.0
            mae = float(np.mean(np.abs(predicted - truth)))
            maes.append(mae)
        records.append({'image': path.name, 'seconds': round(elapsed, 4), 'mae': None if mae is None else round(mae, 6), 'output': str(out_path)})

    summary = {
        'model': str(args.model),
        'model_bytes': args.model.stat().st_size,
        'input_size': size,
        'image_count': len(records),
        'mean_seconds': round(float(np.mean(latencies)), 4) if latencies else None,
        'median_seconds': round(float(np.median(latencies)), 4) if latencies else None,
        'mean_mae': round(float(np.mean(maes)), 6) if maes else None,
        'providers': session.get_providers(),
        'output_count': len(output_metas),
        'records': records,
    }
    (args.out / 'summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
