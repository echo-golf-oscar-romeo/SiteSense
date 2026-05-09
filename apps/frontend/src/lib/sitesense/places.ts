export interface PlaceConfig {
  label: string;
  osmName: string;
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  center: [number, number]; // [lon, lat]
  zoom: number;
}

export const PLACES: Record<string, PlaceConfig> = {
  kowloon: {
    label: "Kowloon",
    osmName: "Kowloon",
    bbox: [114.14, 22.28, 114.23, 22.35],
    center: [114.185, 22.315],
    zoom: 13,
  },
  "hong kong island": {
    label: "Hong Kong Island",
    osmName: "Hong Kong Island",
    bbox: [114.09, 22.19, 114.30, 22.30],
    center: [114.195, 22.245],
    zoom: 12,
  },
  central: {
    label: "Central",
    osmName: "Central",
    bbox: [114.14, 22.27, 114.17, 22.29],
    center: [114.155, 22.28],
    zoom: 15,
  },
  "mong kok": {
    label: "Mong Kok",
    osmName: "Mong Kok",
    bbox: [114.16, 22.31, 114.18, 22.33],
    center: [114.17, 22.32],
    zoom: 15,
  },
  "tsim sha tsui": {
    label: "Tsim Sha Tsui",
    osmName: "Tsim Sha Tsui",
    bbox: [114.16, 22.29, 114.18, 22.31],
    center: [114.17, 22.30],
    zoom: 15,
  },
};

export const PLACE_ALIASES: Record<string, string> = {
  kowloon: "kowloon",
  kln: "kowloon",
  "hong kong island": "hong kong island",
  "hk island": "hong kong island",
  "hong kong": "hong kong island",
  central: "central",
  "central hk": "central",
  "mong kok": "mong kok",
  mongkok: "mong kok",
  "tsim sha tsui": "tsim sha tsui",
  tst: "tsim sha tsui",
};
