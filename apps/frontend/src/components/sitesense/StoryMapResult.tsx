"use client";

import { useState } from "react";
import { ArrowLeft, Code2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import type { StorySchema, StoryChapter } from "@/lib/sitesense/story";
import type { GeoCollection } from "@/lib/sitesense/geo";
import type { AnalysisResult } from "@/lib/sitesense/analysis";
import { MetricCard } from "./MetricCard";
import { ChapterCard } from "./ChapterCard";

// MapPanel loaded client-side only — maplibre-gl uses browser APIs
const MapPanel = dynamic(
  () => import("./MapPanel").then((m) => m.MapPanel),
  { ssr: false, loading: () => <div className="w-full h-full min-h-[400px] rounded-xl border bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">Loading map…</div> }
);

interface Props {
  story: StorySchema;
  geoData: GeoCollection;
  analysis: AnalysisResult;
  usedFallback: boolean;
  onBack: () => void;
}

export function StoryMapResult({ story, geoData, analysis, usedFallback, onBack }: Props) {
  const [activeId, setActiveId] = useState<StoryChapter["id"]>("overview");
  const [showSchema, setShowSchema] = useState(false);

  const activeChapter = story.chapters.find((c) => c.id === activeId) ?? story.chapters[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-6 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          New analysis
        </button>
        <div className="text-center">
          <h1 className="text-sm font-semibold text-foreground">{story.title}</h1>
          <p className="text-xs text-muted-foreground">{story.subtitle}</p>
        </div>
        <button
          onClick={() => setShowSchema((s) => !s)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Code2 size={12} />
          Schema
        </button>
      </div>

      {/* Schema viewer */}
      {showSchema && (
        <div className="border-b bg-card px-6 py-4">
          <pre className="text-xs text-muted-foreground overflow-auto max-h-48 font-mono">
            {JSON.stringify(story, null, 2)}
          </pre>
        </div>
      )}

      {/* Fallback banner */}
      {usedFallback && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <AlertCircle size={14} className="shrink-0" />
          Using demo dataset — Overpass API was unavailable. Data is illustrative.
        </div>
      )}

      {/* Metrics strip */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {story.metrics.map((m) => (
            <MetricCard key={m.label} metric={m} large={m.label === "OSM features found"} />
          ))}
        </div>
      </div>

      {/* Main layout: story + map */}
      <div className="px-6 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[calc(100vh-260px)]">
        {/* Story chapters */}
        <div className="flex flex-col gap-3 overflow-y-auto">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Chapters
          </p>
          {story.chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              active={chapter.id === activeId}
              onClick={() => setActiveId(chapter.id)}
            />
          ))}

          {/* Active chapter body */}
          <div className="mt-2 rounded-xl border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-2">
              {activeChapter.title}
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              {activeChapter.body}
            </p>
          </div>

          {/* Tag breakdown */}
          {Object.keys(analysis.tagBreakdown).length > 0 && (
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Tag breakdown
              </p>
              <div className="space-y-2">
                {Object.entries(analysis.tagBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([key, val]) => {
                    const pct = Math.round((val / analysis.displayCount) * 100);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-foreground capitalize truncate">{key}</span>
                            <span className="text-muted-foreground shrink-0 ml-2">{val} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent/70"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground/60 leading-relaxed px-1">
            {story.disclaimer}
          </p>
        </div>

        {/* Map */}
        <div className="lg:sticky lg:top-[130px] h-[400px] lg:h-full">
          <MapPanel
            geoData={geoData}
            analysis={analysis}
            activeChapter={activeId}
            bbox={analysis.bbox}
          />
        </div>
      </div>
    </div>
  );
}
