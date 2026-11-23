#!/usr/bin/env python3
# Writes intro.txt and captions.json for the day from the PIECES list. Edit the list, then run it.
# python3 write_drop.py  -> writes intro.txt and captions.json for the day from the PIECES list below
import json, os
DAY = os.environ.get('DAY', 'today'); OUT = os.environ.get('OUT_DIR', 'out')
INTRO_Q = "What if you could see right through your workspace?"   # one "What if..." question for the day
PIECES = [  # (Name, slug, customer theme it answers, caption body)
  ("Hello", "hello", "Example theme: people can't tell what moved", "What if a card could slide to where it belongs and show you why? It glides there and settles back."),
]
intro = f"{INTRO_Q}\n\nTen short concept films, each answering something we keep hearing from customers.\n\nThese are concepts, not a roadmap.\n"
caps = [{"name": n, "slug": s, "file": f"{OUT}/{s}.mp4", "theme": th, "caption": f"**{n}**\n{c}"} for n, s, th, c in PIECES]
open('intro.txt', 'w').write(intro); json.dump(caps, open('captions.json', 'w'), indent=1, ensure_ascii=False)
print('ok', len(caps), 'pieces')
