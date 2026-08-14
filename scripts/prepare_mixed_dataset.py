#!/usr/bin/env python3
"""Build a lightweight symlinked mixed dataset without duplicating image bytes."""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path


def link_pairs(source: Path, target: Path, prefix: str, repeats: int = 1) -> int:
    image_dir = source / "images"
    mask_dir = source / "masks"
    out_images = target / "images"
    out_masks = target / "masks"
    out_images.mkdir(parents=True, exist_ok=True)
    out_masks.mkdir(parents=True, exist_ok=True)
    count = 0
    for image in sorted(image_dir.glob("*.jpg")):
        mask = mask_dir / f"{image.stem}.png"
        if not mask.exists():
            continue
        for repeat in range(repeats):
            suffix = f"_r{repeat}" if repeats > 1 else ""
            image_link = out_images / f"{prefix}{suffix}_{image.name}"
            mask_link = out_masks / f"{prefix}{suffix}_{image.stem}.png"
            if image_link.exists() or image_link.is_symlink():
                image_link.unlink()
            if mask_link.exists() or mask_link.is_symlink():
                mask_link.unlink()
            image_link.symlink_to(image.resolve())
            mask_link.symlink_to(mask.resolve())
            count += 1
    return count


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--synthetic", type=Path, required=True)
    parser.add_argument("--aim", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--aim-train-repeats", type=int, default=1)
    args = parser.parse_args()
    if args.out.exists():
        shutil.rmtree(args.out)
    counts = {}
    for split in ("train", "val"):
        target = args.out / split
        counts[f"synthetic_{split}"] = link_pairs(args.synthetic / split, target, "syn")
        repeats = args.aim_train_repeats if split == "train" else 1
        counts[f"aim_{split}"] = link_pairs(args.aim / split, target, "aim", repeats=repeats)
    print(counts)


if __name__ == "__main__":
    main()
