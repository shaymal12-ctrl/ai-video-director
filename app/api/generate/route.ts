import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export type GenerateShot = {
  id: number;
  title: string;
  description: string;
  shotType: string;
  cameraMovement: string;
  lighting: string;
  imagePrompt: string;
  videoPrompt: string;
  soundDesign: string;
  motionDirection: string;
  negativePrompt: string;
  duration: string;
  aspectRatio: string;
};

export type TargetPlatform = "Kling" | "Runway" | "Sora" | "Pika";

export type MasterAspectRatio = "16:9" | "9:16" | "1:1";

export type ProjectTemplate = "Commercial" | "Music Video" | "Short Film" | "Social Ad" | "Teaser";

export type GenerateResponse = {
  projectTitle: string;
  conceptSummary: string;
  sequenceArc: string;
  targetDuration: string;
  averageShotDuration: string;
  recommendedEditingRhythm: string;
  targetPlatform: string;
  platformPromptStyle: string;
  masterAspectRatio: string;
  compositionStyle: string;
  projectTemplate: string;
  templateDirection: string;
  shots: GenerateShot[];
};

function getTemplateGuidance(template: string): string {
  switch (template) {
    case "Commercial":
      return "Project template: Commercial. Polished product-driven storytelling, clean selling moments, aspirational visuals. Sequence: lead with hook, product/hero moments, clear benefit or CTA. Pacing: professional, clear beats. Shot priorities: product beauty, lifestyle context, payoff. Emotional rhythm: aspirational, confident. Sound design: clean, premium, minimal distraction.";
    case "Music Video":
      return "Project template: Music Video. Rhythmic visual flow, style-heavy shots, expressive camera and energy. Sequence: follow musical structure (verse/chorus/bridge), strong visual rhythm. Pacing: cut to beat where appropriate, allow for sustained moments. Shot priorities: performance, atmosphere, visual metaphor. Emotional rhythm: driven by music, high energy or mood. Sound design: integrate with music, ambient layers, impactful moments.";
    case "Short Film":
      return "Project template: Short Film. Narrative progression, emotional beats, cinematic continuity. Sequence: clear story arc (setup, development, payoff), character and story first. Pacing: allow scenes to breathe, narrative-driven. Shot priorities: story, character, environment that supports narrative. Emotional rhythm: follows story beats. Sound design: narrative support, atmosphere, dialogue-friendly space.";
    case "Social Ad":
      return "Project template: Social Ad. Fast hook, short impactful beats, mobile-friendly energy. Sequence: grab attention in first second, quick payoff, scroll-stopping. Pacing: punchy, fast cuts, no dead air. Shot priorities: hook shot, key message, CTA. Emotional rhythm: immediate impact. Sound design: bold, attention-grabbing, works with sound off (captions).";
    case "Teaser":
      return "Project template: Teaser. Mystery, tension, reveal structure, memorable final beat. Sequence: intrigue first, withhold then reveal, end on strong hook or cliffhanger. Pacing: build tension, save payoff. Shot priorities: atmosphere, tease, reveal, final beat. Emotional rhythm: suspenseful, curiosity-driven. Sound design: tension, subtle cues, impactful sting or silence.";
    default:
      return "Project template: Short Film. Narrative progression, emotional beats, cinematic continuity.";
  }
}

function getAspectRatioGuidance(aspectRatio: string): string {
  switch (aspectRatio) {
    case "16:9":
      return "Master aspect ratio: 16:9 (landscape). Use wide cinematic framing, landscapes, environment-heavy composition. Describe shots with wide frames, horizontal scope, and environmental context. imagePrompt and videoPrompt should emphasize wide framing and cinematic landscape language.";
    case "9:16":
      return "Master aspect ratio: 9:16 (portrait/vertical). Use vertical composition, centered subjects, mobile-first framing. Describe shots with vertical frame, centered or stacked elements, and mobile-friendly composition. imagePrompt and videoPrompt should emphasize vertical framing and portrait-oriented composition.";
    case "1:1":
      return "Master aspect ratio: 1:1 (square). Use balanced symmetrical composition, social-friendly framing. Describe shots with balanced frame, centered subjects, and square-friendly composition. imagePrompt and videoPrompt should emphasize balanced, symmetrical, social-friendly framing.";
    default:
      return "Master aspect ratio: 16:9. Use wide cinematic framing and environment-heavy composition.";
  }
}

function getPlatformGuidance(platform: string): string {
  switch (platform) {
    case "Kling":
      return "Target platform: Kling. Use cinematic realism, expressive movement language, and detailed shot flow. videoPrompt: rich cinematic motion and atmosphere. motionDirection: expressive, clear movement phrases. negativePrompt: comprehensive (blurry, distorted, low res, flickering, etc.). Pacing: suggest clear rhythm and shot lengths.";
    case "Runway":
      return "Target platform: Runway. Use concise production-ready video prompts and strong camera language. videoPrompt: short, direct, strong camera and action verbs. motionDirection: clean camera directives (e.g. 'slow push-in', 'tracking left'). negativePrompt: concise list. Pacing: professional, edit-friendly durations.";
    case "Sora":
      return "Target platform: Sora. Use highly descriptive natural language prompts with environmental and atmospheric detail. videoPrompt: immersive, narrative sentences; rich environment and mood. motionDirection: natural-language motion. negativePrompt: descriptive. Pacing: allow for longer, more immersive clips where appropriate.";
    case "Pika":
      return "Target platform: Pika. Use short, direct, stylized prompts with strong visual clarity. videoPrompt: punchy keywords, high visual clarity, minimal filler. motionDirection: very short (e.g. 'slow pan', 'zoom in'). negativePrompt: short list. Pacing: snappy, clear duration suggestions.";
    default:
      return "Target platform: Runway. Use concise production-ready video prompts and strong camera language.";
  }
}

function buildSystemPrompt(style: string, platform: string, aspectRatio: string, template: string): string {
  const platformGuidance = getPlatformGuidance(platform);
  const aspectRatioGuidance = getAspectRatioGuidance(aspectRatio);
  const templateGuidance = getTemplateGuidance(template);
  return `You are a professional cinematic director and pre-production expert. Generate a structured shot list for a video based on the user's concept and chosen visual style. The SEQUENCE STRUCTURE, PACING, SHOT PRIORITIES, and EMOTIONAL RHYTHM must follow the chosen project template. All video prompts, motion directions, and negative prompts must be optimized for the chosen target video platform. All framing and composition must follow the master aspect ratio.

Style: ${style}
${templateGuidance}
${platformGuidance}
${aspectRatioGuidance}

Return a valid JSON object only, no markdown or extra text, with this exact structure:
{
  "projectTitle": "A short project title (e.g. Shot Plan or the film name)",
  "conceptSummary": "The user's video idea summarized in 1-2 sentences",
  "sequenceArc": "One sentence describing the narrative or emotional arc of the 5-shot sequence — must reflect ${template} template",
  "targetDuration": "Total target duration for the sequence (e.g. 30s, 45s) — appropriate for ${template}",
  "averageShotDuration": "Average shot length (e.g. 6s, 8s)",
  "recommendedEditingRhythm": "Brief note on pacing — must match ${template} (e.g. 'steady build', 'quick cuts', 'rhythmic')",
  "targetPlatform": "${platform}",
  "platformPromptStyle": "One sentence describing how prompts are tailored for ${platform}",
  "masterAspectRatio": "${aspectRatio}",
  "compositionStyle": "One sentence describing how composition and framing are tailored for ${aspectRatio}",
  "projectTemplate": "${template}",
  "templateDirection": "One sentence describing how the sequence and shots are tailored for ${template} (e.g. 'Polished product-driven storytelling with aspirational visuals for Commercial')",
  "shots": [
    {
      "id": 1,
      "title": "Shot title (e.g. Opening Establishing Shot)",
      "description": "One sentence describing the shot: shot type, subject, and camera movement. Use framing language appropriate for ${aspectRatio}.",
      "shotType": "Framing (e.g. Wide / Establishing, Medium shot) — appropriate for ${aspectRatio}",
      "cameraMovement": "Camera direction including movement and lens (e.g. Slow push-in, 24mm lens, or Drone-style glide, 35mm)",
      "lighting": "Lighting description for the shot",
      "imagePrompt": "A detailed prompt for generating a still image of this shot. Include composition/framing language for ${aspectRatio}. Comma-separated, cinematic, 4k, suitable for image AI.",
      "videoPrompt": "A prompt optimized for ${platform} and ${aspectRatio} framing. Follow platform and aspect ratio guidance. One clear sentence or comma-separated keywords.",
      "soundDesign": "Short ambient sound design suggestion for the shot, comma-separated (e.g. 'rain ambience, distant traffic, neon electrical buzz' or 'wind, creaking wood, faint piano')",
      "motionDirection": "Motion direction optimized for ${platform}. One phrase. Follow platform guidance.",
      "negativePrompt": "Comma-separated terms to avoid. Follow platform guidance for length and style.",
      "duration": "Suggested clip length. One of: 5s, 8s, 10s",
      "aspectRatio": "${aspectRatio}"
    }
  ]
}

Generate exactly 5 shots. The ORDER and PURPOSE of shots must follow the ${template} template (e.g. Commercial: hook, product moments, payoff; Music Video: rhythmic flow, performance and style; Short Film: narrative beats; Social Ad: fast hook, punchy beats; Teaser: mystery, tension, reveal). Match the visual style (${style}) in every imagePrompt and videoPrompt. Tailor sequence structure, pacing, and emotional rhythm for ${template}. Tailor videoPrompt, motionDirection, and negativePrompt for ${platform}. Use composition appropriate for ${aspectRatio}. Default each shot's aspectRatio to "${aspectRatio}". Provide sequenceArc, targetDuration, averageShotDuration, recommendedEditingRhythm, masterAspectRatio, compositionStyle, projectTemplate, and templateDirection at the top level.`;
}

function logError(message: string, err: unknown): void {
  const detail = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(`[api/generate] ${message}:`, detail);
  if (stack) console.error(stack);
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[api/generate] OPENAI_API_KEY is missing");
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    let body: { idea?: string; style?: string; platform?: string; masterAspectRatio?: string; projectTemplate?: string };
    try {
      body = await request.json();
    } catch (parseErr) {
      logError("Invalid request body", parseErr);
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const idea = typeof body.idea === "string" ? body.idea.trim() : "";
    const style = typeof body.style === "string" ? body.style : "cinematic";
    const platformRaw = typeof body.platform === "string" ? body.platform : "Runway";
    const platform: TargetPlatform =
      platformRaw === "Kling" || platformRaw === "Runway" || platformRaw === "Sora" || platformRaw === "Pika"
        ? platformRaw
        : "Runway";
    const aspectRatioRaw = typeof body.masterAspectRatio === "string" ? body.masterAspectRatio : "16:9";
    const masterAspectRatio: MasterAspectRatio =
      aspectRatioRaw === "16:9" || aspectRatioRaw === "9:16" || aspectRatioRaw === "1:1"
        ? aspectRatioRaw
        : "16:9";
    const templateRaw = typeof body.projectTemplate === "string" ? body.projectTemplate : "Short Film";
    const projectTemplate: ProjectTemplate =
      templateRaw === "Commercial" || templateRaw === "Music Video" || templateRaw === "Short Film" || templateRaw === "Social Ad" || templateRaw === "Teaser"
        ? templateRaw
        : "Short Film";

    if (!idea) {
      return NextResponse.json(
        { error: "Missing or empty idea" },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(style, platform, masterAspectRatio, projectTemplate);
    const userMessage = `Create a cinematic shot list for this video idea:\n\n${idea}`;

    const requestPayload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    };

    const controller = new AbortController();
    const timeoutMs = 55_000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        logError(`OpenAI request timed out (${timeoutMs / 1000}s)`, fetchErr);
        return NextResponse.json(
          { error: "Scene generation timed out. Please try again." },
          { status: 504 }
        );
      }
      logError("OpenAI fetch failed (network or DNS)", fetchErr);
      return NextResponse.json(
        { error: "Scene generation failed. Please try again." },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch (jsonErr) {
      const text = await res.text().catch(() => "(could not read body)");
      logError("OpenAI response was not JSON", jsonErr);
      console.error("[api/generate] Raw response:", text.slice(0, 500));
      return NextResponse.json(
        { error: "Scene generation failed. Please try again." },
        { status: 502 }
      );
    }

    if (!res.ok) {
      const errBody = data as { error?: { message?: string; code?: string } };
      const msg = errBody?.error?.message ?? JSON.stringify(data);
      logError("OpenAI API error", new Error(String(msg)));
      return NextResponse.json(
        { error: "Scene generation failed. Please try again." },
        { status: 502 }
      );
    }

    const content = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      logError("Missing or invalid choices[0].message.content", new Error("Invalid content"));
      return NextResponse.json(
        { error: "Scene generation failed. Please try again." },
        { status: 502 }
      );
    }

    let parsed: GenerateResponse;
    try {
      parsed = JSON.parse(content) as GenerateResponse;
    } catch (parseErr) {
      logError("AI returned invalid JSON", parseErr);
      console.error("[api/generate] Raw content:", content.slice(0, 500));
      return NextResponse.json(
        { error: "Scene generation failed. Please try again." },
        { status: 502 }
      );
    }

    if (!parsed || typeof parsed !== "object") {
      logError("Parsed result is not an object", new Error("Invalid structure"));
      return NextResponse.json(
        { error: "Scene generation failed. Please try again." },
        { status: 502 }
      );
    }

    if (!Array.isArray(parsed.shots) || parsed.shots.length === 0) {
      logError("No shots in response", new Error("Empty shots"));
      return NextResponse.json(
        { error: "Scene generation failed. Please try again." },
        { status: 502 }
      );
    }

    const normalizedShots: GenerateShot[] = parsed.shots.map((s: Record<string, unknown>) => ({
      id: typeof s.id === "number" ? s.id : 0,
      title: typeof s.title === "string" ? s.title : "",
      description: typeof s.description === "string" ? s.description : "",
      shotType: typeof s.shotType === "string" ? s.shotType : "",
      cameraMovement: typeof s.cameraMovement === "string" ? s.cameraMovement : "",
      lighting: typeof s.lighting === "string" ? s.lighting : "",
      imagePrompt: typeof s.imagePrompt === "string" ? s.imagePrompt : "",
      videoPrompt: typeof s.videoPrompt === "string" ? s.videoPrompt : "",
      soundDesign: typeof s.soundDesign === "string" ? s.soundDesign : "",
      motionDirection: typeof s.motionDirection === "string" ? s.motionDirection : "",
      negativePrompt: typeof s.negativePrompt === "string" ? s.negativePrompt : "",
      duration: typeof s.duration === "string" ? s.duration : "",
      aspectRatio: typeof s.aspectRatio === "string" ? s.aspectRatio : masterAspectRatio,
    }));

    const resAny = parsed as Record<string, unknown>;
    return NextResponse.json({
      projectTitle: typeof resAny.projectTitle === "string" ? resAny.projectTitle : "",
      conceptSummary: typeof resAny.conceptSummary === "string" ? resAny.conceptSummary : "",
      sequenceArc: typeof resAny.sequenceArc === "string" ? resAny.sequenceArc : "",
      targetDuration: typeof resAny.targetDuration === "string" ? resAny.targetDuration : "",
      averageShotDuration: typeof resAny.averageShotDuration === "string" ? resAny.averageShotDuration : "",
      recommendedEditingRhythm: typeof resAny.recommendedEditingRhythm === "string" ? resAny.recommendedEditingRhythm : "",
      targetPlatform: typeof resAny.targetPlatform === "string" ? resAny.targetPlatform : platform,
      platformPromptStyle: typeof resAny.platformPromptStyle === "string" ? resAny.platformPromptStyle : "",
      masterAspectRatio: typeof resAny.masterAspectRatio === "string" ? resAny.masterAspectRatio : masterAspectRatio,
      compositionStyle: typeof resAny.compositionStyle === "string" ? resAny.compositionStyle : "",
      projectTemplate: typeof resAny.projectTemplate === "string" ? resAny.projectTemplate : projectTemplate,
      templateDirection: typeof resAny.templateDirection === "string" ? resAny.templateDirection : "",
      shots: normalizedShots,
    });
  } catch (e) {
    logError("Unexpected error in POST /api/generate", e);
    return NextResponse.json(
      { error: "Scene generation failed. Please try again." },
      { status: 500 }
    );
  }
}
