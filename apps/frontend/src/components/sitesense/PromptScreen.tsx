"use client";

import { useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { P, TEXT, TEXT_MUTED, TEXT_SUBTLE } from "@/lib/sitesense/colors";

const EXAMPLE_PROMPTS = [
  "Analyze places of worship in Kowloon",
  "Analyze schools in Brooklyn",
  "Analyze public toilets in Mong Kok",
  "Analyze hospitals in Singapore",
  "Analyze libraries in Tokyo",
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
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 py-16"
      style={{ background: P[0], color: TEXT }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-widest"
            style={{ background: P[1], color: P[5], border: `1px solid ${P[2]}` }}
          >
            <MapPin size={12} />
            Urban Analysis Copilot
          </div>
          <h1
            className="text-5xl font-bold mb-3 tracking-tight"
            style={{ color: TEXT }}
          >
            SiteSense
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: TEXT_MUTED }}>
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
            placeholder='e.g. "Analyze schools in Brooklyn"'
            className="w-full px-5 py-4 pr-14 rounded-xl text-base focus:outline-none transition-all"
            style={{
              background: P[1],
              border: `1.5px solid ${P[2]}`,
              color: TEXT,
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = P[4])
            }
            onBlur={(e) =>
              (e.target.style.borderColor = P[2])
            }
          />
          <button
            onClick={() => submit(value)}
            disabled={!value.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: P[5], color: P[0] }}
          >
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Example chips */}
        <div className="flex flex-col gap-2">
          <p
            className="text-xs font-medium uppercase tracking-wider mb-1"
            style={{ color: TEXT_SUBTLE }}
          >
            Try an example
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => submit(p)}
                className="px-3 py-1.5 rounded-full text-sm transition-all"
                style={{
                  border: `1px solid ${P[2]}`,
                  background: P[1],
                  color: TEXT_MUTED,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = P[4];
                  (e.currentTarget as HTMLButtonElement).style.color = P[5];
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = P[2];
                  (e.currentTarget as HTMLButtonElement).style.color = TEXT_MUTED;
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <p
          className="mt-8 text-center text-xs leading-relaxed"
          style={{ color: TEXT_SUBTLE }}
        >
          Supported: places of worship · schools · public toilets · hospitals · libraries
          <br />
          Works with any city or district worldwide via OpenStreetMap
        </p>
      </div>
    </div>
  );
}
