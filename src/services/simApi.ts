import { getJson, postJson } from "./http";

// =====================================
// SIMULATOR CONTROL
// /api/sim/**  —  `sim` profile only
//
// A production build does not have these
// beans, so every route below 404s. The
// Demo Control panel probes /status once
// and hides itself on failure rather
// than offering buttons that cannot work.
// =====================================

export type SimStatus = {
  running: boolean;

  vehicles_spawned: number;
  events_sent: number;
  events_rejected: number;

  started_at: string | null;
  uptime_seconds: number;

  vehicles_per_minute: number;
  ocr_error_rate: number;
  null_plate_rate: number;
  embedding_noise_sigma: number;
  congestion_factor: number;

  scenario_vehicles_pending: number;
  ingest_url: string;
};

export type SimStartRequest = {
  vehiclesPerMinute?: number;
  /** 0 means run until stopped. */
  durationMinutes?: number;
  ocrErrorRate?: number;
  nullPlateRate?: number;
  embeddingNoiseSigma?: number;
  congestionFactor?: number;
};

export type BackfillRequest = {
  hours?: number;
  vehiclesPerHour?: number;
  ocrErrorRate?: number;
  nullPlateRate?: number;
  embeddingNoiseSigma?: number;
  /**
   * Spreads slowdowns unevenly across edges,
   * so the congestion map gets a range of
   * bands rather than one uniform shift.
   */
  congestionFactor?: number;
};

export type BackfillResponse = {
  status: string;
  hours: number;
  vehicles: number;
  events_sent: number;
  events_rejected: number;
  window_start: string;
  window_end: string;
  elapsed_ms: number;
};

export function getSimStatus(
  signal?: AbortSignal
): Promise<SimStatus> {
  return getJson<SimStatus>(
    "/api/sim/status",
    undefined,
    signal
  );
}

export function startSim(
  request: SimStartRequest = {},
  signal?: AbortSignal
): Promise<SimStatus> {
  return postJson<SimStatus>(
    "/api/sim/start",
    request,
    undefined,
    signal
  );
}

export function stopSim(
  signal?: AbortSignal
): Promise<SimStatus> {
  return postJson<SimStatus>(
    "/api/sim/stop",
    undefined,
    undefined,
    signal
  );
}

/** Blocks until the whole block of history has been posted. */
export function backfill(
  request: BackfillRequest = {},
  signal?: AbortSignal
): Promise<BackfillResponse> {
  return postJson<BackfillResponse>(
    "/api/sim/backfill",
    request,
    undefined,
    signal
  );
}

// =====================================
// IDENTITY REBUILD
// POST /api/identity/rebuild
//
// Required after a backfill: the
// simulator posts history from eight
// threads at once, and greedy linking
// only means anything in first_seen_at
// order. Also recomputes the analytics
// aggregates for the range it touched.
// =====================================

export type RebuildResponse = {
  status: string;
  observations_processed: number;
  vehicles_created: number;
  links_made: number;
  unlinked_observations: number;
  elapsed_ms: number;

  analytics_recomputed: {
    from: string;
    to: string;
    density_rows: number;
    edge_rows: number;
    od_rows: number;
    elapsed_ms: number;
  } | null;
};

export function rebuildIdentity(
  signal?: AbortSignal
): Promise<RebuildResponse> {
  return postJson<RebuildResponse>(
    "/api/identity/rebuild",
    undefined,
    undefined,
    signal
  );
}
