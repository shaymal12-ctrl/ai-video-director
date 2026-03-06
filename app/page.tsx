"use client";

import { useState } from "react";

type StyleOption = "cinematic" | "fantasy" | "dark" | "realistic";

type Shot = {
  id: number;
  label: string;
  shotType: string;
  cameraMovement: string;
  lighting: string;
  imagePrompt: string;
  videoPrompt: string;
};

const STYLE_LABELS: { value: StyleOption; label: string }[] = [
  { value: "cinematic", label: "Cinematic" },
  { value: "fantasy", label: "Fantasy" },
  { value: "dark", label: "Dark" },
  { value: "realistic", label: "Realistic" },
];

function generateScenePlan(idea: string, style: StyleOption): Shot[] {
  const trimmedIdea = idea.trim();
  const subject = trimmedIdea || "the scene";

  const styleDescriptors: Record<StyleOption, { look: string; mood: string }> = {
    cinematic: {
      look: "cinematic, high dynamic range, subtle film grain, shallow depth of field",
      mood: "epic, emotionally charged, film still from a feature movie",
    },
    fantasy: {
      look: "fantasy, ethereal, soft volumetric light, magical atmosphere",
      mood: "mythical, otherworldly, storybook illustration brought to life",
    },
    dark: {
      look: "dark, moody, high contrast, deep shadows, limited color palette",
      mood: "tense, mysterious, psychological thriller mood",
    },
    realistic: {
      look: "natural, realistic, true-to-life colors, subtle imperfections",
      mood: "grounded, intimate, documentary-style realism",
    },
  };

  const styleInfo = styleDescriptors[style];

  const baseShots: Omit<Shot, "imagePrompt" | "videoPrompt">[] = [
    {
      id: 1,
      label: "Opening Establishing Shot",
      shotType: "Wide / Establishing",
      cameraMovement: "Slow push-in or drone-style glide",
      lighting: "Soft, directional key light with gentle backlight to frame the environment",
    },
    {
      id: 2,
      label: "Character / Subject Introduction",
      shotType: "Medium shot",
      cameraMovement: "Slow dolly or slider move across the subject",
      lighting: "Balanced key and fill with subtle edge light to separate subject from background",
    },
    {
      id: 3,
      label: "Detail / Insert Shot",
      shotType: "Extreme close-up",
      cameraMovement: "Locked-off or micro-movement for tension",
      lighting: "Focused, contrasty light highlighting specific textures and shapes",
    },
    {
      id: 4,
      label: "Dynamic Action Moment",
      shotType: "Tracking or handheld",
      cameraMovement: "Responsive camera following motion with slight parallax",
      lighting: "Mixed light sources with motivated highlights and practicals in frame",
    },
    {
      id: 5,
      label: "Closing / Emotional Beat",
      shotType: "Close-up or wide silhouette",
      cameraMovement: "Lingering hold or slow pull-back to reveal context",
      lighting: "Moody, sculpted light emphasizing emotion and overall tone",
    },
  ];

  return baseShots.map((shot) => {
    const commonPrompt = `${shot.shotType.toLowerCase()} of ${subject}, ${styleInfo.look}, ${styleInfo.mood}`;

    const imagePrompt = [
      commonPrompt,
      shot.label.toLowerCase(),
      shot.lighting.toLowerCase(),
      "cinematic composition, highly detailed, 4k still frame",
    ].join(", ");

    const videoPrompt = [
      commonPrompt,
      shot.label.toLowerCase(),
      shot.cameraMovement.toLowerCase(),
      shot.lighting.toLowerCase(),
      "smooth motion, cinematic frame rate, depth and parallax, professional film look",
    ].join(", ");

    return {
      ...shot,
      imagePrompt,
      videoPrompt,
    };
  });
}

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [style, setStyle] = useState<StyleOption>("cinematic");
  const [shots, setShots] = useState<Shot[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
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
    } catch {
      // Silently fail if copy is not permitted
    }
  };

  const handleGenerate = (event: React.FormEvent) => {
    event.preventDefault();

    if (!idea.trim()) {
      setError("Please describe your video idea so the director can plan shots.");
      setShots([]);
      setHasGenerated(false);
      return;
    }

    setError(null);
    const plan = generateScenePlan(idea, style);
    setShots(plan);
    setHasGenerated(true);
  };

  return (
    <main className="page">
      <section className="hero">
        <div className="hero-text">
          <h1 className="title">AI Video Director</h1>
          <p className="subtitle">
            Turn any video idea into a structured, cinematic shot list with image and video prompts
            you can feed into your favorite generative tools.
          </p>
        </div>
      </section>

      <section className="panel">
        <form className="form" onSubmit={handleGenerate}>
          <div className="field-group">
            <label htmlFor="idea" className="label">
              Video idea
            </label>
            <p className="label-help">
              Describe the scene, story, or concept you want to visualize.
            </p>
            <textarea
              id="idea"
              className="textarea"
              rows={4}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Example: A lone astronaut walking through a neon-lit bazaar on an alien planet, discovering a hidden message in the crowd."
            />
          </div>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="style" className="label">
                Style
              </label>
              <select
                id="style"
                className="select"
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

            <div className="button-container">
              <button type="submit" className="primary-button">
                Generate Scene Plan
              </button>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}
        </form>
      </section>

      <section className="results-section">
        {hasGenerated && shots.length === 0 && (
          <p className="muted-text">
            No shots to show yet. Try refining your idea and generating again.
          </p>
        )}

        {shots.length > 0 && (
          <>
            <div className="results-header">
              <h2 className="results-title">Shot Plan</h2>
              <p className="results-subtitle">
                Each shot includes framing, camera movement, lighting, and prompts tailored to your{" "}
                <span className="chip">{style}</span> style choice.
              </p>
            </div>

            <div className="shots-grid">
              {shots.map((shot) => (
                <article key={shot.id} className="shot-card">
                  <header className="shot-header">
                    <span className="shot-number" aria-hidden>{shot.id}</span>
                    <div className="shot-header-content">
                      <h3 className="shot-label">{shot.label}</h3>
                      <p className="shot-meta">
                        <span>{shot.shotType}</span>
                        <span className="dot">•</span>
                        <span>{shot.cameraMovement}</span>
                      </p>
                    </div>
                  </header>

                  <dl className="shot-details">
                    <div className="shot-detail-row">
                      <dt>Lighting</dt>
                      <dd>{shot.lighting}</dd>
                    </div>
                    <div className="shot-detail-row">
                      <dt>Image prompt</dt>
                      <dd>
                        <div className="prompt-block">
                          <div className="prompt-row">
                            <div className="prompt-wrap">
                              <code className="prompt">{shot.imagePrompt}</code>
                            </div>
                            <button
                              type="button"
                              className="copy-button"
                              onClick={() => handleCopy(shot.imagePrompt)}
                              aria-label="Copy image prompt"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </dd>
                    </div>
                    <div className="shot-detail-row">
                      <dt>Video prompt</dt>
                      <dd>
                        <div className="prompt-block">
                          <div className="prompt-row">
                            <div className="prompt-wrap">
                              <code className="prompt">{shot.videoPrompt}</code>
                            </div>
                            <button
                              type="button"
                              className="copy-button"
                              onClick={() => handleCopy(shot.videoPrompt)}
                              aria-label="Copy video prompt"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
