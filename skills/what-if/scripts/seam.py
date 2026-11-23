#!/usr/bin/env python3
# Loop seam check on the raw frames of one scene: last->first must look like an ordinary frame step.
# python3 seam.py <scene>   (env: FRAMES_DIR). Last->first must look like an ordinary frame step.
import sys, os, glob, numpy as np
from PIL import Image
scene = sys.argv[1]
fs = sorted(glob.glob(f"{os.environ.get('FRAMES_DIR','/tmp/frames')}/{scene}/f*.png"))
L = lambda f: np.asarray(Image.open(f).convert('L').resize((480, 270)), dtype=np.float32)
ims = [L(f) for f in fs]
st = np.array([np.abs(a - b).mean() for a, b in zip(ims, ims[1:])])
s1, s2 = float(np.abs(ims[-2] - ims[-1]).mean()), float(np.abs(ims[-1] - ims[0]).mean())
ok = max(s1, s2) <= max(np.percentile(st, 95), 0.05) * 1.5
print(f'{scene}: frames={len(fs)} median={np.median(st):.3f} p95={np.percentile(st,95):.3f} max={st.max():.3f} | seam N-2->N-1={s1:.3f} N-1->0={s2:.3f} ->', 'OK' if ok else 'CHECK')
