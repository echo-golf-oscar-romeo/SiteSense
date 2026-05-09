"use client";

import type { StoryChapter } from "@/lib/sitesense/story";

interface Props {
  chapter: StoryChapter;
  active: boolean;
  onClick: () => void;
}

const MODE_BADGE: Record<string, string> = {
  points: "All points",
  hotspots: "Hotspot view",
  gaps: "Coverage view",
};

export function ChapterCard({ chapter, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-5 transition-all ${
        active
          ? "border-accent bg-accent/5 shadow-sm"
          : "border-border bg-card hover:border-accent/40 hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3
          className={`font-semibold text-sm ${
            active ? "text-accent" : "text-foreground"
          }`}
        >
          {chapter.title}
        </h3>
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {MODE_BADGE[chapter.mapMode]}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
        {chapter.body}
      </p>
    </button>
  );
}
