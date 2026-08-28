const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

export type CameraStatus =
  | "online"
  | "offline"
  | "degraded";

export type Camera = {
  camera_id: string;
  name: string;
  latitude: number;
  longitude: number;
  road_id?: string;
  road_name?: string;
  direction?: string;
  status: CameraStatus;
};

export type TrajectorySegmentType =
  | "confirmed"
  | "inferred"
  | "gap";

export type TrajectorySegment = {
  segment_id: string;
  from_camera_id: string;
  to_camera_id: string;
  type: TrajectorySegmentType;
  confidence: number;

  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

export type TrajectoryObservation = {
  observation_id: string;
  camera_id: string;
  timestamp: string;

  latitude: number;
  longitude: number;

  confidence: number;
};

export type TrajectoryResponse = {
  vehicle_id: string;
  plate: string;

  observations: TrajectoryObservation[];

  segments: TrajectorySegment[];
};

export type HeatmapFeature = {
  type: "Feature";

  geometry: {
    type: "Point";
    coordinates: [number, number];
  };

  properties: {
    density: number;
    vehicle_count?: number;
  };
};

export type HeatmapResponse = {
  type: "FeatureCollection";
  features: HeatmapFeature[];
};

// ---------------------------------
// CAMERAS
// ---------------------------------

export async function getCameras(): Promise<Camera[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/cameras`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch cameras: ${response.status}`
    );
  }

  const data = await response.json();

  return data.cameras;
}

// ---------------------------------
// TRAJECTORY
// ---------------------------------

export async function getTrajectory(
  plate: string,
  from?: string,
  to?: string
): Promise<TrajectoryResponse> {
  const params = new URLSearchParams();

  params.set("plate", plate);

  if (from) {
    params.set("from", from);
  }

  if (to) {
    params.set("to", to);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/trajectory?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch trajectory: ${response.status}`
    );
  }

  return response.json();
}

// ---------------------------------
// HEATMAP
// ---------------------------------

export async function getHeatmap(
  from?: string,
  to?: string
): Promise<HeatmapResponse> {
  const params = new URLSearchParams();

  if (from) {
    params.set("from", from);
  }

  if (to) {
    params.set("to", to);
  }

  const query =
    params.toString().length > 0
      ? `?${params.toString()}`
      : "";

  const response = await fetch(
    `${API_BASE_URL}/api/analytics/heatmap${query}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch heatmap: ${response.status}`
    );
  }

  return response.json();
}