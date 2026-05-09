"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { GeoCollection } from "@/lib/sitesense/geo";
import type { AnalysisResult } from "@/lib/sitesense/analysis";
import type { StoryChapter } from "@/lib/sitesense/story";

// This file is loaded ssr:false via next/dynamic — CSS import is safe here
import "maplibre-gl/dist/maplibre-gl.css";

interface Props {
  geoData: GeoCollection;
  analysis: AnalysisResult;
  activeChapter: StoryChapter["id"];
  bbox: [number, number, number, number];
}

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    "osm-raster": {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-raster",
      type: "raster" as const,
      source: "osm-raster",
      paint: { "raster-opacity": 0.92 },
    },
  ],
};

const POINT_COLORS: Record<string, string> = {
  overview: "#6366f1",
  pattern: "#ec4899",
  takeaways: "#f59e0b",
};

export function MapPanel({ geoData, analysis, activeChapter, bbox }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    let map: MapLibreMap;

    (async () => {
      const maplibre = await import("maplibre-gl");
      const { Map, Popup, AttributionControl } = maplibre;

      map = new Map({
        container: containerRef.current!,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style: MAP_STYLE as any,
        bounds: [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        fitBoundsOptions: { padding: 40 },
        attributionControl: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        map.addSource("features", {
          type: "geojson",
          data: geoData as GeoJSON.FeatureCollection,
        });

        // Heatmap layer (behind points)
        map.addLayer({
          id: "feature-heat",
          type: "heatmap",
          source: "features",
          maxzoom: 17,
          paint: {
            "heatmap-weight": 1,
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(236,72,153,0)",
              0.3, "rgba(236,72,153,0.4)",
              0.7, "rgba(236,72,153,0.7)",
              1, "rgba(236,72,153,1)",
            ],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 15, 15, 30],
            "heatmap-opacity": 0,
          },
        });

        // Points layer
        map.addLayer({
          id: "feature-points",
          type: "circle",
          source: "features",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10, 4,
              15, 8,
            ],
            "circle-color": POINT_COLORS.overview,
            "circle-opacity": 0.8,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
          },
        });

        // Popup on click
        map.on("click", "feature-points", (e) => {
          if (!e.features?.length) return;
          const props = e.features[0].properties as Record<string, string>;
          const name = props.name || props.amenity || "Feature";
          const extra = Object.entries(props)
            .filter(([k]) => !["amenity", "name"].includes(k) && props[k])
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${v}`)
            .join("<br/>");

          new Popup({ closeButton: true, maxWidth: "220px" })
            .setLngLat((e.features[0].geometry as GeoJSON.Point).coordinates as [number, number])
            .setHTML(`<strong style="font-size:13px">${name}</strong>${extra ? `<br/><small style="color:#666">${extra}</small>` : ""}`)
            .addTo(map);
        });

        map.on("mouseenter", "feature-points", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "feature-points", () => {
          map.getCanvas().style.cursor = "";
        });

        map.addControl(new AttributionControl({ compact: true }), "bottom-right");
      });
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      initRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync layer style with active chapter
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.loaded()) return;

    const color = POINT_COLORS[activeChapter] ?? POINT_COLORS.overview;
    map.setPaintProperty("feature-points", "circle-color", color);

    if (activeChapter === "pattern") {
      map.setPaintProperty("feature-heat", "heatmap-opacity", 0.75);
      map.setPaintProperty("feature-points", "circle-opacity", 0.35);
    } else {
      map.setPaintProperty("feature-heat", "heatmap-opacity", 0);
      map.setPaintProperty("feature-points", "circle-opacity", 0.8);
    }
  }, [activeChapter]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden border">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-8 left-3 rounded-lg bg-white/90 backdrop-blur-sm border px-3 py-1.5 text-xs text-gray-600">
        {activeChapter === "pattern" ? "Heatmap" : "Points"} · {geoData.features.length} features
      </div>
    </div>
  );
}
