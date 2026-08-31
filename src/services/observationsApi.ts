import { getJson } from "./http";

// =====================================
// RECENT SIGHTINGS
// GET /api/events/recent
//
// The 512-number embedding is omitted by
// the backend on this route.
// =====================================

export type RecentObservation = {
  id: number;
  event_id: string;

  camera_id: string;
  tracklet_id: string;

  first_seen_at: string;
  last_seen_at: string;
  dwell_ms: number | null;

  plate_text: string | null;
  plate_canonical: string | null;
  plate_confidence: number | null;

  vehicle_type: string | null;
  vehicle_colour: string | null;

  snapshot_url: string | null;
  received_at: string;
};

export function getRecentObservations(
  limit = 10,
  cameraId?: string,
  signal?: AbortSignal
): Promise<RecentObservation[]> {
  return getJson<RecentObservation[]>(
    "/api/events/recent",
    { limit, camera_id: cameraId },
    signal
  );
}
