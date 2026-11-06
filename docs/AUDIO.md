# Audio rules

Status: **the rules are in place, and the app ships no audio yet.** No clip has been recorded,
generated or reviewed. This file explains what audio is allowed and how a clip gets in.

## What is allowed

- **Speech clips only.** No music, jingles, tones or sound effects, ever.
- **Format and place:** Opus files (`.opus`) under `public/audio/<course>/`, where `<course>` is a
  folder that exists in `content/` (today only `en-from-ar`). Every other audio format, and any audio
  file anywhere else, fails the tests. The scan also reads the first bytes of every file: audio or video
  data under any name fails, and a clip must really be Ogg Opus (an `OggS` page with `OpusHead`).
  `public/` may hold only the app icons and these clips.
- **Size:** at most 200 KB per clip, and at most 30 MB for all clips together.
- **Sources:**
  - **Our own recordings**, made by a speaker who agreed in writing to publish them.
  - **Openly licensed clips** whose licence allows commercial use and changes: CC0-1.0, CC-BY-4.0 or
    Apache-2.0. Non-commercial (NC) or no-derivatives (ND) licences count as **no**. Share-alike
    (CC-BY-SA) is not allowed for now, by the owner's decision.
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
| `licence` | `own`, `Apache-2.0`, `CC0-1.0` or `CC-BY-4.0` | `own` for own recordings, `Apache-2.0` for Kokoro, a real open licence otherwise |
| `link` | `https://` link to the source or licence | Required, `https://`, except for own recordings |
| `speaker` | A first name or role (never a full name or contact details), or the Kokoro voice name | Not empty |
| `consent` | The speaker agreed in writing to publish the clip | Must be `true` for own recordings |
| `synthetic` | Generated voice | Must be `true` for every Kokoro clip; may be `true` for an open-licence clip; must be `false` for our own recordings; never `true` for a course that is not English. A synthetic clip needs `reviewed: true` |
| `reviewed` | A teacher listened and checked it against the text | Must be `true` before any synthetic clip (Kokoro or other) is added |

The repository is public: do not put full names, contact details or any personal notes in this file.
Keep written consent outside the repository.

## How the app plays audio

- `src/audio/player.ts` is the only file that creates an audio element. It plays one clip at a time,
  from a relative path `audio/<course>/<file>.opus`, and never records.
- `content/<course>/audio.json` lists the course's clips: `{ "id": "<content item id>", "file": "<name>.opus",
  "synthetic": true|false }`. The tests check that it matches the files in `public/audio/<course>/` and
  that `synthetic` matches `AUDIO_CREDITS.json`. **When the list is empty, the app shows no audio
  controls at all**, and About still says the app has no sound.
- A "Listen" button appears next to a phrase only when that phrase has a clip. Synthetic clips show a
  "synthetic voice" label.
- **Offline:** clips are not part of the app's precache, and **they are saved for offline use only by
  "Download audio for offline use"** in Settings (shown only when the course has clips). That button
  stores the clips in the `english-practice-audio` cache (`src/audio/offline.ts`, the only file allowed
  to use the Cache API), and asks the browser to keep the app's data (persistent storage).
- The service worker reads `audio/*.opus` from that cache first (answering range requests from the
  full cached file), and otherwise goes to the network **without storing anything**. So listening never
  saves a clip, on any server.
- Settings counts what is really in the cache. After a failed download it shows the true number, and
  "Remove downloaded audio" appears whenever anything of the course is stored. Remove deletes every
  stored clip of the course, including files that are no longer listed.

## Adding a clip (later PRs)

1. Record or generate the clip, and encode it as Opus (mono, speech quality).
2. Add the file under `public/audio/<course>/`, its entry in `AUDIO_CREDITS.json`, and its entry in
   `content/<course>/audio.json`.
3. Add a row to the audio review table in `docs/CONTENT_REVIEW.md`.
4. Never add clips in the same PR as a change to these rules.
5. **To correct a clip, give the new file a new name** (for example `ph-01-v2.opus`) and update both
   lists. A learner who already downloaded the old file keeps it under the old name, because a
   download is never replaced in place; the new name makes the app fetch the corrected clip. The old
   file is removed by "Remove downloaded audio".
