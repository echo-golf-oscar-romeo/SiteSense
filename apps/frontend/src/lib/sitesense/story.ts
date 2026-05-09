import { getFeatureConfig } from "./featureTags";
import type { AnalysisResult } from "./analysis";

export type MapMode = "points" | "hexgrid" | "coverage" | "isochrone";

export interface StoryMetric {
  label: string;
  value: string | number;
  sub?: string;
}

export interface StoryChapter {
  id: string;
  title: string;
  body: string;
  mapMode: MapMode;
  showTagBreakdown?: boolean;
}

export interface StorySchema {
  surface: "storymap";
  title: string;
  subtitle: string;
  metrics: StoryMetric[];
  chapters: StoryChapter[];
  disclaimer: string;
}

export function generateStory(
  featureKey: string,
  placeKey: string,
  analysis: AnalysisResult,
  usedFallback: boolean,
  hasIsochrones = false
): StorySchema {
  const featureConfig = getFeatureConfig(featureKey);
  const fl = featureConfig.label;
  const pl = placeKey
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const count = analysis.totalCount;
  const top = analysis.densestCell;
  const topCount = top?.count ?? 0;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const clusterDesc =
    analysis.grid.length > 0
      ? analysis.grid.slice(0, 3).map((c) => c.label).join(", ")
      : "scattered areas";

  const metrics: StoryMetric[] = [
    {
      label: "OSM features",
      value: count.toLocaleString(),
      sub: analysis.truncated ? "map shows first 500" : undefined,
    },
    {
      label: "Densest hex cell",
      value: top ? `${topCount}` : "N/A",
      sub: analysis.grid[0]?.label,
    },
    {
      label: "Hex cells",
      value: analysis.hexCells.length,
      sub: `resolution ${analysis.resolution}`,
    },
    {
      label: "Data source",
      value: usedFallback ? "Demo dataset" : "OpenStreetMap",
      sub: usedFallback ? "Overpass unavailable" : "via Overpass API",
    },
  ];

  const tagLines = buildTagLines(analysis.tagBreakdown);

  const chapters: StoryChapter[] = [
    {
      id: "overview",
      title: "What we found",
      body:
        `${count.toLocaleString()} mapped ${fl} ${usedFallback ? "(demo data — live Overpass was unavailable)" : "were returned from OpenStreetMap"}. ` +
        (analysis.truncated ? "The map displays the first 500 for performance. " : "") +
        (tagLines ? tagLines + " " : "") +
        "OSM coverage varies by district and contributor activity.",
      mapMode: "points",
      showTagBreakdown: Object.keys(analysis.tagBreakdown).length > 0,
    },
    {
      id: "density",
      title: "Density pattern",
      body:
        `${cap(fl)} concentrate most in ${clusterDesc}. ` +
        (top
          ? `The densest hex cell contains ${topCount} features. `
          : "") +
        (count > 30
          ? "Clustering suggests correlation with high-activity mixed-use districts and transport corridors."
          : "Low density may reflect genuine sparsity or incomplete OSM contributor coverage."),
      mapMode: "hexgrid",
    },
    {
      id: "reach",
      title: hasIsochrones ? "Reachability" : "Coverage estimate",
      body: hasIsochrones
        ? `The isochrone rings show how far you can travel from the top ${fl} clusters by ${featureConfig.isochroneProfile ?? "walking"} in 5, 10, and 15 minutes. Overlapping rings indicate well-served zones.`
        : `Coverage circles approximate the service area around each ${fl.replace(/s$/, "")}. Areas outside circles may be underserved or have OSM coverage gaps.`,
      mapMode: hasIsochrones ? "isochrone" : "coverage",
    },
    {
      id: "caveats",
      title: "Planning caveats",
      body:
        `Sparse zones should not be interpreted as confirmed service gaps. ` +
        "They may reflect genuine absences or incomplete OSM contributor coverage. " +
        `Cross-reference with official datasets and field surveys before planning decisions. ` +
        `OSM completeness varies significantly across ${pl}.`,
      mapMode: "hexgrid",
    },
  ];

  return {
    surface: "storymap",
    title: `${cap(fl)} in ${pl}`,
    subtitle: "OSM-based urban spatial scan",
    metrics,
    chapters,
    disclaimer:
      "Hackathon MVP · exploratory OSM scan. Not a professional planning audit.",
  };
}

function buildTagLines(breakdown: Record<string, number>): string {
  const entries = Object.entries(breakdown)
    .filter(([k]) => k !== "unknown")
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (!entries.length) return "";
  const parts = entries.map(([k, v]) => `${v} ${k}`);
  return `Tag breakdown: ${parts.join(", ")}.`;
}
