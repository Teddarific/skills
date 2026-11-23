#!/usr/bin/env python3
# Writes intro.txt and captions.json for the day from the PIECES list. Edit the list, then run it.
# python3 write_drop.py  -> writes intro.txt and captions.json for the day from the PIECES list below (env: OUT_DIR)
import json, os, sys
OUT = os.environ.get('OUT_DIR', 'out')
INTRO_Q = "What if you could see right through your workspace?"   # one "What if..." question for the day
PIECES = [  # (Name, slug, customer theme it answers or "eye candy", caption body, 1-3 reference links: real pages you opened)
  ("Hello", "hello", "Example theme: people can't tell what moved", "What if a card could slide to where it belongs and show you why? It glides there and settles back.", ["https://example.com/"]),
]
for n, s, th, c, links in PIECES:
  if not 1 <= len(links) <= 3 or not all(l.startswith(('https://', 'http://')) for l in links):
    sys.exit(f'{n}: give 1-3 reference links, full URLs of real pages you opened')
count = len(PIECES)
words = "zero one two three four five six seven eight nine ten eleven twelve".split()
films = f"{(words[count] if count < len(words) else str(count)).capitalize()} short film{'' if count == 1 else 's'} today."
intro = f"{INTRO_Q}\n\n{films} These are concepts drawn from what we're hearing from customers, not a roadmap.\n"
caps = [{"name": n, "slug": s, "file": f"{OUT}/{s}.mp4", "theme": th, "links": links, "caption": f"**{n}**\n{c}\n" + " · ".join(links)} for n, s, th, c, links in PIECES]
open('intro.txt', 'w').write(intro); json.dump(caps, open('captions.json', 'w'), indent=1, ensure_ascii=False)
print('ok', len(caps), 'pieces')
