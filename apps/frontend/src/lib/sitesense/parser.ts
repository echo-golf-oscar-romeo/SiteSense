import { PLACES, PLACE_ALIASES } from "./places";
import { FEATURE_TAGS, FEATURE_ALIASES } from "./featureTags";

export interface ParsedPrompt {
  feature: string;
  place: string;
  featureLabel: string;
  placeLabel: string;
  confidence: number;
  valid: boolean;
  error?: string;
}

export function parsePrompt(prompt: string): ParsedPrompt {
  const lower = prompt.toLowerCase().trim();

  let detectedFeature: string | null = null;
  for (const [alias, featureKey] of Object.entries(FEATURE_ALIASES)) {
    if (lower.includes(alias)) {
      detectedFeature = featureKey;
      break;
    }
  }

  let detectedPlace: string | null = null;
  for (const [alias, placeKey] of Object.entries(PLACE_ALIASES)) {
    if (lower.includes(alias)) {
      detectedPlace = placeKey;
      break;
    }
  }

  if (!detectedFeature && !detectedPlace) {
    return {
      feature: "",
      place: "",
      featureLabel: "",
      placeLabel: "",
      confidence: 0,
      valid: false,
      error:
        "Could not understand this prompt. Try: \"Analyze places of worship in Kowloon\"",
    };
  }

  if (!detectedFeature) {
    return {
      feature: "",
      place: detectedPlace!,
      featureLabel: "",
      placeLabel: PLACES[detectedPlace!].label,
      confidence: 0,
      valid: false,
      error:
        "Could not detect a feature type. Supported: places of worship, schools, public toilets, hospitals, libraries.",
    };
  }

  if (!detectedPlace) {
    return {
      feature: detectedFeature,
      place: "",
      featureLabel: FEATURE_TAGS[detectedFeature].label,
      placeLabel: "",
      confidence: 0,
      valid: false,
      error:
        "Could not detect a place. Supported: Kowloon, Hong Kong Island, Central, Mong Kok, Tsim Sha Tsui.",
    };
  }

  return {
    feature: detectedFeature,
    place: detectedPlace,
    featureLabel: FEATURE_TAGS[detectedFeature].label,
    placeLabel: PLACES[detectedPlace].label,
    confidence: 0.92,
    valid: true,
  };
}
