import type {
  CameraCollection,
  TrajectoryCollection,
  TrafficCollection,
} from "../services/mapApi";

// =====================================
// CAMERAS
// =====================================

export const mockCameraGeoJson: CameraCollection = {
  type: "FeatureCollection",

  features: [
    {
      type: "Feature",

      geometry: {
        type: "Point",
        coordinates: [77.2167, 28.6315],
      },

      properties: {
        camera_id: "C01",
        name: "Connaught Place",
        heading: 45,
        zone: "Central Delhi",
        last_seen_at: new Date().toISOString(),
      },
    },

    {
      type: "Feature",

      geometry: {
        type: "Point",
        coordinates: [77.2295, 28.6129],
      },

      properties: {
        camera_id: "C02",
        name: "India Gate",
        heading: 120,
        zone: "Central Delhi",
        last_seen_at: new Date(
          Date.now() - 8 * 60 * 1000
        ).toISOString(),
      },
    },

    {
      type: "Feature",

      geometry: {
        type: "Point",
        coordinates: [77.1909, 28.6519],
      },

      properties: {
        camera_id: "C03",
        name: "Karol Bagh",
        heading: 250,
        zone: "West Delhi",
        last_seen_at: new Date(
          Date.now() - 25 * 60 * 1000
        ).toISOString(),
      },
    },

    {
      type: "Feature",

      geometry: {
        type: "Point",
        coordinates: [77.241, 28.628],
      },

      properties: {
        camera_id: "C04",
        name: "ITO",
        heading: 310,
        zone: "Central Delhi",
        last_seen_at: new Date().toISOString(),
      },
    },
  ],
};

// =====================================
// VEHICLE TRAJECTORY
// =====================================

export const mockTrajectoryGeoJson: TrajectoryCollection = {
  type: "FeatureCollection",

  features: [
    // sighting 1
    {
      type: "Feature",

      geometry: {
        type: "Point",
        coordinates: [77.1909, 28.6519],
      },

      properties: {
        feature_type: "sighting",
        camera_id: "C03",
        timestamp: "2026-08-29T16:10:00Z",
        confidence: 0.97,
        sequence: 1,
      },
    },

    // hop 1
    {
      type: "Feature",

      geometry: {
        type: "LineString",
        coordinates: [
          [77.1909, 28.6519],
          [77.1975, 28.647],
          [77.2055, 28.641],
          [77.2167, 28.6315],
        ],
      },

      properties: {
        feature_type: "hop",
        from_camera_id: "C03",
        to_camera_id: "C01",
        link_confidence: 0.94,
        skipped_cameras: [],
        detour_suspected: false,
        sequence: 2,
      },
    },

    // sighting 2
    {
      type: "Feature",

      geometry: {
        type: "Point",
        coordinates: [77.2167, 28.6315],
      },

      properties: {
        feature_type: "sighting",
        camera_id: "C01",
        timestamp: "2026-08-29T16:18:00Z",
        confidence: 0.95,
        sequence: 3,
      },
    },

    // hop 2 - skipped camera
    {
      type: "Feature",

      geometry: {
        type: "LineString",
        coordinates: [
          [77.2167, 28.6315],
          [77.2215, 28.626],
          [77.2255, 28.6205],
          [77.2295, 28.6129],
        ],
      },

      properties: {
        feature_type: "hop",
        from_camera_id: "C01",
        to_camera_id: "C02",
        link_confidence: 0.68,
        skipped_cameras: ["C05"],
        detour_suspected: false,
        sequence: 4,
      },
    },

    // sighting 3
    {
      type: "Feature",

      geometry: {
        type: "Point",
        coordinates: [77.2295, 28.6129],
      },

      properties: {
        feature_type: "sighting",
        camera_id: "C02",
        timestamp: "2026-08-29T16:28:00Z",
        confidence: 0.91,
        sequence: 5,
      },
    },

    // hop 3 - detour suspected
    {
      type: "Feature",

      geometry: {
        type: "LineString",
        coordinates: [
          [77.2295, 28.6129],
          [77.236, 28.6165],
          [77.245, 28.6215],
          [77.241, 28.628],
        ],
      },

      properties: {
        feature_type: "hop",
        from_camera_id: "C02",
        to_camera_id: "C04",
        link_confidence: 0.82,
        skipped_cameras: [],
        detour_suspected: true,
        sequence: 6,
      },
    },

    // sighting 4
    {
      type: "Feature",

      geometry: {
        type: "Point",
        coordinates: [77.241, 28.628],
      },

      properties: {
        feature_type: "sighting",
        camera_id: "C04",
        timestamp: "2026-08-29T16:39:00Z",
        confidence: 0.96,
        sequence: 7,
      },
    },
  ],
};

// =====================================
// TRAFFIC ROAD LAYER
// =====================================

export const mockTrafficGeoJson: TrafficCollection = {
  type: "FeatureCollection",

  features: [
    {
      type: "Feature",

      geometry: {
        type: "LineString",
        coordinates: [
          [77.186, 28.647],
          [77.198, 28.642],
          [77.210, 28.637],
        ],
      },

      properties: {
        road_id: "R01",
        road_name: "Pusa Road",
        weight: 35,
        normalized: 0.25,
        congestion_band: "normal",
        sample_count: 120,
      },
    },

    {
      type: "Feature",

      geometry: {
        type: "LineString",
        coordinates: [
          [77.210, 28.637],
          [77.219, 28.629],
          [77.226, 28.623],
        ],
      },

      properties: {
        road_id: "R02",
        road_name: "Central Corridor",
        weight: 65,
        normalized: 0.55,
        congestion_band: "moderate",
        sample_count: 175,
      },
    },

    {
      type: "Feature",

      geometry: {
        type: "LineString",
        coordinates: [
          [77.226, 28.623],
          [77.234, 28.618],
          [77.243, 28.614],
        ],
      },

      properties: {
        road_id: "R03",
        road_name: "Ring Connector",
        weight: 95,
        normalized: 0.78,
        congestion_band: "heavy",
        sample_count: 210,
      },
    },

    {
      type: "Feature",

      geometry: {
        type: "LineString",
        coordinates: [
          [77.243, 28.614],
          [77.247, 28.622],
          [77.241, 28.628],
        ],
      },

      properties: {
        road_id: "R04",
        road_name: "ITO Approach",
        weight: 130,
        normalized: 0.96,
        congestion_band: "severe",
        sample_count: 260,
      },
    },

    {
      type: "Feature",

      geometry: {
        type: "LineString",
        coordinates: [
          [77.200, 28.655],
          [77.207, 28.650],
          [77.214, 28.646],
        ],
      },

      properties: {
        road_id: "R05",
        road_name: "Low Sample Road",
        weight: 110,
        normalized: 0.91,
        congestion_band: "severe",
        sample_count: 4,
      },
    },
  ],
};