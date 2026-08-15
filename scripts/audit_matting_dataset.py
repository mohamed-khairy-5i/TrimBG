#!/usr/bin/env python3
"""Audit paired RGB/mask matting datasets and write compact JSON evidence."""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image


EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def audit_root(root: Path) -> dict:
    image_dir = root / "images"
    mask_dir = root / "masks"
    records = []
    if image_dir.exists():
        for image_path in sorted(image_dir.iterdir()):
            if image_path.suffix.lower() not in EXTS:
                continue
            mask_path = mask_dir / f"{image_path.stem}.png"
            if not mask_path.exists():
                continue
            with Image.open(image_path) as image, Image.open(mask_path) as mask:
                image_size = [int(v) for v in image.size]
                mask_array = np.asarray(mask.convert("L"), dtype=np.uint8)
            records.append(
                {
                    "image": image_path.name,
                    "image_size": image_size,
                    "mask_size": [int(v) for v in mask.size],
                    "mask_mean": float(mask_array.mean() / 255.0),
                    "mask_soft_fraction": float(((mask_array > 5) & (mask_array < 250)).mean()),
                    "mask_foreground_fraction": float((mask_array >= 128).mean()),
                }
            )
    if not records:
        return {"root": str(root), "pairs": 0}
    image_sizes = Counter(tuple(r["image_size"]) for r in records)
    mask_sizes = Counter(tuple(r["mask_size"]) for r in records)
    means = np.array([r["mask_mean"] for r in records], dtype=np.float64)
    soft = np.array([r["mask_soft_fraction"] for r in records], dtype=np.float64)
    foreground = np.array([r["mask_foreground_fraction"] for r in records], dtype=np.float64)
    return {
        "root": str(root),
        "pairs": len(records),
        "top_image_sizes": [[list(size), count] for size, count in image_sizes.most_common(10)],
        "top_mask_sizes": [[list(size), count] for size, count in mask_sizes.most_common(10)],
        "mask_mean": {"min": float(means.min()), "median": float(np.median(means)), "max": float(means.max())},
        "mask_soft_fraction": {"min": float(soft.min()), "median": float(np.median(soft)), "max": float(soft.max())},
        "mask_foreground_fraction": {"min": float(foreground.min()), "median": float(np.median(foreground)), "max": float(foreground.max())},
        "small_foreground_pairs": int((foreground < 0.05).sum()),
        "large_foreground_pairs": int((foreground > 0.80).sum()),
        "soft_edge_pairs": int((soft > 0.01).sum()),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--roots", required=True, help="comma-separated dataset roots")
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    report = {"roots": [audit_root(Path(item.strip())) for item in args.roots.split(",") if item.strip()]}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
