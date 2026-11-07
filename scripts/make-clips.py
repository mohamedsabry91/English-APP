"""Make Opus speech clips for the phrase cards with Kokoro-82M (Apache-2.0), voice am_michael.

Not part of the app or the tests. Run it by hand, locally, with no API key:

    pip install kokoro soundfile   (plus a CPU build of torch)
    python -I scripts/make-clips.py content/en-from-ar/phrases.json public/audio/en-from-ar

Needs ffmpeg with libopus on PATH. See docs/AUDIO.md for the rules.

The espeak-ng fallback (GPL-3.0) is switched off. Every phrase is first checked against misaki's
dictionary: a phrase with a word it does not know is SKIPPED and listed, never guessed. (Kokoro's
pipeline drops unknown words silently, so this check is done on misaki directly.)
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro import KPipeline
from misaki import en

VOICE = "am_michael"
SPEED = 0.9  # a little slower than normal, for learners
RATE = 24000

phrases_path, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
out_dir.mkdir(parents=True, exist_ok=True)
phrases = json.loads(phrases_path.read_text(encoding="utf-8"))["phrases"]

g2p = en.G2P(trf=False, british=False, fallback=None)
pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
pipe.g2p.fallback = None  # no espeak-ng

made, skipped = [], []
with tempfile.TemporaryDirectory() as tmp:
    for ph in phrases:
        text = ph["en"]
        _, tokens = g2p(text)
        unknown = [t.text for t in tokens if t.phonemes is None or "❓" in t.phonemes]
        if unknown:
            skipped.append({"id": ph["id"], "text": text, "unknown": unknown})
            continue
        parts = [res.audio.numpy() for res in pipe(text, voice=VOICE, speed=SPEED) if res.audio is not None]
        # 0.15 s of silence at each end, so the start is not cut off on phones.
        pad = np.zeros(int(0.15 * RATE), dtype=np.float32)
        wav = Path(tmp) / f"{ph['id']}.wav"
        sf.write(wav, np.concatenate([pad, *parts, pad]), RATE)
        opus = out_dir / f"{ph['id']}.opus"
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-ac", "1", "-c:a", "libopus",
             "-b:a", "24k", "-application", "voip", "-map_metadata", "-1", str(opus)],
            check=True,
        )
        made.append({"id": ph["id"], "text": text, "bytes": opus.stat().st_size})

print(json.dumps({"made": made, "skipped": skipped}, ensure_ascii=False, indent=1))
