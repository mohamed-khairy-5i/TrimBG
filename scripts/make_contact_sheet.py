from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path('/home/ubuntu/TrimBG/external_data/aim500/extracted/val/images')
paths = sorted(root.glob('*.jpg'))
selected = paths[::max(1, len(paths)//40)][:40]
thumb_w, thumb_h = 180, 150
cols = 5
rows = (len(selected) + cols - 1) // cols
sheet = Image.new('RGB', (cols * thumb_w, rows * thumb_h), 'white')
draw = ImageDraw.Draw(sheet)
for i, path in enumerate(selected):
    with Image.open(path).convert('RGB') as im:
        im.thumbnail((thumb_w - 8, thumb_h - 30))
        x = (i % cols) * thumb_w + (thumb_w - im.width) // 2
        y = (i // cols) * thumb_h + 4
        sheet.paste(im, (x, y))
    label = path.stem.replace('_o_', ' ')
    draw.text(((i % cols) * thumb_w + 4, (i // cols + 1) * thumb_h - 22), label[:25], fill='black')
out = Path('/home/ubuntu/TrimBG/experiments/u2netp/aim500_contact_sheet.jpg')
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out, quality=90)
print(out)
