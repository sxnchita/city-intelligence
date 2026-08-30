import type {
  CameraCollection,
  TrajectoryCollection,
  TrafficCollection,
} from "../services/mapApi";

import { ALL_CAMERAS, lastSeenAt } from "./cameras";

// =============================================
// CAMERAS — built from shared registry
// =============================================

export const mockCameraGeoJson: CameraCollection = {
  type: "FeatureCollection",
  features: ALL_CAMERAS.map((cam) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: cam.coordinates,
    },
    properties: {
      camera_id:    cam.id,
      name:         cam.name,
      heading:      cam.heading,
      zone:         cam.zone,
      last_seen_at: lastSeenAt(cam.minutesOffline),
    },
  })),
};

// =============================================
// VEHICLE TRAJECTORIES
// Three vehicles using different camera routes.
// All sightings + hops are merged into one
// FeatureCollection so a single map layer shows
// every active vehicle's journey at once.
// =============================================

export const mockTrajectoryGeoJson: TrajectoryCollection = {
  type: "FeatureCollection",
  features: [

    // ─────────────────────────────────────────
    // VEHICLE V123  (West → Central)
    // Route: Karol Bagh → Chandni Chowk →
    //        Connaught Place → India Gate → ITO
    // ─────────────────────────────────────────

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.1909, 28.6519] },
      properties: { feature_type: "sighting", camera_id: "C03",
        timestamp: "2026-08-30T16:10:00Z", confidence: 0.97, sequence: 1 } },

    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.1909, 28.6519], [77.2020, 28.6530],
        [77.2140, 28.6515], [77.2311, 28.6506],
      ]},
      properties: { feature_type: "hop",
        from_camera_id: "C03", to_camera_id: "C20",
        link_confidence: 0.91, skipped_cameras: [], detour_suspected: false, sequence: 2 } },

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2311, 28.6506] },
      properties: { feature_type: "sighting", camera_id: "C20",
        timestamp: "2026-08-30T16:19:00Z", confidence: 0.94, sequence: 3 } },

    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.2311, 28.6506], [77.2255, 28.6430],
        [77.2190, 28.6390], [77.2167, 28.6315],
      ]},
      properties: { feature_type: "hop",
        from_camera_id: "C20", to_camera_id: "C01",
        link_confidence: 0.88, skipped_cameras: [], detour_suspected: false, sequence: 4 } },

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2167, 28.6315] },
      properties: { feature_type: "sighting", camera_id: "C01",
        timestamp: "2026-08-30T16:26:00Z", confidence: 0.95, sequence: 5 } },

    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.2167, 28.6315], [77.2215, 28.6250],
        [77.2255, 28.6200], [77.2295, 28.6129],
      ]},
      properties: { feature_type: "hop",
        from_camera_id: "C01", to_camera_id: "C02",
        link_confidence: 0.68, skipped_cameras: ["C05"], detour_suspected: false, sequence: 6 } },

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2295, 28.6129] },
      properties: { feature_type: "sighting", camera_id: "C02",
        timestamp: "2026-08-30T16:36:00Z", confidence: 0.91, sequence: 7 } },

    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.2295, 28.6129], [77.2360, 28.6165],
        [77.2450, 28.6215], [77.2410, 28.6280],
      ]},
      properties: { feature_type: "hop",
        from_camera_id: "C02", to_camera_id: "C04",
        link_confidence: 0.82, skipped_cameras: [], detour_suspected: true, sequence: 8 } },

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2410, 28.6280] },
      properties: { feature_type: "sighting", camera_id: "C04",
        timestamp: "2026-08-30T16:47:00Z", confidence: 0.96, sequence: 9 } },

    // ─────────────────────────────────────────
    // VEHICLE V456  (East corridor)
    // Route: Shahdara → Preet Vihar →
    //        Laxmi Nagar → ITO → Rajiv Chowk
    // ─────────────────────────────────────────

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2906, 28.6667] },
      properties: { feature_type: "sighting", camera_id: "C14",
        timestamp: "2026-08-30T15:55:00Z", confidence: 0.93, sequence: 1 } },

    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.2906, 28.6667], [77.2960, 28.6600],
        [77.2967, 28.6456],
      ]},
      properties: { feature_type: "hop",
        from_camera_id: "C14", to_camera_id: "C16",
        link_confidence: 0.89, skipped_cameras: [], detour_suspected: false, sequence: 2 } },

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2967, 28.6456] },
      properties: { feature_type: "sighting", camera_id: "C16",
        timestamp: "2026-08-30T16:03:00Z", confidence: 0.90, sequence: 3 } },

    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.2967, 28.6456], [77.2900, 28.6400],
        [77.2764, 28.6328],
      ]},
      properties: { feature_type: "hop",
        from_camera_id: "C16", to_camera_id: "C15",
        link_confidence: 0.85, skipped_cameras: [], detour_suspected: false, sequence: 4 } },

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2764, 28.6328] },
      properties: { feature_type: "sighting", camera_id: "C15",
        timestamp: "2026-08-30T16:12:00Z", confidence: 0.87, sequence: 5 } },

    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.2764, 28.6328], [77.2620, 28.6310],
        [77.2510, 28.6295], [77.2410, 28.6280],
      ]},
      properties: { feature_type: "hop",
        from_camera_id: "C15", to_camera_id: "C04",
        link_confidence: 0.92, skipped_cameras: [], detour_suspected: false, sequence: 6 } },

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2410, 28.6280] },
      properties: { feature_type: "sighting", camera_id: "C04",
        timestamp: "2026-08-30T16:22:00Z", confidence: 0.94, sequence: 7 } },

    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.2410, 28.6280], [77.2340, 28.6310],
        [77.2250, 28.6320], [77.2190, 28.6328],
      ]},
      properties: { feature_type: "hop",
        from_camera_id: "C04", to_camera_id: "C05",
        link_confidence: 0.88, skipped_cameras: [], detour_suspected: false, sequence: 8 } },

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2190, 28.6328] },
      properties: { feature_type: "sighting", camera_id: "C05",
        timestamp: "2026-08-30T16:31:00Z", confidence: 0.91, sequence: 9 } },

    // ─────────────────────────────────────────
    // VEHICLE V789  (South → Central)
    // Route: Saket → Lajpat Nagar →
    //        India Gate → ITO → Red Fort
    // ─────────────────────────────────────────

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2108, 28.5264] },
      properties: { feature_type: "sighting", camera_id: "C08",
        timestamp: "2026-08-30T15:40:00Z", confidence: 0.88, sequence: 1 } },

    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.2108, 28.5264], [77.2250, 28.5430],
        [77.2380, 28.5560], [77.2438, 28.5672],
      ]},
      properties: { feature_type: "hop",
        from_camera_id: "C08", to_camera_id: "C06",
        link_confidence: 0.84, skipped_cameras: [], detour_suspected: false, sequence: 2 } },

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2438, 28.5672] },
      properties: { feature_type: "sighting", camera_id: "C06",
        timestamp: "2026-08-30T15:52:00Z", confidence: 0.92, sequence: 3 } },

    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.2438, 28.5672], [77.2390, 28.5820],
        [77.2340, 28.5980], [77.2295, 28.6129],
      ]},
      properties: { feature_type: "hop",
        from_camera_id: "C06", to_camera_id: "C02",
        link_confidence: 0.79, skipped_cameras: ["C07"], detour_suspected: false, sequence: 4 } },

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2295, 28.6129] },
      properties: { feature_type: "sighting", camera_id: "C02",
        timestamp: "2026-08-30T16:05:00Z", confidence: 0.96, sequence: 5 } },

    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.2295, 28.6129], [77.2360, 28.6180],
        [77.2410, 28.6280],
      ]},
      properties: { feature_type: "hop",
        from_camera_id: "C02", to_camera_id: "C04",
        link_confidence: 0.91, skipped_cameras: [], detour_suspected: false, sequence: 6 } },

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2410, 28.6280] },
      properties: { feature_type: "sighting", camera_id: "C04",
        timestamp: "2026-08-30T16:13:00Z", confidence: 0.95, sequence: 7 } },

    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.2410, 28.6280], [77.2430, 28.6370],
        [77.2440, 28.6460], [77.2410, 28.6562],
      ]},
      properties: { feature_type: "hop",
        from_camera_id: "C04", to_camera_id: "C22",
        link_confidence: 0.86, skipped_cameras: [], detour_suspected: false, sequence: 8 } },

    { type: "Feature",
      geometry: { type: "Point", coordinates: [77.2410, 28.6562] },
      properties: { feature_type: "sighting", camera_id: "C22",
        timestamp: "2026-08-30T16:21:00Z", confidence: 0.93, sequence: 9 } },

  ],
};

// =============================================
// TRAFFIC ROAD LAYER — 8 segments
// =============================================

export const mockTrafficGeoJson: TrafficCollection = {
  type: "FeatureCollection",
  features: [
    // Normal
    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.186, 28.647], [77.198, 28.642], [77.210, 28.637],
      ]},
      properties: { road_id: "R01", road_name: "Pusa Road",
        weight: 35, normalized: 0.25, congestion_band: "normal", sample_count: 120 } },

    // Normal
    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.083, 28.633], [77.110, 28.635], [77.145, 28.638],
      ]},
      properties: { road_id: "R02", road_name: "Janakpuri–Karol Bagh Link",
        weight: 42, normalized: 0.30, congestion_band: "normal", sample_count: 95 } },

    // Moderate
    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.210, 28.637], [77.219, 28.629], [77.226, 28.623],
      ]},
      properties: { road_id: "R03", road_name: "Central Corridor",
        weight: 65, normalized: 0.55, congestion_band: "moderate", sample_count: 175 } },

    // Moderate
    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.231, 28.651], [77.238, 28.643], [77.241, 28.634],
      ]},
      properties: { road_id: "R04", road_name: "Old Delhi–ITO Connector",
        weight: 70, normalized: 0.58, congestion_band: "moderate", sample_count: 142 } },

    // Heavy
    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.226, 28.623], [77.234, 28.618], [77.243, 28.614],
      ]},
      properties: { road_id: "R05", road_name: "Ring Connector",
        weight: 95, normalized: 0.78, congestion_band: "heavy", sample_count: 210 } },

    // Heavy
    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.244, 28.567], [77.248, 28.585], [77.244, 28.601],
      ]},
      properties: { road_id: "R06", road_name: "Lajpat–India Gate Stretch",
        weight: 88, normalized: 0.72, congestion_band: "heavy", sample_count: 188 } },

    // Severe
    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.243, 28.614], [77.247, 28.622], [77.241, 28.628],
      ]},
      properties: { road_id: "R07", road_name: "ITO Approach",
        weight: 130, normalized: 0.96, congestion_band: "severe", sample_count: 260 } },

    // Severe (low samples → grey on map)
    { type: "Feature",
      geometry: { type: "LineString", coordinates: [
        [77.200, 28.655], [77.207, 28.650], [77.214, 28.646],
      ]},
      properties: { road_id: "R08", road_name: "Low Sample Road",
        weight: 110, normalized: 0.91, congestion_band: "severe", sample_count: 4 } },
  ],
};

// =============================================
// LIVE VEHICLE ROUTES (for demo animation)
// Each entry is an ordered list of [lng, lat]
// waypoints a vehicle travels through.
// =============================================

export type VehicleRoute = {
  vehicleId: string;
  cameraIds: string[];
  waypoints: [number, number][];
};

export const DEMO_VEHICLE_ROUTES: VehicleRoute[] = [
  {
    vehicleId: "V123",
    cameraIds: ["C03", "C20", "C01", "C02", "C04"],
    waypoints: [
      [77.1909, 28.6519], // C03 Karol Bagh
      [77.2311, 28.6506], // C20 Chandni Chowk
      [77.2167, 28.6315], // C01 CP
      [77.2295, 28.6129], // C02 India Gate
      [77.2410, 28.6280], // C04 ITO
    ],
  },
  {
    vehicleId: "V456",
    cameraIds: ["C14", "C16", "C15", "C04", "C05"],
    waypoints: [
      [77.2906, 28.6667], // C14 Shahdara
      [77.2967, 28.6456], // C16 Preet Vihar
      [77.2764, 28.6328], // C15 Laxmi Nagar
      [77.2410, 28.6280], // C04 ITO
      [77.2190, 28.6328], // C05 Rajiv Chowk
    ],
  },
  {
    vehicleId: "V789",
    cameraIds: ["C08", "C06", "C02", "C04", "C22"],
    waypoints: [
      [77.2108, 28.5264], // C08 Saket
      [77.2438, 28.5672], // C06 Lajpat Nagar
      [77.2295, 28.6129], // C02 India Gate
      [77.2410, 28.6280], // C04 ITO
      [77.2410, 28.6562], // C22 Red Fort
    ],
  },
];