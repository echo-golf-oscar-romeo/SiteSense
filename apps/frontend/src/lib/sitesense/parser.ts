import { FEATURE_ALIASES, normalizeAmenityTerm, getFeatureConfig } from "./featureTags";
import { PLACE_ALIASES } from "./places";

export interface ParsedPrompt {
  feature: string;
  place: string;
  featureLabel: string;
  placeLabel: string;
  confidence: number;
  valid: boolean;
  error?: string;
}

function extractPlace(lower: string): string | null {
  // 1. Known alias lookup
  for (const [alias, placeKey] of Object.entries(PLACE_ALIASES)) {
    if (lower.includes(alias)) return placeKey;
  }
  // 2. Regex: text after "in <place>"
  const m = lower.match(/\bin\s+([a-z\s\-']+?)(?:\s*[?!.]|$)/i);
  if (m) return m[1].trim();
  return null;
}

function extractFeature(lower: string, placeRaw: string): string | null {
  const withoutPlace = lower.replace(placeRaw, "").trim();

  // 1. Direct alias scan on full string
  for (const [alias, key] of Object.entries(FEATURE_ALIASES)) {
    if (lower.includes(alias)) return key;
  }

  // 2. Verb-pattern: "(analyze|find|show|…) <feature> in"
  const verbMatch = withoutPlace.match(
    /(?:analyze|find|show|map|search|list|explore|locate|count|where are|how many)\s+(.+?)(?:\s+in\s+|$)/i
  );
  if (verbMatch) {
    const candidate = verbMatch[1].trim();
    const normalized = normalizeAmenityTerm(candidate);
    return normalized;
  }

  // 3. Strip verb from beginning, strip place from end
  const stripped = withoutPlace
    .replace(/^(analyze|find|show|map|search|list|explore|locate|count)\s+/i, "")
    .replace(/\s+in\s+.+$/, "")
    .trim();

  if (stripped.length > 1) return normalizeAmenityTerm(stripped);
  return null;
}

export function parsePrompt(prompt: string): ParsedPrompt {
  const lower = prompt.toLowerCase().trim();

  const placeRaw = extractPlace(lower);
  const featureRaw = placeRaw ? extractFeature(lower, placeRaw) : null;

  if (!placeRaw && !featureRaw) {
    return invalid(
      'Could not parse prompt. Try: "Analyze cafes in Barcelona" or "Schools in Tokyo"'
    );
  }

  if (!placeRaw) {
    return invalid(
      'Could not detect a city or district. Try adding "in <city>" to your prompt.'
    );
  }

  if (!featureRaw) {
    return invalid(
      'Could not detect a feature type. Try: "cafes", "parks", "hospitals", "schools".'
    );
  }

  const featureConfig = getFeatureConfig(featureRaw);

  // Resolve place label
  const placeLabel = placeRaw
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    feature: featureRaw,
    place: placeRaw,
    featureLabel: featureConfig.label,
    placeLabel,
    confidence: 0.9,
    valid: true,
  };
}

function invalid(error: string): ParsedPrompt {
  return {
    feature: "",
    place: "",
    featureLabel: "",
    placeLabel: "",
    confidence: 0,
    valid: false,
    error,
  };
}
