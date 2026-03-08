import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 90;

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

type TargetPlatform = "Kling" | "Runway" | "Sora" | "Pika";
type MasterAspectRatio = "16:9" | "9:16" | "1:1";
type ProjectTemplate = "Commercial" | "Music Video" | "Short Film" | "Social Ad" | "Teaser";

function getTemplateGuidance(template: string): string {
  switch (template) {
    case "Commercial":
      return "Project template: Commercial. Polished product-driven storytelling, clean selling moments, aspirational visuals.";
    case "Music Video":
      return "Project template: Music Video. Rhythmic visual flow, style-heavy shots, expressive camera and energy.";
    case "Short Film":
      return "Project template: Short Film. Narrative progression, emotional beats, cinematic continuity.";
    case "Social Ad":
      return "Project template: Social Ad. Fast hook, short impactful beats, mobile-friendly energy.";
    case "Teaser":
      return "Project template: Teaser. Mystery, tension, reveal structure, memorable final beat.";
    default:
      return "Project template: Short Film. Narrative progression, emotional beats, cinematic continuity.";
  }
}

function getAspectRatioGuidance(aspectRatio: string): string {
  switch (aspectRatio) {
    case "16:9":
      return "Master aspect ratio: 16:9 (landscape). Use wide cinematic framing and environment-heavy composition.";
    case "9:16":
      return "Master aspect ratio: 9:16 (portrait/vertical). Use vertical composition, mobile-first framing.";
    case "1:1":
      return "Master aspect ratio: 1:1 (square). Use balanced symmetrical composition.";
    default:
      return "Master aspect ratio: 16:9. Use wide cinematic framing.";
  }
}

function getPlatformGuidance(platform: string): string {
  switch (platform) {
    case "Kling":
      return "Target platform: Kling. Rich cinematic motion and atmosphere, expressive movement language.";
    case "Runway":
      return "Target platform: Runway. Concise production-ready video prompts, strong camera language.";
    case "Sora":
      return "Target platform: Sora. Highly descriptive natural language, immersive environment and mood.";
    case "Pika":
      return "Target platform: Pika. Short, direct, stylized prompts, high visual clarity.";
    default:
      return "Target platform: Runway. Concise production-ready video prompts.";
  }
}

function buildSystemPrompt(style: string, platform: string, aspectRatio: string, template: string): string {
  const platformGuidance = getPlatformGuidance(platform);
  const aspectRatioGuidance = getAspectRatioGuidance(aspectRatio);
  const templateGuidance = getTemplateGuidance(template);
  return `You are a professional cinematic director. Generate a FULL FILM shot list of exactly 10 shots for a video based on the user's concept. Each shot must include: shot number (id), shot type, camera movement, environment description, character action, lighting style, image prompt, and video prompt. Follow the chosen visual style and project template.

Style: ${style}
${templateGuidance}
${platformGuidance}
${aspectRatioGuidance}

Return a valid JSON object only, no markdown or extra text, with this exact structure:
{
  "projectTitle": "A short film or project title",
  "conceptSummary": "The user's video idea summarized in 1-2 sentences",
  "sequenceArc": "One sentence describing the narrative or emotional arc of the 10-shot sequence",
  "targetDuration": "Total target duration (e.g. 60s, 90s)",
  "averageShotDuration": "Average shot length (e.g. 6s, 8s, 10s)",
  "recommendedEditingRhythm": "Brief note on pacing",
  "targetPlatform": "${platform}",
  "platformPromptStyle": "One sentence describing how prompts are tailored for ${platform}",
  "masterAspectRatio": "${aspectRatio}",
  "compositionStyle": "One sentence describing composition for ${aspectRatio}",
  "projectTemplate": "${template}",
  "templateDirection": "One sentence describing how the sequence is tailored for ${template}",
  "shots": [
    {
      "id": 1,
      "title": "Shot title",
      "description": "One sentence: shot type, subject, camera movement, environment, character action.",
      "shotType": "Framing (e.g. Wide, Medium, Close-up)",
      "cameraMovement": "Camera direction and movement (e.g. Slow push-in, 24mm lens)",
      "lighting": "Lighting style for the shot",
      "imagePrompt": "Detailed prompt for a still image. Comma-separated, cinematic, 4k, suitable for image AI. Include composition for ${aspectRatio}.",
      "videoPrompt": "Prompt optimized for ${platform}. Camera movement, lighting, environment, character action, cinematic style.",
      "soundDesign": "Short ambient sound suggestion",
      "motionDirection": "Motion direction for ${platform}",
      "negativePrompt": "Comma-separated terms to avoid",
      "duration": "Suggested clip length (e.g. 5s, 8s, 10s)",
      "aspectRatio": "${aspectRatio}"
    }
  ]
}

Generate exactly 10 shots. Each shot must have: id (1-10), title, description, shotType, cameraMovement, lighting, imagePrompt, videoPrompt, soundDesign, motionDirection, negativePrompt, duration, aspectRatio. The sequence must form a complete cinematic narrative. Match the visual style (${style}) in every imagePrompt and videoPrompt. Use composition appropriate for ${aspectRatio}.`;
}

function logError(message: string, err: unknown): void {
  const detail = err instanceof Error ? err.message : String(err);
  console.error(`[api/generate-full-film] ${message}:`, detail);
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
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
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
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
      return NextResponse.json({ error: "Missing or empty idea" }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(style, platform, masterAspectRatio, projectTemplate);
    const userMessage = `Create a full 10-shot cinematic film plan for this idea:\n\n${idea}`;

    const controller = new AbortController();
    const timeoutMs = 85_000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 8192,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        logError("OpenAI request timed out", fetchErr);
        return NextResponse.json(
          { error: "Full film generation timed out. Please try again." },
          { status: 504 }
        );
      }
      logError("OpenAI fetch failed", fetchErr);
      return NextResponse.json(
        { error: "Full film generation failed. Please try again." },
        { status: 502 }
      );
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch (jsonErr) {
      clearTimeout(timeoutId);
      logError("OpenAI response was not JSON", jsonErr);
      return NextResponse.json(
        { error: "Full film generation failed. Please try again." },
        { status: 502 }
      );
    }

    if (!res.ok) {
      clearTimeout(timeoutId);
      const errBody = data as { error?: { message?: string } };
      logError("OpenAI API error", new Error(String(errBody?.error?.message)));
      return NextResponse.json(
        { error: "Full film generation failed. Please try again." },
        { status: 502 }
      );
    }

    const content = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: "Full film generation failed. Please try again." },
        { status: 502 }
      );
    }

    let parsed: { shots?: Array<Record<string, unknown>>; [key: string]: unknown };
    try {
      parsed = JSON.parse(content) as typeof parsed;
    } catch (parseErr) {
      clearTimeout(timeoutId);
      logError("AI returned invalid JSON", parseErr);
      return NextResponse.json(
        { error: "Full film generation failed. Please try again." },
        { status: 502 }
      );
    }

    if (!Array.isArray(parsed.shots) || parsed.shots.length === 0) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: "Full film generation failed. Please try again." },
        { status: 502 }
      );
    }

    const normalizedShots: GenerateShot[] = parsed.shots.map((s: Record<string, unknown>, index: number) => ({
      id: typeof s.id === "number" ? s.id : index + 1,
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

    clearTimeout(timeoutId);
    return NextResponse.json({
      projectTitle: typeof parsed.projectTitle === "string" ? parsed.projectTitle : "Full Film Plan",
      conceptSummary: typeof parsed.conceptSummary === "string" ? parsed.conceptSummary : "",
      sequenceArc: typeof parsed.sequenceArc === "string" ? parsed.sequenceArc : "",
      targetDuration: typeof parsed.targetDuration === "string" ? parsed.targetDuration : "",
      averageShotDuration: typeof parsed.averageShotDuration === "string" ? parsed.averageShotDuration : "",
      recommendedEditingRhythm: typeof parsed.recommendedEditingRhythm === "string" ? parsed.recommendedEditingRhythm : "",
      targetPlatform: typeof parsed.targetPlatform === "string" ? parsed.targetPlatform : platform,
      platformPromptStyle: typeof parsed.platformPromptStyle === "string" ? parsed.platformPromptStyle : "",
      masterAspectRatio: typeof parsed.masterAspectRatio === "string" ? parsed.masterAspectRatio : masterAspectRatio,
      compositionStyle: typeof parsed.compositionStyle === "string" ? parsed.compositionStyle : "",
      projectTemplate: typeof parsed.projectTemplate === "string" ? parsed.projectTemplate : projectTemplate,
      templateDirection: typeof parsed.templateDirection === "string" ? parsed.templateDirection : "",
      shots: normalizedShots,
    });
  } catch (e) {
    logError("Unexpected error", e);
    return NextResponse.json(
      { error: "Full film generation failed. Please try again." },
      { status: 500 }
    );
  }
}
