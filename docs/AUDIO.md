# Audio rules

Status: **the rules are in place, and the app ships no audio yet.** No clip has been recorded,
generated or reviewed. This file explains what audio is allowed and how a clip gets in.

## What is allowed

- **Speech clips only.** No music, jingles, tones or sound effects, ever.
- **Format and place:** Opus files (`.opus`) under `public/audio/<course>/`, where `<course>` is a
  folder that exists in `content/` (today only `en-from-ar`). Every other audio format, and any audio
  file anywhere else, fails the tests.
- **Size:** at most 200 KB per clip, and at most 30 MB for all clips together.
- **Sources:**
  - **Our own recordings**, made by a speaker who agreed in writing to publish them.
  - **Openly licensed clips** whose licence allows commercial use and changes: CC0-1.0, CC-BY-4.0,
    CC-BY-SA-4.0 or Apache-2.0. Non-commercial (NC) or no-derivatives (ND) licences count as **no**.
  - **English only:** clips pre-generated with **Kokoro** (Apache-2.0). These are labelled synthetic in
    the app, and are added **only after a teacher has listened to and checked** each clip.
- **Chinese and Urdu (later):** our own teacher recordings only. No AI voice, because tones and sounds
  must be right. No release without a named teacher. Neither language is in the app yet.
- **No recording, ever, in the app:** no microphone (`getUserMedia`, `MediaRecorder`), no speech
  recognition, no speech synthesis in the browser, and no `AudioContext`. Only one file,
  `src/audio/player.ts`, may create an audio element.
- **No other hosts:** audio is played from the app's own files, by relative path. The Content Security
  Policy allows media from the app itself only (`media-src 'self'`).

## AUDIO_CREDITS.json

Every clip must have exactly one entry in `AUDIO_CREDITS.json` at the repository root. The file lives
outside the scanned app folders because it holds `https://` source links. The tests check the schema
(`tests/unit/audioCredits.ts`), and that every clip is listed and every listed clip exists.

```json
{
  "version": 1,
  "clips": [
    {
      "file": "public/audio/en-from-ar/ph-01.opus",
      "text": "Could you send me the report, please?",
      "source": "own-recording",
      "licence": "own",
      "link": "",
      "speaker": "Teacher A",
      "consent": true,
      "synthetic": false,
      "reviewed": false
    }
  ]
}
```

| Field | Meaning | Rule checked by the tests |
|---|---|---|
| `file` | Path of the clip | `public/audio/<known course>/<name>.opus`, listed once |
| `text` | The exact words spoken | Not empty, at most 300 characters |
| `source` | `own-recording`, `kokoro` or `open-licence` | One of these three |
| `licence` | `own`, `Apache-2.0`, `CC0-1.0`, `CC-BY-4.0` or `CC-BY-SA-4.0` | `own` for own recordings, `Apache-2.0` for Kokoro, a real open licence otherwise |
| `link` | `https://` link to the source or licence | Required, `https://`, except for own recordings |
| `speaker` | A first name or role (never a full name or contact details), or the Kokoro voice name | Not empty |
| `consent` | The speaker agreed in writing to publish the clip | Must be `true` for own recordings |
| `synthetic` | Generated voice | `true` exactly for Kokoro; never for a non-English course |
| `reviewed` | A teacher listened and checked it against the text | Must be `true` before a Kokoro clip is added |

The repository is public: do not put full names, contact details or any personal notes in this file.
Keep written consent outside the repository.

## Adding a clip (later PRs)

1. Record or generate the clip, and encode it as Opus (mono, speech quality).
2. Add the file under `public/audio/<course>/` and its entry in `AUDIO_CREDITS.json`.
3. Add a row to the audio review table in `docs/CONTENT_REVIEW.md`.
4. Never add clips in the same PR as a change to these rules.
