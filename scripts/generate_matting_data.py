#!/usr/bin/env python3
"""Generate diverse paired RGB images and alpha masks from RGBA foregrounds.

This creates synthetic composites using real transparent foreground assets and
real/procedural backgrounds. The alpha channel remains the exact ground-truth
mask; no model prediction is used as a label.
"""
from __future__ import annotations

import argparse
import random
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def list_files(directory: Path, exts: Iterable[str]) -> list[Path]:
    if not directory.exists():
        return []
    allowed = set(exts)
    return sorted(p for p in directory.iterdir() if p.suffix.lower() in allowed)


def make_background(size: tuple[int, int], rng: random.Random) -> Image.Image:
    """Create a varied background without making it part of the alpha label."""
    width, height = size
    base = Image.new("RGB", size, tuple(rng.randrange(15, 240) for _ in range(3)))
    draw = ImageDraw.Draw(base, "RGBA")
    mode = rng.randrange(4)
    if mode == 0:
        top = tuple(rng.randrange(10, 245) for _ in range(3))
        bottom = tuple(rng.randrange(10, 245) for _ in range(3))
        pixels = base.load()
        for y in range(height):
            ratio = y / max(1, height - 1)
            color = tuple(int(top[i] * (1 - ratio) + bottom[i] * ratio) for i in range(3))
            for x in range(width):
                pixels[x, y] = color
    elif mode == 1:
        for _ in range(rng.randint(8, 24)):
            x0 = rng.randint(-width // 2, width)
            y0 = rng.randint(-height // 2, height)
            x1 = x0 + rng.randint(width // 8, width // 2)
            y1 = y0 + rng.randint(height // 8, height // 2)
            draw.ellipse((x0, y0, x1, y1), fill=tuple(rng.randrange(0, 255) for _ in range(3)) + (rng.randint(25, 100),))
    elif mode == 2:
        for y in range(0, height, max(8, height // 18)):
            draw.line((0, y, width, y + rng.randint(-height // 8, height // 8)), fill=tuple(rng.randrange(0, 255) for _ in range(3)) + (rng.randint(35, 120),), width=rng.randint(2, 12))
    else:
        for _ in range(rng.randint(3, 10)):
            draw.rectangle((rng.randint(0, width // 2), rng.randint(0, height // 2), rng.randint(width // 2, width), rng.randint(height // 2, height)), fill=tuple(rng.randrange(0, 255) for _ in range(3)) + (rng.randint(20, 90),))
    return base


def prepare_background(path: Path | None, size: tuple[int, int], rng: random.Random) -> Image.Image:
    if path is None:
        background = make_background(size, rng)
    else:
        with Image.open(path) as source:
            background = ImageOps.fit(source.convert("RGB"), size, method=Image.Resampling.LANCZOS)
        if rng.random() < 0.45:
            background = ImageOps.mirror(background)
    if rng.random() < 0.55:
        background = background.filter(ImageFilter.GaussianBlur(radius=rng.uniform(0.15, 2.5)))
    background = ImageEnhance.Color(background).enhance(rng.uniform(0.55, 1.45))
    background = ImageEnhance.Contrast(background).enhance(rng.uniform(0.75, 1.35))
    return ImageEnhance.Brightness(background).enhance(rng.uniform(0.75, 1.25))


def transform_foreground(path: Path, size: tuple[int, int], rng: random.Random) -> tuple[Image.Image, Image.Image]:
    with Image.open(path) as source:
        foreground = source.convert("RGBA")
    scale = rng.uniform(0.25, 1.15) * min(size) / max(foreground.size)
    new_size = (max(12, int(foreground.width * scale)), max(12, int(foreground.height * scale)))
    foreground = foreground.resize(new_size, Image.Resampling.LANCZOS)
    if rng.random() < 0.5:
        foreground = ImageOps.mirror(foreground)
    foreground = foreground.rotate(rng.uniform(-28, 28), expand=True, resample=Image.Resampling.BICUBIC)
    if rng.random() < 0.18:
        foreground = foreground.filter(ImageFilter.GaussianBlur(radius=rng.uniform(0.05, 0.45)))
    foreground = ImageEnhance.Color(foreground).enhance(rng.uniform(0.8, 1.2))
    foreground = ImageEnhance.Contrast(foreground).enhance(rng.uniform(0.85, 1.18))
    foreground.thumbnail(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    # Negative coordinates intentionally create partial crops at image borders.
    x_min = -max(0, foreground.width // 5)
    y_min = -max(0, foreground.height // 5)
    x = rng.randint(x_min, max(x_min, size[0] - foreground.width))
    y = rng.randint(y_min, max(y_min, size[1] - foreground.height))
    canvas.alpha_composite(foreground, (x, y))
    return canvas, canvas.getchannel("A")


def generate_split(root: Path, foregrounds: list[Path], backgrounds: list[Path], split: str, count: int, size: tuple[int, int], rng: random.Random) -> None:
    image_dir = root / split / "images"
    mask_dir = root / split / "masks"
    image_dir.mkdir(parents=True, exist_ok=True)
    mask_dir.mkdir(parents=True, exist_ok=True)
    for index in range(count):
        fg_path = rng.choice(foregrounds)
        bg_path = rng.choice(backgrounds) if backgrounds and rng.random() < 0.72 else None
        background = prepare_background(bg_path, size, rng)
        foreground, mask = transform_foreground(fg_path, size, rng)
        composed = Image.alpha_composite(background.convert("RGBA"), foreground).convert("RGB")
        stem = f"sample_{index:06d}"
        composed.save(image_dir / f"{stem}.jpg", quality=rng.randint(84, 94), optimize=True)
        mask.save(mask_dir / f"{stem}.png", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--count", type=int, default=6000, help="training sample count")
    parser.add_argument("--val-count", type=int, default=600, help="validation sample count")
    parser.add_argument("--width", type=int, default=256)
    parser.add_argument("--height", type=int, default=256)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()

    rng = random.Random(args.seed)
    root = args.root
    foregrounds: list[Path] = []
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

    output = args.output or (root / "training_data_large")
    size = (args.width, args.height)
    generate_split(output, foregrounds, backgrounds, "train", args.count, size, rng)
    generate_split(output, foregrounds, backgrounds, "val", args.val_count, size, rng)
    print(f"train={args.count}")
    print(f"val={args.val_count}")
    print(f"foreground_sources={len(foregrounds)}")
    print(f"background_sources={len(backgrounds)}")
    print(f"output={output}")


if __name__ == "__main__":
    main()
