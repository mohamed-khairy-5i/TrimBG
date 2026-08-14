#!/usr/bin/env python3
"""Generate paired RGB images and alpha masks from RGBA foreground assets.

The script uses real transparent foregrounds from public/ and composites them onto
real background photos plus procedural gradients. The alpha channel is preserved
as the ground-truth mask, so no automatic model prediction is used as a label.
"""
from __future__ import annotations

import argparse
import random
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def list_files(directory: Path, exts: Iterable[str]) -> list[Path]:
    return sorted(p for p in directory.iterdir() if p.suffix.lower() in set(exts))


def make_gradient(size: tuple[int, int], rng: random.Random) -> Image.Image:
    width, height = size
    top = tuple(rng.randrange(20, 235) for _ in range(3))
    bottom = tuple(rng.randrange(20, 235) for _ in range(3))
    image = Image.new("RGB", size)
    pixels = image.load()
    for y in range(height):
        ratio = y / max(1, height - 1)
        color = tuple(int(top[i] * (1 - ratio) + bottom[i] * ratio) for i in range(3))
        for x in range(width):
            pixels[x, y] = color
    return image


def prepare_background(path: Path | None, size: tuple[int, int], rng: random.Random) -> Image.Image:
    if path is None:
        background = make_gradient(size, rng)
    else:
        with Image.open(path) as source:
            background = ImageOps.fit(source.convert("RGB"), size, method=Image.Resampling.LANCZOS)
    if rng.random() < 0.35:
        background = background.filter(ImageFilter.GaussianBlur(radius=rng.uniform(0.2, 1.5)))
    return ImageEnhance.Color(background).enhance(rng.uniform(0.75, 1.25))


def transform_foreground(path: Path, size: tuple[int, int], rng: random.Random) -> tuple[Image.Image, Image.Image]:
    with Image.open(path) as source:
        foreground = source.convert("RGBA")
    scale = rng.uniform(0.45, 0.95) * min(size) / max(foreground.size)
    new_size = (max(8, int(foreground.width * scale)), max(8, int(foreground.height * scale)))
    foreground = foreground.resize(new_size, Image.Resampling.LANCZOS)
    if rng.random() < 0.5:
        foreground = ImageOps.mirror(foreground)
    angle = rng.uniform(-12, 12)
    foreground = foreground.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    foreground.thumbnail(size, Image.Resampling.LANCZOS)
    mask = foreground.getchannel("A")
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    x = rng.randint(-max(0, foreground.width // 8), max(0, size[0] - foreground.width))
    y = rng.randint(-max(0, foreground.height // 8), max(0, size[1] - foreground.height))
    canvas.alpha_composite(foreground, (x, y))
    return canvas, canvas.getchannel("A")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--count", type=int, default=256)
    parser.add_argument("--width", type=int, default=256)
    parser.add_argument("--height", type=int, default=256)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    rng = random.Random(args.seed)
    root = args.root
    foregrounds = []
    for path in list_files(root / "public", IMAGE_EXTS):
        try:
            with Image.open(path) as image:
                if "A" in image.getbands() and image.getchannel("A").getbbox():
                    foregrounds.append(path)
        except Exception:
            continue
    backgrounds = list_files(root / "public", {".jpg", ".jpeg", ".webp"})
    if not foregrounds:
        raise SystemExit("No RGBA foreground assets found under public/")

    output = root / "training_data"
    image_dir = output / "images"
    mask_dir = output / "masks"
    image_dir.mkdir(parents=True, exist_ok=True)
    mask_dir.mkdir(parents=True, exist_ok=True)
    size = (args.width, args.height)

    for index in range(args.count):
        fg_path = rng.choice(foregrounds)
        bg_path = rng.choice(backgrounds) if backgrounds and rng.random() < 0.8 else None
        background = prepare_background(bg_path, size, rng)
        foreground, mask = transform_foreground(fg_path, size, rng)
        composed = Image.alpha_composite(background.convert("RGBA"), foreground).convert("RGB")
        stem = f"sample_{index:05d}"
        composed.save(image_dir / f"{stem}.jpg", quality=92, optimize=True)
        mask.save(mask_dir / f"{stem}.png", optimize=True)

    print(f"generated={args.count}")
    print(f"foreground_sources={len(foregrounds)}")
    print(f"background_sources={len(backgrounds)}")
    print(f"output={output}")


if __name__ == "__main__":
    main()
