# Writing prompts that models can't misread

## 1. Video prompt template (one shot = one prompt)

```
[Shot size + angle], [camera body/format], [lens + focal length + aperture].
SUBJECT: [who/what, exact look - use the reference tags], [what they do, in order, with timing].
CAMERA: [one movement, direction, speed] (+ rack focus / speed ramp if needed).
LIGHT: [style + direction + practicals + atmosphere].
COLOUR: [palette / grade / film stock].
COMPOSITION: [where the subject sits, negative space for text, aspect ratio].
SOUND (if the model makes audio): [ambience, foley, dialogue]; or "no music, no voices".
KEEP: [what must not change - faces, product, logo, background].
AVOID: [known failure modes for this shot].
```

Rules:
- Present tense, concrete verbs, one main action per shot; give the order ("first..., then...").
- Duration-aware: 5 s fits one action; 10 s fits two beats. Say when the key moment happens
  ("the glasses clink at about one second").
- Name what stays still ("the plate and food stay exactly as shown", "no new objects, no hands").
- Negative instructions for known problems: "no text, no logos, no extra people, no dust from the
  mouth, no grey studio background".
- For image-to-video, describe the MOTION, not the picture - the picture is already given.

## 2. Image prompt template

```
[Genre/purpose: premium food commercial photography / film still / character sheet],
[aspect ratio], [subject with exact details], [action/pose], [setting + props],
[camera + lens + aperture], [lighting], [colour palette/grade], [composition + negative space],
[texture/detail words: glistening, crisp, fine grain], [what to keep from the source images],
"no text, no logos" (unless text is required, then quote it exactly).
```

- **Character sheet:** full body front + 3/4 + close-up face, neutral grey background, even
  light, the exact outfit; name every accessory (one nose stud, not two). This sheet is the DNA.
- **Product/food cut-out:** keep the real item as the source image; ask the model to keep it
  "exactly as in the source" and only change light/background.
- **Image edit:** say what to keep first, then the single change ("Keep everything exactly the
  same. Only make the pizza sliced into 6 slices").

## 3. Model notes (Kolbo)

| Model | Best for | Watch out |
|---|---|---|
| Seedance 2.5 | multi-shot scenes, character consistency with Visual DNA, native English dialogue | no Hebrew script in prompts (transliterate dialogue in Latin letters); can leak the reference sheet's grey background on solo close-ups - include environment in frame; invents props |
| Kling 2.5 Turbo Pro / 2.6 | single clean image-to-video shots, food, product, people at 1080p, cheap | one action per clip; may start mid-action (check frame 0) |
| Gemini Omni / Veo 3.1 Lite | native Hebrew speech | short clips |
| Nano Banana 2.1 (edit) | start frames, compositing real products into new scenes, removing text/people, background swaps | check flags/symbols and small text after edits |
| Video watermark remover | burned-in captions/text in real footage | crop UI first |
| Bytedance upscaler | 480p/phone footage to 1080p (preset aigc / ugc) | billed per started 30 fps |

Cost discipline: quote the cost, generate a draft or one test, then the batch. Batch independent
shots in one call.

## 4. Consistency
- Same Visual DNA/reference on every shot of a character; same look-bible sentence in every prompt.
- Generate start frames as stills first (cheap), approve them, then animate.
- Keep wardrobe, props and time of day in a continuity table.

## 5. Hebrew
- Video models: dialogue in Latin transliteration in quotes; on-screen Hebrew text is added in the
  edit, never generated.
- Voice (ElevenLabs eleven_v3): add niqqud to words that are misread; for brand/person names that
  still fail, record the user saying them and convert with speech-to-speech into the narrator's
  voice, then splice.
- Fonts for overlays: Heebo / Frank Ruhl Libre / Assistant / Rubik (fontsource), RTL with RAQM.
