import { FEATURE_TAGS } from "./featureTags";
import type { GeoPoint } from "./geo";

const MAX_DISPLAY = 500;
const MAX_GAP_CELLS = 600;

const COVERAGE_RADIUS_KM: Record<string, number> = {
  public_toilets: 0.25,
  schools: 0.5,
  libraries: 0.6,
  hospitals: 1.2,
  places_of_worship: 0.35,
};

export interface AnalysisResult {
  totalCount: number;
  displayCount: number;
  truncated: boolean;
  h3Resolution: number;
  h3GeoJSON: GeoJSON.FeatureCollection;
  gapGeoJSON: GeoJSON.FeatureCollection;
  coverageGeoJSON: GeoJSON.FeatureCollection;
  maxCellCount: number;
  tagBreakdown: Record<string, number>;
  bbox: [number, number, number, number];
}

function pickResolution(bboxAreaDeg2: number): number {
  if (bboxAreaDeg2 > 0.5) return 8;
  if (bboxAreaDeg2 > 0.08) return 9;
  return 10;
}

function circlePolygon(
  lon: number,
  lat: number,
  radiusKm: number,
  steps = 32
): [number, number][] {
  const R = 6371;
  const latRad = (lat * Math.PI) / 180;
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = (radiusKm / R) * (180 / Math.PI) * Math.cos(angle);
    const dLon =
      ((radiusKm / R) * (180 / Math.PI) * Math.sin(angle)) /
      Math.cos(latRad);
    coords.push([lon + dLon, lat + dLat]);
  }
  return coords;
}

export async function analyzeFeatures(
  features: GeoPoint[],
  featureKey: string
): Promise<AnalysisResult> {
  const h3 = await import("h3-js");

  const truncated = features.length > MAX_DISPLAY;
  const displayed = features.slice(0, MAX_DISPLAY);

  // Bounding box
  let minLon = Infinity,
    minLat = Infinity,
    maxLon = -Infinity,
    maxLat = -Infinity;
  for (const f of displayed) {
    const [lon, lat] = f.geometry.coordinates;
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }
  const padLon = Math.max((maxLon - minLon) * 0.12, 0.008);
  const padLat = Math.max((maxLat - minLat) * 0.12, 0.008);
  const bbox: [number, number, number, number] =
    displayed.length > 0
      ? [minLon - padLon, minLat - padLat, maxLon + padLon, maxLat + padLat]
      : [114.05, 22.15, 114.35, 22.45];

  const bboxArea = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]);
  const resolution = pickResolution(bboxArea);

  // H3 cell counts + dominant tag
  const featureConfig = FEATURE_TAGS[featureKey];
  const tagKey = featureConfig.tagBreakdownKey;
  const cellCounts = new Map<string, number>();
  const cellTags = new Map<string, Record<string, number>>();

  for (const f of displayed) {
    const [lon, lat] = f.geometry.coordinates;
    const cell = h3.latLngToCell(lat, lon, resolution);
    cellCounts.set(cell, (cellCounts.get(cell) ?? 0) + 1);
    if (tagKey) {
      const tag = (f.properties[tagKey] as string) ?? "unknown";
      const tagMap = cellTags.get(cell) ?? {};
      tagMap[tag] = (tagMap[tag] ?? 0) + 1;
      cellTags.set(cell, tagMap);
    }
  }

  const maxCellCount = Math.max(...cellCounts.values(), 1);

  // H3 GeoJSON
  const h3Features: GeoJSON.Feature[] = [];
  for (const [cell, count] of cellCounts) {
    const boundary = h3.cellToBoundary(cell); // [[lat, lon], ...]
    const coords = boundary.map(([lat, lon]) => [lon, lat] as [number, number]);
    coords.push(coords[0]); // close ring

    const tagMap = cellTags.get(cell) ?? {};
    const dominantTag =
      Object.entries(tagMap).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "unknown";

    h3Features.push({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [coords] },
      properties: {
        count,
        normalizedCount: count / maxCellCount,
        dominantTag,
        h3Index: cell,
      },
    });
  }

  const h3GeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: h3Features,
  };

  // Gap cells: bbox cells with zero features
  const bboxOuter: [number, number][] = [
    [bbox[1], bbox[0]], // [minLat, minLon]
    [bbox[3], bbox[0]],
    [bbox[3], bbox[2]],
    [bbox[1], bbox[2]],
  ];

  let gapFeatures: GeoJSON.Feature[] = [];
  try {
    const allCells = h3.polygonToCells([bboxOuter], resolution);
    const gapCells = allCells
      .filter((c) => !cellCounts.has(c))
      .slice(0, MAX_GAP_CELLS);
    gapFeatures = gapCells.map((cell) => {
      const boundary = h3.cellToBoundary(cell);
      const coords = boundary.map(([lat, lon]) => [lon, lat] as [number, number]);
      coords.push(coords[0]);
      return {
        type: "Feature" as const,
        geometry: { type: "Polygon" as const, coordinates: [coords] },
        properties: { count: 0 },
      };
    });
  } catch {
    /* bbox too large or resolution mismatch — skip gap layer */
  }

  const gapGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: gapFeatures,
  };

  // Coverage circles (sample max 80 points)
  const radiusKm = COVERAGE_RADIUS_KM[featureKey] ?? 0.5;
  const sampleStep = Math.max(1, Math.ceil(displayed.length / 80));
  const coverageFeatures: GeoJSON.Feature[] = [];
  for (let i = 0; i < displayed.length; i += sampleStep) {
    const [lon, lat] = displayed[i].geometry.coordinates;
    coverageFeatures.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [circlePolygon(lon, lat, radiusKm)],
      },
      properties: {},
    });
  }
  const coverageGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: coverageFeatures,
  };

  // Tag breakdown
  const tagBreakdown: Record<string, number> = {};
  if (tagKey) {
    for (const f of displayed) {
      const val = (f.properties[tagKey] as string) ?? "unknown";
      tagBreakdown[val] = (tagBreakdown[val] ?? 0) + 1;
    }
  }

  return {
    totalCount: features.length,
    displayCount: displayed.length,
    truncated,
    h3Resolution: resolution,
    h3GeoJSON,
    gapGeoJSON,
    coverageGeoJSON,
    maxCellCount,
    tagBreakdown,
    bbox,
  };
}
