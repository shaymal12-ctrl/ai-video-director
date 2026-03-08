"use client";

import React, { useState, useRef } from "react";

type StyleOption = "cinematic" | "fantasy" | "dark" | "realistic";

type PlatformOption = "Kling" | "Runway" | "Sora" | "Pika";

const PLATFORM_OPTIONS: { value: PlatformOption; label: string }[] = [
  { value: "Kling", label: "Kling" },
  { value: "Runway", label: "Runway" },
  { value: "Sora", label: "Sora" },
  { value: "Pika", label: "Pika" },
];

type MasterAspectRatioOption = "16:9" | "9:16" | "1:1";

const ASPECT_RATIO_OPTIONS: { value: MasterAspectRatioOption; label: string }[] = [
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "1:1", label: "1:1" },
];

type ProjectTemplateOption = "Commercial" | "Music Video" | "Short Film" | "Social Ad" | "Teaser";

const TEMPLATE_OPTIONS: { value: ProjectTemplateOption; label: string }[] = [
  { value: "Commercial", label: "Commercial" },
  { value: "Music Video", label: "Music Video" },
  { value: "Short Film", label: "Short Film" },
  { value: "Social Ad", label: "Social Ad" },
  { value: "Teaser", label: "Teaser" },
];

type Shot = {
  id: number;
  label: string;
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

const STYLE_LABELS: { value: StyleOption; label: string }[] = [
  { value: "cinematic", label: "Cinematic" },
  { value: "fantasy", label: "Fantasy" },
  { value: "dark", label: "Dark" },
  { value: "realistic", label: "Realistic" },
];

const EXAMPLE_IDEAS = [
  "A cinematic fighter jet battle above the ocean at sunset",
  "A detective walking through neon Tokyo rain at night",
  "A lone astronaut discovering an abandoned space station",
  "Cinematic slow pan across a neon-lit Tokyo skyline at night, rain pouring down, vibrant reflections on wet surfaces, atmospheric, ultra realistic, filmic lighting, high detail",
];

function formatRunwayPrompt(videoPrompt: string): string {
  return videoPrompt
    .replace(/,?\s*smooth motion, cinematic frame rate, depth and parallax, professional film look\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatSoraPrompt(videoPrompt: string): string {
  return videoPrompt;
}

function formatKlingPrompt(videoPrompt: string): string {
  const trimmed = formatRunwayPrompt(videoPrompt);
  if (trimmed.length <= 240) return trimmed;
  const lastComma = trimmed.lastIndexOf(",", 240);
  const cut = lastComma > 180 ? trimmed.slice(0, lastComma) : trimmed.slice(0, 237) + "...";
  return cut.trim();
}

function getStoryboardPrompt(shot: Shot): string {
  const description = `${shot.shotType}: ${shot.label}. ${shot.cameraMovement}.`;
  return `${shot.label}. ${description} ${shot.imagePrompt}`;
}

async function copyFullShot(shot: Shot) {
  const description = `${shot.shotType}: ${shot.label}. ${shot.cameraMovement}.`;
  const text = `
SHOT
${shot.label}

DESCRIPTION
${description}

IMAGE PROMPT
${shot.imagePrompt}

VIDEO PROMPT
${shot.videoPrompt}

MOTION
${shot.motionDirection}

NEGATIVE PROMPT
${shot.negativePrompt}

DURATION
${shot.duration}

ASPECT RATIO
${shot.aspectRatio}

SOUND DESIGN
${shot.soundDesign}
`;
  try {
    await navigator.clipboard.writeText(text.trim());
    alert("Full shot package copied");
  } catch (err) {
    console.error(err);
    alert("Copy failed");
  }
}

async function fetchImageBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch image");
  }
  return await response.blob();
}

async function downloadImage(url: string, filename: string) {
  const blob = await fetchImageBlob(url);
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

async function copyImageUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    alert("Image URL copied to clipboard");
  } catch (err) {
    console.error(err);
    alert("Copy failed");
  }
}

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [style, setStyle] = useState<StyleOption>("cinematic");
  const [targetPlatform, setTargetPlatform] = useState<PlatformOption>("Runway");
  const [masterAspectRatio, setMasterAspectRatio] = useState<MasterAspectRatioOption>("16:9");
  const [projectTemplate, setProjectTemplate] = useState<ProjectTemplateOption>("Short Film");
  const [platformPromptStyle, setPlatformPromptStyle] = useState<string | null>(null);
  const [compositionStyle, setCompositionStyle] = useState<string | null>(null);
  const [templateDirection, setTemplateDirection] = useState<string | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatedFrames, setGeneratedFrames] = useState<Record<number, string>>({});
  const [storyboardError, setStoryboardError] = useState<Record<number, string>>({});
  const [loadingShotId, setLoadingShotId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationIdRef = useRef(0);
  const [generatedVideoPrompts, setGeneratedVideoPrompts] = useState<Record<number, string>>({});
  const [loadingVideoPromptId, setLoadingVideoPromptId] = useState<number | null>(null);
  const [videoPromptError, setVideoPromptError] = useState<Record<number, string>>({});
  const [isGeneratingFullFilm, setIsGeneratingFullFilm] = useState(false);

  const mergeStoryboardError = (
    prev: Record<number, string>,
    id: number,
    msg: string
  ): Record<number, string> => ({ ...prev, [id]: msg });

  const mergeGeneratedFrames = (
    prev: Record<number, string>,
    id: number,
    url: string
  ): Record<number, string> => ({ ...prev, [id]: url });

  const triggerAutoImageGeneration = (plan: Shot[], currentGen: number) => {
    (async () => {
      for (const shot of plan) {
        if (currentGen !== generationIdRef.current) return;
        setLoadingShotId(shot.id);
        setStoryboardError((prev) => mergeStoryboardError(prev, shot.id, ""));
        try {
          const res = await fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: shot.imagePrompt, aspectRatio: masterAspectRatio }),
          });
          const data = (await res.json()) as { url?: string; error?: string };
          if (currentGen !== generationIdRef.current) return;
          if (!res.ok) {
            setStoryboardError((prev) =>
              mergeStoryboardError(prev, shot.id, data.error ?? "Image generation failed")
            );
            continue;
          }
          if (data.url) {
            setGeneratedFrames((prev) => mergeGeneratedFrames(prev, shot.id, data.url!));
          } else {
            setStoryboardError((prev) =>
              mergeStoryboardError(prev, shot.id, "No image URL in response")
            );
          }
        } catch (e) {
          if (currentGen !== generationIdRef.current) return;
          const errMsg =
            e instanceof Error ? (e.message || "Failed to generate image") : "Failed to generate image";
          setStoryboardError((prev) => mergeStoryboardError(prev, shot.id, errMsg));
        } finally {
          if (currentGen === generationIdRef.current) {
            setLoadingShotId(null);
          }
        }
      }
      if (currentGen === generationIdRef.current) {
        setLoadingShotId(null);
      }
    })();
  };

  const handleCopy = async (text: string, copyId?: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      if (copyId != null) {
        setCopiedId(copyId);
        window.setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      // Silently fail if copy is not permitted
    }
  };

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!idea.trim()) {
      setError("Please describe your video idea so the director can plan shots.");
      setShots([]);
      setHasGenerated(false);
      return;
    }

    setError(null);
    setIsGenerating(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim(), style, platform: targetPlatform, masterAspectRatio, projectTemplate }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      let data: { error?: string; shots?: unknown; platformPromptStyle?: string; compositionStyle?: string; templateDirection?: string };
      try {
        data = await res.json();
      } catch {
        setError("Invalid response from server. Please try again.");
        setShots([]);
        setHasGenerated(false);
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }
      setPlatformPromptStyle(typeof data.platformPromptStyle === "string" ? data.platformPromptStyle : null);
      setCompositionStyle(typeof data.compositionStyle === "string" ? data.compositionStyle : null);
      setTemplateDirection(typeof data.templateDirection === "string" ? data.templateDirection : null);
      const apiShots = (data.shots ?? []) as Array<{
        id: number;
        title: string;
        shotType?: string;
        cameraMovement?: string;
        lighting?: string;
        imagePrompt?: string;
        videoPrompt?: string;
        soundDesign?: string;
        motionDirection?: string;
        negativePrompt?: string;
        duration?: string;
        aspectRatio?: string;
      }>;
      const plan: Shot[] = apiShots.map((s) => ({
        id: s.id,
        label: s.title,
        shotType: s.shotType ?? "",
        cameraMovement: s.cameraMovement ?? "",
        lighting: s.lighting ?? "",
        imagePrompt: s.imagePrompt ?? "",
        videoPrompt: s.videoPrompt ?? "",
        soundDesign: s.soundDesign ?? "",
        motionDirection: s.motionDirection ?? "",
        negativePrompt: s.negativePrompt ?? "",
        duration: s.duration ?? "",
        aspectRatio: s.aspectRatio ?? "",
      }));
      setShots(plan);
      setGeneratedFrames({});
      setStoryboardError({});
      setLoadingShotId(null);
      setGeneratedVideoPrompts({});
      setVideoPromptError({});
      setHasGenerated(true);

      generationIdRef.current += 1;
      const currentGen = generationIdRef.current;
      triggerAutoImageGeneration(plan, currentGen);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.name === "AbortError"
            ? "Scene generation timed out. Please try again."
            : e.message
          : "Failed to generate scene plan";
      setError(message);
      setShots([]);
      setHasGenerated(false);
    } finally {
      clearTimeout(timeoutId);
      setIsGenerating(false);
    }
  };

  const handleGenerateStoryboard = async (shot: Shot) => {
    setLoadingShotId(shot.id);
    setStoryboardError((prev) => mergeStoryboardError(prev, shot.id, ""));
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: shot.imagePrompt, aspectRatio: masterAspectRatio }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setStoryboardError((prev) =>
          mergeStoryboardError(prev, shot.id, data.error ?? "Image generation failed")
        );
        return;
      }
      if (data.url) {
        const imageUrl = data.url;
        setGeneratedFrames((prev) => mergeGeneratedFrames(prev, shot.id, imageUrl));
      } else {
        setStoryboardError((prev) =>
          mergeStoryboardError(prev, shot.id, "No image URL in response")
        );
      }
    } catch (e) {
      const errMsg =
        e instanceof Error ? (e.message || "Failed to generate image") : "Failed to generate image";
      setStoryboardError((prev) => mergeStoryboardError(prev, shot.id, errMsg));
    } finally {
      setLoadingShotId(null);
    }
  };

  const handleGenerateVideoPrompt = async (shot: Shot) => {
    const description = `${shot.shotType}: ${shot.label}. ${shot.cameraMovement}. ${shot.lighting}`;
    setLoadingVideoPromptId(shot.id);
    setVideoPromptError((prev) => ({ ...prev, [shot.id]: "" }));
    try {
      const res = await fetch("/api/generate-video-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = (await res.json()) as { prompt?: string; error?: string };
      if (!res.ok) {
        setVideoPromptError((prev) => ({ ...prev, [shot.id]: data.error ?? "Video prompt generation failed" }));
        return;
      }
      if (data.prompt) {
        setGeneratedVideoPrompts((prev) => ({ ...prev, [shot.id]: data.prompt! }));
      } else {
        setVideoPromptError((prev) => ({ ...prev, [shot.id]: "No prompt in response" }));
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Failed to generate video prompt";
      setVideoPromptError((prev) => ({ ...prev, [shot.id]: errMsg }));
    } finally {
      setLoadingVideoPromptId(null);
    }
  };

  const handleGenerateFullFilm = async () => {
    if (!idea.trim()) {
      setError("Please enter a video idea to generate a full film plan.");
      return;
    }
    setError(null);
    setIsGeneratingFullFilm(true);
    try {
      const res = await fetch("/api/generate-full-film", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea.trim(),
          style,
          platform: targetPlatform,
          masterAspectRatio,
          projectTemplate,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        shots?: Array<{
          id: number;
          title: string;
          shotType?: string;
          cameraMovement?: string;
          lighting?: string;
          imagePrompt?: string;
          videoPrompt?: string;
          soundDesign?: string;
          motionDirection?: string;
          negativePrompt?: string;
          duration?: string;
          aspectRatio?: string;
        }>;
        platformPromptStyle?: string;
        compositionStyle?: string;
        templateDirection?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Full film generation failed. Please try again.");
        setShots([]);
        setHasGenerated(false);
        return;
      }
      const apiShots = data.shots ?? [];
      const plan: Shot[] = apiShots.map((s) => ({
        id: s.id,
        label: s.title,
        shotType: s.shotType ?? "",
        cameraMovement: s.cameraMovement ?? "",
        lighting: s.lighting ?? "",
        imagePrompt: s.imagePrompt ?? "",
        videoPrompt: s.videoPrompt ?? "",
        soundDesign: s.soundDesign ?? "",
        motionDirection: s.motionDirection ?? "",
        negativePrompt: s.negativePrompt ?? "",
        duration: s.duration ?? "",
        aspectRatio: s.aspectRatio ?? "",
      }));
      setShots(plan);
      setGeneratedFrames({});
      setStoryboardError({});
      setLoadingShotId(null);
      setGeneratedVideoPrompts({});
      setVideoPromptError({});
      setPlatformPromptStyle(data.platformPromptStyle ?? null);
      setCompositionStyle(data.compositionStyle ?? null);
      setTemplateDirection(data.templateDirection ?? null);
      setHasGenerated(true);
      generationIdRef.current += 1;
      const currentGen = generationIdRef.current;
      triggerAutoImageGeneration(plan, currentGen);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Full film generation failed. Please try again.";
      setError(message);
      setShots([]);
      setHasGenerated(false);
    } finally {
      setIsGeneratingFullFilm(false);
    }
  };

  const handleExportShotList = () => {
    const lines: string[] = [
      "PROJECT: Shot Plan",
      "",
      "CONCEPT",
      idea.trim(),
      "",
    ];
    shots.forEach((shot) => {
      const description = `${shot.shotType}: ${shot.label}. ${shot.cameraMovement}.`;
      lines.push(`SHOT ${shot.id} – ${shot.label}`);
      lines.push("Description:");
      lines.push(description);
      lines.push("");
      lines.push("Camera:");
      lines.push(shot.cameraMovement);
      lines.push("");
      lines.push("Lighting:");
      lines.push(shot.lighting);
      lines.push("");
      lines.push("Image Prompt:");
      lines.push(shot.imagePrompt);
      lines.push("");
      lines.push("Video Prompt:");
      lines.push(shot.videoPrompt);
      lines.push("");
      if (shot.motionDirection) {
        lines.push("Motion Direction:");
        lines.push(shot.motionDirection);
        lines.push("");
      }
      if (shot.negativePrompt) {
        lines.push("Negative Prompt:");
        lines.push(shot.negativePrompt);
        lines.push("");
      }
      if (shot.duration) {
        lines.push("Duration:");
        lines.push(shot.duration);
        lines.push("");
      }
      if (shot.aspectRatio) {
        lines.push("Aspect Ratio:");
        lines.push(shot.aspectRatio);
        lines.push("");
      }
      if (shot.soundDesign) {
        lines.push("Sound Design:");
        lines.push(shot.soundDesign);
        lines.push("");
      }
      lines.push("");
    });
    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shot-list.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportAsJson = () => {
    const filmPlan = {
      concept: idea.trim(),
      targetPlatform,
      masterAspectRatio,
      projectTemplate,
      platformPromptStyle: platformPromptStyle ?? undefined,
      compositionStyle: compositionStyle ?? undefined,
      templateDirection: templateDirection ?? undefined,
      generatedAt: new Date().toISOString(),
      shots: shots.map((shot) => ({
        id: shot.id,
        title: shot.label,
        shotType: shot.shotType,
        cameraMovement: shot.cameraMovement,
        lighting: shot.lighting,
        imagePrompt: shot.imagePrompt,
        videoPrompt: shot.videoPrompt,
        soundDesign: shot.soundDesign,
        motionDirection: shot.motionDirection,
        negativePrompt: shot.negativePrompt,
        duration: shot.duration,
        aspectRatio: shot.aspectRatio,
      })),
    };
    const json = JSON.stringify(filmPlan, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "film-plan.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const s = {
    main: { margin: "0 auto", maxWidth: 960, padding: 0, paddingBottom: "clamp(56px, 8vw, 80px)", background: "transparent", minHeight: "100vh", boxSizing: "border-box" as const },
    nav: { display: "flex", alignItems: "center" as const, justifyContent: "space-between" as const, padding: "clamp(20px, 3vw, 28px) clamp(20px, 4vw, 32px)", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative" as const, zIndex: 10 },
    navLogo: { fontSize: "1.0625rem", fontWeight: 600, color: "#f8fafc", letterSpacing: "-0.02em" },
    navLinks: { display: "flex", gap: 28, alignItems: "center" as const },
    navLink: { fontSize: "0.9375rem", color: "#94a3b8", textDecoration: "none" as const },
    hero: { position: "relative" as const, paddingTop: "clamp(56px, 10vw, 96px)", paddingBottom: "clamp(48px, 8vw, 80px)", paddingLeft: "clamp(20px, 4vw, 32px)", paddingRight: "clamp(20px, 4vw, 32px)", marginBottom: 56, overflow: "hidden" as const },
    heroGlow: { position: "absolute" as const, inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.25) 0%, rgba(30, 58, 138, 0.12) 40%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(ellipse 50% 30% at 20% 60%, rgba(59, 130, 246, 0.06) 0%, transparent 50%)", pointerEvents: "none" as const },
    heroContent: { position: "relative" as const, zIndex: 1, textAlign: "center" as const },
    heroText: { marginBottom: 32, textAlign: "center" as const },
    title: { fontSize: "clamp(2.75rem, 6vw, 4rem)", fontWeight: 800, margin: "0 0 24px", color: "#f8fafc", letterSpacing: "-0.04em", lineHeight: 1.05, textShadow: "0 0 40px rgba(59, 130, 246, 0.15)" },
    subtitle: { fontSize: "1.125rem", lineHeight: 1.7, color: "#94a3b8", maxWidth: 560, margin: "0 auto 40px", textAlign: "center" as const },
    heroCtaWrap: { display: "flex", flexWrap: "wrap" as const, gap: 16, justifyContent: "center" as const, alignItems: "center" as const, marginBottom: 48 },
    heroCtaPrimary: { padding: "18px 36px", borderRadius: 16, border: "none", background: "linear-gradient(165deg, #60a5fa 0%, #3b82f6 45%, #2563eb 100%)", color: "#fff", fontSize: "1.0625rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 10px 28px rgba(37,99,235,0.4)", textDecoration: "none" as const },
    heroCtaSecondary: { padding: "16px 28px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: "0.9375rem", fontWeight: 500, cursor: "pointer", textDecoration: "none" as const },
    heroPreviewCard: { maxWidth: 420, margin: "0 auto", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(15, 23, 42, 0.6)", boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 24px 48px -12px rgba(0,0,0,0.4), 0 0 80px -20px rgba(59, 130, 246, 0.08)", backdropFilter: "blur(12px)" },
    heroPreviewCardInner: { padding: "24px 28px", display: "flex", flexDirection: "column" as const, gap: 12 },
    heroPreviewLabel: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", color: "#64748b", textTransform: "uppercase" as const },
    heroPreviewTitle: { fontSize: "1rem", fontWeight: 600, color: "#e2e8f0", margin: 0, lineHeight: 1.5 },
    heroPreviewMeta: { fontSize: "0.8125rem", color: "#94a3b8", margin: 0 },
    panelWrap: { padding: "0 clamp(20px, 4vw, 32px)" },
    panel: { marginBottom: 40, padding: "clamp(36px, 5vw, 56px)", borderRadius: 22, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(22, 24, 32, 0.92)", boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 32px 64px -16px rgba(0,0,0,0.5), 0 0 120px -24px rgba(59, 130, 246, 0.1)", backdropFilter: "blur(12px)" },
    form: { display: "flex", flexDirection: "column" as const, gap: 32 },
    fieldGroup: { marginBottom: 0 },
    fieldGroupFirst: { marginBottom: 28 },
    label: { display: "block" as const, fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.05em", color: "#a1a1aa", marginBottom: 10, textTransform: "uppercase" as const },
    labelHelp: { fontSize: "0.875rem", color: "#64748b", margin: "0 0 12px", lineHeight: 1.5 },
    textarea: { width: "100%", minHeight: 200, padding: "24px 28px", borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(15, 18, 26, 0.7)", color: "#f8fafc", fontSize: "1rem", lineHeight: 1.65, resize: "vertical" as const, outline: "none", boxSizing: "border-box" as const },
    fieldRow: { display: "flex", flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 24, alignItems: "center" as const, marginTop: 4 },
    select: { padding: "14px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(15, 18, 26, 0.7)", color: "#f8fafc", fontSize: "1rem", minWidth: 160, outline: "none", cursor: "pointer" as const },
    btnWrap: { marginLeft: "auto" },
    btn: { padding: "18px 36px", borderRadius: 16, border: "none", background: "linear-gradient(165deg, #60a5fa 0%, #3b82f6 45%, #2563eb 100%)", color: "#fff", fontSize: "1.0625rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 10px 28px rgba(37,99,235,0.4)" },
    btnDis: { opacity: 0.7, cursor: "not-allowed" },
    exportBtnWrap: { marginBottom: 28, display: "flex", flexWrap: "wrap" as const, gap: 12 },
    exportBtn: { padding: "14px 28px", borderRadius: 14, border: "none", background: "linear-gradient(165deg, #60a5fa 0%, #3b82f6 45%, #2563eb 100%)", color: "#fff", fontSize: "0.9375rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 8px 22px rgba(37,99,235,0.35)" },
    results: { marginTop: 64, paddingLeft: "clamp(20px, 4vw, 32px)", paddingRight: "clamp(20px, 4vw, 32px)" },
    resultsLoading: { textAlign: "center" as const, color: "#94a3b8", padding: "48px 24px", fontSize: "1rem" },
    resultsSummaryCard: { padding: "clamp(32px, 5vw, 48px)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(12, 14, 22, 0.95)", marginBottom: 40, boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 24px 48px -12px rgba(0,0,0,0.4), 0 0 80px -20px rgba(59, 130, 246, 0.05)", backdropFilter: "blur(12px)" },
    resultsSummaryTitle: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", color: "#94a3b8", marginBottom: 8, textTransform: "uppercase" as const },
    resultsSummaryHeading: { fontSize: "1.5rem", fontWeight: 600, color: "#f8fafc", margin: "0 0 16px", letterSpacing: "-0.02em" },
    resultsSummaryConcept: { fontSize: "1rem", lineHeight: 1.7, color: "#94a3b8", margin: 0 },
    shotsGrid: { display: "flex", flexDirection: "column" as const, gap: 32 },
    shotCard: { borderRadius: 24, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(12, 14, 22, 0.92)", boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 20px 48px -16px rgba(0,0,0,0.4), 0 0 60px -20px rgba(59, 130, 246, 0.04)", backdropFilter: "blur(12px)", overflow: "hidden" as const },
    shotCardBody: { padding: "clamp(28px, 4vw, 40px)" },
    shotHeader: { display: "flex", alignItems: "flex-start" as const, gap: 20, marginBottom: 28 },
    shotBadge: { width: 48, height: 48, borderRadius: 16, background: "linear-gradient(145deg, rgba(59, 130, 246, 0.18) 0%, rgba(30, 58, 138, 0.12) 100%)", color: "#93c5fd", fontSize: "1.125rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(59, 130, 246, 0.18)" },
    shotHeaderContent: { flex: 1, minWidth: 0 },
    shotTitle: { fontSize: "1.25rem", fontWeight: 600, color: "#f8fafc", margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.3 },
    shotMeta: { fontSize: "0.875rem", color: "#94a3b8", margin: 0, lineHeight: 1.45 },
    storyboardWrap: { marginBottom: 0, overflow: "hidden" as const, borderBottom: "1px solid rgba(255,255,255,0.06)" },
    storyboardThumb: { aspectRatio: "16 / 9", background: "linear-gradient(145deg, #1e293b 0%, #0f172a 45%, #1e1b4b 100%)", position: "relative" as const, display: "flex", flexDirection: "column" as const, justifyContent: "flex-end" as const, padding: "clamp(24px, 4vw, 32px)" },
    storyboardOverlay: { position: "absolute" as const, inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 55%)", display: "flex", flexDirection: "column" as const, justifyContent: "flex-end" as const, padding: "clamp(24px, 4vw, 32px)" },
    storyboardNumber: { fontSize: "0.6875rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em", marginBottom: 6, textTransform: "uppercase" as const },
    storyboardTitle: { fontSize: "clamp(1rem, 2vw, 1.25rem)", fontWeight: 600, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.02em" },
    storyboardLabel: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.6)", marginBottom: 10, textTransform: "uppercase" as const },
    storyboardCaption: { fontSize: "0.8125rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.5, margin: "0 0 14px", maxWidth: "100%" },
    storyboardBtnRow: { display: "flex", flexWrap: "wrap" as const, gap: 12, marginTop: 4 },
    storyboardBtn: { padding: "10px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer", alignSelf: "flex-start" as const },
    storyboardImg: { width: "100%", aspectRatio: "16 / 9", objectFit: "cover" as const, display: "block" as const },
    storyboardGeneratedLabel: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", color: "#94a3b8", marginTop: 14, marginBottom: 12, textTransform: "uppercase" as const },
    storyboardDownloadBtn: { padding: "10px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer" },
    storyboardLoading: { position: "absolute" as const, inset: 0, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" },
    storyboardSpinner: { width: 32, height: 32, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "storyboard-spin 0.8s linear infinite" },
    storyboardError: { fontSize: "0.875rem", color: "#f87171", marginBottom: 12, padding: "12px 16px", background: "rgba(248,113,113,0.1)", borderRadius: 12, border: "1px solid rgba(248,113,113,0.2)" },
    shotSection: { marginBottom: 26 },
    shotSectionLast: { marginBottom: 0 },
    shotLabel: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", color: "#64748b", marginBottom: 10, textTransform: "uppercase" as const },
    shotDesc: { fontSize: "0.9375rem", color: "#e2e8f0", margin: 0, lineHeight: 1.6 },
    promptInset: { padding: "22px 26px", borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(8, 10, 18, 0.9)", marginTop: 12 },
    promptRow: { display: "flex", flexDirection: "column" as const, gap: 14 },
    promptText: { fontSize: "0.875rem", fontFamily: "ui-monospace, 'SF Mono', monospace", color: "#cbd5e1", whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const, lineHeight: 1.6, margin: 0 },
    promptActions: { display: "flex", justifyContent: "flex-end" as const, marginTop: 4 },
    copyBtn: { padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer" },
    copyBtnSuccess: { color: "#86efac", borderColor: "rgba(134, 239, 172, 0.3)" },
    platformSection: { marginTop: 28 },
    platformLabel: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", color: "#64748b", marginBottom: 12, textTransform: "uppercase" as const },
    platformGrid: { display: "flex", flexDirection: "column" as const, gap: 16 },
    platformInset: { padding: "18px 22px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(8, 10, 18, 0.85)", marginBottom: 0 },
    platformRow: { display: "flex", flexDirection: "column" as const, gap: 12 },
    platformCopyBtn: { padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", alignSelf: "flex-end" as const },
    examplesSection: { padding: "0 clamp(20px, 4vw, 32px)", marginBottom: 56 },
    examplesTitle: { fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", color: "#94a3b8", marginBottom: 16, textTransform: "uppercase" as const },
    examplesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 12 },
    exampleCard: { display: "block" as const, width: "100%", padding: "16px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(22, 24, 32, 0.6)", color: "#e2e8f0", fontSize: "0.9375rem", lineHeight: 1.5, cursor: "pointer", textAlign: "left" as const, margin: 0, fontFamily: "inherit" },
  };

  return (
    <main className="page" style={s.main}>
      <style dangerouslySetInnerHTML={{ __html: `
        #idea::placeholder { color: rgba(148, 163, 184, 0.55); }
        @keyframes storyboard-spin { to { transform: rotate(360deg); } }
        .primary-button { transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; }
        .primary-button:hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 2px 0 rgba(255,255,255,0.15) inset, 0 14px 36px rgba(37,99,235,0.45); }
        .primary-button:active { transform: translateY(0); }
        .copy-button { transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease; }
        .copy-button:hover { background: rgba(255,255,255,0.1); color: #cbd5e1; border-color: rgba(255,255,255,0.12); }
        .example-card { transition: background 0.2s ease, border-color 0.2s ease; }
        .example-card:hover { background: rgba(28, 30, 40, 0.85); border-color: rgba(255,255,255,0.1); }
        .hero-cta-primary { transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; }
        .hero-cta-primary:hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 2px 0 rgba(255,255,255,0.15) inset, 0 14px 36px rgba(37,99,235,0.45); }
        .hero-cta-secondary { transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease; }
        .hero-cta-secondary:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: #f8fafc; }
      ` }} />
      <header style={s.nav}>
        <span style={s.navLogo}>AI Video Director</span>
        <nav style={s.navLinks}>
          <a href="#examples" style={s.navLink}>Examples</a>
          <a href="#" style={s.navLink}>Docs</a>
          <a href="#" style={s.navLink}>About</a>
        </nav>
      </header>

      <section className="hero" style={s.hero}>
        <div style={s.heroGlow} aria-hidden />
        <div style={s.heroContent}>
          <div className="hero-text" style={s.heroText}>
            <h1 className="title" style={s.title}>AI Video Director</h1>
            <p className="subtitle" style={s.subtitle}>
              Turn any video idea into a structured, cinematic shot list with image and video prompts
              you can feed into your favorite generative tools.
            </p>
          </div>
          <div style={s.heroCtaWrap}>
            <a href="#create" className="primary-button hero-cta-primary" style={s.heroCtaPrimary}>Start creating</a>
            <button
              type="button"
              className="primary-button hero-cta-primary"
              style={s.heroCtaPrimary}
              onClick={() => {
                const el = document.getElementById("create");
                if (el) el.scrollIntoView({ behavior: "smooth" });
                handleGenerateFullFilm();
              }}
              disabled={isGeneratingFullFilm}
              aria-label="Generate full film plan"
            >
              Generate Full Film
            </button>
            <a href="#examples" className="hero-cta-secondary" style={s.heroCtaSecondary}>Try an example</a>
          </div>
          <div style={s.heroPreviewCard}>
            <div style={s.heroPreviewCardInner}>
              <span style={s.heroPreviewLabel}>What you get</span>
              <p style={s.heroPreviewTitle}>Scene breakdown · Image prompts · Video prompts</p>
              <p style={s.heroPreviewMeta}>Continuity between shots, ready for Runway, Sora, Kling & Pika.</p>
            </div>
          </div>
        </div>
      </section>

      <div style={s.panelWrap}>
      <section id="create" className="panel" style={s.panel}>
        <form className="form" style={s.form} onSubmit={handleGenerate}>
          <div className="field-group" style={s.fieldGroupFirst}>
            <label htmlFor="idea" className="label" style={s.label}>
              Video idea
            </label>
            <p className="label-help" style={s.labelHelp}>
              Describe the scene, story, or concept you want to visualize.
            </p>
            <textarea
              id="idea"
              className="textarea"
              style={s.textarea}
              rows={4}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Example: A lone astronaut walking through a neon-lit bazaar on an alien planet, discovering a hidden message in the crowd."
            />
          </div>

          <div className="field-row" style={s.fieldRow}>
            <div className="field-group" style={s.fieldGroup}>
              <label htmlFor="style" className="label" style={s.label}>
                Style
              </label>
              <select
                id="style"
                className="select"
                style={s.select}
                value={style}
                onChange={(e) => setStyle(e.target.value as StyleOption)}
              >
                {STYLE_LABELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group" style={s.fieldGroup}>
              <label htmlFor="platform" className="label" style={s.label}>
                TARGET PLATFORM
              </label>
              <select
                id="platform"
                className="select"
                style={s.select}
                value={targetPlatform}
                onChange={(e) => setTargetPlatform(e.target.value as PlatformOption)}
              >
                {PLATFORM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group" style={s.fieldGroup}>
              <label htmlFor="aspectRatio" className="label" style={s.label}>
                MASTER ASPECT RATIO
              </label>
              <select
                id="aspectRatio"
                className="select"
                style={s.select}
                value={masterAspectRatio}
                onChange={(e) => setMasterAspectRatio(e.target.value as MasterAspectRatioOption)}
              >
                {ASPECT_RATIO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group" style={s.fieldGroup}>
              <label htmlFor="template" className="label" style={s.label}>
                PROJECT TEMPLATE
              </label>
              <select
                id="template"
                className="select"
                style={s.select}
                value={projectTemplate}
                onChange={(e) => setProjectTemplate(e.target.value as ProjectTemplateOption)}
              >
                {TEMPLATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="button-container" style={s.btnWrap}>
              <button
                type="submit"
                className="primary-button"
                style={{ ...s.btn, ...(isGenerating ? s.btnDis : {}) }}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating…" : "Generate Scene Plan"}
              </button>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}
        </form>
      </section>

      <section id="examples" style={s.examplesSection}>
        <h3 style={s.examplesTitle}>Example ideas</h3>
        <div style={s.examplesGrid}>
          {EXAMPLE_IDEAS.map((text) => (
            <button
              key={text}
              type="button"
              className="example-card"
              style={s.exampleCard}
              onClick={() => setIdea(text)}
            >
              {text}
            </button>
          ))}
        </div>
      </section>
      </div>

      <section className="results-section" style={s.results}>
        {isGenerating && (
          <p style={s.resultsLoading}>Generating your scene plan…</p>
        )}
        {isGeneratingFullFilm && (
          <p style={s.resultsLoading}>Generating full film plan…</p>
        )}

        {!isGenerating && !isGeneratingFullFilm && hasGenerated && shots.length === 0 && (
          <p className="muted-text">
            No shots to show yet. Try refining your idea and generating again.
          </p>
        )}

        {!isGenerating && !isGeneratingFullFilm && shots.length > 0 && (
          <>
            <div style={s.resultsSummaryCard}>
              <p style={s.resultsSummaryTitle}>Project</p>
              <h2 style={s.resultsSummaryHeading}>Shot Plan</h2>
              <p style={s.resultsSummaryConcept}>{idea.trim()}</p>
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={s.resultsSummaryTitle}>Target Platform</p>
                <p style={s.resultsSummaryConcept}>{targetPlatform}</p>
                <p style={{ ...s.resultsSummaryTitle, marginTop: 12 }}>Prompt Style</p>
                <p style={s.resultsSummaryConcept}>{platformPromptStyle ?? "—"}</p>
                <p style={{ ...s.resultsSummaryTitle, marginTop: 12 }}>Master Aspect Ratio</p>
                <p style={s.resultsSummaryConcept}>{masterAspectRatio}</p>
                <p style={{ ...s.resultsSummaryTitle, marginTop: 12 }}>Composition Style</p>
                <p style={s.resultsSummaryConcept}>{compositionStyle ?? "—"}</p>
                <p style={{ ...s.resultsSummaryTitle, marginTop: 12 }}>Project Template</p>
                <p style={s.resultsSummaryConcept}>{projectTemplate}</p>
                <p style={{ ...s.resultsSummaryTitle, marginTop: 12 }}>Template Direction</p>
                <p style={s.resultsSummaryConcept}>{templateDirection ?? "—"}</p>
              </div>
            </div>

            <div style={s.exportBtnWrap}>
              <button type="button" style={s.exportBtn} onClick={handleExportShotList}>
                Export Shot List
              </button>
              <button type="button" style={s.exportBtn} onClick={handleExportAsJson}>
                Export as JSON
              </button>
            </div>

            <div className="shots-grid" style={s.shotsGrid}>
              {shots.map((shot) => (
                <article key={shot.id} className="shot-card" style={s.shotCard}>
                  <div style={s.storyboardWrap}>
                    {generatedFrames[shot.id] ? (
                      <>
                        <img src={generatedFrames[shot.id]} alt={`Shot ${shot.id} storyboard`} style={s.storyboardImg} />
                        <div style={{ padding: "0 clamp(28px, 4vw, 40px) clamp(28px, 4vw, 40px)" }}>
                          <p style={s.storyboardGeneratedLabel}>Generated Storyboard Frame</p>
                          <div style={s.storyboardBtnRow}>
                            <button
                              type="button"
                              className="copy-button"
                              style={s.storyboardDownloadBtn}
                              onClick={async () => {
                                try {
                                  await downloadImage(generatedFrames[shot.id], `shot-${shot.id}.png`);
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              disabled={!generatedFrames[shot.id]}
                            >
                              Download Frame
                            </button>
                            <button
                              type="button"
                              className="copy-button"
                              style={s.storyboardDownloadBtn}
                              onClick={() => copyImageUrl(generatedFrames[shot.id])}
                              disabled={!generatedFrames[shot.id]}
                            >
                              Copy Image Link
                            </button>
                            <button
                              type="button"
                              className="copy-button"
                              style={s.storyboardDownloadBtn}
                              onClick={() => handleGenerateVideoPrompt(shot)}
                              disabled={loadingVideoPromptId !== null}
                              aria-label="Generate video prompt"
                            >
                              Generate Video Prompt
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={s.storyboardThumb}>
                        {loadingShotId === shot.id && (
                          <div style={s.storyboardLoading}>
                            <div style={s.storyboardSpinner} />
                            <span style={{ marginTop: 12, fontSize: "0.875rem", color: "rgba(255,255,255,0.9)" }}>Generating…</span>
                          </div>
                        )}
                        <div style={s.storyboardOverlay}>
                          <span style={s.storyboardNumber}>SHOT {shot.id}</span>
                          <h3 style={s.storyboardTitle}>{shot.label}</h3>
                          <span style={s.storyboardLabel}>Storyboard Preview</span>
                          <p style={s.storyboardCaption}>
                            {shot.shotType}: {shot.label}. {shot.cameraMovement}.
                          </p>
                          {storyboardError[shot.id] && (
                            <p style={s.storyboardError}>{storyboardError[shot.id]}</p>
                          )}
                          <div style={s.storyboardBtnRow}>
                            <button
                              type="button"
                              className="copy-button"
                              style={s.storyboardBtn}
                              onClick={() => handleGenerateStoryboard(shot)}
                              disabled={loadingShotId !== null}
                              aria-label="Generate storyboard image"
                            >
                              Generate Storyboard
                            </button>
                            <button
                              type="button"
                              className="copy-button"
                              style={s.storyboardBtn}
                              onClick={() => handleGenerateVideoPrompt(shot)}
                              disabled={loadingVideoPromptId !== null}
                              aria-label="Generate video prompt"
                            >
                              Generate Video Prompt
                            </button>
                            <button
                              type="button"
                              className="copy-button"
                              style={copiedId === `storyboard-${shot.id}` ? { ...s.storyboardBtn, ...s.copyBtnSuccess } : s.storyboardBtn}
                              onClick={() => handleCopy(getStoryboardPrompt(shot), `storyboard-${shot.id}`)}
                              aria-label="Copy storyboard prompt"
                            >
                              {copiedId === `storyboard-${shot.id}` ? "Copied!" : "Copy Storyboard Prompt"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={s.shotCardBody}>
                  <header className="shot-header" style={s.shotHeader}>
                    <span className="shot-number" style={s.shotBadge} aria-hidden>{shot.id}</span>
                    <div className="shot-header-content" style={s.shotHeaderContent}>
                      <h3 className="shot-label" style={s.shotTitle}>{shot.label}</h3>
                      <p className="shot-meta" style={s.shotMeta}>
                        {shot.shotType} · {shot.cameraMovement}
                      </p>
                    </div>
                  </header>

                  {loadingVideoPromptId === shot.id && (
                    <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: 16 }}>Generating video prompt…</p>
                  )}
                  {videoPromptError[shot.id] && (
                    <p style={{ ...s.storyboardError, marginBottom: 16 }}>{videoPromptError[shot.id]}</p>
                  )}
                  {generatedVideoPrompts[shot.id] && (
                    <div style={{ marginBottom: 24 }}>
                      <p style={s.shotLabel}>Video Prompt</p>
                      <div style={s.promptInset}>
                        <p style={s.promptText}>{generatedVideoPrompts[shot.id]}</p>
                        <div style={s.promptActions}>
                          <button
                            type="button"
                            className="copy-button"
                            style={copiedId === `video-prompt-${shot.id}` ? { ...s.copyBtn, ...s.copyBtnSuccess } : s.copyBtn}
                            onClick={() => handleCopy(generatedVideoPrompts[shot.id], `video-prompt-${shot.id}`)}
                            aria-label="Copy prompt"
                          >
                            {copiedId === `video-prompt-${shot.id}` ? "Copied!" : "Copy Prompt"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="shot-details">
                    <div style={s.shotSection}>
                      <p style={s.shotLabel}>Description</p>
                      <p style={s.shotDesc}>
                        {shot.shotType}: {shot.label}. {shot.cameraMovement}.
                      </p>
                    </div>
                    <div style={s.shotSection}>
                      <p style={s.shotLabel}>Camera</p>
                      <p style={s.shotDesc}>{shot.cameraMovement}</p>
                    </div>
                    <div style={s.shotSection}>
                      <p style={s.shotLabel}>Lighting</p>
                      <p style={s.shotDesc}>{shot.lighting}</p>
                    </div>
                    <div style={s.shotSection}>
                      <p style={s.shotLabel}>Image prompt</p>
                      <div style={s.promptInset}>
                        <div style={s.promptRow}>
                          <code style={s.promptText}>{shot.imagePrompt}</code>
                          <div style={s.promptActions}>
                            <button
                              type="button"
                              className="copy-button"
                              style={copiedId === `image-${shot.id}` ? { ...s.copyBtn, ...s.copyBtnSuccess } : s.copyBtn}
                              onClick={() => handleCopy(shot.imagePrompt, `image-${shot.id}`)}
                              aria-label="Copy image prompt"
                            >
                              {copiedId === `image-${shot.id}` ? "Copied!" : "Copy Image Prompt"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={s.shotSection}>
                      <p style={s.shotLabel}>VIDEO GENERATION</p>
                      <div style={s.promptInset}>
                        <div style={s.promptRow}>
                          <p style={s.shotLabel}>Video Prompt</p>
                          <code style={s.promptText}>{shot.videoPrompt}</code>
                          <div style={s.promptActions}>
                            <button
                              type="button"
                              className="copy-button"
                              style={copiedId === `video-${shot.id}` ? { ...s.copyBtn, ...s.copyBtnSuccess } : s.copyBtn}
                              onClick={() => handleCopy(shot.videoPrompt, `video-${shot.id}`)}
                              aria-label="Copy video prompt"
                            >
                              {copiedId === `video-${shot.id}` ? "Copied!" : "Copy Video Prompt"}
                            </button>
                          </div>
                        </div>
                        <div style={{ marginTop: 16 }}>
                          <p style={s.shotLabel}>Motion Direction</p>
                          <p style={s.shotDesc}>{shot.motionDirection || "—"}</p>
                        </div>
                        <div style={{ marginTop: 16 }}>
                          <p style={s.shotLabel}>Negative Prompt</p>
                          <code style={s.promptText}>{shot.negativePrompt || "—"}</code>
                          <div style={s.promptActions}>
                            <button
                              type="button"
                              className="copy-button"
                              style={copiedId === `negative-${shot.id}` ? { ...s.copyBtn, ...s.copyBtnSuccess } : s.copyBtn}
                              onClick={() => handleCopy(shot.negativePrompt, `negative-${shot.id}`)}
                              aria-label="Copy negative prompt"
                            >
                              {copiedId === `negative-${shot.id}` ? "Copied!" : "Copy Negative Prompt"}
                            </button>
                          </div>
                        </div>
                        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 20 }}>
                          <div>
                            <p style={s.shotLabel}>Duration</p>
                            <p style={s.shotDesc}>{shot.duration || "—"}</p>
                          </div>
                          <div>
                            <p style={s.shotLabel}>Aspect Ratio</p>
                            <p style={s.shotDesc}>{shot.aspectRatio || "—"}</p>
                          </div>
                        </div>
                        <div style={s.promptActions}>
                          <button
                            type="button"
                            className="copy-button"
                            style={s.copyBtn}
                            onClick={() => void copyFullShot(shot)}
                            aria-label="Copy full shot package"
                          >
                            Copy Full Shot Package
                          </button>
                        </div>
                      </div>
                    </div>
                    <div style={s.shotSection}>
                      <p style={s.shotLabel}>Sound design</p>
                      <p style={s.shotDesc}>{shot.soundDesign || "—"}</p>
                    </div>
                    <div style={s.shotSectionLast}>
                      <p style={s.shotLabel}>Platform prompts</p>
                      <div style={s.platformGrid}>
                        <div style={s.platformInset}>
                          <p style={s.shotLabel}>Runway</p>
                          <div style={s.platformRow}>
                            <code style={s.promptText}>{formatRunwayPrompt(shot.videoPrompt)}</code>
                            <button type="button" className="copy-button" style={copiedId === `runway-${shot.id}` ? { ...s.platformCopyBtn, ...s.copyBtnSuccess } : s.platformCopyBtn} onClick={() => handleCopy(formatRunwayPrompt(shot.videoPrompt), `runway-${shot.id}`)} aria-label="Copy Runway prompt">{copiedId === `runway-${shot.id}` ? "Copied!" : "Copy"}</button>
                          </div>
                        </div>
                        <div style={s.platformInset}>
                          <p style={s.shotLabel}>Sora</p>
                          <div style={s.platformRow}>
                            <code style={s.promptText}>{formatSoraPrompt(shot.videoPrompt)}</code>
                            <button type="button" className="copy-button" style={copiedId === `sora-${shot.id}` ? { ...s.platformCopyBtn, ...s.copyBtnSuccess } : s.platformCopyBtn} onClick={() => handleCopy(formatSoraPrompt(shot.videoPrompt), `sora-${shot.id}`)} aria-label="Copy Sora prompt">{copiedId === `sora-${shot.id}` ? "Copied!" : "Copy"}</button>
                          </div>
                        </div>
                        <div style={s.platformInset}>
                          <p style={s.shotLabel}>Kling</p>
                          <div style={s.platformRow}>
                            <code style={s.promptText}>{formatKlingPrompt(shot.videoPrompt)}</code>
                            <button type="button" className="copy-button" style={copiedId === `kling-${shot.id}` ? { ...s.platformCopyBtn, ...s.copyBtnSuccess } : s.platformCopyBtn} onClick={() => handleCopy(formatKlingPrompt(shot.videoPrompt), `kling-${shot.id}`)} aria-label="Copy Kling prompt">{copiedId === `kling-${shot.id}` ? "Copied!" : "Copy"}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
