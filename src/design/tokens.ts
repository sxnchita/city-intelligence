// =====================================================================
// SEMANTIC MAPPINGS
//
// The palette lives in index.css as CSS custom properties; Tailwind
// classes reference it directly. This file holds only the things a
// class name cannot express: the mapping from a backend value to a
// colour, and the raw hex values that non-CSS consumers need —
// Leaflet path options and Recharts series both take strings.
// =====================================================================

/** Kept in sync with the @theme block in index.css. */
export const HEX = {
  primary: "#536224",
  primaryContainer: "#6b7b3a",
  primaryFixed: "#d8eb9d",
  inversePrimary: "#bcce84",
  secondaryContainer: "#d8e6a8",
  tertiary: "#415f77",
  tertiaryFixedDim: "#abcae6",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  warning: "#b4690e",
  warningContainer: "#ffddb8",
  onSurface: "#171e0c",
  onSurfaceVariant: "#46483b",
  outline: "#76786a",
  outlineVariant: "#c6c8b7",
  surface: "#f5fde0",
  surfaceContainer: "#e9f1d5",
  paper: "#f5efe5",
  hairline: "#e8dfc9",
  sand: "#efe4ce",
  white: "#ffffff",
} as const;

// ---------------------------------------------------------------------
// CAMERA HEALTH
//
// Thresholds come from the design's own legend: reporting normally,
// no data > 2 min, no data > 10 min. Derived from the camera's
// last_event_at, which the backend maintains as events arrive.
// ---------------------------------------------------------------------

export type CameraStatus = "healthy" | "degraded" | "offline";

export const CAMERA_WARNING_MINUTES = 2;
export const CAMERA_OFFLINE_MINUTES = 10;

export function cameraStatus(
  minutesSinceLastEvent: number
): CameraStatus {
  if (minutesSinceLastEvent <= CAMERA_WARNING_MINUTES) return "healthy";
  if (minutesSinceLastEvent <= CAMERA_OFFLINE_MINUTES) return "degraded";
  return "offline";
}

export const CAMERA_STATUS: Record<
  CameraStatus,
  { label: string; hint: string; hex: string; dot: string; text: string }
> = {
  healthy: {
    label: "Healthy",
    hint: "Reporting normally",
    hex: HEX.primary,
    dot: "bg-primary",
    text: "text-on-surface",
  },
  degraded: {
    label: "Degraded",
    hint: `No data > ${CAMERA_WARNING_MINUTES} mins`,
    hex: HEX.warning,
    dot: "bg-warning",
    text: "text-warning",
  },
  offline: {
    label: "Offline",
    hint: `No data > ${CAMERA_OFFLINE_MINUTES} mins`,
    hex: HEX.error,
    dot: "bg-error",
    text: "text-error",
  },
};

// ---------------------------------------------------------------------
// ALERT SEVERITY
// The backend's ladder is low / medium / high. There is no "critical".
// ---------------------------------------------------------------------

export const SEVERITY: Record<
  string,
  { hex: string; bar: string; chip: string }
> = {
  high: {
    hex: HEX.error,
    bar: "bg-error",
    chip: "bg-error-container text-on-error-container",
  },
  medium: {
    hex: HEX.warning,
    bar: "bg-warning",
    chip: "bg-warning-container text-warning",
  },
  low: {
    hex: HEX.primaryContainer,
    bar: "bg-primary-container",
    chip: "bg-secondary-container text-on-secondary-container",
  },
};

export function severity(name: string | null | undefined) {
  return SEVERITY[name ?? "low"] ?? SEVERITY.low;
}

// ---------------------------------------------------------------------
// CONGESTION BANDS
// A null band means the backend saw the edge fewer than
// analytics.min-samples times and will not claim a level for it.
// ---------------------------------------------------------------------

export type CongestionBand =
  | "free"
  | "moderate"
  | "heavy"
  | "severe";

export const BAND: Record<
  CongestionBand,
  { label: string; hex: string; chip: string }
> = {
  free: {
    label: "Free flowing",
    hex: HEX.primaryContainer,
    chip: "bg-secondary-container text-on-secondary-container",
  },
  moderate: {
    label: "Moderate",
    hex: "#a8951f",
    chip: "bg-[#f0e6b8] text-[#6b5d10]",
  },
  heavy: {
    label: "Heavy",
    hex: HEX.warning,
    chip: "bg-warning-container text-warning",
  },
  severe: {
    label: "Severe",
    hex: HEX.error,
    chip: "bg-error-container text-on-error-container",
  },
};

/** Grey is the honest colour for an edge with too few samples to band. */
export const UNBANDED = {
  label: "Too few samples",
  hex: HEX.outlineVariant,
  chip: "bg-surface-container text-on-surface-variant",
};

export function band(name: string | null | undefined) {
  return name ? (BAND[name as CongestionBand] ?? UNBANDED) : UNBANDED;
}

// ---------------------------------------------------------------------
// LINK CONFIDENCE
//
// Spec §6.5: the UI must never visually imply that an inferred or
// unobserved segment is a confirmed observation. Three encodings,
// matching the design's "Route Confidence" legend.
// ---------------------------------------------------------------------

export type LinkKind = "certain" | "inferred" | "unobserved";

export const LINK: Record<
  LinkKind,
  {
    label: string;
    hex: string;
    weight: number;
    opacity: number;
    dashArray?: string;
  }
> = {
  certain: {
    label: "High confidence match",
    hex: HEX.primary,
    weight: 4,
    opacity: 0.9,
  },
  inferred: {
    label: "Lower confidence (fuzzy)",
    hex: HEX.primaryContainer,
    weight: 2,
    opacity: 0.55,
  },
  unobserved: {
    label: "Missing observation / detour",
    hex: HEX.error,
    weight: 2.5,
    opacity: 0.85,
    dashArray: "6 7",
  },
};

/**
 * Classifies a trajectory hop.
 *
 * A hop the road graph could not explain, or one that took far longer
 * than the edge normally does, is drawn as unobserved — the vehicle
 * plausibly went somewhere the system did not see. A weak link score
 * is merely inferred. Everything else is certain.
 */
export function linkKind(properties: {
  link_confidence: number | null;
  geometry_source?: "road" | "straight_line";
  detour_suspected?: boolean | null;
  skipped_cameras?: string[];
}): LinkKind {
  if (
    properties.detour_suspected === true ||
    properties.geometry_source === "straight_line" ||
    (properties.skipped_cameras?.length ?? 0) > 0
  ) {
    return "unobserved";
  }

  const confidence = properties.link_confidence;

  if (confidence !== null && confidence < 0.75) {
    return "inferred";
  }

  return "certain";
}

// ---------------------------------------------------------------------
// FORMATTING
// ---------------------------------------------------------------------

/** The design labels camera bearings by compass direction, not degrees. */
export function compassLabel(degrees: number | null): string | null {
  if (degrees === null || Number.isNaN(degrees)) return null;

  const points = [
    "Northbound",
    "Northeastbound",
    "Eastbound",
    "Southeastbound",
    "Southbound",
    "Southwestbound",
    "Westbound",
    "Northwestbound",
  ];

  return points[Math.round(((degrees % 360) + 360) % 360 / 45) % 8];
}

/** "4s ago", "2m ago", "3h ago" — the design's own density. */
export function agoLabel(timestamp: string | null): string {
  if (!timestamp) return "never";

  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return "never";

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return `${Math.round(seconds / 3600)}h ago`;
}

export function clockTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
}

export function clockSeconds(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
}

export function percent(value: number | null): string {
  return value === null || value === undefined
    ? "—"
    : `${Math.round(value * 100)}%`;
}

export function duration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

export function distance(metres: number | null): string {
  if (metres === null || metres === undefined) return "—";
  return metres < 1000
    ? `${Math.round(metres)} m`
    : `${(metres / 1000).toFixed(1)} km`;
}
