---
name: app-spec-ad
description: >
  Build a 16:9 "spec ad" for an app in the style of the Duolingo / Yellow / Bit / El Al spec ads:
  one continuous line that links every scene (a camera that pans across a strip of panels), real
  app screens in a 3D CSS phone, features cut out of the screen and popped out, kinetic Hebrew (or
  any language) headlines that land on the narrator's words, a logo opener and a slogan + logo +
  credit ending. Two looks: DARK (black/graphite studio, one neon brand colour) and LIGHT (cloud-sky
  photo backdrop, crisp navy line, no glow). Use when the user asks for a promo / spec ad / app ad
  "like Yellow", "like Bit", "like El Al", "like the Duolingo ad", or names this skill. Built in
  HyperFrames (HTML + GSAP), narrated with ElevenLabs.
---

# app-spec-ad: a spec ad for any app, from real screen recordings

A spec ad is an unofficial ad you make for a brand you love. The post must say it is your own work
and not an official ad. Every claim in the narration must be visible on a real screen.

## 1. Inputs (ask only for what is missing)

| Input | Notes |
|---|---|
| App name, brand colour | ONE accent colour for the whole film. |
| Screen recordings + screenshots | The home screen, the 3-6 features, and the app's launch/logo animation. Real UI only. |
| Logo (transparent PNG) | For the ending. |
| Script idea | 15-20 s of narration, one short sentence per screen. |
| Look | DARK (neon on black/graphite) or LIGHT (cloud sky, navy line). Calm or premium brands suit LIGHT. |
| Format | 16:9 1920x1080 @60fps by default. |

Put raw files in `assets/raw/` and gitignore that folder (it holds private data).

## 2. Workflow

1. **Watch everything first.** Make 1 fps contact sheets of every recording and list the usable moments with timestamps.
2. **Facts table.** For every claim in the script, write the screen and second it comes from. Flag anything unsupported.
3. **Privacy pass, before any frame is built.** Names, profile photos, booking/account/confirmation numbers, routes, seats with names, plates, addresses, other apps' notifications:
   - erase with the exact sampled background colour, or inpaint a photo background (OpenCV `cv2.inpaint`, TELEA, radius 25);
   - redraw dummy data at the same size and weight;
   - for a name in the app's own font, splice letters cut from the original line into a new dummy name;
   - **never blur.** Blur looks suspicious and can sometimes be reversed.
4. **Crops** with `scripts/crop.py`: rect/pill/circle masks drawn at 4x and downsampled with LANCZOS, so the edges are smooth. Scale phone screens to 2x their display width (752 px for a 376 px screen). Crop away the app's own status bar, skip buttons and black edges, so the screen fills the phone from the top.
5. **Script (the formula that keeps viewers):**
   - a question hook ("מתכננים חופשה?");
   - concrete names, each with its own visual (cities, amounts);
   - app actions in short verbs ("מזמינים כרטיסים באפליקציה, וזהו");
   - one benefit sentence, then the slogan.
   - Abstract sentences ("don't worry about anything") make the film feel sleepy.
6. **Voice:** ElevenLabs, a confident male narrator, `eleven_v4`, with a tone tag such as `[energetic, upbeat, confident commercial tone]`. Words that get mispronounced are written with niqqud. Optional deepening: `asetrate=44100*0.95,aresample=44100,atempo=1.0526,bass=g=3:f=140`, then `loudnorm` to -16 LUFS.
7. **Word times from the real take.** Use `silencedetect` (n=-36dB, d=0.06) plus an RMS envelope at 25 ms. Don't trust an alignment of the prompt text.
8. **Music first-class:** about 120 BPM, kick and claps from the first second, instrumental. Check for vocals by transcribing it: empty text means none. Mix the music at about 0.42 with a sidechain duck of ratio 3 under the voice, then the final mix at about -14 LUFS.
9. **Build** (see §3). Show 2-3 stills of the first beat for approval, then build the rest.
10. **Verify** with a contact sheet at about 2 fps of the whole film (checklist §5), then render:
    `npx hyperframes render -o renders/ad.mp4 --fps 60 --workers 1`.
    Mix with ffmpeg afterwards: VO, music and SFX.

## 3. The engine (one HTML composition)

- **World strip.** N panels of 1920 px placed right-to-left: `X(p, x) = (N-1-p)*1920 + x`. The camera pans `#world` to `-X(p, 0)` in **0.42 s `power3.inOut`**. Inside each panel there is a slow push of `scale` 1 → 1.035.
- **Cut on the narration.** The narration is ONE continuous clip. Each pan starts the moment its sentence ends. No dead seconds: something moves on every beat.
- **The line `piece(d, a, b, opts)`.** Two SVG paths in the world: a halo (stroke 14, blur) and a tube (stroke 4.2). Draw them with `strokeDashoffset`, and hide each path until it starts so round caps don't leave dots.
  - DARK: a neon tube plus a white core plus a travelling spark.
  - LIGHT: a crisp navy tube, halo opacity 0.14, and a small plane as the head. Keyframe the head from `getPointAtLength` with `rotation = atan2` of the tangent.
  - Rules: curves only, never right-angle corners. Every piece starts in the direction the previous one ended. Route the line low, never through text or cards.
- **Headlines `words(sel, times)`.** Each word enters from `blur(18px)`, `y 40`, `scale 1.12` with `expo.out` 0.55 s, exactly on its spoken time. One emphasised word per line in the accent colour. Compare 3-4 fonts on the real text before choosing; for Hebrew, Assistant 800, Heebo Black and Rubik.
- **Phone.** A CSS phone 400x820 with radius 64, a Dynamic Island and a shine sweep. Entry: `rotationY 26 → -8`, `z -240 → 0`, `expo.out`.
- **When the line arrives `arrive(el, halo, t)`.**
  - DARK: the line closes a loop around the phone, and pop-outs get neon frames.
  - LIGHT: **no frames.** The element grows ×1.04-1.05 in 0.5 s, and a blurred radial halo (`rgba(30,104,190,.85)` → 0) fades in over 0.28 s and out over 0.7 s.
- **Pop-outs.** Cut the element from the screenshot. It starts at its exact position on the phone screen (offset × the screen's scale) and flies out with `back.out(1.4)`. A button gets a small press (`scale .92` yoyo).
- **Lists of choices** (destinations, categories): the line reaches a hub and fans out into rays, each ending at an item. On its spoken word, the named item grows ×1.3 over a halo, and the previous one settles back.
- **Info cards.** If the app's cards are glassy or busy, rebuild them in HTML, white with a soft shadow. Use the app's own fonts: compare on the real text; El Al was Rubik light for Hebrew and Montserrat bold for codes.
- **LIGHT backdrop.** A real cloud-sea photo (16:9), oversized (about 2656x1500) so the parallax never shows an edge, with a white haze gradient (0.5 → 0.22 → 0.3) for legibility. It drifts slowly and moves about 60 px per pan. On the final push-in it zooms ×1.25.
- **Opener:** the app's real launch/logo animation, cut from the recording, on its own OPAQUE layer. Run `tl.seek(0.001)` at load, so the film's start state is set.
- **Ending:**
  - push the camera into a window/element so it fills the frame (`scale 7`, `power2.in`, plus a short blur);
  - then the logo, and the slogan word by word on the voice;
  - a line with the plane draws under the slogan and flies off;
  - hold at least 1 s, then "created by <your name>".

## 4. Sound

- whoosh on every pan and on the push-in;
- a soft pop on every pop-out;
- a gentle impact on the logo.

Nothing harsh, no loud clicks.

## 5. Checklist before rendering

- [ ] No private data anywhere: names, numbers, routes, notifications. Nothing blurred.
- [ ] Every claim is visible on a real screen.
- [ ] The line never crosses text or a card, has no right-angle corner, and leaves no stray dots.
- [ ] Nothing is clipped by the frame edges. Pop-outs are a sensible size, sharp, and unstretched.
- [ ] Every headline word lands on its spoken word, and no headline overlaps another.
- [ ] Each screen moves on as its sentence ends. No dead seconds.
- [ ] The music is audible under the voice throughout. SFX play only on actions.
- [ ] The opener and the closer differ, and the slogan holds at least 1 s.
- [ ] The post says it's a spec ad, not an official ad.
