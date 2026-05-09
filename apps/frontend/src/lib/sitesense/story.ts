import { FEATURE_TAGS } from "./featureTags";
import { PLACES } from "./places";
import type { AnalysisResult } from "./analysis";

const GRID_SIZE_KM = "~1";

export interface StoryMetric {
  label: string;
  value: string | number;
  sub?: string;
}

export interface StoryChapter {
  id: "overview" | "pattern" | "takeaways";
  title: string;
  body: string;
  mapMode: "points" | "hotspots" | "gaps";
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
  usedFallback: boolean
): StorySchema {
  const featureConfig = FEATURE_TAGS[featureKey];
  const placeConfig = PLACES[placeKey];
  const fl = featureConfig.label;
  const pl = placeConfig.label;
  const count = analysis.totalCount;
  const topCell = analysis.densestCell;
  const topCount = topCell?.count ?? 0;

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const metrics: StoryMetric[] = [
    {
      label: "OSM features found",
      value: count,
      sub: analysis.truncated ? "map shows first 500" : undefined,
    },
    {
      label: "Densest cluster",
      value: topCell ? `${topCount} features` : "N/A",
      sub: topCell?.label,
    },
    {
      label: "Grid cells with data",
      value: analysis.grid.length,
      sub: `~${GRID_SIZE_KM} km² each`,
    },
    {
      label: "Data source",
      value: usedFallback ? "Demo dataset" : "OpenStreetMap",
      sub: usedFallback ? "Overpass unavailable" : "via Overpass API",
    },
  ];

  const clusterDesc =
    analysis.topClusters.length > 0
      ? analysis.topClusters.map((c) => c.label).join(", ")
      : "scattered areas";

  const tagLines = buildTagLines(analysis.tagBreakdown);

  const chapters: StoryChapter[] = [
    {
      id: "overview",
      title: "1. What we found",
      body:
        `The query returned ${count.toLocaleString()} mapped ${fl} across ${pl}. ` +
        (analysis.truncated
          ? "The map displays the first 500 for performance. "
          : "") +
        `This is an OSM-based inventory${usedFallback ? " using demo data (live Overpass was unavailable)" : ""}. ` +
        (tagLines ? tagLines + " " : "") +
        `OSM coverage varies by district and contributor activity.`,
      mapMode: "points",
    },
    {
      id: "pattern",
      title: "2. Spatial pattern",
      body:
        `${cap(fl)} appear most concentrated in ${clusterDesc}. ` +
        (topCell
          ? `The densest single grid cell (≈1 km²) contains ${topCount} features. `
          : "") +
        (count > 30
          ? "Clustering suggests correlation with high-activity mixed-use districts and transport corridors. "
          : "The low density suggests either sparse provision or incomplete OSM mapping. ") +
        "Use the map to explore the distribution — zoom in to inspect individual features.",
      mapMode: "hotspots",
    },
    {
      id: "takeaways",
      title: "3. Planning takeaways",
      body:
        `Areas with few mapped ${fl} should not be interpreted as confirmed service gaps. ` +
        "Sparse zones may reflect genuine absences, incomplete OSM contributor coverage, or both. " +
        "Before making planning decisions, cross-reference with official administrative datasets, " +
        "field surveys, or street-view validation. " +
        `OSM data is community-contributed and completeness varies significantly across ${pl}.`,
      mapMode: "gaps",
    },
  ];

  return {
    surface: "storymap",
    title: `${cap(fl)} in ${pl}`,
    subtitle: "A lightweight OSM-based spatial scan",
    metrics,
    chapters,
    disclaimer:
      "Hackathon MVP — lightweight OSM analysis. Treat as an exploratory scan, not a professional planning audit.",
  };
}

function buildTagLines(breakdown: Record<string, number>): string {
  const entries = Object.entries(breakdown)
    .filter(([k]) => k !== "unknown")
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (entries.length === 0) return "";
  const parts = entries.map(([k, v]) => `${v} ${k}`);
  return `Tag breakdown includes ${parts.join(", ")}.`;
}
