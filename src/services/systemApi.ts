import { getJson } from "./http";

// =====================================
// SYSTEM HEALTH
// GET /api/health/system
//
// Answers "is anything actually
// arriving?" — from
// common/SystemHealthResponse.java.
// =====================================

export type SystemHealth = {
  camera_count: number;
  active_camera_count: number;

  observation_count: number;
  last_ingest_at: string | null;

  reject_count: number;

  /**
   * Failures that were caught and swallowed,
   * by name. A climbing counter here means
   * work is being lost silently, so it is
   * worth surfacing even when everything
   * looks fine.
   */
  failures: Record<string, number>;
};

export function getSystemHealth(
  signal?: AbortSignal
): Promise<SystemHealth> {
  return getJson<SystemHealth>(
    "/api/health/system",
    undefined,
    signal
  );
}

// =====================================
// STREAM STATUS
// GET /api/stream/status
// =====================================

export type StreamStatus = {
  open_connections: number;
  events_pushed: number;

  /** Events older than the 60 s live window. */
  suppressed_as_historic: number;

  rejected_connections: number;
  muted: boolean;
};

export function getStreamStatus(
  signal?: AbortSignal
): Promise<StreamStatus> {
  return getJson<StreamStatus>(
    "/api/stream/status",
    undefined,
    signal
  );
}
