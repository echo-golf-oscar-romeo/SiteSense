import { FEATURE_TAGS } from "./featureTags";
import type { AnalysisResult } from "./analysis";

export type MapMode = "points" | "hexgrid" | "coverage" | "gaps";

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

const COVERAGE_RADII_M: Record<string, number> = {
  public_toilets: 250,
  schools: 500,
  libraries: 600,
  hospitals: 1200,
  places_of_worship: 350,
};

export function generateStory(
  featureKey: string,
  place: string,
  analysis: AnalysisResult,
  usedFallback: boolean
): StorySchema {
  const featureConfig = FEATURE_TAGS[featureKey];
  const fl = featureConfig.label;
  const count = analysis.totalCount;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const metrics: StoryMetric[] = [
    {
      label: "Features found",
      value: count,
      sub: analysis.truncated ? "map shows first 500" : "via OpenStreetMap",
    },
    {
      label: "H3 cells with data",
      value: analysis.h3GeoJSON.features.length,
      sub: `resolution ${analysis.h3Resolution}`,
    },
    {
      label: "Peak cell density",
      value: analysis.maxCellCount,
      sub: "features in densest cell",
    },
    {
      label: "Data source",
      value: usedFallback ? "Demo dataset" : "OpenStreetMap",
      sub: usedFallback ? "Overpass unavailable" : "via Overpass API",
    },
  ];

  const chapters = buildChapters(featureKey, fl, place, count, analysis, usedFallback);

  return {
    surface: "storymap",
    title: `${cap(fl)} in ${place}`,
    subtitle: "OSM spatial analysis",
    metrics,
    chapters,
    disclaimer:
      "Exploratory OSM analysis · community-contributed data · completeness varies · not a planning audit",
  };
}

function buildChapters(
  featureKey: string,
  fl: string,
  place: string,
  count: number,
  analysis: AnalysisResult,
  usedFallback: boolean
): StoryChapter[] {
  const sparse = count < 20;
  const fallbackNote = usedFallback ? " (demo dataset)" : "";

  const overviewChapter: StoryChapter = {
    id: "overview",
    title: `${count.toLocaleString()} ${fl} mapped${fallbackNote}`,
    body:
      `OpenStreetMap records ${count.toLocaleString()} ${fl} within ${place}. ` +
      `Each dot represents one OSM node, way centroid, or relation centroid. ` +
      (analysis.truncated
        ? "For performance, the map renders the first 500 features. "
        : "") +
      (sparse
        ? "The low count may reflect genuine sparsity or incomplete OSM coverage."
        : "Density varies considerably across sub-districts."),
    mapMode: "points",
  };

  if (featureKey === "places_of_worship") {
    return [
      overviewChapter,
      {
        id: "density",
        title: "Density hotspots",
        body:
          `The hexagonal grid aggregates ${fl} into H3 resolution-${analysis.h3Resolution} cells (roughly 1–3 km across). ` +
          `Darker cells indicate higher concentrations. ` +
          `Peak density: ${analysis.maxCellCount} features in a single cell. ` +
          `Clustering often aligns with heritage districts, transport corridors, and residential density.`,
        mapMode: "hexgrid",
      },
      {
        id: "diversity",
        title: "Faith landscape",
        body:
          `Different religious communities cluster in distinct neighborhoods, reflecting historical settlement patterns. ` +
          `The breakdown shows the OSM-recorded religion attribute. ` +
          `"Unknown" entries are unmapped or untagged features — more common in newer or less-surveyed areas.`,
        mapMode: "hexgrid",
        showTagBreakdown: true,
      },
      {
        id: "gaps",
        title: "Underserved zones",
        body:
          `Highlighted cells cover the same geographic extent but contain zero recorded ${fl}. ` +
          `These may represent genuine gaps in provision, low-density residential zones, ` +
          `industrial areas, or simply incomplete OSM coverage. ` +
          `Cross-reference with population data before drawing planning conclusions.`,
        mapMode: "gaps",
      },
    ];
  }

  if (featureKey === "public_toilets") {
    return [
      overviewChapter,
      {
        id: "coverage",
        title: "Accessibility radius",
        body:
          `Each circle represents a ${COVERAGE_RADII_M[featureKey]}m walking catchment around a mapped public toilet. ` +
          `Overlapping circles indicate redundant coverage; large gaps highlight potential accessibility issues. ` +
          `Dense commercial and transit areas typically show better coverage.`,
        mapMode: "coverage",
      },
      {
        id: "gaps",
        title: "Coverage gaps",
        body:
          `Empty H3 cells within the study area flag zones with no recorded public toilets. ` +
          `Persistently uncovered areas — especially near markets, parks, and transit hubs — may warrant provision review. ` +
          `OSM may undercount private or semi-public facilities (malls, restaurants).`,
        mapMode: "gaps",
      },
    ];
  }

  if (featureKey === "hospitals") {
    return [
      overviewChapter,
      {
        id: "coverage",
        title: "Service radius",
        body:
          `Each circle represents an approximate ${COVERAGE_RADII_M[featureKey]}m catchment for mapped hospitals and clinics. ` +
          `Urban health systems typically aim for at least one facility within 1–2 km of all residents. ` +
          `OSM may undercount small clinics and private practices in less-mapped areas.`,
        mapMode: "coverage",
      },
      {
        id: "gaps",
        title: "Underserved zones",
        body:
          `H3 cells with no recorded medical facilities highlight potential healthcare deserts. ` +
          `Cross-reference with official health authority data — OSM healthcare mapping is ` +
          `significantly less complete than amenity or transport data, so gaps may overstate the true access problem.`,
        mapMode: "gaps",
      },
    ];
  }

  // schools and libraries
  return [
    overviewChapter,
    {
      id: "density",
      title: "Clustering patterns",
      body:
        `The H3 hexgrid (resolution ${analysis.h3Resolution}) reveals spatial concentration patterns. ` +
        (sparse
          ? "Low total counts mean individual cells are rarely dense."
          : `Peak concentration: ${analysis.maxCellCount} ${fl} in a single cell.`) +
        ` Clustering typically correlates with population density, planning zones, and land availability.`,
      mapMode: "hexgrid",
    },
    {
      id: "coverage",
      title: "Service catchment",
      body:
        `Service circles (≈ ${COVERAGE_RADII_M[featureKey]}m radius) visualise theoretical walking access. ` +
        `Overlapping areas indicate over-provision; uncovered zones suggest gaps. ` +
        (featureKey === "schools"
          ? "School catchment in practice depends on enrolment policies, private vs. public status, and grade level."
          : "Library catchment depends on opening hours, language collections, and branch size."),
      mapMode: "coverage",
    },
    {
      id: "gaps",
      title: "Coverage gaps",
      body:
        `Empty hexagonal cells within the study extent highlight zones without a single recorded ${fl}. ` +
        `Before treating these as planning gaps, consider: (1) OSM mapping completeness, ` +
        `(2) actual population in the zone, (3) access via adjacent districts not shown.`,
      mapMode: "gaps",
    },
  ];
}
