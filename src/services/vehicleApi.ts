import { getJson } from "./http";
import type { TrajectoryResponse } from "./mapApi";

// =====================================
// PLATE SEARCH
// GET /api/vehicles/search?plate=
// =====================================

export type MatchType =
  | "exact"
  | "skeleton"
  | "fuzzy";

export type VehicleSearchResult = {
  vehicle_id: number;
  canonical_plate: string | null;

  match_type: MatchType;
  match_score: number | null;

  sighting_count: number;

  first_seen_at: string | null;
  last_seen_at: string | null;

  first_camera_id: string | null;
  last_camera_id: string | null;

  status: string;
};

export type AlternateMatch = {
  vehicle_id: number;
  canonical_plate: string | null;
  match_type: MatchType;
  sighting_count: number;
  last_seen_at: string | null;
};

/**
 * No match is a 200 with `trajectory: null` —
 * "no vehicle carries that plate" is a search
 * result, not an error.
 */
export type PlateTrajectoryResponse = {
  query: string;
  matched_plate: string | null;
  match_type: MatchType | null;
  trajectory: TrajectoryResponse | null;
  alternate_matches: AlternateMatch[];
};

/** `plate` is required — omitting it is a 400. */
export function searchVehicles(
  plate: string,
  from?: string,
  to?: string,
  limit?: number,
  signal?: AbortSignal
): Promise<VehicleSearchResult[]> {
  return getJson<VehicleSearchResult[]>(
    "/api/vehicles/search",
    { plate, from, to, limit },
    signal
  );
}

export function getTrajectoryByPlate(
  plate: string,
  from?: string,
  to?: string,
  signal?: AbortSignal
): Promise<PlateTrajectoryResponse> {
  return getJson<PlateTrajectoryResponse>(
    "/api/trajectory",
    { plate, from, to },
    signal
  );
}
