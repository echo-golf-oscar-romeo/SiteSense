"use client";

import type { StoryMetric } from "@/lib/sitesense/story";

interface Props {
  metric: StoryMetric;
  large?: boolean;
}

export function MetricCard({ metric, large }: Props) {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {metric.label}
      </p>
      <p className={`font-semibold text-foreground ${large ? "text-3xl" : "text-xl"}`}>
        {typeof metric.value === "number"
          ? metric.value.toLocaleString()
          : metric.value}
      </p>
      {metric.sub && (
        <p className="text-xs text-muted-foreground">{metric.sub}</p>
      )}
    </div>
  );
}
