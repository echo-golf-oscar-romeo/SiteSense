"use client";

import { useEffect, useState } from "react";
import { P, TEXT, TEXT_MUTED, TEXT_SUBTLE } from "@/lib/sitesense/colors";

interface Props {
  featureLabel: string;
  placeLabel: string;
  currentStep: string;
}

const STEPS = [
  "Querying OpenStreetMap via Overpass…",
  "Converting OSM data to GeoJSON…",
  "Computing spatial analysis…",
  "Generating storymap…",
];

export function LoadingState({ featureLabel, placeLabel, currentStep }: Props) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(id);
  }, []);

  const currentIndex = STEPS.findIndex((s) =>
    currentStep.toLowerCase().includes(s.split("…")[0].toLowerCase().slice(0, 15))
  );
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 py-16"
      style={{ background: P[0], color: TEXT }}
    >
      <div className="w-full max-w-md">
        {/* Spinner */}
        <div className="flex justify-center mb-8">
          <div
            className="w-12 h-12 rounded-full border-4 animate-spin"
            style={{ borderColor: `${P[2]} ${P[2]} ${P[2]} ${P[5]}` }}
          />
        </div>

        <h2 className="text-xl font-semibold text-center mb-1" style={{ color: TEXT }}>
          Analyzing {featureLabel}
        </h2>
        <p className="text-sm text-center mb-8" style={{ color: TEXT_MUTED }}>
          in {placeLabel}
        </p>

        {/* Steps */}
        <div className="space-y-2">
          {STEPS.map((step, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;
            return (
              <div
                key={step}
                className="flex items-center gap-3 rounded-lg px-4 py-3 transition-all"
                style={{
                  background: active ? P[1] : done ? P[0] : P[0],
                  border: `1px solid ${active ? P[3] : done ? P[2] : P[2] + "55"}`,
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{
                    background: done ? P[3] : active ? P[5] : P[2],
                    color: done ? P[5] : active ? P[0] : TEXT_MUTED,
                  }}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className="text-sm"
                  style={{
                    color: active ? TEXT : done ? TEXT_MUTED : TEXT_SUBTLE,
                    fontWeight: active ? 500 : 400,
                    textDecoration: done ? "line-through" : "none",
                  }}
                >
                  {active ? step.replace("…", dots) : step}
                </span>
              </div>
            );
          })}
        </div>

        <p
          className="mt-6 text-center text-xs"
          style={{ color: TEXT_SUBTLE }}
        >
          Overpass API may take 5–60 s · fallback data ready if needed
        </p>
      </div>
    </div>
  );
}
