import { getJson } from "./http";

// =====================================
// GEOJSON TYPES
// =====================================

export type Position = [number, number];

export type GeoJSONPointGeometry = {
  type: "Point";
  coordinates: Position;
};

export type GeoJSONLineStringGeometry = {
  type: "LineString";
  coordinates: Position[];
};

export type GeoJSONFeature<
  TGeometry,
  TProperties
> = {
  type: "Feature";

  // Null when a record has no coordinates —
  // camera/GeoJsonFeatureCollection.java emits
  // a feature with null geometry rather than
  // dropping the row.
  geometry: TGeometry | null;

  properties: TProperties;
};

export type GeoJSONFeatureCollection<
  TFeature
> = {
  type: "FeatureCollection";
  features: TFeature[];
};

// =====================================
// CAMERA TYPES
// GET /api/cameras
// =====================================

export type CameraProperties = {
  camera_id: string;
  name: string;
  heading_degrees: number;
  zone: string;
  is_provisional: boolean;
  is_active: boolean;
  last_event_at: string | null;
};

export type CameraFeature =
  GeoJSONFeature<
    GeoJSONPointGeometry,
    CameraProperties
  >;

/**
 * The camera response carries the map's own
 * framing, which is what makes the frontend
 * city-agnostic: never hardcode a centre.
 *
 * bbox and center are [] and suggested_zoom is
 * 2 when no camera has coordinates.
 */
export type CameraCollection =
  GeoJSONFeatureCollection<CameraFeature> & {
    camera_set: string;
    bbox: number[];
    center: number[];
    suggested_zoom: number;
  };

// =====================================
// TRAJECTORY TYPES
// GET /api/vehicles/{id}/trajectory
// =====================================

export type TrajectorySightingProperties = {
  kind: "sighting";

  sequence: number;
  observation_id: number;

  camera_id: string;
  camera_name: string | null;
  zone: string | null;

  timestamp: string;
  dwell_ms: number | null;

  plate_read: string | null;
  plate_confidence: number | null;

  vehicle_type: string | null;
  vehicle_colour: string | null;
  snapshot_url: string | null;
};

export type TrajectoryHopProperties = {
  kind: "hop";

  sequence: number;

  from_camera_id: string | null;
  to_camera_id: string;

  link_confidence: number | null;
  score_breakdown: unknown;

  duration_s: number | null;
  typical_s: number | null;
  distance_m: number | null;

  /**
   * Always true: the road between two cameras is
   * never observed, only its endpoints.
   */
  inferred: boolean;

  /**
   * "road" when the backend has real road
   * geometry for this edge, "straight_line" when
   * it is drawing the honest fallback.
   */
  geometry_source: "road" | "straight_line";

  skipped_cameras: string[];

  /** Null when typical_s is unknown. */
  detour_suspected: boolean | null;
};

export type TrajectoryPointFeature =
  GeoJSONFeature<
    GeoJSONPointGeometry,
    TrajectorySightingProperties
  >;

export type TrajectoryLineFeature =
  GeoJSONFeature<
    GeoJSONLineStringGeometry,
    TrajectoryHopProperties
  >;

export type TrajectoryFeature =
  | TrajectoryPointFeature
  | TrajectoryLineFeature;

export type TrajectoryCollection =
  GeoJSONFeatureCollection<TrajectoryFeature>;

/**
 * Summary fields sit flat at the root, with the
 * features nested under `geojson` — the response
 * is not itself a FeatureCollection.
 */
export type TrajectoryResponse = {
  vehicle_id: number;
  canonical_plate: string | null;
  status: string;

  sighting_count: number;

  first_seen_at: string | null;
  last_seen_at: string | null;

  min_link_confidence: number | null;
  mean_link_confidence: number | null;

  total_distance_m: number | null;
  total_duration_s: number | null;

  geojson: TrajectoryCollection;
};

// =====================================
// TRAFFIC / HEATMAP TYPES
// GET /api/analytics/heatmap
// =====================================

/** Null when the sample was too thin to band. */
export type CongestionBand =
  | "free"
  | "moderate"
  | "heavy"
  | "severe";

export type TrafficProperties = {
  edge_id: number;

  from_camera_id: string;
  to_camera_id: string;

  weight: number;

  /** 0–1 against the busiest edge in this response. */
  normalized: number;

  median_duration_s: number | null;
  free_flow_s: number | null;

  congestion_ratio: number | null;
  congestion_band: CongestionBand | null;

  sample_count: number;
};

export type TrafficFeature =
  GeoJSONFeature<
    GeoJSONLineStringGeometry,
    TrafficProperties
  >;

export type TrafficCollection =
  GeoJSONFeatureCollection<TrafficFeature> & {
    as_of: string;
    from: string;
    to: string;
    bucket_minutes: number;
    max_weight: number;
    edge_count: number;
  };

// =====================================
// CALLS
// =====================================

export function getCameras(
  signal?: AbortSignal
): Promise<CameraCollection> {
  return getJson<CameraCollection>(
    "/api/cameras",
    undefined,
    signal
  );
}

/** Vehicle ids are numeric — a non-numeric id is a 400. */
export function getVehicleTrajectory(
  vehicleId: number,
  from?: string,
  to?: string,
  signal?: AbortSignal
): Promise<TrajectoryResponse> {
  return getJson<TrajectoryResponse>(
    `/api/vehicles/${vehicleId}/trajectory`,
    { from, to },
    signal
  );
}

export function getTrafficHeatmap(
  from?: string,
  to?: string,
  signal?: AbortSignal
): Promise<TrafficCollection> {
  return getJson<TrafficCollection>(
    "/api/analytics/heatmap",
    { from, to },
    signal
  );
}
