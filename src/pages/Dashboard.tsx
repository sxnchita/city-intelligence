import { Link } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import CityMap from "../components/map/CityMap";
import ConnectionBadge, {
  connectionState,
} from "../components/common/ConnectionBadge";
import DemoControl from "../components/common/DemoControl";
import EmptyState, {
  NO_DATA_HINT,
  OFFLINE_HINT,
} from "../components/common/EmptyState";
import { useApiData } from "../hooks/useApiData";
import { getSummary } from "../services/analyticsApi";
import {
  alertTypeLabel,
  getAlerts,
  type Severity,
} from "../services/alertsApi";
import { getRecentObservations } from "../services/observationsApi";
import { getCameras } from "../services/mapApi";

type DashboardAlert = {
  severity: Severity;
  title: string;
  description: string;
  time: string;
};

type DashboardSighting = {
  vehicle: string;
  camera: string;
  zone: string;
  time: string;
  confidence: string;
};

type DashboardData = {
  activeCameras: number;
  camerasReporting: number;
  /**
   * Sightings, not distinct vehicles: the backend's
   * unique_vehicles is summed over per-camera
   * buckets, so it counts a vehicle once per camera
   * per bucket. Labelled accordingly.
   */
  sightingCount: number;
  activeAlerts: number;
  highAlerts: number;
  /** Congestion ratio of the worst edge, e.g. "2.09x". */
  worstRatio: string;
  worstEdge: string;
  alerts: DashboardAlert[];
  sightings: DashboardSighting[];
};

function clockTime(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
}

function percent(
  value: number | null
): string {
  return value === null
    ? "\u2014"
    : `${Math.round(value * 100)}%`;
}

// What an empty database looks like. Every number is
// a real zero, not a placeholder standing in for one.
const NOTHING_YET: DashboardData = {
  activeCameras: 0,
  camerasReporting: 0,
  sightingCount: 0,
  activeAlerts: 0,
  highAlerts: 0,
  worstRatio: "\u2014",
  worstEdge: "No corridor ranked yet",
  alerts: [],
  sightings: [],
};

// Live mode: the analytics endpoints default to the
// last 15 minutes when called with no range, so a
// poll on that cadence is what "live" means here.
const REFRESH_MS = 15_000;

export default function Dashboard() {
  const {
    data: fetched,
    loading,
    error,
  } = useApiData<DashboardData>(
      async (signal) => {
        const [
          summary,
          alerts,
          recent,
          cameras,
        ] = await Promise.all([
          getSummary(
            undefined,
            undefined,
            signal
          ),
          getAlerts({ limit: 4 }, signal),
          getRecentObservations(
            5,
            undefined,
            signal
          ),
          getCameras(signal),
        ]);

        // /api/events/recent carries camera ids
        // but not names or zones; the camera
        // response is where those live.
        const byId = new Map(
          cameras.features.map((f) => [
            f.properties.camera_id,
            f.properties,
          ])
        );

        const bySeverity =
          summary.alerts_by_severity ?? {};

        const activeAlerts = Object.values(
          bySeverity
        ).reduce((a, b) => a + b, 0);

        const worst =
          summary.worst_congested_edge;

        return {
          activeCameras:
            cameras.features.filter(
              (f) => f.properties.is_active
            ).length,
          camerasReporting:
            summary.active_cameras_reporting,
          sightingCount:
            summary.total_observations,
          activeAlerts,
          highAlerts: bySeverity.high ?? 0,
          // The count of severe corridors was a poor
          // headline: a city with one badly congested
          // corridor and none at "severe" showed a
          // zero. The ratio is the number that
          // actually says how bad the worst one is.
          worstRatio:
            worst?.congestion_ratio != null
              ? `${worst.congestion_ratio.toFixed(2)}\u00d7`
              : "\u2014",
          worstEdge: worst
            ? `${worst.from_camera_id} \u2192 ${worst.to_camera_id} \u00b7 ${
                worst.congestion_band ?? "unbanded"
              }`
            : "No corridor ranked yet",

          alerts: alerts.map((row) => ({
            severity: row.severity,
            title: alertTypeLabel(
              row.alert_type
            ),
            description: row.message,
            time: clockTime(row.occurred_at),
          })),

          sightings: recent.map((row) => {
            const camera = byId.get(
              row.camera_id
            );

            return {
              vehicle:
                row.plate_text ?? "unreadable",
              camera: camera
                ? `${row.camera_id} \u00b7 ${camera.name}`
                : row.camera_id,
              zone: camera?.zone ?? "\u2014",
              time: clockTime(
                row.first_seen_at
              ),
              confidence: percent(
                row.plate_confidence
              ),
            };
          }),
        };
      },
      [],
      { refreshMs: REFRESH_MS }
    );

  // The page renders zeros rather than blanking
  // while the first load is in flight.
  const data = fetched ?? NOTHING_YET;

  const hasData =
    fetched !== null &&
    (fetched.sightingCount > 0 ||
      fetched.activeCameras > 0);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#07111f",
        color: "white",
        display: "flex",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "18px",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "18px",
            marginBottom: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 750,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              Live Operations Dashboard

              <ConnectionBadge
                state={connectionState({
                  loading,
                  error,
                })}
                title={
                  error
                    ? error.message
                    : undefined
                }
              />
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "12px",
                color: "#7f9dbd",
              }}
            >
              City-wide vehicle tracking, traffic intelligence and alerts
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <input
              placeholder="Search vehicle plate..."
              style={{
                width: "280px",
                height: "42px",
                boxSizing: "border-box",
                borderRadius: "10px",
                border:
                  "1px solid rgba(148,163,184,.16)",
                background: "#0c1b2d",
                color: "white",
                padding: "0 14px",
                outline: "none",
                fontSize: "13px",
              }}
            />

            <select
              defaultValue="live"
              style={{
                height: "42px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(148,163,184,.16)",
                background: "#0c1b2d",
                color: "white",
                padding: "0 12px",
                outline: "none",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <option value="live">
                Live · 15 min
              </option>

              <option value="hour">
                Last 1 hour
              </option>

              <option value="today">
                Today
              </option>

              <option value="custom">
                Custom
              </option>
            </select>
          </div>
        </div>

        <DemoControl />

        {/* KPI CARDS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0,1fr))",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <KpiCard
            label="Active Cameras"
            value={String(data.activeCameras)}
            detail={`${data.camerasReporting} reporting`}
          />

          <KpiCard
            label="Vehicle Sightings"
            value={data.sightingCount.toLocaleString()}
            detail="Within last 15 min"
          />

          <KpiCard
            label="Active Alerts"
            value={String(data.activeAlerts)}
            detail={`${data.highAlerts} high priority`}
            accent="#ef4444"
          />

          <KpiCard
            label="Worst Corridor"
            value={data.worstRatio}
            detail={data.worstEdge}
            accent="#f97316"
          />
        </div>

        {/* MAP + ALERTS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 3.25fr) minmax(250px, 1fr)",
            gap: "12px",
            height: "690px",
          }}
        >
          <section
            style={{
              position: "relative",
              minWidth: 0,
              borderRadius: "16px",
              overflow: "hidden",
              border:
                "1px solid rgba(255,255,255,0.07)",
              background: "#0f172a",
              boxShadow:
                "0 12px 35px rgba(0,0,0,.18)",
            }}
          >
            <CityMap />
          </section>

          <aside
            style={{
              background: "#091828",
              border:
                "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              padding: "15px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  Live Alerts
                </div>

                <div
                  style={{
                    marginTop: "3px",
                    fontSize: "10px",
                    color: "#64748b",
                  }}
                >
                  Real-time system events
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 8px",
                  background:
                    "rgba(34,197,94,.08)",
                  borderRadius: "20px",
                  color: "#4ade80",
                  fontSize: "10px",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#22c55e",
                  }}
                />

                SSE
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "9px",
              }}
            >
              {data.alerts.length === 0 ? (
                <EmptyState
                  title={
                    error
                      ? "Alerts unavailable"
                      : "No alerts"
                  }
                  detail={
                    error
                      ? OFFLINE_HINT
                      : hasData
                      ? "Nothing has fired in this window."
                      : NO_DATA_HINT
                  }
                  tone={
                    error ? "error" : "neutral"
                  }
                />
              ) : (
                data.alerts.map(
                (alert, index) => (
                  <AlertCard
                    key={index}
                    severity={alert.severity}
                    title={alert.title}
                    description={
                      alert.description
                    }
                    time={alert.time}
                  />
                )
              ))}
            </div>
          </aside>
        </div>

        {/* RECENT SIGHTINGS */}

        <section
          style={{
            marginTop: "12px",
            background: "#091828",
            border:
              "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "15px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                Recent Vehicle Sightings
              </div>

              <div
                style={{
                  marginTop: "3px",
                  color: "#64748b",
                  fontSize: "10px",
                }}
              >
                Latest ANPR observations
              </div>
            </div>

            <Link
              to="/vehicles"
              style={{
                color: "#38bdf8",
                fontSize: "11px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              View all →
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1.1fr 1.3fr 1fr 1fr .7fr",
              gap: "10px",
              padding: "8px 6px",
              fontSize: "10px",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: ".5px",
            }}
          >
            <div>Vehicle</div>
            <div>Camera</div>
            <div>Zone</div>
            <div>Time</div>
            <div>Confidence</div>
          </div>

          {data.sightings.length === 0 ? (
            <EmptyState
              title={
                error
                  ? "Sightings unavailable"
                  : "No sightings yet"
              }
              detail={
                error ? OFFLINE_HINT : NO_DATA_HINT
              }
              tone={error ? "error" : "neutral"}
            />
          ) : (
            data.sightings.map(
            (sighting, index) => (
              <SightingRow
                key={index}
                vehicle={sighting.vehicle}
                camera={sighting.camera}
                zone={sighting.zone}
                time={sighting.time}
                confidence={
                  sighting.confidence
                }
              />
            )
          ))}
        </section>
      </main>
    </div>
  );
}

// =====================================
// KPI
// =====================================

function KpiCard({
  label,
  value,
  detail,
  accent = "#60a5fa",
}: {
  label: string;
  value: string;
  detail: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#091828",
        border:
          "1px solid rgba(255,255,255,0.07)",
        borderRadius: "13px",
        padding: "14px 16px",
        minHeight: "92px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "#8ba7c5",
          }}
        >
          {label}
        </div>

        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: accent,
          }}
        />
      </div>

      <div
        style={{
          marginTop: "7px",
          fontSize: "23px",
          fontWeight: 750,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "3px",
          fontSize: "10px",
          color: "#64748b",
        }}
      >
        {detail}
      </div>
    </div>
  );
}

// =====================================
// ALERT
// =====================================

function AlertCard({
  severity,
  title,
  description,
  time,
}: {
  severity:
    | "low"
    | "medium"
    | "high";

  title: string;
  description: string;
  time: string;
}) {
  const color =
    severity === "high"
      ? "#ef4444"
      : severity === "medium"
      ? "#f59e0b"
      : "#38bdf8";

  return (
    <div
      style={{
        borderLeft: `3px solid ${color}`,
        background: "#0c1b2d",
        padding: "12px",
        borderRadius: "9px",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 650,
          }}
        >
          {title}
        </div>

        <span
          style={{
            fontSize: "9px",
            color,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {severity}
        </span>
      </div>

      <div
        style={{
          marginTop: "6px",
          fontSize: "11px",
          color: "#8ba7c5",
          lineHeight: 1.45,
        }}
      >
        {description}
      </div>

      <div
        style={{
          marginTop: "7px",
          fontSize: "9px",
          color: "#64748b",
        }}
      >
        {time}
      </div>
    </div>
  );
}

// =====================================
// SIGHTING
// =====================================

function SightingRow({
  vehicle,
  camera,
  zone,
  time,
  confidence,
}: {
  vehicle: string;
  camera: string;
  zone: string;
  time: string;
  confidence: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "1.1fr 1.3fr 1fr 1fr .7fr",
        gap: "10px",
        padding: "11px 6px",
        borderTop:
          "1px solid rgba(255,255,255,0.05)",
        fontSize: "11px",
        color: "#a9bdd1",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontWeight: 650,
          color: "#f8fafc",
        }}
      >
        {vehicle}
      </div>

      <div>{camera}</div>
      <div>{zone}</div>
      <div>{time}</div>

      <div
        style={{
          color: "#4ade80",
          fontWeight: 650,
        }}
      >
        {confidence}
      </div>
    </div>
  );
}