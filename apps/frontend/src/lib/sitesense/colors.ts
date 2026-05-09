// precip_meadow_dusk — Pale meadow green through cerulean blue to warm dusk salmon
export const P = [
  "#F3F9EB", // 0 bg
  "#E5F1DB", // 1 surface
  "#B6DFBD", // 2 border
  "#90CDBD", // 3 secondary
  "#6BB8C2", // 4 interactive
  "#549FBC", // 5 primary
  "#6284A9", // 6 accent
  "#856A8D", // 7 purple
  "#B9677E", // 8 rose / gap warning
  "#E98551", // 9 highlight / CTA / points
] as const;

export const TEXT = "#1a3040";
export const TEXT_MUTED = "#4a6a78";
export const TEXT_SUBTLE = "#8aacb8";

// H3 hexgrid density scale (low → high)
export const H3_SCALE = [P[1], P[3], P[4], P[5], P[6], P[7], P[8]] as const;

// Specific semantic colors
export const POINT_COLOR   = P[9];       // feature dots
export const BOUNDARY_COLOR = P[6];      // area outline
export const COVERAGE_COLOR = P[5];      // service radius
export const GAP_COLOR      = P[8];      // underserved cells

// Religion / tag categorical colors
export const TAG_COLORS: Record<string, string> = {
  buddhist:  P[4],
  christian: P[6],
  taoist:    P[3],
  muslim:    P[7],
  hindu:     P[9],
  jewish:    P[5],
  other:     P[2],
  unknown:   P[2],
};
