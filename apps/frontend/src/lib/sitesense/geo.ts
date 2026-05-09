import type { OverpassElement, OverpassResult } from "./overpass";

export interface GeoPoint {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  properties: Record<string, string>;
}

export interface GeoCollection {
  type: "FeatureCollection";
  features: GeoPoint[];
}

export function overpassToGeoJSON(result: OverpassResult): GeoCollection {
  const features: GeoPoint[] = [];

  for (const el of result.elements) {
    let lat: number | undefined;
    let lon: number | undefined;

    if (el.type === "node" && el.lat !== undefined && el.lon !== undefined) {
      lat = el.lat;
      lon = el.lon;
    } else if (el.center) {
      lat = el.center.lat;
      lon = el.center.lon;
    }

    if (lat === undefined || lon === undefined) continue;

    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lon, lat] },
      properties: (el.tags as Record<string, string>) ?? {},
    });
  }

  return { type: "FeatureCollection", features };
}
