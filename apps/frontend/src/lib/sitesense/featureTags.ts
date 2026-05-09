export interface OsmTag {
  key: string;
  value: string;
}

export interface FeatureConfig {
  label: string;
  osmTags: OsmTag[];
  tagBreakdownKey?: string;
  icon: string;
}

export const FEATURE_TAGS: Record<string, FeatureConfig> = {
  places_of_worship: {
    label: "places of worship",
    osmTags: [{ key: "amenity", value: "place_of_worship" }],
    tagBreakdownKey: "religion",
    icon: "⛩️",
  },
  schools: {
    label: "schools",
    osmTags: [{ key: "amenity", value: "school" }],
    tagBreakdownKey: "operator",
    icon: "🏫",
  },
  public_toilets: {
    label: "public toilets",
    osmTags: [{ key: "amenity", value: "toilets" }],
    tagBreakdownKey: "wheelchair",
    icon: "🚻",
  },
  hospitals: {
    label: "hospitals & clinics",
    osmTags: [
      { key: "amenity", value: "hospital" },
      { key: "amenity", value: "clinic" },
    ],
    tagBreakdownKey: "emergency",
    icon: "🏥",
  },
  libraries: {
    label: "libraries",
    osmTags: [{ key: "amenity", value: "library" }],
    tagBreakdownKey: "operator",
    icon: "📚",
  },
};

export const FEATURE_ALIASES: Record<string, string> = {
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
  schools: "schools",
  school: "schools",
  education: "schools",
  "public toilets": "public_toilets",
  toilets: "public_toilets",
  toilet: "public_toilets",
  restrooms: "public_toilets",
  "public toilet": "public_toilets",
  wc: "public_toilets",
  hospitals: "hospitals",
  hospital: "hospitals",
  clinics: "hospitals",
  clinic: "hospitals",
  healthcare: "hospitals",
  medical: "hospitals",
  libraries: "libraries",
  library: "libraries",
};
