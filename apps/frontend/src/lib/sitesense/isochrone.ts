import { getFeatureConfig } from "./featureTags";

const MAPBOX_TOKEN =
  "pk.eyJ1Ijoia3V0dGluMjkiLCJhIjoiY21vbWhlbWJ6MHVwbjJ4c2FpNTU5ZzdkOSJ9.k7RvlUlZzj6RhX6hgf26IQ";

export async function fetchIsochrones(
  topCellCenters: [number, number][], // [lon, lat]
  featureKey: string
): Promise<GeoJSON.FeatureCollection | null> {
  if (!topCellCenters.length) return null;

  const config = getFeatureConfig(featureKey);
  const profile = config.isochroneProfile ?? "walking";
  const minutes = profile === "driving" ? [5, 10, 20] : [5, 10, 15];
  const origins = topCellCenters.slice(0, 6);

  const results = await Promise.allSettled(
    origins.map(async ([lon, lat]) => {
      const url =
        `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${lon},${lat}` +
        `?contours_minutes=${minutes.join(",")}` +
        `&polygons=true` +
        `&access_token=${MAPBOX_TOKEN}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`Mapbox ${res.status}`);
      return (await res.json()) as GeoJSON.FeatureCollection;
    })
  );

  const features: GeoJSON.Feature[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      features.push(...r.value.features);
    }
  }

  if (!features.length) return null;
  return { type: "FeatureCollection", features };
}
