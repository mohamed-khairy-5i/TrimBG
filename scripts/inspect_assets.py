from pathlib import Path
from PIL import Image

root = Path('/home/ubuntu/TrimBG/public')
for path in sorted(root.iterdir()):
    if path.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp'}:
        continue
    try:
        with Image.open(path) as image:
            has_alpha = 'A' in image.getbands()
            alpha_range = None
            if has_alpha:
                alpha = image.getchannel('A')
                alpha_range = (alpha.getextrema(), alpha.getbbox())
            print(f'{path.name}\tmode={image.mode}\tsize={image.size}\talpha={alpha_range}')
    except Exception as exc:
        print(f'{path.name}\tERROR={exc}')
