// =============================================
// CENTRAL CAMERA REGISTRY — single source of truth
// All 20 ANPR cameras across Delhi / NCR.
// Import this file in mockBackendGeoJson and
// CameraHealth so data is never out of sync.
// =============================================

export type CameraRecord = {
  id: string;
  name: string;
  zone: string;
  coordinates: [number, number]; // [lng, lat] — GeoJSON order
  heading: number;              // compass bearing the lens faces
  minutesOffline: number;       // set at startup; 0 = online
};

// Compute ISO timestamp from minutesOffline
export function lastSeenAt(minutesOffline: number): string {
  return new Date(
    Date.now() - minutesOffline * 60 * 1000
  ).toISOString();
}

// Derive Leaflet-friendly status
export function cameraStatus(
  minutesOffline: number
): "online" | "delayed" | "silent" {
  if (minutesOffline <= 5)  return "online";
  if (minutesOffline <= 15) return "delayed";
  return "silent";
}

// =============================================
// THE 20 CAMERAS
// =============================================

export const ALL_CAMERAS: CameraRecord[] = [
  // ── Central Delhi ──────────────────────────
  {
    id: "C01",
    name: "Connaught Place",
    zone: "Central Delhi",
    coordinates: [77.2167, 28.6315],
    heading: 45,
    minutesOffline: 0,
  },
  {
    id: "C02",
    name: "India Gate",
    zone: "Central Delhi",
    coordinates: [77.2295, 28.6129],
    heading: 120,
    minutesOffline: 8,
  },
  {
    id: "C04",
    name: "ITO",
    zone: "Central Delhi",
    coordinates: [77.2410, 28.6280],
    heading: 310,
    minutesOffline: 1,
  },
  {
    id: "C05",
    name: "Rajiv Chowk",
    zone: "Central Delhi",
    coordinates: [77.2190, 28.6328],
    heading: 90,
    minutesOffline: 2,
  },
  {
    id: "C20",
    name: "Chandni Chowk",
    zone: "Central Delhi",
    coordinates: [77.2311, 28.6506],
    heading: 315,
    minutesOffline: 4,
  },

  // ── Old Delhi ──────────────────────────────
  {
    id: "C21",
    name: "Kashmere Gate",
    zone: "Old Delhi",
    coordinates: [77.2269, 28.6672],
    heading: 180,
    minutesOffline: 3,
  },
  {
    id: "C22",
    name: "Red Fort",
    zone: "Old Delhi",
    coordinates: [77.2410, 28.6562],
    heading: 270,
    minutesOffline: 0,
  },

  // ── West Delhi ─────────────────────────────
  {
    id: "C03",
    name: "Karol Bagh",
    zone: "West Delhi",
    coordinates: [77.1909, 28.6519],
    heading: 250,
    minutesOffline: 25,
  },
  {
    id: "C13",
    name: "Janakpuri",
    zone: "West Delhi",
    coordinates: [77.0833, 28.6333],
    heading: 45,
    minutesOffline: 6,
  },
  {
    id: "C10",
    name: "Dwarka Mor",
    zone: "West Delhi",
    coordinates: [77.0597, 28.5921],
    heading: 0,
    minutesOffline: 12,
  },

  // ── North Delhi ────────────────────────────
  {
    id: "C11",
    name: "Rohini Sector 7",
    zone: "North Delhi",
    coordinates: [77.1167, 28.7333],
    heading: 180,
    minutesOffline: 0,
  },
  {
    id: "C12",
    name: "Pitampura",
    zone: "North Delhi",
    coordinates: [77.1339, 28.7000],
    heading: 270,
    minutesOffline: 7,
  },

  // ── East Delhi ─────────────────────────────
  {
    id: "C14",
    name: "Shahdara",
    zone: "East Delhi",
    coordinates: [77.2906, 28.6667],
    heading: 225,
    minutesOffline: 0,
  },
  {
    id: "C15",
    name: "Laxmi Nagar",
    zone: "East Delhi",
    coordinates: [77.2764, 28.6328],
    heading: 90,
    minutesOffline: 9,
  },
  {
    id: "C16",
    name: "Preet Vihar",
    zone: "East Delhi",
    coordinates: [77.2967, 28.6456],
    heading: 135,
    minutesOffline: 1,
  },
  {
    id: "C19",
    name: "Mayur Vihar Phase 1",
    zone: "East Delhi",
    coordinates: [77.2997, 28.6074],
    heading: 180,
    minutesOffline: 5,
  },

  // ── South Delhi ────────────────────────────
  {
    id: "C06",
    name: "Lajpat Nagar",
    zone: "South Delhi",
    coordinates: [77.2438, 28.5672],
    heading: 180,
    minutesOffline: 3,
  },
  {
    id: "C07",
    name: "Nehru Place",
    zone: "South Delhi",
    coordinates: [77.2507, 28.5480],
    heading: 270,
    minutesOffline: 0,
  },
  {
    id: "C08",
    name: "Saket",
    zone: "South Delhi",
    coordinates: [77.2108, 28.5264],
    heading: 135,
    minutesOffline: 18,
  },

  // ── South-West Delhi ───────────────────────
  {
    id: "C09",
    name: "Vasant Kunj",
    zone: "South-West Delhi",
    coordinates: [77.1587, 28.5208],
    heading: 90,
    minutesOffline: 2,
  },
];

// Quick lookup by camera ID
export const CAMERA_BY_ID: Record<string, CameraRecord> = Object.fromEntries(
  ALL_CAMERAS.map((c) => [c.id, c])
);

// Unique zone list (for filter dropdowns)
export const CAMERA_ZONES = [
  "all",
  ...Array.from(new Set(ALL_CAMERAS.map((c) => c.zone))).sort(),
] as const;
