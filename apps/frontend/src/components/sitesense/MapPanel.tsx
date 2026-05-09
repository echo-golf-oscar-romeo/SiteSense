"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap, GeoJSONSource } from "maplibre-gl";
import type { GeoCollection } from "@/lib/sitesense/geo";
import type { AnalysisResult } from "@/lib/sitesense/analysis";
import type { MapMode } from "@/lib/sitesense/story";

import "maplibre-gl/dist/maplibre-gl.css";

const CARTO_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

// Isochrone contour colors (5 → 15 min, lighter → darker)
const ISO_FILL_EXPR = [
  "step", ["get", "contour"],
  "rgba(74, 124, 48, 0.10)", // ≤ 5 min
  5,  "rgba(74, 124, 48, 0.10)",
  10, "rgba(74, 124, 48, 0.16)",
  15, "rgba(74, 124, 48, 0.22)",
] as unknown as maplibregl.ExpressionSpecification;

interface Props {
  geoData: GeoCollection;
  analysis: AnalysisResult;
  boundary: GeoJSON.FeatureCollection | null;
  isochroneGeoJSON: GeoJSON.FeatureCollection | null;
  mapMode: MapMode;
  bbox: [number, number, number, number];
}

export function MapPanel({
  geoData,
  analysis,
  boundary,
  isochroneGeoJSON,
  mapMode,
  bbox,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<MapLibreMap | null>(null);
  const initRef      = useRef(false);
  const modeRef      = useRef<MapMode>(mapMode);

  // ── Initialise map once ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    let map: MapLibreMap;

    (async () => {
      const maplibre = await import("maplibre-gl");
      const { Map, Popup, AttributionControl } = maplibre;

      // Build hex polygon GeoJSON
      const hexGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: analysis.hexCells.map((cell) => ({
          type: "Feature",
          properties: { count: cell.count },
          geometry: {
            type: "Polygon",
            coordinates: [[...cell.boundary, cell.boundary[0]]],
          },
        })),
      };

      const maxCount = Math.max(1, ...analysis.hexCells.map((c) => c.count));

      map = new Map({
        container: containerRef.current!,
        style: CARTO_STYLE,
        bounds: [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
        fitBoundsOptions: { padding: 40 },
        attributionControl: false,
      });
      mapRef.current = map;

      map.on("load", () => {
        // ── Sources ──────────────────────────────────────────────────────────
        map.addSource("features", {
          type: "geojson",
          data: geoData as GeoJSON.FeatureCollection,
        });
        map.addSource("hexgrid", { type: "geojson", data: hexGeoJSON });
        map.addSource("boundary", {
          type: "geojson",
          data: boundary ?? EMPTY,
        });
        map.addSource("isochrones", {
          type: "geojson",
          data: isochroneGeoJSON ?? EMPTY,
        });

        // ── Layers ───────────────────────────────────────────────────────────

        // Boundary
        map.addLayer({
          id: "boundary-line",
          type: "line",
          source: "boundary",
          paint: {
            "line-color": "#4a7c30",
            "line-width": 1.5,
            "line-dasharray": [4, 3],
            "line-opacity": 0.55,
          },
        });

        // Isochrone fill
        map.addLayer({
          id: "iso-fill",
          type: "fill",
          source: "isochrones",
          filter: ["==", ["geometry-type"], "Polygon"],
          paint: {
            "fill-color": ISO_FILL_EXPR,
            "fill-opacity": 1,
          },
          layout: { visibility: "none" },
        });

        // Isochrone stroke
        map.addLayer({
          id: "iso-line",
          type: "line",
          source: "isochrones",
          filter: ["==", ["geometry-type"], "Polygon"],
          paint: {
            "line-color": "#4a7c30",
            "line-width": 1,
            "line-opacity": 0.6,
          },
          layout: { visibility: "none" },
        });

        // H3 hexgrid fill
        map.addLayer({
          id: "hex-fill",
          type: "fill",
          source: "hexgrid",
          paint: {
            "fill-color": [
              "interpolate", ["linear"],
              ["get", "count"],
              1,    "rgba(180,220,140,0.3)",
              Math.ceil(maxCount / 2), "rgba(100,170,60,0.6)",
              maxCount, "rgba(58,110,30,0.85)",
            ],
            "fill-opacity": 1,
          },
          layout: { visibility: "none" },
        });
        map.addLayer({
          id: "hex-stroke",
          type: "line",
          source: "hexgrid",
          paint: {
            "line-color": "#fff",
            "line-width": 0.5,
            "line-opacity": 0.35,
          },
          layout: { visibility: "none" },
        });

        // Points
        map.addLayer({
          id: "feature-points",
          type: "circle",
          source: "features",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3.5, 15, 7],
            "circle-color": "#4a7c30",
            "circle-opacity": 0.8,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#fff",
          },
        });

        // Coverage circles (point-spread approximation)
        map.addLayer({
          id: "coverage-circle",
          type: "circle",
          source: "features",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 18, 14, 60],
            "circle-color": "#4a7c30",
            "circle-opacity": 0.07,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#4a7c30",
            "circle-stroke-opacity": 0.25,
          },
          layout: { visibility: "none" },
        });

        // Click popup
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
            .setLngLat(
              (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number]
            )
            .setHTML(
              `<strong style="font-size:13px">${name}</strong>` +
              (extra ? `<br/><small style="color:#666">${extra}</small>` : "")
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

        applyMode(map, modeRef.current, !!isochroneGeoJSON?.features.length);
      });
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      initRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync mode when prop changes ───────────────────────────────────────────
  useEffect(() => {
    modeRef.current = mapMode;
    const map = mapRef.current;
    if (!map?.loaded()) return;
    applyMode(map, mapMode, !!isochroneGeoJSON?.features.length);
  }, [mapMode, isochroneGeoJSON]);

  // ── Update isochrone source when data arrives ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.loaded()) return;
    const src = map.getSource("isochrones") as GeoJSONSource | undefined;
    src?.setData(isochroneGeoJSON ?? EMPTY);
    if (mapMode === "isochrone") {
      applyMode(map, mapMode, !!isochroneGeoJSON?.features.length);
    }
  }, [isochroneGeoJSON, mapMode]);

  return (
    <div
      className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden"
      style={{ border: "1px solid #d4e9b8" }}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

function setVis(map: MapLibreMap, id: string, visible: boolean) {
  if (!map.getLayer(id)) return;
  map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
}

function applyMode(
  map: MapLibreMap,
  mode: MapMode,
  hasIsochrones: boolean
) {
  const showPoints   = mode === "points" || mode === "coverage";
  const showHex      = mode === "hexgrid";
  const showCoverage = mode === "coverage";
  const showIso      = mode === "isochrone" && hasIsochrones;
  // Fall back to coverage if isochrones not loaded yet
  const showFallback = mode === "isochrone" && !hasIsochrones;

  setVis(map, "feature-points",  showPoints || showFallback);
  setVis(map, "hex-fill",        showHex);
  setVis(map, "hex-stroke",      showHex);
  setVis(map, "coverage-circle", showCoverage || showFallback);
  setVis(map, "iso-fill",        showIso);
  setVis(map, "iso-line",        showIso);
}
