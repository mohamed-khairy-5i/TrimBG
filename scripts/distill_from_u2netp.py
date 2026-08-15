"""Generate student-training masks from U2NetP for knowledge distillation."""
from __future__ import annotations

import argparse
import json
import random
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

EXTS = {'.jpg', '.jpeg', '.png', '.webp'}


def collect(root: Path | None, limit: int, seed: int) -> list[Path]:
    if root is None or limit <= 0:
        return []
    paths = sorted(p for p in (root / 'images').iterdir() if p.suffix.lower() in EXTS)
    rng = random.Random(seed)
    if len(paths) > limit:
        paths = rng.sample(paths, limit)
    return sorted(paths)


def normalize_mask(raw: np.ndarray) -> np.ndarray:
    mask = np.asarray(raw, dtype=np.float32).squeeze()
    if mask.min() < 0.0 or mask.max() > 1.0:
        mask = 1.0 / (1.0 + np.exp(-np.clip(mask, -30.0, 30.0)))
    low, high = float(mask.min()), float(mask.max())
    if high > low:
        mask = (mask - low) / (high - low)
    return np.clip(mask, 0.0, 1.0)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('model', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--synthetic-data', type=Path)
    parser.add_argument('--real-data', type=Path)
    parser.add_argument('--limit-synthetic', type=int, default=1000)
    parser.add_argument('--limit-real', type=int, default=400)
    parser.add_argument('--size', type=int, default=320)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--threads', type=int, default=2)
    args = parser.parse_args()

    synthetic = collect(args.synthetic_data, args.limit_synthetic, args.seed)
    real = collect(args.real_data, args.limit_real, args.seed + 1)
    sources = [('synthetic', p) for p in synthetic] + [('aim500', p) for p in real]
    if not sources:
        raise SystemExit('No source images selected')

    image_dir = args.output / 'images'
    mask_dir = args.output / 'masks'
    image_dir.mkdir(parents=True, exist_ok=True)
    mask_dir.mkdir(parents=True, exist_ok=True)
    options = ort.SessionOptions()
    options.intra_op_num_threads = max(1, args.threads)
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(args.model), sess_options=options, providers=['CPUExecutionProvider'])
    input_meta = session.get_inputs()[0]
    records = []
    started = time.perf_counter()
    for index, (source_type, path) in enumerate(sources, start=1):
        stem = f'{source_type}_{index:05d}'
        out_image = image_dir / f'{stem}.jpg'
        out_mask = mask_dir / f'{stem}.png'
        if out_image.exists() and out_mask.exists():
            continue
        with Image.open(path) as source:
            image = source.convert('RGB')
        resized = image.resize((args.size, args.size), Image.Resampling.BILINEAR)
        tensor = np.asarray(resized, dtype=np.float32).transpose(2, 0, 1)[None] / 255.0
        start = time.perf_counter()
        output = session.run(None, {input_meta.name: tensor.astype(np.float32)})[0]
        elapsed = time.perf_counter() - start
        mask = normalize_mask(output)
        alpha = Image.fromarray(np.clip(mask * 255.0, 0, 255).astype(np.uint8), mode='L').resize(image.size, Image.Resampling.BILINEAR)
        image.save(out_image, quality=95, optimize=True)
        alpha.save(out_mask, optimize=True)
        records.append({'source': str(path), 'source_type': source_type, 'image': out_image.name, 'mask': out_mask.name, 'teacher_seconds': round(elapsed, 4)})
        if index == 1 or index % 50 == 0 or index == len(sources):
            print(json.dumps({'processed': index, 'total': len(sources), 'last_seconds': round(elapsed, 3)}), flush=True)
    manifest = args.output / 'manifest.json'
    previous = json.loads(manifest.read_text()) if manifest.exists() else []
    all_records = previous + records
    summary = {
        'teacher': str(args.model),
        'teacher_bytes': args.model.stat().st_size,
        'input_size': args.size,
        'sources': {'synthetic': len(synthetic), 'aim500': len(real)},
        'generated_now': len(records),
        'total_manifest_records': len(all_records),
        'elapsed_seconds': round(time.perf_counter() - started, 2),
        'providers': session.get_providers(),
    }
    manifest.write_text(json.dumps(all_records, indent=2), encoding='utf-8')
    (args.output / 'summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
