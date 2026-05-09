import { FEATURE_TAGS, FEATURE_ALIASES } from "./featureTags";

export interface ParsedPrompt {
  feature: string;
  place: string;
  featureLabel: string;
  confidence: number;
  valid: boolean;
  error?: string;
}

export function parsePrompt(raw: string): ParsedPrompt {
  const lower = raw.toLowerCase().trim();

  // Longest-first alias scan to avoid partial matches
  const sorted = Object.entries(FEATURE_ALIASES).sort(([a], [b]) => b.length - a.length);
  let detectedFeature: string | null = null;
  for (const [alias, key] of sorted) {
    if (lower.includes(alias)) { detectedFeature = key; break; }
  }

  // Extract place — everything after " in "
  let detectedPlace = "";
  const m = lower.match(/\bin\s+(.+?)(?:\s*\?|$)/i);
  if (m) {
    detectedPlace = m[1].trim().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  if (!detectedFeature && !detectedPlace) {
    return { feature: "", place: "", featureLabel: "", confidence: 0, valid: false,
      error: 'Try: "Analyze places of worship in Kowloon" or "Analyze schools in Brooklyn"' };
  }
  if (!detectedFeature) {
    return { feature: "", place: detectedPlace, featureLabel: "", confidence: 0, valid: false,
      error: "Supported: places of worship · schools · public toilets · hospitals · libraries" };
  }
  if (!detectedPlace) {
    return { feature: detectedFeature, place: "", featureLabel: FEATURE_TAGS[detectedFeature].label,
      confidence: 0, valid: false, error: 'Add "in [place]" — any city or district works.' };
  }

  return {
    feature: detectedFeature,
    place: detectedPlace,
    featureLabel: FEATURE_TAGS[detectedFeature].label,
    confidence: 0.92,
    valid: true,
  };
}
