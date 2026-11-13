# Edit, colour, sound and delivery

## 1. Edit
- **Music first.** Pick/generate the track, find its BPM and beat grid (onset autocorrelation),
  then cut on beats. Typical: 110-125 BPM for reels; shots of 2-4 beats; hero moments 5-7 beats.
- **Order:** hook → context → 2-4 escalating beats → payoff → CTA/end card → creator credit.
- **Transitions:** hard cut on the beat (default) · zoom-blur cut (energy) · whip pan · light-leak
  flash for chapter changes · match cut (shape/motion) · "fly-in" push through a window/door to
  enter a new space · glow dissolve. One family per film.
- **Speed ramps** on pours, drops, impacts: fast → slow at the peak → fast.
- **Text:** max 6 words per card, enters with a wipe or word-by-word blur-in on the beat, sits in
  negative space, never over faces; shadow for legibility; dark gradient behind text on busy shots.
- **Logos:** the client's real logo files only; extract clean alpha; recolour to the palette.
- No shot repeated unless it's a deliberate callback.

## 2. Colour
- Grade all shots to one look: match black level, saturation and white balance. AI lifestyle shots
  are usually brighter and more saturated than macro food shots - pull them down.
- Finishing: subtle vignette, fine film grain, warm highlights / cooler shadows (or the brief's palette).
- Real phone footage: crop UI, remove text, upscale, then grade warmer and with more contrast.

## 3. Sound
- **Music:** ElevenLabs music with a composition plan (sections ≥ 3 s, styles per section, an
  "impact hit" where the edit needs it). Generate 3-4 genuinely different styles for the user to
  choose. Check for breaks/drops mid-track; cut them on bar boundaries (bar = 4 beats) if they
  stop the energy. Extend by repeating whole bars, crossfade 20-80 ms.
- ElevenLabs allows about 2 concurrent requests - generate in pairs.
- **SFX:** only on real actions (clink when glasses touch, pour, door). Generate several, pick the
  most natural, normalize, place to the frame. Fewer is better; ask before adding many.
- **Ambience:** room tone / street / café murmur under scene changes, low (-25 to -30 dB).
- **Voice-over:** ElevenLabs; word timings from the real take (silence detection), not the script.
- **Mix:** voice on top, music ducked under voice (sidechain), final loudness -14 LUFS,
  true peak -1 to -1.5 dBTP. Fade music out on the end card.

## 4. QC before delivery
- [ ] 2 fps contact sheet viewed end to end; frame count/duration correct.
- [ ] Faces, hands, props, food look right; nothing the model invented slipped through.
- [ ] No other brands, UI, watermarks, captions from source footage; nothing blurred.
- [ ] Text readable, inside safe zones, no typos, RTL correct, dates/prices/hours verified.
- [ ] Cuts land on beats; no dead seconds; music has no unintended gaps; SFX in sync.
- [ ] Loudness measured; file plays on phone (H.264 high, yuv420p, faststart, AAC).

## 5. Delivery
- Masters: 1080x1920 (or 1920x1080), 30 fps, CRF 18-19 (~3 MB/s).
- Phone/social copies: CRF 23, maxrate 6M (~0.75 MB/s) - easy to download and upload.
- Separate cut per platform (Reels long, TikTok short with raised text).
- Name files clearly: Client_Campaign_Platform_vN.mp4. Upload to the user's library and give
  direct links plus phone-saving instructions.
