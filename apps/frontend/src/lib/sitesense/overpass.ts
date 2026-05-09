import { FEATURE_TAGS } from "./featureTags";

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
  members?: Array<{
    type: string;
    ref: number;
    role: string;
    geometry?: Array<{ lat: number; lon: number }>;
  }>;
}

export interface OverpassResult {
  elements: OverpassElement[];
}

const ENDPOINTS = [
  "/api/overpass",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

async function postOverpass(query: string, timeoutMs = 68000): Promise<OverpassResult> {
  const body = `data=${encodeURIComponent(query)}`;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as OverpassResult;
      if (data?.elements) return data;
    } catch { /* try next */ }
  }
  throw new Error("All Overpass endpoints failed");
}

export async function fetchOverpassData(
  feature: string,
  place: string
): Promise<OverpassResult> {
  const tags = FEATURE_TAGS[feature].osmTags;
  const tagQueries = tags
    .flatMap((t) => [
      `node["${t.key}"="${t.value}"](area.searchArea);`,
      `way["${t.key}"="${t.value}"](area.searchArea);`,
      `relation["${t.key}"="${t.value}"](area.searchArea);`,
    ])
    .join("\n");

  const query = `[out:json][timeout:60];
area["name"="${place}"]->.searchArea;
(
${tagQueries}
);
out center 500;`;

  return postOverpass(query, 68000);
}

export async function fetchAreaBoundary(
  place: string
): Promise<GeoJSON.FeatureCollection | null> {
  const query = `[out:json][timeout:30];
(
  relation["name"="${place}"]["boundary"="administrative"];
  relation["name"="${place}"]["place"];
);
out geom;`;

  try {
    const data = await postOverpass(query, 32000);
    const features: GeoJSON.Feature[] = [];

    for (const el of data.elements ?? []) {
      if (el.type !== "relation") continue;
      for (const member of el.members ?? []) {
        if (
          member.type === "way" &&
          member.role === "outer" &&
          (member.geometry?.length ?? 0) > 1
        ) {
          const coords = member.geometry!.map(
            (pt) => [pt.lon, pt.lat] as [number, number]
          );
          features.push({
            type: "Feature",
            geometry: { type: "LineString", coordinates: coords },
            properties: {},
          });
        }
      }
    }

    return features.length > 0 ? { type: "FeatureCollection", features } : null;
  } catch {
    return null;
  }
}
