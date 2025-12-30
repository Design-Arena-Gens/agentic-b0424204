"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createWallpaperBlueprint,
  type AgentStepKey,
  type PaletteColor,
  type WallpaperBlueprint,
} from "@/lib/agent";

type StepStatus = "pending" | "running" | "done";

interface AgentStep {
  key: AgentStepKey;
  title: string;
  detail?: string;
  status: StepStatus;
}

interface ResolutionOption {
  label: string;
  value: string;
}

const STYLES = ["Orgânico", "Geométrico", "Futurista", "Artístico"];

const RESOLUTIONS: ResolutionOption[] = [
  { label: "Full HD 1920×1080", value: "1920x1080" },
  { label: "QHD 2560×1440", value: "2560x1440" },
  { label: "UltraWide 3440×1440", value: "3440x1440" },
];

const INITIAL_PROMPT =
  "Aurora boreal futurista com tons de azul e roxo, detalhes luminosos e atmosfera etérea.";

function parseResolution(value: string): { width: number; height: number } {
  const [w, h] = value.split("x").map((part) => parseInt(part, 10));
  return {
    width: Number.isFinite(w) ? w : 1920,
    height: Number.isFinite(h) ? h : 1080,
  };
}

function createBlankSteps(): AgentStep[] {
  return [
    { key: "analysis", title: "Analisando briefing", status: "pending" },
    { key: "palette", title: "Compondo paleta cromática", status: "pending" },
    { key: "composition", title: "Planejando camadas visuais", status: "pending" },
    { key: "render", title: "Renderizando wallpaper", status: "pending" },
  ];
}

function updateStepLog(
  steps: AgentStep[],
  key: AgentStepKey,
  patch: Partial<AgentStep>,
): AgentStep[] {
  return steps.map((step) =>
    step.key === key
      ? {
          ...step,
          ...patch,
        }
      : step,
  );
}

function degToVector(angle: number, width: number, height: number) {
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians);
  const y = Math.sin(radians);
  const length = Math.sqrt(width * width + height * height);
  return { x: width / 2 + x * length, y: height / 2 + y * length };
}

function drawWaves(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  intensity: number,
) {
  const waveCount = 3;
  for (let wave = 0; wave < waveCount; wave += 1) {
    const amplitude = height * (0.08 + wave * 0.02) * intensity;
    const frequency = 2 + wave * 0.5;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 160 - wave * 35;
    ctx.globalAlpha = 0.18;
    for (let x = -width * 0.2; x <= width * 1.2; x += 6) {
      const y =
        height / 2 +
        Math.sin((x / width) * Math.PI * frequency + wave * 0.6) * amplitude;
      if (x === -width * 0.2) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawBlobs(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  density: number,
) {
  const blobCount = Math.round(8 * density);
  for (let i = 0; i < blobCount; i += 1) {
    const radius =
      Math.random() * (width * 0.18) + width * 0.08 * Math.max(1, density);
    const x = Math.random() * width;
    const y = Math.random() * height;
    const gradient = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    gradient.addColorStop(0, `${color}dd`);
    gradient.addColorStop(1, `${color}00`);
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * (0.7 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  density: number,
) {
  const spacing = width / (12 + density * 20);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 1.4;

  for (let x = spacing / 2; x < width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + spacing * 0.2, height);
    ctx.stroke();
  }
  for (let y = spacing / 2; y < height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  density: number,
) {
  const count = Math.round(width / 12 * density);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < count; i += 1) {
    const radius = Math.random() * 6 + 1;
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBeams(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  density: number,
) {
  const count = Math.round(4 + density * 6);
  for (let i = 0; i < count; i += 1) {
    const xStart = Math.random() * width * 1.2 - width * 0.1;
    const gradient = ctx.createLinearGradient(
      xStart,
      0,
      xStart + width * 0.8,
      height,
    );
    gradient.addColorStop(0, `${color}00`);
    gradient.addColorStop(0.35, `${color}35`);
    gradient.addColorStop(0.55, `${color}bb`);
    gradient.addColorStop(1, `${color}00`);
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(xStart, -height * 0.2);
    ctx.lineTo(xStart + width * 0.1, height * 1.2);
    ctx.lineTo(xStart + width * 0.28, height * 1.2);
    ctx.lineTo(xStart + width * 0.18, -height * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function applyVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number,
) {
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) / 1.2,
  );

  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(8, 11, 24, ${strength})`);

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function applyGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
) {
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = width;
  grainCanvas.height = height;

  const grainCtx = grainCanvas.getContext("2d");
  if (!grainCtx) return;

  const imageData = grainCtx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const value = 128 + (Math.random() * 255 - 128) * intensity;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = Math.floor(255 * intensity);
  }

  grainCtx.putImageData(imageData, 0, 0);
  ctx.globalAlpha = 0.2;
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.globalAlpha = 1;
}

async function renderWallpaper(
  blueprint: WallpaperBlueprint,
  resolution: { width: number; height: number },
) {
  const { palette, composition } = blueprint;
  const canvas = document.createElement("canvas");
  canvas.width = resolution.width;
  canvas.height = resolution.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas API indisponível");

  const baseColor = palette.scheme.find((color) => color.role === "background")
    ?.hex;
  const primary =
    palette.scheme.find((color) => color.role === "primary")?.hex ??
    palette.scheme[1]?.hex ??
    "#2563eb";
  const secondary =
    palette.scheme.find((color) => color.role === "secondary")?.hex ??
    palette.scheme[2]?.hex ??
    "#38bdf8";
  const accent =
    palette.scheme.find((color) => color.role === "accent")?.hex ??
    palette.scheme[3]?.hex ??
    "#f8fafc";

  const gradient = ctx.createLinearGradient(
    0,
    0,
    degToVector(palette.gradientAngle, resolution.width, resolution.height).x,
    degToVector(palette.gradientAngle, resolution.width, resolution.height).y,
  );
  gradient.addColorStop(0, baseColor ?? "#020617");
  gradient.addColorStop(0.45, primary);
  gradient.addColorStop(1, secondary);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, resolution.width, resolution.height);

  const radial = ctx.createRadialGradient(
    resolution.width * 0.55,
    resolution.height * 0.35,
    resolution.width * 0.05,
    resolution.width * 0.5,
    resolution.height * 0.5,
    resolution.width * 0.8,
  );
  radial.addColorStop(0, `${accent}dd`);
  radial.addColorStop(1, `${accent}00`);
  ctx.fillStyle = radial;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, 0, resolution.width, resolution.height);
  ctx.globalAlpha = 1;

  composition.layers.forEach((layer) => {
    switch (layer.type) {
      case "waves":
        drawWaves(ctx, resolution.width, resolution.height, layer.emphasisColor, layer.density);
        break;
      case "blobs":
        drawBlobs(ctx, resolution.width, resolution.height, layer.emphasisColor, layer.density);
        break;
      case "grid":
        drawGrid(ctx, resolution.width, resolution.height, layer.emphasisColor, layer.density);
        break;
      case "particles":
        drawParticles(ctx, resolution.width, resolution.height, layer.emphasisColor, layer.density);
        break;
      case "beams":
        drawBeams(ctx, resolution.width, resolution.height, layer.emphasisColor, layer.density);
        break;
      default:
        break;
    }
  });

  applyVignette(ctx, resolution.width, resolution.height, composition.vignetteStrength);
  applyGrain(ctx, resolution.width, resolution.height, composition.grain);

  const previewCanvas = document.createElement("canvas");
  const previewScale = 900 / resolution.width;
  previewCanvas.width = Math.round(resolution.width * previewScale);
  previewCanvas.height = Math.round(resolution.height * previewScale);
  const previewCtx = previewCanvas.getContext("2d");
  if (!previewCtx) throw new Error("Canvas de preview indisponível");
  previewCtx.drawImage(
    canvas,
    0,
    0,
    previewCanvas.width,
    previewCanvas.height,
  );

  return {
    full: canvas.toDataURL("image/png"),
    preview: previewCanvas.toDataURL("image/png"),
  };
}

export default function WallpaperAgent() {
  const [prompt, setPrompt] = useState<string>(INITIAL_PROMPT);
  const [style, setStyle] = useState<string>(STYLES[0] ?? "Orgânico");
  const [resolution, setResolution] = useState<string>(RESOLUTIONS[1]!.value);
  const [steps, setSteps] = useState<AgentStep[]>(createBlankSteps);
  const [blueprint, setBlueprint] = useState<WallpaperBlueprint | null>(null);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [wallpaperPreview, setWallpaperPreview] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentSummary = useMemo(() => blueprint?.summary ?? "", [blueprint]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Descreva o tipo de wallpaper desejado.");
      return;
    }
    setError(null);
    setIsGenerating(true);
    setWallpaperPreview(null);
    setDownloadUrl(null);
    setSteps(createBlankSteps());

    // Step 1 - analysis
    setSteps((prev) =>
      updateStepLog(prev, "analysis", {
        status: "running",
        detail: "Extraindo temas, humores e referências visuais do briefing.",
      }),
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const draft = createWallpaperBlueprint(prompt, style);
      setSteps((prev) =>
        updateStepLog(prev, "analysis", {
          status: "done",
          detail: `Mood: ${draft.insights.mood}. Textura: ${draft.insights.texture}.`,
        }),
      );

      // Step 2 - palette
      setSteps((prev) =>
        updateStepLog(prev, "palette", {
          status: "running",
          detail: "Balanceando cores base, realces e luz.",
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 260));
      setPalette(draft.palette.scheme);
      setSteps((prev) =>
        updateStepLog(prev, "palette", {
          status: "done",
          detail: `Ângulo do gradiente ${draft.palette.gradientAngle}°. Tons: ${draft.palette.scheme
            .map((color) => color.hex)
            .join(", ")}.`,
        }),
      );

      // Step 3 - composition
      setSteps((prev) =>
        updateStepLog(prev, "composition", {
          status: "running",
          detail: "Configurando camadas, densidade e profundidade.",
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 260));
      setSteps((prev) =>
        updateStepLog(prev, "composition", {
          status: "done",
          detail: `${draft.composition.layers.length} camadas com ${
            draft.composition.layers[0]?.type ?? "texturas"
          } predominantes.`,
        }),
      );

      setBlueprint({
        ...draft,
        summary: draft.summary,
      });

      // Step 4 - render
      setSteps((prev) =>
        updateStepLog(prev, "render", {
          status: "running",
          detail: "Sintetizando pixels finais em alta resolução.",
        }),
      );
      const targetResolution = parseResolution(resolution);
      await new Promise((resolve) => setTimeout(resolve, 120));
      const rendered = await renderWallpaper(draft, targetResolution);
      setWallpaperPreview(rendered.preview);
      setDownloadUrl(rendered.full);

      setSteps((prev) =>
        updateStepLog(prev, "render", {
          status: "done",
          detail: `Renderização finalizada em ${targetResolution.width}×${targetResolution.height}.`,
        }),
      );
    } catch (err) {
      console.error(err);
      setError("Não foi possível gerar o wallpaper. Tente novamente.");
      setSteps((prev) =>
        updateStepLog(prev, "render", {
          status: "pending",
          detail: "Falha na renderização.",
        }),
      );
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, style, resolution]);

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 bg-mesh blur-3xl opacity-70" />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 pt-12 pb-16">
        <header className="rounded-3xl border border-white/10 bg-white/70 p-8 backdrop-blur-xl shadow-glow dark:bg-zinc-900/60">
          <div className="flex flex-col gap-4">
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-sky-500/60 bg-sky-500/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.3em] text-sky-700 dark:text-sky-200">
              Agente Criativo IA
            </span>
            <h1 className="text-4xl font-semibold text-zinc-900 dark:text-white">
              Gerador inteligente de wallpapers exclusivos
            </h1>
            <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
              Descreva o clima visual desejado e deixe o agente criar uma composição em alta resolução com paletas harmônicas, camadas atmosféricas e acabamento profissional.
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/15 bg-white/70 p-6 backdrop-blur md:p-8 dark:bg-zinc-900/60">
              <label className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
                Briefing criativo
                <span className="text-xs font-medium text-sky-500">
                  passo 1
                </span>
              </label>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={6}
                className="mt-3 w-full resize-none rounded-2xl border border-transparent bg-white/60 p-4 text-sm text-zinc-800 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-200/50 dark:bg-zinc-900/60 dark:text-zinc-100"
                placeholder="Explique o estilo, cores e sensações."
              />

              <div className="mt-6 grid grid-cols-2 gap-3">
                {STYLES.map((agentStyle) => {
                  const active = style === agentStyle;
                  return (
                    <button
                      key={agentStyle}
                      onClick={() => setStyle(agentStyle)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                        active
                          ? "border-sky-400 bg-sky-500/15 text-sky-700 shadow-inner dark:text-sky-200"
                          : "border-transparent bg-white/40 text-zinc-600 hover:border-sky-300/60 hover:text-sky-600 dark:bg-zinc-900/50 dark:text-zinc-300"
                      }`}
                    >
                      {agentStyle}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
                  Resolução
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {RESOLUTIONS.map((res) => {
                    const active = resolution === res.value;
                    return (
                      <button
                        key={res.value}
                        onClick={() => setResolution(res.value)}
                        className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                          active
                            ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                            : "bg-white/40 text-zinc-600 hover:bg-white/70 dark:bg-zinc-900/50 dark:text-zinc-300"
                        }`}
                      >
                        {res.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-2xl border border-red-300/80 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/60 dark:bg-red-500/20 dark:text-red-200">
                  {error}
                </p>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-purple-500 to-fuchsia-500 p-[2px] shadow-lg shadow-sky-500/25 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="block w-full rounded-[18px] bg-white py-3 text-base font-semibold text-sky-700 dark:bg-zinc-950 dark:text-sky-200">
                  {isGenerating ? "Gerando composição..." : "Criar wallpaper agora"}
                </span>
              </button>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/60 p-6 backdrop-blur dark:bg-zinc-900/60">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
                Linha de raciocínio
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {steps.map((step) => (
                  <div
                    key={step.key}
                    className="rounded-2xl border border-white/40 bg-white/80 p-4 shadow-sm dark:border-zinc-700/40 dark:bg-zinc-900/70"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {step.title}
                      </p>
                      <span
                        className={`text-xs font-semibold ${
                          step.status === "done"
                            ? "text-emerald-500"
                            : step.status === "running"
                              ? "text-sky-500"
                              : "text-zinc-400"
                        }`}
                      >
                        {step.status === "done"
                          ? "concluído"
                          : step.status === "running"
                            ? "processando"
                            : "aguardando"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {step.detail ??
                        "O agente definirá esta etapa automaticamente durante a geração."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/70 to-transparent p-6 shadow-xl backdrop-blur dark:bg-zinc-900/60 lg:p-8">
              <div className="absolute inset-x-6 top-6 flex justify-between text-xs text-zinc-400">
                <span>Preview em tempo real</span>
                <span>{style} · {resolution}</span>
              </div>
              <div className="mt-8 aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900/80 shadow-inner">
                {wallpaperPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={wallpaperPreview}
                    alt="Preview do wallpaper gerado"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      O preview aparecerá aqui após a geração.
                    </span>
                  </div>
                )}
              </div>
              {downloadUrl && (
                <a
                  download="wallpaper-ai.png"
                  href={downloadUrl}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900/90 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-zinc-800 dark:bg-white/10 dark:text-white"
                >
                  Baixar em alta resolução
                </a>
              )}
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/60 p-6 backdrop-blur dark:bg-zinc-900/60 lg:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
                Paleta sintetizada
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                {palette.map((color) => (
                  <div
                    key={`${color.role}-${color.hex}`}
                    className="overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-sm dark:border-zinc-700/40 dark:bg-zinc-900/70"
                  >
                    <div
                      className="h-20 w-full"
                      style={{ background: color.hex }}
                    />
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
                        {color.role}
                      </p>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {color.hex.toUpperCase()}
                      </p>
                    </div>
                  </div>
                ))}
                {palette.length === 0 && (
                  <p className="col-span-full text-sm text-zinc-500 dark:text-zinc-400">
                    A paleta aparecerá aqui após a síntese do agente.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/60 p-6 backdrop-blur dark:bg-zinc-900/60">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
                Resumo conceitual
              </h2>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                {currentSummary.length > 0
                  ? currentSummary
                  : "Assim que o agente concluir a análise você verá aqui os principais conceitos utilizados na composição."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
