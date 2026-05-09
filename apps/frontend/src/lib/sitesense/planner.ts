import { PLACES } from "./places";
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
    placeLabel: string;
    osmTags: Array<{ key: string; value: string }>;
  };
  steps: PlanStep[];
  uiPlan: string[];
}

export function generatePlan(parsed: ParsedPrompt): PlannerOutput {
  const featureConfig = FEATURE_TAGS[parsed.feature];
  const placeConfig = PLACES[parsed.place];
  const tagStr = featureConfig.osmTags
    .map((t) => `${t.key}=${t.value}`)
    .join(", ");

  return {
    surface: "analysis_plan",
    title: `Plan for analyzing ${featureConfig.label} in ${placeConfig.label}`,
    detected: {
      feature: parsed.feature,
      featureLabel: featureConfig.label,
      place: parsed.place,
      placeLabel: placeConfig.label,
      osmTags: featureConfig.osmTags,
    },
    steps: [
      {
        label: `Find the ${placeConfig.label} area in OpenStreetMap`,
        detail: `Using area["name"="${placeConfig.osmName}"] boundary lookup`,
      },
      {
        label: `Query ${featureConfig.label} using Overpass API`,
        detail: `OSM tags: ${tagStr} — nodes, ways, and relations`,
      },
      {
        label: "Convert OSM elements into GeoJSON points",
        detail: "Nodes use lat/lon directly; ways and relations use centroid",
      },
      {
        label: "Compute total count and simple density clusters",
        detail: "0.01° grid cells, sorted by feature density",
      },
      {
        label: "Generate a storymap with findings and planning takeaways",
        detail: "3-chapter narrative with map, metrics, and caveats",
      },
    ],
    uiPlan: [
      "Metric cards (count, densest cell, data source)",
      "MapLibre map with feature points",
      "Three narrative chapters (inventory, pattern, takeaways)",
      "Confidence and limitation block",
    ],
  };
}
