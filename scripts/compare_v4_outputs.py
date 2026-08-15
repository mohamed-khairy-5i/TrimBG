from pathlib import Path
from PIL import Image, ImageDraw

root = Path('/home/ubuntu/TrimBG')
orig_dir = root / 'external_data/aim500/extracted/val/images'
a_dir = root / 'experiments/lite-v4-screen/eval-aim500'
b_dir = root / 'experiments/lite-v4-160/eval-aim500'
out = root / 'experiments/lite-v4-comparison.jpg'
paths = sorted(a_dir.glob('*.png'))[:12]
cell_w, cell_h = 240, 205
cols = 3
rows = len(paths)
sheet = Image.new('RGB', (cols * cell_w, rows * cell_h), 'white')
draw = ImageDraw.Draw(sheet)
for r, path in enumerate(paths):
    original_path = orig_dir / f'{path.stem}.jpg'
    images = [
        Image.open(original_path).convert('RGB'),
        Image.open(path).convert('RGBA'),
        Image.open(b_dir / path.name).convert('RGBA'),
    ]
    labels = ['Original', 'V4-128', 'V4-160']
    for c, (im, label) in enumerate(zip(images, labels)):
        if im.mode == 'RGBA':
            bg = Image.new('RGB', im.size, (238, 238, 238))
            bg.paste(im, mask=im.getchannel('A'))
            im = bg
        im.thumbnail((cell_w - 12, cell_h - 35))
        x = c * cell_w + (cell_w - im.width) // 2
        y = r * cell_h + 25
        sheet.paste(im, (x, y))
        draw.text((c * cell_w + 8, r * cell_h + 6), label, fill='black')
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out, quality=90)
print(out)

if __name__ == '__main__':
    pass

sheet.close()
for path in paths:
    pass
