#!/usr/bin/env python3
"""Extract AIM-500 parquet rows into train/val image and soft-alpha folders.

AIM-500 is used here as an external real-matte supplement. The split is
fixed and deterministic so the validation subset is not accidentally reused
as training data.
"""
from __future__ import annotations

import argparse
import io
import json
from pathlib import Path

import pyarrow.parquet as pq
from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--val-count", type=int, default=100)
    args = parser.parse_args()

    table = pq.read_table(args.file)
    total = table.num_rows
    if not 1 <= args.val_count < total:
        raise SystemExit("val-count must be between 1 and rows-1")

    rows = []
    for index in range(total):
        image_name = table["image_name"][index].as_py()
        image_bytes = table["image"][index].as_py()["bytes"]
        mask_bytes = table["mask"][index].as_py()["bytes"]
        split = "val" if index >= total - args.val_count else "train"
        image_dir = args.out / split / "images"
        mask_dir = args.out / split / "masks"
        image_dir.mkdir(parents=True, exist_ok=True)
        mask_dir.mkdir(parents=True, exist_ok=True)
        stem = f"aim_{index:04d}_{image_name}"
        with Image.open(io.BytesIO(image_bytes)) as image:
            image.convert("RGB").save(image_dir / f"{stem}.jpg", quality=94, optimize=True)
        with Image.open(io.BytesIO(mask_bytes)) as mask:
            # AIM masks are true soft alpha; do not threshold them.
            mask.convert("L").save(mask_dir / f"{stem}.png", optimize=True)
        rows.append({
            "index": index,
            "name": image_name,
            "split": split,
            "category": table["category"][index].as_py(),
            "type": table["type"][index].as_py(),
        })
    (args.out / "manifest.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    print(json.dumps({"rows": total, "train": total - args.val_count, "val": args.val_count, "output": str(args.out)}))


if __name__ == "__main__":
    main()
