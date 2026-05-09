"use client";

import { useEffect, useState } from "react";

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
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
      <div className="w-full max-w-md">
        {/* Spinner */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
        </div>

        <h2 className="text-xl font-semibold text-foreground text-center mb-2">
          Analyzing {featureLabel}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-8">
          in {placeLabel}
        </p>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;
            return (
              <div
                key={step}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 border transition-all ${
                  active
                    ? "border-accent bg-accent/5"
                    : done
                    ? "border-border/50 bg-muted/30"
                    : "border-border/30 bg-card"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    done
                      ? "bg-accent/20 text-accent"
                      : active
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={`text-sm ${
                    active
                      ? "text-foreground font-medium"
                      : done
                      ? "text-muted-foreground line-through"
                      : "text-muted-foreground/60"
                  }`}
                >
                  {active ? step.replace("…", dots) : step}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Overpass API may take 5–15 s · fallback data ready if needed
        </p>
      </div>
    </div>
  );
}
