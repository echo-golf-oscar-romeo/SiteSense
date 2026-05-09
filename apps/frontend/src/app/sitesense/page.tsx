"use client";

import { useState } from "react";
import { parsePrompt } from "@/lib/sitesense/parser";
import { generatePlan, type PlannerOutput } from "@/lib/sitesense/planner";
import { fetchOverpassData, fetchAreaBoundary } from "@/lib/sitesense/overpass";
import { overpassToGeoJSON, type GeoCollection } from "@/lib/sitesense/geo";
import { analyzeFeatures, type AnalysisResult } from "@/lib/sitesense/analysis";
import { fetchIsochrones } from "@/lib/sitesense/isochrone";
import { generateStory, type StorySchema } from "@/lib/sitesense/story";
import { DEMO_DATA } from "@/lib/sitesense/demoData";
import { PromptScreen } from "@/components/sitesense/PromptScreen";
import { PlanScreen } from "@/components/sitesense/PlanScreen";
import { LoadingState } from "@/components/sitesense/LoadingState";
import { StoryMapResult } from "@/components/sitesense/StoryMapResult";
import { ErrorState } from "@/components/sitesense/ErrorState";

type Screen = "prompt" | "plan" | "loading" | "result" | "error";

interface AnalysisState {
  plan: PlannerOutput;
  geoData: GeoCollection;
  analysis: AnalysisResult;
  story: StorySchema;
  boundary: GeoJSON.FeatureCollection | null;
  isochroneGeoJSON: GeoJSON.FeatureCollection | null;
  usedFallback: boolean;
  featureLabel: string;
  placeLabel: string;
}

export default function SiteSensePage() {
  const [screen, setScreen]             = useState<Screen>("prompt");
  const [currentFeature, setCurrentFeature] = useState("");
  const [currentPlace, setCurrentPlace]     = useState("");
  const [featureLabel, setFeatureLabel]     = useState("");
  const [placeLabel, setPlaceLabel]         = useState("");
  const [plan, setPlan]                     = useState<PlannerOutput | null>(null);
  const [result, setResult]                 = useState<AnalysisState | null>(null);
  const [loadingStep, setLoadingStep]       = useState("");
  const [errorMsg, setErrorMsg]             = useState("");

  const handleAnalyze = (prompt: string) => {
    const parsed = parsePrompt(prompt);

    if (!parsed.valid) {
      setErrorMsg(parsed.error ?? "Invalid prompt");
      setScreen("error");
      return;
    }

    setCurrentFeature(parsed.feature);
    setCurrentPlace(parsed.place);
    setFeatureLabel(parsed.featureLabel);
    setPlaceLabel(parsed.placeLabel);
    setPlan(generatePlan(parsed));
    setScreen("plan");
  };

  const handleContinue = async () => {
    if (!currentFeature || !currentPlace) return;
    setScreen("loading");

    try {
      // ── Step 1: Overpass data ────────────────────────────────────────────
      setLoadingStep("Querying OpenStreetMap via Overpass…");
      let overpassResult;
      let fallback = false;

      try {
        overpassResult = await fetchOverpassData(currentFeature, currentPlace);
        if (!overpassResult?.elements?.length) throw new Error("No results");
      } catch {
        fallback = true;
        overpassResult =
          DEMO_DATA[currentFeature]?.[currentPlace] ??
          DEMO_DATA.places_of_worship.kowloon;
      }

      // ── Step 2: GeoJSON + H3 analysis ───────────────────────────────────
      setLoadingStep("Converting OSM data and computing H3 hexgrid…");
      const geoData  = overpassToGeoJSON(overpassResult);
      const analysis = await analyzeFeatures(geoData.features, currentFeature);

      // ── Step 3: Boundary + isochrones (parallel) ─────────────────────────
      setLoadingStep("Fetching area boundary and isochrones…");
      const [boundary, isochroneData] = await Promise.all([
        fallback ? Promise.resolve(null) : fetchAreaBoundary(currentPlace).catch(() => null),
        fetchIsochrones(analysis.topCellCenters, currentFeature).catch(() => null),
      ]);

      // ── Step 4: Story ────────────────────────────────────────────────────
      setLoadingStep("Generating storymap…");
      const story = generateStory(
        currentFeature,
        currentPlace,
        analysis,
        fallback,
        !!isochroneData?.features.length
      );

      setResult({
        plan: plan!,
        geoData,
        analysis,
        story,
        boundary,
        isochroneGeoJSON: isochroneData,
        usedFallback: fallback,
        featureLabel,
        placeLabel,
      });
      setScreen("result");
    } catch {
      setErrorMsg("Analysis failed. Overpass may be unavailable.");
      setScreen("error");
    }
  };

  const handleUseDemoData = () => {
    if (!currentFeature || !currentPlace) {
      setScreen("prompt");
      return;
    }
    const overpassResult =
      DEMO_DATA[currentFeature]?.[currentPlace] ??
      DEMO_DATA.places_of_worship.kowloon;

    const geoData  = overpassToGeoJSON(overpassResult);

    // analyzeFeatures is async — run it and then set result
    analyzeFeatures(geoData.features, currentFeature).then((analysis) => {
      const story = generateStory(currentFeature, currentPlace, analysis, true, false);
      setResult({
        plan: plan!,
        geoData,
        analysis,
        story,
        boundary: null,
        isochroneGeoJSON: null,
        usedFallback: true,
        featureLabel,
        placeLabel,
      });
      setScreen("result");
    });
  };

  if (screen === "prompt") {
    return <PromptScreen onAnalyze={handleAnalyze} />;
  }

  if (screen === "plan" && plan) {
    return (
      <PlanScreen
        plan={plan}
        onContinue={handleContinue}
        onBack={() => setScreen("prompt")}
      />
    );
  }

  if (screen === "loading") {
    return (
      <LoadingState
        featureLabel={featureLabel}
        placeLabel={placeLabel}
        currentStep={loadingStep}
      />
    );
  }

  if (screen === "result" && result) {
    return (
      <StoryMapResult
        story={result.story}
        geoData={result.geoData}
        analysis={result.analysis}
        boundary={result.boundary}
        isochroneGeoJSON={result.isochroneGeoJSON}
        usedFallback={result.usedFallback}
        onBack={() => setScreen("prompt")}
      />
    );
  }

  if (screen === "error") {
    return (
      <ErrorState
        message={errorMsg}
        onRetry={() => setScreen("prompt")}
        onUseDemoData={currentFeature ? handleUseDemoData : undefined}
      />
    );
  }

  return null;
}
