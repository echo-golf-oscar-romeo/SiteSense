import { FEATURE_TAGS } from "./featureTags";
import type { GeoPoint } from "./geo";

const GRID_SIZE = 0.01; // ~1km grid cells
const MAX_DISPLAY = 500;

export interface GridCell {
  key: string;
  lat: number;
  lon: number;
  count: number;
  label: string;
}

export interface AnalysisResult {
  totalCount: number;
  displayCount: number;
  truncated: boolean;
  grid: GridCell[];
  densestCell: GridCell | null;
  topClusters: GridCell[];
  tagBreakdown: Record<string, number>;
  bbox: [number, number, number, number];
}

export function analyzeFeatures(
  features: GeoPoint[],
  featureKey: string
): AnalysisResult {
  const truncated = features.length > MAX_DISPLAY;
  const displayed = features.slice(0, MAX_DISPLAY);

  // Grid density
  const gridMap = new Map<string, GridCell>();
  for (const f of displayed) {
    const [lon, lat] = f.geometry.coordinates;
    const gridLat = Math.round(lat / GRID_SIZE) * GRID_SIZE;
    const gridLon = Math.round(lon / GRID_SIZE) * GRID_SIZE;
    const key = `${gridLat.toFixed(3)},${gridLon.toFixed(3)}`;

    if (!gridMap.has(key)) {
      gridMap.set(key, {
        key,
        lat: gridLat,
        lon: gridLon,
        count: 0,
        label: describeCell(gridLat, gridLon),
      });
    }
    gridMap.get(key)!.count++;
  }

  const grid = Array.from(gridMap.values()).sort((a, b) => b.count - a.count);

  // Tag breakdown
  const featureConfig = FEATURE_TAGS[featureKey];
  const tagKey = featureConfig.tagBreakdownKey;
  const tagBreakdown: Record<string, number> = {};
  if (tagKey) {
    for (const f of displayed) {
      const val = f.properties[tagKey] ?? "unknown";
      tagBreakdown[val] = (tagBreakdown[val] ?? 0) + 1;
    }
  }

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

  const padLon = Math.max((maxLon - minLon) * 0.12, 0.006);
  const padLat = Math.max((maxLat - minLat) * 0.12, 0.006);

  const bbox: [number, number, number, number] =
    displayed.length > 0
      ? [minLon - padLon, minLat - padLat, maxLon + padLon, maxLat + padLat]
      : [114.05, 22.15, 114.35, 22.45];

  return {
    totalCount: features.length,
    displayCount: displayed.length,
    truncated,
    grid,
    densestCell: grid[0] ?? null,
    topClusters: grid.slice(0, 3),
    tagBreakdown,
    bbox,
  };
}

function describeCell(lat: number, lon: number): string {
  const centerLat = 22.32;
  const centerLon = 114.17;
  const ns = lat > centerLat + 0.02 ? "northern" : lat < centerLat - 0.02 ? "southern" : "central";
  const ew = lon > centerLon + 0.02 ? "eastern" : lon < centerLon - 0.02 ? "western" : "inner";
  return `${ns} ${ew} area`;
}
