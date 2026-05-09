"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  message: string;
  onRetry: () => void;
  onUseDemoData?: () => void;
}

const SUGGESTED_PROMPTS = [
  "Analyze places of worship in Kowloon",
  "Analyze schools in Hong Kong Island",
  "Analyze hospitals in Central",
];

export function ErrorState({ message, onRetry, onUseDemoData }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mb-6">
          <AlertTriangle size={24} className="text-destructive" />
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-2">
          Analysis failed
        </h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex flex-col gap-3 mb-8">
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-muted/40 transition-all"
          >
            <RefreshCw size={14} />
            Try a different prompt
          </button>
          {onUseDemoData && (
            <button
              onClick={onUseDemoData}
              className="px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-all"
            >
              Use demo data instead
            </button>
          )}
        </div>

        <div className="text-left">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
            Try these prompts
          </p>
          <div className="space-y-2">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => onRetry()}
                className="w-full text-left px-3 py-2 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
