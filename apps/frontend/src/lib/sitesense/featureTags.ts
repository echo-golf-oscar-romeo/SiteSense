export interface OsmTag {
  key: string;
  value: string;
}

export interface FeatureConfig {
  label: string;
  osmTags: OsmTag[];
  tagBreakdownKey?: string;
  icon: string;
  isochroneProfile?: "walking" | "cycling" | "driving";
}

export const FEATURE_TAGS: Record<string, FeatureConfig> = {
  places_of_worship: {
    label: "places of worship",
    osmTags: [{ key: "amenity", value: "place_of_worship" }],
    tagBreakdownKey: "religion",
    icon: "⛩️",
    isochroneProfile: "walking",
  },
  schools: {
    label: "schools",
    osmTags: [{ key: "amenity", value: "school" }],
    tagBreakdownKey: "operator",
    icon: "🏫",
    isochroneProfile: "walking",
  },
  public_toilets: {
    label: "public toilets",
    osmTags: [{ key: "amenity", value: "toilets" }],
    tagBreakdownKey: "wheelchair",
    icon: "🚻",
    isochroneProfile: "walking",
  },
  hospitals: {
    label: "hospitals & clinics",
    osmTags: [
      { key: "amenity", value: "hospital" },
      { key: "amenity", value: "clinic" },
    ],
    tagBreakdownKey: "emergency",
    icon: "🏥",
    isochroneProfile: "driving",
  },
  libraries: {
    label: "libraries",
    osmTags: [{ key: "amenity", value: "library" }],
    tagBreakdownKey: "operator",
    icon: "📚",
    isochroneProfile: "walking",
  },
};

const GENERIC_ICONS: Record<string, string> = {
  cafe: "☕", restaurant: "🍽️", bar: "🍺", pub: "🍻",
  fast_food: "🍔", food_court: "🥡", bakery: "🥐",
  park: "🌳", playground: "🛝", garden: "🌸",
  bank: "🏦", atm: "💳", pharmacy: "💊", chemist: "🧪",
  supermarket: "🛒", convenience: "🏪", marketplace: "🏬",
  gym: "🏋️", fitness_centre: "🏋️", sports_centre: "⚽",
  swimming_pool: "🏊", bicycle_rental: "🚲",
  kindergarten: "🧒", college: "🎓", university: "🎓",
  police: "👮", fire_station: "🚒", post_office: "📮",
  fuel: "⛽", parking: "🅿️", bus_station: "🚌",
  museum: "🏛️", theatre: "🎭", cinema: "🎬",
  hotel: "🏨", hostel: "🏩", camp_site: "⛺",
  dentist: "🦷", veterinary: "🐾", social_facility: "🤝",
};

export const FEATURE_ALIASES: Record<string, string> = {
  // worship
  "places of worship": "places_of_worship",
  "place of worship": "places_of_worship",
  worship: "places_of_worship",
  churches: "places_of_worship",
  church: "places_of_worship",
  temples: "places_of_worship",
  temple: "places_of_worship",
  mosques: "places_of_worship",
  mosque: "places_of_worship",
  religious: "places_of_worship",
  // schools
  schools: "schools",
  school: "schools",
  education: "schools",
  primary: "schools",
  secondary: "schools",
  // toilets
  "public toilets": "public_toilets",
  toilets: "public_toilets",
  toilet: "public_toilets",
  restrooms: "public_toilets",
  "public toilet": "public_toilets",
  wc: "public_toilets",
  // hospitals
  hospitals: "hospitals",
  hospital: "hospitals",
  clinics: "hospitals",
  clinic: "hospitals",
  healthcare: "hospitals",
  medical: "hospitals",
  // libraries
  libraries: "libraries",
  library: "libraries",
};

function buildGenericOsmTags(key: string): OsmTag[] {
  const namespaces = ["amenity", "shop", "leisure", "tourism", "office", "craft"];
  return namespaces.map((ns) => ({ key: ns, value: key }));
}

export function getFeatureConfig(key: string): FeatureConfig {
  if (FEATURE_TAGS[key]) return FEATURE_TAGS[key];
  return {
    label: key.replace(/_/g, " "),
    osmTags: buildGenericOsmTags(key),
    icon: GENERIC_ICONS[key] ?? "📍",
    isochroneProfile: "walking",
  };
}

export function normalizeAmenityTerm(raw: string): string {
  const lower = raw.toLowerCase().trim();
  // Check predefined aliases first
  if (FEATURE_ALIASES[lower]) return FEATURE_ALIASES[lower];
  // Singularize common plurals
  const singular = lower.endsWith("ies")
    ? lower.slice(0, -3) + "y"
    : lower.endsWith("s")
    ? lower.slice(0, -1)
    : lower;
  if (FEATURE_ALIASES[singular]) return FEATURE_ALIASES[singular];
  // Return as snake_case OSM key
  return lower.replace(/\s+/g, "_");
}
