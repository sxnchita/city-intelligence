import { getJson } from "./http";
import type { CongestionBand } from "./mapApi";

// =====================================
// SUMMARY
// GET /api/analytics/summary
// =====================================

export type BusiestCamera = {
  camera_id: string;
  camera_name: string | null;
  observation_count: number;
};

export type WorstEdge = {
  edge_id: number;
  from_camera_id: string;
  to_camera_id: string;
  congestion_ratio: number | null;
  congestion_band: CongestionBand | null;
  sample_count: number;
};

export type SummaryResponse = {
  from: string;
  to: string;

  total_observations: number;
  unique_vehicles: number;
  active_cameras_reporting: number;

  alerts_by_severity: Record<string, number>;

  busiest_camera: BusiestCamera | null;
  worst_congested_edge: WorstEdge | null;

  mean_congestion_ratio: number | null;
};

// =====================================
// CONGESTION
// GET /api/analytics/congestion
// =====================================

export type CongestionRow = {
  edge_id: number;

  from_camera_id: string;
  from_camera_name: string | null;
  to_camera_id: string;
  to_camera_name: string | null;

  median_duration_s: number | null;
  p85_duration_s: number | null;
  free_flow_s: number | null;

  congestion_ratio: number | null;
  congestion_band: CongestionBand | null;

  sample_count: number;
};

export type CongestionResponse = {
  from: string;
  to: string;
  min_samples: number;

  /** Edges too thinly sampled to rank — reported, not hidden. */
  excluded_low_sample_edges: number;

  rows: CongestionRow[];
};

// =====================================
// DENSITY
// GET /api/analytics/density
// =====================================

export type DensityPoint = {
  bucket_start: string;
  observation_count: number;
  unique_vehicle_count: number;
  mean_dwell_ms: number | null;
};

export type DensitySeries = {
  /** Null on the synthetic city-wide series. */
  camera_id: string | null;
  camera_name: string | null;
  zone: string | null;
  points: DensityPoint[];
};

export type DensityResponse = {
  from: string;
  to: string;
  bucket_minutes: number;
  series: DensitySeries[];
};

// =====================================
// ORIGIN-DESTINATION
// GET /api/analytics/od
// =====================================

export type OdCell = {
  origin: string;
  destination: string;
  count: number;
};

/**
 * Built only from vehicles seen at two or more
 * cameras. The backend ships this denominator
 * deliberately — always render it.
 */
export type OdCoverage = {
  vehicles_with_both_ends: number;
  vehicles_observed: number;
  coverage_fraction: number | null;
  note: string;
};

export type OdResponse = {
  from: string;
  to: string;
  zones: string[];
  matrix: OdCell[];
  coverage: OdCoverage;
};

// =====================================
// CALLS
//
// Omitting from/to is the live path: the
// backend defaults to the last 15 minutes.
// =====================================

export function getSummary(
  from?: string,
  to?: string,
  signal?: AbortSignal
): Promise<SummaryResponse> {
  return getJson<SummaryResponse>(
    "/api/analytics/summary",
    { from, to },
    signal
  );
}

export function getCongestion(
  from?: string,
  to?: string,
  limit?: number,
  signal?: AbortSignal
): Promise<CongestionResponse> {
  return getJson<CongestionResponse>(
    "/api/analytics/congestion",
    { from, to, limit },
    signal
  );
}

/**
 * There is no bucket-size parameter: the backend
 * buckets at analytics.density-bucket-minutes and
 * AnalyticsController accepts only from, to and
 * camera_id. Sending one is silently ignored, so
 * callers that want a coarser series must fold the
 * points themselves.
 */
export function getDensity(
  from?: string,
  to?: string,
  cameraId?: string,
  signal?: AbortSignal
): Promise<DensityResponse> {
  return getJson<DensityResponse>(
    "/api/analytics/density",
    {
      from,
      to,
      camera_id: cameraId,
    },
    signal
  );
}

export function getOd(
  from?: string,
  to?: string,
  signal?: AbortSignal
): Promise<OdResponse> {
  return getJson<OdResponse>(
    "/api/analytics/od",
    { from, to },
    signal
  );
}
