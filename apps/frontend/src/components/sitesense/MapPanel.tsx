"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { GeoCollection } from "@/lib/sitesense/geo";
import type { AnalysisResult } from "@/lib/sitesense/analysis";
import type { MapMode } from "@/lib/sitesense/story";
import {
  POINT_COLOR,
  BOUNDARY_COLOR,
  COVERAGE_COLOR,
  GAP_COLOR,
  H3_SCALE,
  TAG_COLORS,
  TEXT_MUTED,
  P,
} from "@/lib/sitesense/colors";

// Safe to import CSS here — this file is always loaded ssr:false via next/dynamic
import "maplibre-gl/dist/maplibre-gl.css";

const CARTO_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json";

const MODE_LABELS: Record<MapMode, string> = {
  points: "Feature points",
  hexgrid: "H3 density grid",
  coverage: "Service coverage",
  gaps: "Underserved zones",
};

interface Props {
  geoData: GeoCollection;
  analysis: AnalysisResult;
  boundary: GeoJSON.FeatureCollection | null;
  mapMode: MapMode;
  bbox: [number, number, number, number];
}

function applyMode(map: MapLibreMap, mode: MapMode) {
  const setV = (id: string, on: boolean) => {
    if (map.getLayer(id))
      map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
  };
  setV("feature-points", mode === "points");
  setV("h3-fill", mode === "hexgrid");
  setV("h3-line", mode === "hexgrid");
  setV("coverage-fill", mode === "coverage");
  setV("coverage-line", mode === "coverage");
  setV("gap-fill", mode === "gaps");
}

export function MapPanel({
  geoData,
  analysis,
  boundary,
  mapMode,
  bbox,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initRef = useRef(false);
  const modeRef = useRef<MapMode>(mapMode);

  useEffect(() => {
    modeRef.current = mapMode;
  }, [mapMode]);

  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    let map: MapLibreMap;

    (async () => {
      const { Map, Popup, AttributionControl } = await import("maplibre-gl");

      map = new Map({
        container: containerRef.current!,
        style: CARTO_STYLE,
        bounds: [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        fitBoundsOptions: { padding: 40 },
        attributionControl: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        // ── Sources ────────────────────────────────────────────────────────
        map.addSource("features", {
          type: "geojson",
          data: geoData as GeoJSON.FeatureCollection,
        });
        map.addSource("h3", { type: "geojson", data: analysis.h3GeoJSON });
        map.addSource("coverage", {
          type: "geojson",
          data: analysis.coverageGeoJSON,
        });
        map.addSource("gaps", { type: "geojson", data: analysis.gapGeoJSON });
        if (boundary) {
          map.addSource("boundary", { type: "geojson", data: boundary });
        }

        // ── Gap cells ──────────────────────────────────────────────────────
        map.addLayer({
          id: "gap-fill",
          type: "fill",
          source: "gaps",
          paint: { "fill-color": GAP_COLOR, "fill-opacity": 0.18 },
          layout: { visibility: modeRef.current === "gaps" ? "visible" : "none" },
        });

        // ── Coverage circles ───────────────────────────────────────────────
        map.addLayer({
          id: "coverage-fill",
          type: "fill",
          source: "coverage",
          paint: { "fill-color": COVERAGE_COLOR, "fill-opacity": 0.12 },
          layout: {
            visibility: modeRef.current === "coverage" ? "visible" : "none",
          },
        });
        map.addLayer({
          id: "coverage-line",
          type: "line",
          source: "coverage",
          paint: {
            "line-color": COVERAGE_COLOR,
            "line-opacity": 0.45,
            "line-width": 1,
          },
          layout: {
            visibility: modeRef.current === "coverage" ? "visible" : "none",
          },
        });

        // ── H3 hexgrid ─────────────────────────────────────────────────────
        map.addLayer({
          id: "h3-fill",
          type: "fill",
          source: "h3",
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "normalizedCount"],
              0, H3_SCALE[0],
              1 / 6, H3_SCALE[1],
              2 / 6, H3_SCALE[2],
              3 / 6, H3_SCALE[3],
              4 / 6, H3_SCALE[4],
              5 / 6, H3_SCALE[5],
              1, H3_SCALE[6],
            ],
            "fill-opacity": 0.72,
          },
          layout: {
            visibility: modeRef.current === "hexgrid" ? "visible" : "none",
          },
        });
        map.addLayer({
          id: "h3-line",
          type: "line",
          source: "h3",
          paint: {
            "line-color": "#ffffff",
            "line-opacity": 0.3,
            "line-width": 0.6,
          },
          layout: {
            visibility: modeRef.current === "hexgrid" ? "visible" : "none",
          },
        });

        // ── Area boundary ──────────────────────────────────────────────────
        if (boundary) {
          map.addLayer({
            id: "boundary-line",
            type: "line",
            source: "boundary",
            paint: {
              "line-color": BOUNDARY_COLOR,
              "line-opacity": 0.55,
              "line-width": 1.5,
              "line-dasharray": [3, 2],
            },
          });
        }

        // ── Feature points ────────────────────────────────────────────────
        map.addLayer({
          id: "feature-points",
          type: "circle",
          source: "features",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10, 3.5,
              15, 7,
            ],
            "circle-color": POINT_COLOR,
            "circle-opacity": 0.85,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
          },
          layout: {
            visibility: modeRef.current === "points" ? "visible" : "none",
          },
        });

        // Popup on click
        map.on("click", "feature-points", (e) => {
          if (!e.features?.length) return;
          const props = e.features[0].properties as Record<string, string>;
          const name = props.name || props.amenity || "Feature";
          const extras = Object.entries(props)
            .filter(([k, v]) => k !== "name" && v)
            .slice(0, 3)
            .map(
              ([k, v]) =>
                `<tr><td style="color:${TEXT_MUTED};padding-right:6px">${k}</td><td>${v}</td></tr>`
            )
            .join("");
          new Popup({ closeButton: true, maxWidth: "240px" })
            .setLngLat(
              (e.features[0].geometry as GeoJSON.Point)
                .coordinates as [number, number]
            )
            .setHTML(
              `<strong style="font-size:13px;color:#1a3040">${name}</strong>` +
                (extras
                  ? `<table style="margin-top:4px;font-size:11px">${extras}</table>`
                  : "")
            )
            .addTo(map);
        });
        map.on("mouseenter", "feature-points", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "feature-points", () => {
          map.getCanvas().style.cursor = "";
        });

        map.addControl(new AttributionControl({ compact: true }), "bottom-right");
        applyMode(map, modeRef.current);
      });
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      initRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.loaded()) return;
    applyMode(map, mapMode);
  }, [mapMode]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      <div
        className="absolute bottom-8 left-3 rounded-lg px-3 py-1.5 text-xs"
        style={{
          background: "rgba(243,249,235,0.92)",
          color: TEXT_MUTED,
          backdropFilter: "blur(4px)",
          border: `1px solid ${P[2]}`,
        }}
      >
        {MODE_LABELS[mapMode]} · {geoData.features.length} features
      </div>
    </div>
  );
}
