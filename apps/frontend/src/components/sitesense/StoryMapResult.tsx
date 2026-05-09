"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import type { StorySchema, MapMode } from "@/lib/sitesense/story";
import type { GeoCollection } from "@/lib/sitesense/geo";
import type { AnalysisResult } from "@/lib/sitesense/analysis";
import { P, TEXT, TEXT_MUTED, TEXT_SUBTLE, TAG_COLORS } from "@/lib/sitesense/colors";

const MapPanel = dynamic(
  () => import("./MapPanel").then((m) => m.MapPanel),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-full min-h-[400px] rounded-xl flex items-center justify-center text-sm"
        style={{ background: P[1], color: TEXT_MUTED }}
      >
        Loading map…
      </div>
    ),
  }
);

interface Props {
  story: StorySchema;
  geoData: GeoCollection;
  analysis: AnalysisResult;
  boundary: GeoJSON.FeatureCollection | null;
  usedFallback: boolean;
  onBack: () => void;
}

export function StoryMapResult({
  story,
  geoData,
  analysis,
  boundary,
  usedFallback,
  onBack,
}: Props) {
  const [activeId, setActiveId] = useState<string>(
    story.chapters[0]?.id ?? "overview"
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const activeChapter =
    story.chapters.find((c) => c.id === activeId) ?? story.chapters[0];

  useEffect(() => {
    if (!scrollRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            const id = entry.target.getAttribute("data-chapter-id");
            if (id) setActiveId(id);
          }
        }
      },
      { root: scrollRef.current, threshold: [0.4] }
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [story.chapters]);

  const registerRef =
    (id: string) => (el: HTMLElement | null) => {
      if (el) sectionRefs.current.set(id, el);
      else sectionRefs.current.delete(id);
    };

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", background: P[0], color: TEXT, overflow: "hidden" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-3 border-b z-20"
        style={{
          background: "rgba(243,249,235,0.94)",
          backdropFilter: "blur(8px)",
          borderColor: P[2],
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: TEXT_MUTED }}
        >
          <ArrowLeft size={14} />
          New analysis
        </button>
        <div className="text-center">
          <h1 className="text-sm font-semibold" style={{ color: TEXT }}>
            {story.title}
          </h1>
          <p className="text-xs" style={{ color: TEXT_MUTED }}>
            {story.subtitle}
          </p>
        </div>
        {/* Chapter dots */}
        <div className="flex gap-1.5 items-center">
          {story.chapters.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className="rounded-full transition-all"
              style={{
                width: c.id === activeId ? 20 : 8,
                height: 8,
                background: c.id === activeId ? P[5] : P[2],
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Fallback banner ─────────────────────────────────────────────────── */}
      {usedFallback && (
        <div
          className="shrink-0 mx-6 mt-3 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm"
          style={{ borderColor: "#f59e0b44", background: "#fef9ec", color: "#92400e" }}
        >
          <AlertCircle size={14} className="shrink-0" />
          Demo dataset — Overpass API unavailable. Data is illustrative only.
        </div>
      )}

      {/* ── Metrics strip ───────────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-4 pb-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {story.metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl p-3 flex flex-col gap-0.5"
              style={{ background: P[1], border: `1px solid ${P[2]}` }}
            >
              <p
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: TEXT_MUTED }}
              >
                {m.label}
              </p>
              <p className="text-xl font-bold" style={{ color: TEXT }}>
                {typeof m.value === "number"
                  ? m.value.toLocaleString()
                  : m.value}
              </p>
              {m.sub && (
                <p className="text-xs" style={{ color: TEXT_SUBTLE }}>
                  {m.sub}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main: text 38% + map 62% ─────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 px-6 pb-6 gap-5">
        {/* Left: scrollable chapters */}
        <div
          ref={scrollRef}
          className="lg:w-[38%] w-full overflow-y-auto"
          style={{ scrollBehavior: "smooth" }}
        >
          {story.chapters.map((chapter, i) => (
            <section
              key={chapter.id}
              ref={registerRef(chapter.id)}
              data-chapter-id={chapter.id}
              className="min-h-[65vh] py-6 flex flex-col justify-center"
            >
              <div
                className="rounded-2xl p-5 transition-all duration-300"
                style={{
                  background: chapter.id === activeId ? P[1] : "transparent",
                  border: `1px solid ${chapter.id === activeId ? P[3] : "transparent"}`,
                }}
              >
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: P[4] }}
                >
                  {i + 1} / {story.chapters.length}
                </span>
                <h2
                  className="text-lg font-bold mt-1 mb-2.5 leading-snug"
                  style={{ color: TEXT }}
                >
                  {chapter.title}
                </h2>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: TEXT_MUTED }}
                >
                  {chapter.body}
                </p>

                {/* Tag breakdown (only for chapters that request it) */}
                {chapter.showTagBreakdown &&
                  Object.keys(analysis.tagBreakdown).length > 0 && (
                    <div className="mt-4 space-y-2">
                      {Object.entries(analysis.tagBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 6)
                        .map(([key, val]) => {
                          const pct = Math.round(
                            (val / analysis.displayCount) * 100
                          );
                          const color = TAG_COLORS[key] ?? TAG_COLORS.other;
                          return (
                            <div key={key}>
                              <div className="flex justify-between text-xs mb-1">
                                <span
                                  className="capitalize font-medium"
                                  style={{ color: TEXT }}
                                >
                                  {key || "unknown"}
                                </span>
                                <span style={{ color: TEXT_MUTED }}>
                                  {val} ({pct}%)
                                </span>
                              </div>
                              <div
                                className="h-1.5 rounded-full overflow-hidden"
                                style={{ background: P[2] }}
                              >
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, background: color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
              </div>
            </section>
          ))}

          {/* Disclaimer */}
          <div className="pb-8 pt-2 px-1">
            <p
              className="text-xs leading-relaxed"
              style={{ color: TEXT_SUBTLE }}
            >
              {story.disclaimer}
            </p>
          </div>
        </div>

        {/* Right: sticky map */}
        <div className="hidden lg:flex lg:w-[62%] flex-col min-h-0">
          <MapPanel
            geoData={geoData}
            analysis={analysis}
            boundary={boundary}
            mapMode={(activeChapter?.mapMode ?? "points") as MapMode}
            bbox={analysis.bbox}
          />
        </div>
      </div>
    </div>
  );
}
