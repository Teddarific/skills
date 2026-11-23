#!/usr/bin/env python3
# Loop seam and motion check on the raw frames of one scene. Exits 1 on CHECK, so a broken film fails.
# python3 seam.py <scene>   (env: FRAMES_DIR, MIN_PEAK, MIN_MOVING). Last->first must look like an ordinary frame step.
# A rest-to-rest loop ends exactly where it starts, so the seam alone also passes a film that never moves. The motion check
# fails a film whose middle (20-80%) never departs from its start frame by MIN_PEAK (mean abs diff, 0-255 at 480x270),
# or where fewer than MIN_MOVING of frame steps move at all (static, blank or crashed scenes; CSS/timer animation that jumps).
import sys, os, glob, numpy as np
from PIL import Image
scene = sys.argv[1]
fs = sorted(glob.glob(f"{os.environ.get('FRAMES_DIR','/tmp/frames')}/{scene}/f*.png"))
if len(fs) < 10: sys.exit(f"{scene}: only {len(fs)} frames in {os.environ.get('FRAMES_DIR','/tmp/frames')}/{scene}; record it first")
L = lambda f: np.asarray(Image.open(f).convert('L').resize((480, 270)), dtype=np.float32)
ims = [L(f) for f in fs]
st = np.array([np.abs(a - b).mean() for a, b in zip(ims, ims[1:])])
s1, s2 = float(np.abs(ims[-2] - ims[-1]).mean()), float(np.abs(ims[-1] - ims[0]).mean())
seam_ok = max(s1, s2) <= max(np.percentile(st, 95), 0.05) * 1.5
n = len(ims); peak = max(float(np.abs(im - ims[0]).mean()) for im in ims[n // 5: n * 4 // 5])
moving = float((st > 0.01).mean())
min_peak, min_moving = float(os.environ.get('MIN_PEAK', 0.1)), float(os.environ.get('MIN_MOVING', 0.1))
motion_ok = peak >= min_peak and moving >= min_moving
print(f'{scene}: frames={len(fs)} median={np.median(st):.3f} p95={np.percentile(st,95):.3f} max={st.max():.3f} | seam N-2->N-1={s1:.3f} N-1->0={s2:.3f} ->', 'OK' if seam_ok else 'CHECK',
      f'| motion mid-film peak={peak:.3f} (min {min_peak}) moving steps={moving:.0%} (min {min_moving:.0%}) ->', 'OK' if motion_ok else 'CHECK: no real motion (static, blank or jumping)')
sys.exit(0 if seam_ok and motion_ok else 1)
