import type { OverpassResult } from "./overpass";

// Realistic demo data for Kowloon places of worship
const KOWLOON_WORSHIP: OverpassResult = {
  elements: [
    // Wong Tai Sin area
    { type: "node", id: 1001, lat: 22.3425, lon: 114.1935, tags: { amenity: "place_of_worship", religion: "buddhist", name: "Wong Tai Sin Temple" } },
    { type: "node", id: 1002, lat: 22.3418, lon: 114.1922, tags: { amenity: "place_of_worship", religion: "taoist", name: "Good Wish Garden" } },
    { type: "node", id: 1003, lat: 22.3431, lon: 114.1948, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    { type: "node", id: 1004, lat: 22.3410, lon: 114.1910, tags: { amenity: "place_of_worship", religion: "christian" } },
    // Mong Kok area
    { type: "node", id: 1005, lat: 22.3195, lon: 114.1695, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    { type: "node", id: 1006, lat: 22.3210, lon: 114.1701, tags: { amenity: "place_of_worship", religion: "taoist" } },
    { type: "node", id: 1007, lat: 22.3185, lon: 114.1688, tags: { amenity: "place_of_worship", religion: "christian", name: "St. Francis of Assisi Church" } },
    { type: "node", id: 1008, lat: 22.3220, lon: 114.1715, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    { type: "node", id: 1009, lat: 22.3175, lon: 114.1680, tags: { amenity: "place_of_worship", religion: "taoist" } },
    // Tsim Sha Tsui area
    { type: "node", id: 1010, lat: 22.2988, lon: 114.1722, tags: { amenity: "place_of_worship", religion: "christian", name: "St. Andrew's Church" } },
    { type: "node", id: 1011, lat: 22.2975, lon: 114.1735, tags: { amenity: "place_of_worship", religion: "muslim", name: "Kowloon Mosque" } },
    { type: "node", id: 1012, lat: 22.3001, lon: 114.1718, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    { type: "node", id: 1013, lat: 22.2962, lon: 114.1748, tags: { amenity: "place_of_worship", religion: "taoist" } },
    // Yau Ma Tei area
    { type: "node", id: 1014, lat: 22.3118, lon: 114.1705, tags: { amenity: "place_of_worship", religion: "taoist", name: "Tin Hau Temple" } },
    { type: "node", id: 1015, lat: 22.3125, lon: 114.1695, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    { type: "node", id: 1016, lat: 22.3108, lon: 114.1718, tags: { amenity: "place_of_worship", religion: "christian" } },
    { type: "node", id: 1017, lat: 22.3132, lon: 114.1725, tags: { amenity: "place_of_worship", religion: "taoist" } },
    // Sham Shui Po area
    { type: "node", id: 1018, lat: 22.3298, lon: 114.1625, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    { type: "node", id: 1019, lat: 22.3285, lon: 114.1638, tags: { amenity: "place_of_worship", religion: "christian" } },
    { type: "node", id: 1020, lat: 22.3312, lon: 114.1612, tags: { amenity: "place_of_worship", religion: "taoist" } },
    { type: "node", id: 1021, lat: 22.3275, lon: 114.1651, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    { type: "node", id: 1022, lat: 22.3301, lon: 114.1648, tags: { amenity: "place_of_worship", religion: "christian" } },
    // Jordan area
    { type: "node", id: 1023, lat: 22.3052, lon: 114.1711, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    { type: "node", id: 1024, lat: 22.3065, lon: 114.1722, tags: { amenity: "place_of_worship", religion: "taoist" } },
    { type: "node", id: 1025, lat: 22.3041, lon: 114.1700, tags: { amenity: "place_of_worship", religion: "christian" } },
    // Hung Hom
    { type: "node", id: 1026, lat: 22.3048, lon: 114.1890, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    { type: "node", id: 1027, lat: 22.3062, lon: 114.1905, tags: { amenity: "place_of_worship", religion: "christian" } },
    { type: "node", id: 1028, lat: 22.3035, lon: 114.1875, tags: { amenity: "place_of_worship", religion: "taoist" } },
    // To Kwa Wan
    { type: "node", id: 1029, lat: 22.3158, lon: 114.1878, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    { type: "node", id: 1030, lat: 22.3172, lon: 114.1892, tags: { amenity: "place_of_worship", religion: "christian" } },
    { type: "node", id: 1031, lat: 22.3145, lon: 114.1865, tags: { amenity: "place_of_worship", religion: "taoist" } },
    { type: "node", id: 1032, lat: 22.3188, lon: 114.1901, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    // Kowloon City
    { type: "node", id: 1033, lat: 22.3271, lon: 114.1912, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    { type: "node", id: 1034, lat: 22.3285, lon: 114.1928, tags: { amenity: "place_of_worship", religion: "taoist" } },
    { type: "node", id: 1035, lat: 22.3258, lon: 114.1898, tags: { amenity: "place_of_worship", religion: "christian", name: "St. Teresa's Church" } },
    // Additional scattered points
    { type: "node", id: 1036, lat: 22.3361, lon: 114.1798, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    { type: "node", id: 1037, lat: 22.3245, lon: 114.1761, tags: { amenity: "place_of_worship", religion: "taoist" } },
    { type: "node", id: 1038, lat: 22.3092, lon: 114.1758, tags: { amenity: "place_of_worship", religion: "buddhist" } },
    { type: "node", id: 1039, lat: 22.3378, lon: 114.1851, tags: { amenity: "place_of_worship", religion: "christian" } },
    { type: "node", id: 1040, lat: 22.3218, lon: 114.1845, tags: { amenity: "place_of_worship", religion: "buddhist" } },
  ],
};

function generateDemoData(
  feature: string,
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number,
  count = 20
): OverpassResult {
  const seed = feature.length * 17;
  const elements = [];
  for (let i = 0; i < count; i++) {
    const t = (i * seed * 0.618) % 1;
    const s = (i * seed * 0.414) % 1;
    elements.push({
      type: "node" as const,
      id: 2000 + i,
      lat: minLat + t * (maxLat - minLat),
      lon: minLon + s * (maxLon - minLon),
      tags: { amenity: feature.replace("_", "") },
    });
  }
  return { elements };
}

export const DEMO_DATA: Record<string, Record<string, OverpassResult>> = {
  places_of_worship: {
    kowloon: KOWLOON_WORSHIP,
    "hong kong island": generateDemoData("place_of_worship", 114.09, 22.19, 114.30, 22.30, 28),
    central: generateDemoData("place_of_worship", 114.14, 22.27, 114.17, 22.29, 12),
    "mong kok": generateDemoData("place_of_worship", 114.16, 22.31, 114.18, 22.33, 15),
    "tsim sha tsui": generateDemoData("place_of_worship", 114.16, 22.29, 114.18, 22.31, 14),
  },
  schools: {
    kowloon: generateDemoData("school", 114.14, 22.28, 114.23, 22.35, 35),
    "hong kong island": generateDemoData("school", 114.09, 22.19, 114.30, 22.30, 30),
    central: generateDemoData("school", 114.14, 22.27, 114.17, 22.29, 8),
    "mong kok": generateDemoData("school", 114.16, 22.31, 114.18, 22.33, 12),
    "tsim sha tsui": generateDemoData("school", 114.16, 22.29, 114.18, 22.31, 10),
  },
  public_toilets: {
    kowloon: generateDemoData("toilets", 114.14, 22.28, 114.23, 22.35, 25),
    "hong kong island": generateDemoData("toilets", 114.09, 22.19, 114.30, 22.30, 22),
    central: generateDemoData("toilets", 114.14, 22.27, 114.17, 22.29, 10),
    "mong kok": generateDemoData("toilets", 114.16, 22.31, 114.18, 22.33, 8),
    "tsim sha tsui": generateDemoData("toilets", 114.16, 22.29, 114.18, 22.31, 9),
  },
  hospitals: {
    kowloon: generateDemoData("hospital", 114.14, 22.28, 114.23, 22.35, 18),
    "hong kong island": generateDemoData("hospital", 114.09, 22.19, 114.30, 22.30, 15),
    central: generateDemoData("hospital", 114.14, 22.27, 114.17, 22.29, 6),
    "mong kok": generateDemoData("hospital", 114.16, 22.31, 114.18, 22.33, 7),
    "tsim sha tsui": generateDemoData("hospital", 114.16, 22.29, 114.18, 22.31, 5),
  },
  libraries: {
    kowloon: generateDemoData("library", 114.14, 22.28, 114.23, 22.35, 12),
    "hong kong island": generateDemoData("library", 114.09, 22.19, 114.30, 22.30, 10),
    central: generateDemoData("library", 114.14, 22.27, 114.17, 22.29, 4),
    "mong kok": generateDemoData("library", 114.16, 22.31, 114.18, 22.33, 5),
    "tsim sha tsui": generateDemoData("library", 114.16, 22.29, 114.18, 22.31, 4),
  },
};
