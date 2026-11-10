# Practice audio (shipped)

Offline spoken guides, short quiz cues, Hebrew letter/name clips, and soft beds for **Practice**, **Scripture Listen**, and **Extra-canon**.

| Kind | Files | Role |
|------|--------|------|
| Guides | `guide-*.mp3` | Meditate session intros + `guide-temple.mp3` Temple walk |
| Cues | `cue-*.mp3` | correct, again, complete, next, reveal, drill |
| Letters | `letter-*.mp3` | 22 letters + 5 sofit pronunciation (River) |
| Names | `name-*.mp3` | Featured Hitchcock names (River) |
| Beds | `bed-meditate.mp3`, `bed-read.mp3` | Soft instrumental under Meditate / reading |
| Phrases | `phrases.json` | Exact TTS bake strings for regen |
| Index | `manifest.json` | Stable URL map used by the desk and smoke checks |
| Scripts | `public/practice-meditations.json` | Session text + `audio` paths |
| Audio root | `public/audio/practice/` | Shipped mp3 + manifests (this doc stays in `docs/`) |

**Voice:** River (ElevenLabs), generated for Anointed Staff and baked into the desk build.  
**Beds:** Meditate bed from local Comfy YuE2; read bed from ElevenLabs `music_v2` instrumental (or regenerate YuE2 per `docs/regenerate-practice-media.md`).  
**Runtime:** The app plays these local files only — no live ElevenLabs or Comfy call while practicing or reading. Hear falls back to browser `speechSynthesis` when a clip is missing.

Regenerate only when phrases or scripts change; keep filenames stable so `src/study/practiceAudio.ts` keeps working. Prefer ~128 kbps mp3 and calm, Scripture-framed wording (no fortunes, no occult technique language).
