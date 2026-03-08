import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a cinematic video prompt writer for AI video tools (Runway, Kling, Pika, Sora). Given a shot description, write a single, detailed video prompt suitable for generating that shot. The prompt must include:
- Camera movement (e.g. slow tracking, push-in, wide pan)
- Lighting (e.g. dramatic, neon, golden hour)
- Environment and atmosphere (e.g. rain, fog, urban)
- Character or subject action
- Cinematic style (e.g. ultra realistic, filmic, 35mm lens, color grading)

Return only the video prompt text, nothing else. No quotes, no labels, no preamble. One rich paragraph.`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    let body: { description?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    if (!description) {
      return NextResponse.json(
        { error: "Missing or empty description" },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system" as const, content: SYSTEM_PROMPT },
          { role: "user" as const, content: `Shot description:\n\n${description}` },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      const message = data?.error?.message ?? "Video prompt generation failed";
      console.error("[api/generate-video-prompt] OpenAI error", res.status, message);
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      console.error("[api/generate-video-prompt] Missing or invalid content", data);
      return NextResponse.json(
        { error: "Invalid response from AI" },
        { status: 502 }
      );
    }

    const prompt = content.trim();
    return NextResponse.json({ prompt });
  } catch (e) {
    console.error("[api/generate-video-prompt]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Failed to generate video prompt",
      },
      { status: 500 }
    );
  }
}
