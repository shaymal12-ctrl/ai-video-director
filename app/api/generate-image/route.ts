import { NextRequest, NextResponse } from "next/server";

const STORYBOARD_SUFFIX =
  ", cinematic storyboard frame, film still, highly detailed, dramatic lighting";

function getCompositionSuffix(aspectRatio: string): string {
  switch (aspectRatio) {
    case "16:9":
      return ", wide cinematic composition, landscape framing";
    case "9:16":
      return ", vertical cinematic composition, portrait framing";
    case "1:1":
      return ", square balanced cinematic composition";
    default:
      return ", wide cinematic composition, landscape framing";
  }
}

function getSizeForAspectRatio(aspectRatio: string): "1792x1024" | "1024x1792" | "1024x1024" {
  switch (aspectRatio) {
    case "16:9":
      return "1792x1024";
    case "9:16":
      return "1024x1792";
    case "1:1":
      return "1024x1024";
    default:
      return "1792x1024";
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    let body: { prompt?: string; aspectRatio?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const rawPrompt =
      typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!rawPrompt) {
      return NextResponse.json(
        { error: "Missing or empty prompt" },
        { status: 400 }
      );
    }

    const aspectRatio = typeof body.aspectRatio === "string" ? body.aspectRatio : "16:9";
    const compositionSuffix = getCompositionSuffix(aspectRatio);
    const baseSuffix = `${STORYBOARD_SUFFIX}${compositionSuffix}`;
    const prompt =
      rawPrompt.length + baseSuffix.length <= 1000
        ? `${rawPrompt}${baseSuffix}`
        : `${rawPrompt.slice(0, 1000 - baseSuffix.length)}${baseSuffix}`;

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    const data = (await res.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      const message = data?.error?.message ?? "Image generation failed";
      console.error("[api/generate-image] OpenAI error", res.status, message);
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const first = data?.data?.[0];
    let url: string | undefined = first?.url;
    if (!url && typeof first?.b64_json === "string") {
      url = `data:image/png;base64,${first.b64_json}`;
    }
    if (!url || typeof url !== "string") {
      console.error("[api/generate-image] No image URL or b64_json in response", data);
      return NextResponse.json(
        { error: "No image URL in response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url });
  } catch (e) {
    console.error("[api/generate-image]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Failed to generate image",
      },
      { status: 500 }
    );
  }
}
