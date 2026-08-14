#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', type=Path, default=Path('models/u2netp/u2netp.onnx'))
    parser.add_argument('--images', type=Path, default=Path('public'))
    parser.add_argument('--out', type=Path, default=Path('models/u2netp/eval'))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    session = ort.InferenceSession(str(args.model), providers=['CPUExecutionProvider'])
    input_meta = session.get_inputs()[0]
    output_meta = session.get_outputs()[0]
    size = int(input_meta.shape[-1])
    paths = sorted(p for p in args.images.iterdir() if p.suffix.lower() in {'.jpg', '.jpeg', '.webp'})
    records, latencies = [], []
    for path in paths:
        original = Image.open(path).convert('RGB')
        resized = original.resize((size, size), Image.Resampling.LANCZOS)
        array = np.asarray(resized, dtype=np.float32) / 255.0
        mean = np.asarray([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.asarray([0.229, 0.224, 0.225], dtype=np.float32)
        tensor = ((array - mean) / std).transpose(2, 0, 1)[None].astype(np.float32)
        start = time.perf_counter()
        output = session.run([output_meta.name], {input_meta.name: tensor})[0][0, 0]
        elapsed = time.perf_counter() - start
        latencies.append(elapsed)
        # U2NetP exports a sigmoid-like saliency output in most released weights.
        if output.min() < 0 or output.max() > 1:
            output = 1 / (1 + np.exp(-output))
        low, high = float(output.min()), float(output.max())
        output = (output - low) / max(high - low, 1e-6)
        alpha = Image.fromarray(np.clip(output * 255, 0, 255).astype(np.uint8), 'L').resize(original.size, Image.Resampling.BILINEAR)
        rgba = original.convert('RGBA')
        rgba.putalpha(alpha)
        out_path = args.out / f'{path.stem}.png'
        rgba.save(out_path)
        records.append({'image': path.name, 'seconds': round(elapsed, 4), 'range': [round(low, 4), round(high, 4)], 'output': str(out_path)})
    summary = {'model': str(args.model), 'model_bytes': args.model.stat().st_size, 'input_size': size, 'image_count': len(records), 'mean_seconds': round(float(np.mean(latencies)), 4), 'median_seconds': round(float(np.median(latencies)), 4), 'records': records}
    (args.out / 'summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
