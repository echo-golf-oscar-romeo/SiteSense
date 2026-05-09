// SiteSense design palette — sage-green with dark ink
export const P = [
  "#f4f9ee", // P[0] page background
  "#ecf4e1", // P[1] card background
  "#d4e9b8", // P[2] border / subtle divider
  "#b5d68f", // P[3] active border
  "#7aab50", // P[4] accent label
  "#4a7c30", // P[5] CTA / active dot
] as const;

export const TEXT        = "#1a2e0d";
export const TEXT_MUTED  = "#4a5e38";
export const TEXT_SUBTLE = "#7a9063";

export const TAG_COLORS: Record<string, string> = {
  christian: "#6366f1",
  muslim:    "#059669",
  buddhist:  "#f59e0b",
  hindu:     "#ef4444",
  jewish:    "#3b82f6",
  taoist:    "#8b5cf6",
  other:     "#6b7280",
  unknown:   "#9ca3af",
};
