import { PLACES } from "./places";
import { FEATURE_TAGS } from "./featureTags";

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OverpassResult {
  elements: OverpassElement[];
}

function buildQuery(osmName: string, tags: Array<{ key: string; value: string }>): string {
  const tagQueries = tags
    .flatMap((tag) => [
      `node["${tag.key}"="${tag.value}"](area.searchArea);`,
      `way["${tag.key}"="${tag.value}"](area.searchArea);`,
      `relation["${tag.key}"="${tag.value}"](area.searchArea);`,
    ])
    .join("\n");

  return `[out:json][timeout:25];
area["name"="${osmName}"]->.searchArea;
(
${tagQueries}
);
out center 500;`;
}

export async function fetchOverpassData(
  feature: string,
  place: string
): Promise<OverpassResult> {
  const featureConfig = FEATURE_TAGS[feature];
  const placeConfig = PLACES[place];
  const query = buildQuery(placeConfig.osmName, featureConfig.osmTags);
  const body = `data=${encodeURIComponent(query)}`;

  // Prefer local API proxy to avoid CORS issues
  const endpoints = [
    { url: "/api/overpass", method: "POST" as const },
    { url: "https://overpass-api.de/api/interpreter", method: "POST" as const },
    { url: "https://overpass.kumi.systems/api/interpreter", method: "POST" as const },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(28000),
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
