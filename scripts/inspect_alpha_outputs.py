from pathlib import Path
import argparse
from PIL import Image
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('--dir', type=Path, default=Path('/home/ubuntu/TrimBG/models/tiny-matting/eval'))
args = parser.parse_args()

for path in sorted(args.dir.glob('*.png')):
    with Image.open(path) as image:
        alpha = np.asarray(image.getchannel('A'), dtype=np.float32) / 255.0
    print(path.name, 'min=', round(float(alpha.min()), 3), 'max=', round(float(alpha.max()), 3), 'mean=', round(float(alpha.mean()), 3), 'transparent_pct=', round(float((alpha < 0.2).mean() * 100), 1), 'opaque_pct=', round(float((alpha > 0.8).mean() * 100), 1))
