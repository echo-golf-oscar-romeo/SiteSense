"use client";

import { useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Analyze places of worship in Kowloon",
  "Analyze schools in Hong Kong Island",
  "Analyze public toilets in Mong Kok",
  "Analyze hospitals in Central",
  "Analyze libraries in Tsim Sha Tsui",
];

interface Props {
  onAnalyze: (prompt: string) => void;
}

export function PromptScreen({ onAnalyze }: Props) {
  const [value, setValue] = useState("");

  const submit = (p: string) => {
    const trimmed = p.trim();
    if (trimmed) onAnalyze(trimmed);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium uppercase tracking-widest">
            <MapPin size={12} />
            Urban Analysis Copilot
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-3 tracking-tight">
            SiteSense
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Ask an urban question. Get a generated map story.
          </p>
        </div>

        {/* Input */}
        <div className="relative mb-4">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(value)}
            placeholder='e.g. "Analyze places of worship in Kowloon"'
            className="w-full px-5 py-4 pr-14 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          />
          <button
            onClick={() => submit(value)}
            disabled={!value.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Example chips */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
            Try an example
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => submit(p)}
                className="px-3 py-1.5 rounded-full text-sm border border-border bg-card text-muted-foreground hover:border-accent hover:text-accent hover:bg-accent/5 transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Feature note */}
        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          Supported features: places of worship · schools · public toilets · hospitals · libraries
          <br />
          Supported areas: Kowloon · Hong Kong Island · Central · Mong Kok · Tsim Sha Tsui
        </p>
      </div>
    </div>
  );
}
