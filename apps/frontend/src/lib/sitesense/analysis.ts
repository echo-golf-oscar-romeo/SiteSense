import { getFeatureConfig } from "./featureTags";
import type { GeoPoint } from "./geo";

const MAX_DISPLAY   = 500;
const MAX_H3_CELLS  = 300;
const MAX_GAP_CELLS = 200;

export interface HexCell {
  id: string;
  lat: number;
  lon: number;
  count: number;
  boundary: [number, number][]; // [lon, lat] ring
}

export interface AnalysisResult {
  totalCount: number;
  displayCount: number;
  truncated: boolean;
  hexCells: HexCell[];
  resolution: number;
  densestCell: HexCell | null;
  topClusters: HexCell[];
  topCellCenters: [number, number][]; // [lon, lat] for isochrone origins
  tagBreakdown: Record<string, number>;
  bbox: [number, number, number, number];
  // legacy grid fields kept for compatibility
  grid: Array<{ key: string; lat: number; lon: number; count: number; label: string }>;
  displayCount_alias?: number;
}

export async function analyzeFeatures(
  features: GeoPoint[],
  featureKey: string
): Promise<AnalysisResult> {
  const truncated = features.length > MAX_DISPLAY;
  const displayed = features.slice(0, MAX_DISPLAY);

  // Bounding box
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
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

  // Tag breakdown
  const featureConfig = getFeatureConfig(featureKey);
  const tagKey = featureConfig.tagBreakdownKey;
  const tagBreakdown: Record<string, number> = {};
  if (tagKey) {
    for (const f of displayed) {
      const val = (f.properties[tagKey] as string | undefined) ?? "unknown";
      tagBreakdown[val] = (tagBreakdown[val] ?? 0) + 1;
    }
  }

  // H3 hexgrid via dynamic import (SSR-safe)
  const { hexCells, resolution } = await computeHexCells(displayed, bbox);

  const sorted = [...hexCells].sort((a, b) => b.count - a.count);
  const topClusters = sorted.slice(0, 3);
  const topCellCenters: [number, number][] = topClusters.slice(0, 8).map((c) => [c.lon, c.lat]);

  // Legacy grid (for story text)
  const grid = sorted.slice(0, 20).map((c) => ({
    key: c.id,
    lat: c.lat,
    lon: c.lon,
    count: c.count,
    label: describeCell(c.lat, c.lon, minLat, maxLat, minLon, maxLon),
  }));

  return {
    totalCount: features.length,
    displayCount: displayed.length,
    truncated,
    hexCells,
    resolution,
    densestCell: sorted[0] ?? null,
    topClusters,
    topCellCenters,
    tagBreakdown,
    bbox,
    grid,
  };
}

async function computeHexCells(
  features: GeoPoint[],
  bbox: [number, number, number, number]
): Promise<{ hexCells: HexCell[]; resolution: number }> {
  if (!features.length) return { hexCells: [], resolution: 8 };

  try {
    const h3 = await import("h3-js");
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const area = (maxLon - minLon) * (maxLat - minLat);

    // Resolution: coarser for larger areas to avoid OOM
    const resolution =
      area > 4   ? 6 :
      area > 1   ? 7 :
      area > 0.2 ? 8 :
      area > 0.04? 9 : 10;

    // Count features per hex cell
    const cellMap = new Map<string, number>();
    for (const f of features) {
      const [lon, lat] = f.geometry.coordinates;
      const cellId = h3.latLngToCell(lat, lon, resolution);
      cellMap.set(cellId, (cellMap.get(cellId) ?? 0) + 1);
    }

    // Cap cells to avoid OOM
    const topEntries = [...cellMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_H3_CELLS);

    const hexCells: HexCell[] = topEntries.map(([id, count]) => {
      const [lat, lon] = h3.cellToLatLng(id);
      const boundary = h3.cellToBoundary(id).map(
        ([blat, blon]) => [blon, blat] as [number, number]
      );
      return { id, lat, lon, count, boundary };
    });

    return { hexCells, resolution };
  } catch {
    // h3-js unavailable or error — return empty
    return { hexCells: [], resolution: 8 };
  }
}

function describeCell(
  lat: number,
  lon: number,
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number
): string {
  const latMid = (minLat + maxLat) / 2;
  const lonMid = (minLon + maxLon) / 2;
  const ns = lat > latMid + 0.005 ? "northern" : lat < latMid - 0.005 ? "southern" : "central";
  const ew = lon > lonMid + 0.005 ? "eastern" : lon < lonMid - 0.005 ? "western" : "inner";
  return `${ns} ${ew} area`;
}
