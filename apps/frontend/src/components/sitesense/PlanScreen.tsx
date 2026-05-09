"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, Code2, Edit2 } from "lucide-react";
import type { PlannerOutput } from "@/lib/sitesense/planner";
import { FEATURE_TAGS } from "@/lib/sitesense/featureTags";

interface Props {
  plan: PlannerOutput;
  onContinue: () => void;
  onBack: () => void;
}

export function PlanScreen({ plan, onContinue, onBack }: Props) {
  const [showSchema, setShowSchema] = useState(false);
  const icon = FEATURE_TAGS[plan.detected.feature]?.icon ?? "📍";

  return (
    <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">
          Agent Plan
        </p>
        <h2 className="text-2xl font-bold text-foreground mb-1">{plan.title}</h2>
        <p className="text-sm text-muted-foreground">
          The agent has parsed your request and generated the analysis workflow below.
        </p>
      </div>

      {/* Detected entities */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Feature</p>
          <p className="font-semibold text-foreground">
            {icon} {plan.detected.featureLabel}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {plan.detected.osmTags.map((t) => `${t.key}=${t.value}`).join(", ")}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Area</p>
          <p className="font-semibold text-foreground">📍 {plan.detected.placeLabel}</p>
          <p className="text-xs text-muted-foreground mt-1">OpenStreetMap / Overpass</p>
        </div>
      </div>

      {/* Steps */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Analysis steps
        </p>
        <div className="space-y-2">
          {plan.steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center font-semibold">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* UI plan */}
      <div className="mb-6 rounded-xl border bg-muted/40 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          UI will generate
        </p>
        <div className="flex flex-wrap gap-2">
          {plan.uiPlan.map((item) => (
            <span
              key={item}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs"
            >
              <CheckCircle2 size={10} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Schema toggle */}
      <button
        onClick={() => setShowSchema((s) => !s)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
      >
        <Code2 size={12} />
        {showSchema ? "Hide" : "Inspect"} plan schema
      </button>

      {showSchema && (
        <pre className="mb-6 rounded-xl border bg-card p-4 text-xs text-muted-foreground overflow-auto max-h-64 font-mono">
          {JSON.stringify(plan, null, 2)}
        </pre>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
        >
          <Edit2 size={14} />
          Edit prompt
        </button>
        <button
          onClick={onContinue}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-all"
        >
          Run analysis
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
