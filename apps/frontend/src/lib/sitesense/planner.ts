import { FEATURE_TAGS } from "./featureTags";
import type { ParsedPrompt } from "./parser";

export interface PlanStep {
  label: string;
  detail: string;
}

export interface PlannerOutput {
  surface: "analysis_plan";
  title: string;
  detected: {
    feature: string;
    featureLabel: string;
    place: string;
    osmTags: Array<{ key: string; value: string }>;
  };
  steps: PlanStep[];
  uiPlan: string[];
}

export function generatePlan(parsed: ParsedPrompt): PlannerOutput {
  const featureConfig = FEATURE_TAGS[parsed.feature];
  const tagStr = featureConfig.osmTags
    .map((t) => `${t.key}=${t.value}`)
    .join(", ");

  return {
    surface: "analysis_plan",
    title: `Analyzing ${featureConfig.label} in ${parsed.place}`,
    detected: {
      feature: parsed.feature,
      featureLabel: featureConfig.label,
      place: parsed.place,
      osmTags: featureConfig.osmTags,
    },
    steps: [
      {
        label: `Locate "${parsed.place}" in OpenStreetMap`,
        detail: `area["name"="${parsed.place}"] boundary lookup via Overpass`,
      },
      {
        label: `Query ${featureConfig.label} (tags: ${tagStr})`,
        detail: "Overpass QL — nodes, ways, and relations with center output",
      },
      {
        label: "Fetch area boundary",
        detail: "relation[boundary=administrative] out geom for map overlay",
      },
      {
        label: "H3 hexgrid spatial analysis",
        detail: "Auto-selected resolution · density per cell · gap detection",
      },
      {
        label: "Generate scroll-based storymap",
        detail: "3–4 chapters: inventory → density → coverage/diversity → gaps",
      },
    ],
    uiPlan: [
      "4 metric cards",
      "MapLibre map with CARTO Positron basemap",
      "H3 hexgrid density layer",
      "Service coverage circles",
      "Gap cell overlay",
      "Area boundary outline",
    ],
  };
}
