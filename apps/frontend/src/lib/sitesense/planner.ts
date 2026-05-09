import { getFeatureConfig } from "./featureTags";
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
  const featureConfig = getFeatureConfig(parsed.feature);
  const tagStr = featureConfig.osmTags
    .slice(0, 4)
    .map((t) => `${t.key}=${t.value}`)
    .join(", ");

  return {
    surface: "analysis_plan",
    title: `Plan · ${featureConfig.label} in ${parsed.placeLabel}`,
    detected: {
      feature: parsed.feature,
      featureLabel: featureConfig.label,
      place: parsed.place,
      placeLabel: parsed.placeLabel,
      osmTags: featureConfig.osmTags.slice(0, 4),
    },
    steps: [
      {
        label: `Locate ${parsed.placeLabel} in OpenStreetMap`,
        detail: `area["name"="${parsed.placeLabel}"] boundary lookup`,
      },
      {
        label: `Query ${featureConfig.label} via Overpass API`,
        detail: `OSM tags: ${tagStr}`,
      },
      {
        label: "Convert OSM elements to GeoJSON points",
        detail: "Nodes use lat/lon; ways and relations use centroid",
      },
      {
        label: "Compute H3 hexgrid density map",
        detail: "Resolution auto-selected by area size to avoid memory issues",
      },
      {
        label: "Fetch Mapbox isochrones for top clusters",
        detail: `Travel-time rings by ${featureConfig.isochroneProfile ?? "walking"}: 5, 10, 15 min`,
      },
      {
        label: "Generate 4-chapter storymap",
        detail: "Inventory → density → reachability → caveats",
      },
    ],
    uiPlan: [
      "Metric cards",
      "H3 hexgrid density map",
      "Isochrone reachability rings",
      "Area boundary overlay",
      "4-chapter scroll narrative",
    ],
  };
}
