import { getFeatureConfig } from "./featureTags";

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
  members?: Array<{ type: string; ref: number; role: string }>;
}

export interface OverpassResult {
  elements: OverpassElement[];
}

function buildQuery(osmName: string, tags: Array<{ key: string; value: string }>): string {
  // De-duplicate tag pairs (generic config may produce e.g. amenity=cafe + amenity=cafe)
  const unique = Array.from(
    new Map(tags.map((t) => [`${t.key}=${t.value}`, t])).values()
  );

  const tagQueries = unique
    .flatMap((tag) => [
      `node["${tag.key}"="${tag.value}"](area.searchArea);`,
      `way["${tag.key}"="${tag.value}"](area.searchArea);`,
    ])
    .join("\n");

  return `[out:json][timeout:28];
area["name"="${osmName}"]->.searchArea;
(
${tagQueries}
);
out center 600;`;
}

function buildBoundaryQuery(osmName: string): string {
  return `[out:json][timeout:25];
relation["name"="${osmName}"]["boundary"="administrative"];
out geom;`;
}

export async function fetchOverpassData(
  feature: string,
  place: string
): Promise<OverpassResult> {
  const featureConfig = getFeatureConfig(feature);
  const osmName = toOsmName(place);
  const query = buildQuery(osmName, featureConfig.osmTags);
  const body = `data=${encodeURIComponent(query)}`;

  const endpoints = [
    { url: "/api/overpass" },
    { url: "https://overpass-api.de/api/interpreter" },
    { url: "https://overpass.kumi.systems/api/interpreter" },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as OverpassResult;
      if (data?.elements) return data;
    } catch {
      // Try next endpoint
    }
  }

  throw new Error("All Overpass endpoints failed");
}

export async function fetchAreaBoundary(
  place: string
): Promise<GeoJSON.FeatureCollection | null> {
  const osmName = toOsmName(place);
  const query = buildBoundaryQuery(osmName);
  const body = `data=${encodeURIComponent(query)}`;

  const endpoints = [
    "/api/overpass",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as OverpassResult;
      if (!data?.elements?.length) continue;

      return extractBestBoundary(data.elements);
    } catch {
      // Try next
    }
  }

  return null;
}

function extractBestBoundary(
  elements: OverpassElement[]
): GeoJSON.FeatureCollection | null {
  const relations = elements.filter((e) => e.type === "relation");
  if (!relations.length) return null;

  // Score by number of outer way members
  const scored = relations.map((r) => ({
    rel: r,
    outerWays: (r.members ?? []).filter((m) => m.role === "outer"),
  }));
  const best = scored.sort((a, b) => b.outerWays.length - a.outerWays.length)[0];

  // Build a single LineString feature per outer way for the best relation
  const wayIds = new Set(best.outerWays.map((m) => m.ref));
  const wayEls = elements.filter((e) => e.type === "way" && wayIds.has(e.id));

  if (!wayEls.length) return null;

  const features: GeoJSON.Feature[] = wayEls
    .map((way) => {
      const coords = (way as unknown as { geometry?: Array<{ lat: number; lon: number }> })
        .geometry;
      if (!coords?.length) return null;
      return {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: coords.map((pt) => [pt.lon, pt.lat]),
        },
      };
    })
    .filter(Boolean) as GeoJSON.Feature[];

  if (!features.length) return null;
  return { type: "FeatureCollection", features };
}

function toOsmName(place: string): string {
  // Title-case the place for better OSM name matching
  return place
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
