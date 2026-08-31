const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "";

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
  geometry: TGeometry;
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
// =====================================

export type CameraProperties = {
  camera_id: string;
  name: string;
  heading: number;
  zone: string;
  last_seen_at: string;
};

export type CameraFeature =
  GeoJSONFeature<
    GeoJSONPointGeometry,
    CameraProperties
  >;

export type CameraCollection =
  GeoJSONFeatureCollection<CameraFeature>;

// =====================================
// TRAJECTORY TYPES
// =====================================

export type TrajectoryPointProperties = {
  feature_type: "sighting";

  camera_id: string;
  timestamp: string;

  confidence?: number;
  sequence?: number;
};

export type TrajectoryLineProperties = {
  feature_type: "hop";

  from_camera_id?: string;
  to_camera_id?: string;

  link_confidence: number;

  skipped_cameras: string[];

  detour_suspected: boolean;

  sequence?: number;
};

export type TrajectoryPointFeature =
  GeoJSONFeature<
    GeoJSONPointGeometry,
    TrajectoryPointProperties
  >;

export type TrajectoryLineFeature =
  GeoJSONFeature<
    GeoJSONLineStringGeometry,
    TrajectoryLineProperties
  >;

export type TrajectoryFeature =
  | TrajectoryPointFeature
  | TrajectoryLineFeature;

export type TrajectoryCollection =
  GeoJSONFeatureCollection<TrajectoryFeature>;

// =====================================
// TRAFFIC / HEATMAP TYPES
// =====================================

export type CongestionBand =
  | "normal"
  | "moderate"
  | "heavy"
  | "severe";

export type TrafficProperties = {
  road_id?: string;
  road_name?: string;

  weight: number;

  normalized: number;

  congestion_band: CongestionBand;

  sample_count: number;
};

export type TrafficFeature =
  GeoJSONFeature<
    GeoJSONLineStringGeometry,
    TrafficProperties
  >;

export type TrafficCollection =
  GeoJSONFeatureCollection<TrafficFeature>;

// =====================================
// CAMERAS
// GET /api/v1/cameras
// =====================================

export async function getCameras(): Promise<CameraCollection> {
  const response = await fetch(
    `${API_BASE_URL}/api/cameras`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch cameras: ${response.status}`
    );
  }

  return response.json();
}

// =====================================
// VEHICLE TRAJECTORY
// GET /api/v1/vehicles/{id}/trajectory
// =====================================

export async function getVehicleTrajectory(
  vehicleId: string,
  from?: string,
  to?: string
): Promise<TrajectoryCollection> {
  const params =
    new URLSearchParams();

  if (from) {
    params.set("from", from);
  }

  if (to) {
    params.set("to", to);
  }

  const query =
    params.toString()
      ? `?${params.toString()}`
      : "";

  const response = await fetch(
    `${API_BASE_URL}/api/v1/vehicles/${encodeURIComponent(
      vehicleId
    )}/trajectory${query}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch trajectory: ${response.status}`
    );
  }

  return response.json();
}

// =====================================
// TRAFFIC HEATMAP
// GET /api/v1/analytics/heatmap
// =====================================

export async function getTrafficHeatmap(
  from: string,
  to: string
): Promise<TrafficCollection> {
  const params =
    new URLSearchParams();

  params.set("from", from);
  params.set("to", to);

  const response = await fetch(
    `${API_BASE_URL}/api/analytics/heatmap?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch traffic heatmap: ${response.status}`
    );
  }

  return response.json();
}