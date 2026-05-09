"use client";

import { CheckCircle2, ChevronRight, Edit2 } from "lucide-react";
import type { PlannerOutput } from "@/lib/sitesense/planner";
import { FEATURE_TAGS } from "@/lib/sitesense/featureTags";
import { P, TEXT, TEXT_MUTED, TEXT_SUBTLE } from "@/lib/sitesense/colors";

interface Props {
  plan: PlannerOutput;
  onContinue: () => void;
  onBack: () => void;
}

export function PlanScreen({ plan, onContinue, onBack }: Props) {
  const icon = FEATURE_TAGS[plan.detected.feature]?.icon ?? "📍";

  return (
    <div
      className="min-h-screen px-6 py-12 max-w-2xl mx-auto"
      style={{ background: P[0], color: TEXT }}
    >
      {/* Header */}
      <div className="mb-8">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: P[4] }}
        >
          Agent Plan
        </p>
        <h2 className="text-2xl font-bold mb-1" style={{ color: TEXT }}>
          {plan.title}
        </h2>
        <p className="text-sm" style={{ color: TEXT_MUTED }}>
          The agent parsed your request and generated the analysis workflow below.
        </p>
      </div>

      {/* Detected entities */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div
          className="rounded-xl p-4"
          style={{ background: P[1], border: `1px solid ${P[2]}` }}
        >
          <p
            className="text-xs uppercase tracking-wider mb-1"
            style={{ color: TEXT_MUTED }}
          >
            Feature
          </p>
          <p className="font-semibold" style={{ color: TEXT }}>
            {icon} {plan.detected.featureLabel}
          </p>
          <p className="text-xs mt-1" style={{ color: TEXT_SUBTLE }}>
            {plan.detected.osmTags.map((t) => `${t.key}=${t.value}`).join(", ")}
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: P[1], border: `1px solid ${P[2]}` }}
        >
          <p
            className="text-xs uppercase tracking-wider mb-1"
            style={{ color: TEXT_MUTED }}
          >
            Area
          </p>
          <p className="font-semibold" style={{ color: TEXT }}>
            📍 {plan.detected.place}
          </p>
          <p className="text-xs mt-1" style={{ color: TEXT_SUBTLE }}>
            OpenStreetMap · Overpass API
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="mb-6">
        <p
          className="text-xs font-medium uppercase tracking-wider mb-3"
          style={{ color: TEXT_MUTED }}
        >
          Analysis steps
        </p>
        <div className="space-y-2">
          {plan.steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg px-4 py-3"
              style={{ background: P[1], border: `1px solid ${P[2]}` }}
            >
              <span
                className="mt-0.5 shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold"
                style={{ background: P[2], color: P[5] }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium" style={{ color: TEXT }}>
                  {step.label}
                </p>
                <p className="text-xs" style={{ color: TEXT_SUBTLE }}>
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* UI plan */}
      <div
        className="mb-6 rounded-xl p-4"
        style={{ background: P[1], border: `1px solid ${P[2]}` }}
      >
        <p
          className="text-xs font-medium uppercase tracking-wider mb-2"
          style={{ color: TEXT_MUTED }}
        >
          UI will generate
        </p>
        <div className="flex flex-wrap gap-2">
          {plan.uiPlan.map((item) => (
            <span
              key={item}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
              style={{ background: P[2], color: P[5] }}
            >
              <CheckCircle2 size={10} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm transition-opacity hover:opacity-70"
          style={{
            borderColor: P[3],
            color: TEXT_MUTED,
            background: "transparent",
          }}
        >
          <Edit2 size={14} />
          Edit prompt
        </button>
        <button
          onClick={onContinue}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: P[5], color: P[0] }}
        >
          Run analysis
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
