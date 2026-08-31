import Sidebar from "../components/layout/Sidebar";
import ConnectionBadge, {
  connectionState,
} from "../components/common/ConnectionBadge";
import EmptyState, {
  NO_DATA_HINT,
  OFFLINE_HINT,
} from "../components/common/EmptyState";
import { useApiData } from "../hooks/useApiData";
import {
  getCongestion,
  getDensity,
  getOd,
  getSummary,
} from "../services/analyticsApi";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsData = {
  totalObservations: number;
  /**
   * Distinct vehicles, from the OD coverage
   * denominator -- the only vehicle-keyed count the
   * analytics API exposes. summary.unique_vehicles
   * is NOT one: it sums per-camera bucket counts and
   * tracks the observation total instead.
   */
  vehiclesTracked: number;
  camerasReporting: number;
  topFlowCount: number;
  topFlowLabel: string;

  /** Observations per bucket, city-wide. */
  volumeSeries: {
    time: string;
    observations: number;
    vehicles: number;
  }[];

  flowSeries: {
    route: string;
    vehicles: number;
  }[];

  corridors: {
    name: string;
    speed: string;
    travelTime: string;
    status: string;
    color: string;
  }[];

  coverageFraction: number | null;
  coverageNote: string;
  coverageObserved: number;
  coverageUsable: number;
};

const BAND_COLOR: Record<string, string> = {
  free: "#22c55e",
  moderate: "#eab308",
  heavy: "#f97316",
  severe: "#ef4444",
};

const BAND_LABEL: Record<string, string> = {
  free: "Free flowing",
  moderate: "Moderate",
  heavy: "Heavy",
  severe: "Severe",
};

function bucketLabel(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
}

/**
 * Corridor speed is derived, not measured: the
 * backend reports distance and median duration
 * per edge, and speed follows from those.
 */
function kmh(
  distanceM: number | null,
  durationS: number | null
): string {
  if (!distanceM || !durationS) {
    return "\u2014";
  }

  return `${Math.round(
    (distanceM / durationS) * 3.6
  )} km/h`;
}

function minutes(
  durationS: number | null
): string {
  return durationS === null
    ? "\u2014"
    : `${Math.round(durationS / 60)} min`;
}

const NOTHING_YET: AnalyticsData = {
  totalObservations: 0,
  vehiclesTracked: 0,
  camerasReporting: 0,
  topFlowCount: 0,
  topFlowLabel: "\u2014",
  volumeSeries: [],
  flowSeries: [],
  corridors: [],
  coverageFraction: null,
  coverageNote: "",
  coverageObserved: 0,
  coverageUsable: 0,
};

/**
 * The density endpoint buckets at
 * analytics.density-bucket-minutes, which is 5.
 * Over a 24-hour window that is 288 points, which
 * is unreadable as a trend line, so they are
 * folded into hours here. There is no server-side
 * bucket size to ask for: AnalyticsController only
 * accepts from, to and camera_id.
 */
function toHourlyBuckets(
  points: {
    bucket_start: string;
    observation_count: number;
    unique_vehicle_count: number;
  }[]
): {
  time: string;
  observations: number;
  vehicles: number;
}[] {
  const hours = new Map<
    number,
    { observations: number; vehicles: number }
  >();

  for (const point of points) {
    const at = new Date(point.bucket_start);

    if (Number.isNaN(at.getTime())) {
      continue;
    }

    at.setMinutes(0, 0, 0);

    const key = at.getTime();

    const bucket = hours.get(key) ?? {
      observations: 0,
      vehicles: 0,
    };

    bucket.observations +=
      point.observation_count;

    // Unique vehicles do not sum across buckets --
    // one vehicle seen in three of them is one
    // vehicle. The hourly figure is therefore an
    // upper bound, and the label says "sightings"
    // for the honest number.
    bucket.vehicles +=
      point.unique_vehicle_count;

    hours.set(key, bucket);
  }

  return [...hours.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([key, value]) => ({
      time: bucketLabel(
        new Date(key).toISOString()
      ),
      observations: value.observations,
      vehicles: value.vehicles,
    }));
}

export default function Analytics() {
  const {
    data: fetched,
    loading,
    error,
  } = useApiData<AnalyticsData>(
      async (signal) => {
        // A day-wide window: the 15-minute
        // default is too short to draw a trend.
        const from = new Date(
          Date.now() - 24 * 60 * 60 * 1000
        ).toISOString();
        const to = new Date().toISOString();

        const [
          summary,
          density,
          od,
          congestion,
        ] = await Promise.all([
          getSummary(from, to, signal),
          getDensity(
            from,
            to,
            undefined,
            signal
          ),
          getOd(from, to, signal),
          getCongestion(from, to, 4, signal),
        ]);

        // camera_id is null on the synthetic
        // city-wide series.
        const cityWide =
          density.series.find(
            (series) =>
              series.camera_id === null
          ) ?? density.series[0];

        const flows = [...od.matrix]
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((cell) => ({
            route: `${cell.origin} \u2192 ${cell.destination}`,
            vehicles: cell.count,
          }));

        return {
          totalObservations:
            summary.total_observations,
          vehiclesTracked:
            od.coverage.vehicles_observed,
          camerasReporting:
            summary.active_cameras_reporting,
          topFlowCount:
            flows[0]?.vehicles ?? 0,
          topFlowLabel:
            flows[0]?.route ?? "\u2014",

          volumeSeries: toHourlyBuckets(
            cityWide?.points ?? []
          ),

          flowSeries: flows,

          corridors: congestion.rows.map(
            (row) => ({
              name: `${
                row.from_camera_name ??
                row.from_camera_id
              } \u2192 ${
                row.to_camera_name ??
                row.to_camera_id
              }`,
              // The congestion endpoint has no
              // distance, so speed is left out
              // rather than invented.
              speed: kmh(
                null,
                row.median_duration_s
              ),
              travelTime: minutes(
                row.median_duration_s
              ),
              status: row.congestion_band
                ? BAND_LABEL[
                    row.congestion_band
                  ]
                : "Unbanded",
              color: row.congestion_band
                ? BAND_COLOR[
                    row.congestion_band
                  ]
                : "#94a3b8",
            })
          ),

          coverageFraction:
            od.coverage.coverage_fraction,
          coverageNote: od.coverage.note,
          coverageObserved:
            od.coverage.vehicles_observed,
          coverageUsable:
            od.coverage
              .vehicles_with_both_ends,
        };
      },
      []
    );

  const data = fetched ?? NOTHING_YET;

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
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
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
              Analytics

              <ConnectionBadge
                state={connectionState({
                  loading,
                  error,
                })}
                title={
                  error ? error.message : undefined
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
              Traffic movement, corridor speed and origin-destination insights
            </div>
          </div>

          <select
            defaultValue="today"
            style={{
              height: "40px",
              borderRadius: "10px",
              border:
                "1px solid rgba(148,163,184,.16)",
              background: "#0c1b2d",
              color: "white",
              padding: "0 12px",
              outline: "none",
            }}
          >
            <option value="hour">
              Last 1 hour
            </option>

            <option value="today">
              Today
            </option>

            <option value="week">
              Last 7 days
            </option>
          </select>
        </div>

        {/* KPI */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0,1fr))",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <Kpi
            label="Total Observations"
            value={data.totalObservations.toLocaleString()}
            detail="Last 24 hours"
          />

          <Kpi
            label="Vehicles Tracked"
            value={data.vehiclesTracked.toLocaleString()}
            detail={`${data.coverageUsable.toLocaleString()} usable for OD flows`}
          />

          <Kpi
            label="Cameras Reporting"
            value={String(
              data.camerasReporting
            )}
            detail="Across the network"
          />

          <Kpi
            label="Top OD Flow"
            value={data.topFlowCount.toLocaleString()}
            detail={data.topFlowLabel}
          />
        </div>

        {/* TOP CHART ROW */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1.4fr) minmax(0,1fr)",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <ChartCard
            title="Observation Volume"
            subtitle="Sightings per hour, city-wide"
          >
            {data.volumeSeries.length === 0 && (
              <EmptyState
                title={
                  error
                    ? "Density unavailable"
                    : "No observations"
                }
                detail={
                  error
                    ? OFFLINE_HINT
                    : NO_DATA_HINT
                }
                tone={
                  error ? "error" : "neutral"
                }
              />
            )}

            {data.volumeSeries.length > 0 && (
            <ResponsiveContainer
              width="100%"
              height={280}
            >
              <LineChart
                data={data.volumeSeries}
                margin={{
                  top: 10,
                  right: 20,
                  bottom: 0,
                  left: -10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,.12)"
                />

                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                />

                <YAxis
                  stroke="#64748b"
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0c1b2d",
                    border:
                      "1px solid rgba(255,255,255,.08)",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="observations"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{
                    r: 3,
                    fill: "#38bdf8",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Top Origin-Destination Flows"
            subtitle="Highest vehicle movement pairs"
          >
            {data.flowSeries.length === 0 && (
              <EmptyState
                title={
                  error
                    ? "Flows unavailable"
                    : "No origin-destination flows"
                }
                detail={
                  error
                    ? OFFLINE_HINT
                    : "Only vehicles seen at two or more cameras contribute to this matrix."
                }
                tone={
                  error ? "error" : "neutral"
                }
              />
            )}

            {data.flowSeries.length > 0 && (
            <ResponsiveContainer
              width="100%"
              height={280}
            >
              <BarChart
                data={data.flowSeries}
                layout="vertical"
                margin={{
                  top: 10,
                  right: 20,
                  bottom: 0,
                  left: 30,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,.12)"
                />

                <XAxis
                  type="number"
                  stroke="#64748b"
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                />

                <YAxis
                  type="category"
                  dataKey="route"
                  width={110}
                  stroke="#64748b"
                  tick={{
                    fill: "#64748b",
                    fontSize: 9,
                  }}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0c1b2d",
                    border:
                      "1px solid rgba(255,255,255,.08)",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />

                <Bar
                  dataKey="vehicles"
                  fill="#2563eb"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* SECOND ROW */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1fr) minmax(0,1fr)",
            gap: "12px",
          }}
        >
          {/* CORRIDOR PERFORMANCE */}

          <section
            style={{
              background: "#091828",
              border:
                "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              Corridor Performance
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "10px",
                color: "#64748b",
              }}
            >
              Current average travel performance
            </div>

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {data.corridors.length === 0 ? (
                <EmptyState
                  title={
                    error
                      ? "Corridors unavailable"
                      : "No ranked corridors"
                  }
                  detail={
                    error
                      ? OFFLINE_HINT
                      : NO_DATA_HINT
                  }
                  tone={
                    error ? "error" : "neutral"
                  }
                />
              ) : (
                data.corridors.map(
                (corridor) => (
                  <CorridorRow
                    key={corridor.name}
                    name={corridor.name}
                    speed={corridor.speed}
                    travelTime={
                      corridor.travelTime
                    }
                    status={corridor.status}
                    color={corridor.color}
                  />
                )
              ))}
            </div>
          </section>

          {/* INTERPRETATION */}

          <section
            style={{
              background: "#091828",
              border:
                "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              Interpretation
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "10px",
                color: "#64748b",
              }}
            >
              Quick operational summary
            </div>

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <Insight
                title="Peak movement"
                text={`${data.topFlowLabel} is the strongest OD flow, at ${data.topFlowCount.toLocaleString()} vehicles.`}
              />

              <Insight
                title="Slowest corridor"
                text={
                  data.corridors[0]
                    ? `${data.corridors[0].name} is the worst corridor, at ${data.corridors[0].travelTime} median travel time.`
                    : "No corridor had enough samples to rank."
                }
              />

              <Insight
                title="OD coverage"
                text={`${
                  data.coverageFraction !== null
                    ? `${Math.round(
                        data.coverageFraction * 100
                      )}% of observed vehicles`
                    : "An unreported share of vehicles"
                } could be used (${data.coverageUsable.toLocaleString()} of ${data.coverageObserved.toLocaleString()}). ${
                  data.coverageNote
                }`}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// =====================================
// KPI
// =====================================

function Kpi({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      style={{
        background: "#091828",
        border:
          "1px solid rgba(255,255,255,0.07)",
        borderRadius: "13px",
        padding: "14px 16px",
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
// CHART CARD
// =====================================

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#091828",
        border:
          "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
        padding: "16px",
      }}
    >
      <div
        style={{
          fontSize: "15px",
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "4px",
          marginBottom: "14px",
          fontSize: "10px",
          color: "#64748b",
        }}
      >
        {subtitle}
      </div>

      {children}
    </section>
  );
}

// =====================================
// CORRIDOR
// =====================================

function CorridorRow({
  name,
  speed,
  travelTime,
  status,
  color,
}: {
  name: string;
  speed: string;
  travelTime: string;
  status: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "1.4fr .8fr .8fr .7fr",
        gap: "8px",
        alignItems: "center",
        padding: "11px",
        background: "#0c1b2d",
        borderRadius: "9px",
        fontSize: "11px",
      }}
    >
      <div
        style={{
          fontWeight: 650,
        }}
      >
        {name}
      </div>

      <div
        style={{
          color: "#94a3b8",
        }}
      >
        {speed}
      </div>

      <div
        style={{
          color: "#94a3b8",
        }}
      >
        {travelTime}
      </div>

      <div
        style={{
          color,
          fontSize: "9px",
          fontWeight: 700,
        }}
      >
        {status}
      </div>
    </div>
  );
}

// =====================================
// INSIGHT
// =====================================

function Insight({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "9px",
        background: "#0c1b2d",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 650,
          color: "#93c5fd",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "5px",
          fontSize: "10px",
          lineHeight: 1.5,
          color: "#7f9dbd",
        }}
      >
        {text}
      </div>
    </div>
  );
}