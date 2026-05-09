"use client";

import { useState } from "react";
import { parsePrompt } from "@/lib/sitesense/parser";
import { generatePlan, type PlannerOutput } from "@/lib/sitesense/planner";
import { fetchOverpassData } from "@/lib/sitesense/overpass";
import { overpassToGeoJSON, type GeoCollection } from "@/lib/sitesense/geo";
import { analyzeFeatures, type AnalysisResult } from "@/lib/sitesense/analysis";
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
  usedFallback: boolean;
  featureLabel: string;
  placeLabel: string;
}

export default function SiteSensePage() {
  const [screen, setScreen] = useState<Screen>("prompt");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentFeature, setCurrentFeature] = useState("");
  const [currentPlace, setCurrentPlace] = useState("");
  const [featureLabel, setFeatureLabel] = useState("");
  const [placeLabel, setPlaceLabel] = useState("");
  const [plan, setPlan] = useState<PlannerOutput | null>(null);
  const [result, setResult] = useState<AnalysisState | null>(null);
  const [loadingStep, setLoadingStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAnalyze = (prompt: string) => {
    setCurrentPrompt(prompt);
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
    setLoadingStep("Querying OpenStreetMap via Overpass…");

    try {
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

      setLoadingStep("Converting OSM data to GeoJSON…");
      const geoData = overpassToGeoJSON(overpassResult);

      setLoadingStep("Computing spatial analysis…");
      const analysis = analyzeFeatures(geoData.features, currentFeature);

      setLoadingStep("Generating storymap…");
      const story = generateStory(currentFeature, currentPlace, analysis, fallback);

      setResult({
        plan: plan!,
        geoData,
        analysis,
        story,
        usedFallback: fallback,
        featureLabel,
        placeLabel,
      });
      setScreen("result");
    } catch (err) {
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

    const geoData = overpassToGeoJSON(overpassResult);
    const analysis = analyzeFeatures(geoData.features, currentFeature);
    const story = generateStory(currentFeature, currentPlace, analysis, true);

    setResult({
      plan: plan!,
      geoData,
      analysis,
      story,
      usedFallback: true,
      featureLabel,
      placeLabel,
    });
    setScreen("result");
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
