import {
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import Sidebar from "../components/layout/Sidebar";
import CityMap from "../components/map/CityMap";

type TimeRange =
  | "live"
  | "hour"
  | "today";

type CongestionBand =
  | "smooth"
  | "moderate"
  | "heavy"
  | "severe";

type Corridor = {
  name: string;
  from_camera_id: string;
  to_camera_id: string;
  congestion_ratio: number;
  congestion_band: CongestionBand;
  sample_count: number;
  trafficIndex: number;
  trend: number[];
};

type IncidentSeverity =
  | "high"
  | "medium"
  | "low";

type Incident = {
  title: string;
  description: string;
  location: string;
  severity: IncidentSeverity;
  reported: string;
};

const corridors: Corridor[] = [
  {
    name: "Sector 17 → 22 Corridor",
    from_camera_id: "CHD_CAM_02",
    to_camera_id: "CHD_CAM_01",
    congestion_ratio: 2.35,
    congestion_band: "severe",
    sample_count: 61,
    trafficIndex: 85,
    trend: [
      68, 75, 70, 73, 79,
      76, 83, 88, 81, 80,
    ],
  },
  {
    name: "Sector 22 → 35 Corridor",
    from_camera_id: "CHD_CAM_01",
    to_camera_id: "CHD_CAM_05",
    congestion_ratio: 1.84,
    congestion_band: "heavy",
    sample_count: 54,
    trafficIndex: 72,
    trend: [
      58, 66, 61, 65, 63,
      70, 75, 68, 72, 78,
    ],
  },
  {
    name: "Sector 8 → 26 Corridor",
    from_camera_id: "CHD_CAM_06",
    to_camera_id: "CHD_CAM_08",
    congestion_ratio: 1.37,
    congestion_band: "moderate",
    sample_count: 48,
    trafficIndex: 58,
    trend: [
      49, 55, 52, 54, 59,
      63, 56, 58, 54, 57,
    ],
  },
  {
    name: "Sector 35 → 52 Corridor",
    from_camera_id: "CHD_CAM_05",
    to_camera_id: "CHD_CAM_12",
    congestion_ratio: 1.29,
    congestion_band: "moderate",
    sample_count: 39,
    trafficIndex: 55,
    trend: [
      47, 52, 50, 54, 55,
      61, 64, 58, 54, 59,
    ],
  },
  {
    name: "Airport Road Corridor",
    from_camera_id: "CHD_CAM_11",
    to_camera_id: "CHD_CAM_14",
    congestion_ratio: 0.96,
    congestion_band: "smooth",
    sample_count: 71,
    trafficIndex: 32,
    trend: [
      29, 34, 32, 35, 36,
      39, 42, 37, 40, 36,
    ],
  },
];

const incidents: Incident[] = [
  {
    title: "Accident",
    description:
      "2 vehicles involved",
    location:
      "Sector 22, Near Metro Station",
    severity: "high",
    reported: "23 min ago",
  },
  {
    title: "Road Work",
    description:
      "Lane closure",
    location:
      "Sector 17, Main Market Road",
    severity: "medium",
    reported: "45 min ago",
  },
  {
    title: "Signal Malfunction",
    description:
      "Signal flashing",
    location:
      "Sector 35, City Center",
    severity: "medium",
    reported: "1 hr ago",
  },
  {
    title: "Heavy Volume",
    description:
      "High traffic volume",
    location:
      "Airport Road Terminal 1",
    severity: "low",
    reported: "2 hr ago",
  },
];

const trafficTrend = [
  39, 43, 48, 55, 64, 66,
  58, 70, 78, 72, 66, 75,
  81, 77, 68, 65, 48, 31,
  22, 21, 28, 33, 31, 32,
  42, 58, 67, 70,
];

export default function Traffic() {
  const [
    selectedRange,
    setSelectedRange,
  ] =
    useState<TimeRange>(
      "live"
    );

  const rangeLabel =
    selectedRange === "live"
      ? "Live · Last 15 minutes"
      : selectedRange === "hour"
      ? "Last 1 hour"
      : "Today";

  const severeCount =
    corridors.filter(
      (corridor) =>
        corridor.congestion_band ===
        "severe"
    ).length;

  const heavyCount =
    corridors.filter(
      (corridor) =>
        corridor.congestion_band ===
        "heavy"
    ).length;

  const overallTrafficIndex =
    Math.round(
      corridors.reduce(
        (
          total,
          corridor
        ) =>
          total +
          corridor.trafficIndex,
        0
      ) /
        corridors.length
    );

  const networkState =
    overallTrafficIndex >=
    75
      ? "Heavy"
      : overallTrafficIndex >=
        50
      ? "Moderate"
      : "Smooth";

  const rankedCorridors =
    useMemo(
      () =>
        [...corridors].sort(
          (a, b) =>
            b.trafficIndex -
            a.trafficIndex
        ),
      []
    );

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",

        display: "flex",

        background:
          "#07111d",

        color: "#f8fafc",

        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          minWidth: 0,

          padding:
            "18px 20px 24px",

          background:
            "radial-gradient(circle at top right, rgba(37,99,235,.06), transparent 34%), #07111d",
        }}
      >
        {/* =================================
            HEADER
        ================================= */}

        <div
          style={{
            display: "flex",

            justifyContent:
              "space-between",

            alignItems:
              "flex-start",

            gap: "20px",

            marginBottom:
              "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "28px",

                fontWeight: 760,

                letterSpacing:
                  "-.6px",
              }}
            >
              Traffic
            </div>

            <div
              style={{
                marginTop: "5px",

                color: "#7c93aa",

                fontSize: "10px",
              }}
            >
              Real-time traffic flow, congestion hotspots and corridor performance
            </div>
          </div>

          <div
            style={{
              display: "flex",

              alignItems: "center",

              gap: "9px",
            }}
          >
            <TimeButton
              label="Live · 15m"
              active={
                selectedRange ===
                "live"
              }
              onClick={() =>
                setSelectedRange(
                  "live"
                )
              }
            />

            <TimeButton
              label="1 Hour"
              active={
                selectedRange ===
                "hour"
              }
              onClick={() =>
                setSelectedRange(
                  "hour"
                )
              }
            />

            <TimeButton
              label="Today"
              active={
                selectedRange ===
                "today"
              }
              onClick={() =>
                setSelectedRange(
                  "today"
                )
              }
            />

            <div
              style={{
                marginLeft:
                  "7px",

                display: "flex",

                alignItems:
                  "center",

                gap: "6px",

                color: "#4ade80",

                fontSize: "8px",

                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",

                  borderRadius:
                    "50%",

                  background:
                    "#22c55e",

                  boxShadow:
                    "0 0 10px rgba(34,197,94,.7)",
                }}
              />

              System Live
            </div>

            <span
              style={{
                height: "14px",
                width: "1px",

                margin:
                  "0 3px",

                background:
                  "rgba(148,163,184,.20)",
              }}
            />

            <span
              style={{
                color: "#71869d",

                fontSize: "8px",
              }}
            >
              Updated 12 sec ago
            </span>
          </div>
        </div>

        {/* =================================
            KPI ROW
        ================================= */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(6,minmax(0,1fr))",

            gap: "10px",

            marginBottom:
              "12px",
          }}
        >
          <IndexMetric
            value={
              overallTrafficIndex
            }
            state={
              networkState
            }
          />

          <TrafficMetric
            label="Active Corridors"
            value="8 / 14"
            detail="High congestion"
            delta="+2 vs yesterday"
            deltaColor="#ef4444"
            icon="◷"
            color="#f59e0b"
          />

          <TrafficMetric
            label="Avg Travel Speed"
            value="28 km/h"
            detail={rangeLabel}
            delta="-4 km/h vs yesterday"
            deltaColor="#ef4444"
            icon="⌁"
            color="#8b5cf6"
          />

          <TrafficMetric
            label="Incidents Today"
            value="12"
            detail="City-wide"
            delta="-3 vs yesterday"
            deltaColor="#22c55e"
            icon="△"
            color="#22c55e"
          />

          <TrafficMetric
            label="Congestion Hotspots"
            value={String(
              severeCount +
                heavyCount +
                3
            )}
            detail="Active now"
            icon="⌖"
            color="#ef4444"
          />

          <NetworkMetric
            value={92}
          />
        </div>

        {/* =================================
            TOP CONTENT
        ================================= */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "minmax(0,1.35fr) minmax(390px,.85fr)",

            gap: "12px",

            marginBottom:
              "12px",
          }}
        >
          {/* =============================
              MAP
          ============================= */}

          <section
            style={{
              ...panelStyle,

              minWidth: 0,
            }}
          >
            <PanelHeader
              title="Live Traffic Map"
              subtitle="City-wide traffic flow visualization"
            >
              <div
                style={{
                  display: "flex",

                  alignItems:
                    "center",

                  gap: "7px",
                }}
              >
                <div
                  style={{
                    height: "31px",

                    padding:
                      "0 12px",

                    display: "flex",

                    alignItems:
                      "center",

                    gap: "7px",

                    borderRadius:
                      "7px",

                    border:
                      "1px solid rgba(148,163,184,.11)",

                    background:
                      "#0c1c2e",

                    color:
                      "#c1d1df",

                    fontSize:
                      "8px",
                  }}
                >
                  <span
                    style={{
                      width:
                        "7px",

                      height:
                        "7px",

                      borderRadius:
                        "50%",

                      background:
                        "#22c55e",

                      boxShadow:
                        "0 0 7px rgba(34,197,94,.6)",
                    }}
                  />

                  Live
                  <span>
                   ⌄
                  </span>
                </div>
              </div>
            </PanelHeader>

            {/*
              IMPORTANT:
              MAP IMPLEMENTATION IS UNCHANGED.
              This is still your teammate's
              CityMap component.
            */}

            <div
              style={{
                position: "relative",

                height: "385px",

                overflow: "hidden",

                background:
                  "#081420",
              }}
            >
              <CityMap
                showCamerasInitially={
                  true
                }
                showTrajectoryInitially={
                  false
                }
                showTrafficInitially={
                  true
                }
              />
            </div>
          </section>

          {/* =============================
              CORRIDOR PERFORMANCE
          ============================= */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Corridor Performance"
              subtitle="Ranked using congestion ratio and traffic index"
            />

            <div
              style={{
                padding:
                  "0 13px 8px",
              }}
            >
              <div
                style={{
                  display: "grid",

                  gridTemplateColumns:
                    "1.55fr .9fr .7fr .9fr",

                  gap: "8px",

                  padding:
                    "11px 0",

                  color:
                    "#6f859a",

                  fontSize:
                    "6.5px",

                  fontWeight:
                    700,

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    ".5px",

                  borderBottom:
                    "1px solid rgba(148,163,184,.07)",
                }}
              >
                <div>
                  Corridor
                </div>

                <div>
                  Status
                </div>

                <div>
                  Traffic Index
                </div>

                <div>
                  Trend
                </div>
              </div>

              {rankedCorridors.map(
                (
                  corridor
                ) => (
                  <CorridorRow
                    key={
                      corridor.name
                    }
                    corridor={
                      corridor
                    }
                  />
                )
              )}

              <button
                style={{
                  width: "100%",

                  marginTop:
                    "5px",

                  height:
                    "33px",

                  border: "none",

                  background:
                    "transparent",

                  color:
                    "#52a8ff",

                  textAlign:
                    "right",

                  cursor:
                    "pointer",

                  fontSize:
                    "8px",
                }}
              >
                View all corridors →
              </button>
            </div>
          </section>
        </div>

        {/* =================================
            BOTTOM CONTENT
        ================================= */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "minmax(0,1.35fr) minmax(390px,.85fr)",

            gap: "12px",
          }}
        >
          {/* =============================
              TRAFFIC TREND
          ============================= */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Traffic Trend"
              subtitle="Last 24 hours"
            >
              <select
                defaultValue="index"
                style={
                  smallSelectStyle
                }
              >
                <option value="index">
                  Traffic Index
                </option>

                <option value="speed">
                  Avg Speed
                </option>

                <option value="volume">
                  Vehicle Volume
                </option>
              </select>
            </PanelHeader>

            <div
              style={{
                padding:
                  "12px 14px 13px",
              }}
            >
              <TrafficTrendChart
                values={
                  trafficTrend
                }
              />
            </div>
          </section>

          {/* =============================
              ACTIVE INCIDENTS
          ============================= */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Active Incidents"
              subtitle="Operational incidents affecting traffic"
            >
              <button
                style={{
                  border:
                    "none",

                  background:
                    "transparent",

                  color:
                    "#52a8ff",

                  cursor:
                    "pointer",

                  fontSize:
                    "8px",
                }}
              >
                View all →
              </button>
            </PanelHeader>

            <div
              style={{
                padding:
                  "0 13px 8px",
              }}
            >
              <div
                style={{
                  display: "grid",

                  gridTemplateColumns:
                    "1.2fr .9fr .55fr .65fr",

                  gap: "9px",

                  padding:
                    "11px 0",

                  borderBottom:
                    "1px solid rgba(148,163,184,.07)",

                  color:
                    "#6e849a",

                  fontSize:
                    "6.5px",

                  fontWeight:
                    700,

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    ".45px",
                }}
              >
                <div>
                  Incident
                </div>

                <div>
                  Location
                </div>

                <div>
                  Severity
                </div>

                <div>
                  Reported
                </div>
              </div>

              {incidents.map(
                (
                  incident
                ) => (
                  <IncidentRow
                    key={
                      incident.title
                    }
                    incident={
                      incident
                    }
                  />
                )
              )}
            </div>
          </section>
        </div>

        {/* =================================
            BACKEND-AWARE FOOTER
        ================================= */}

        <div
          style={{
            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            gap: "20px",

            marginTop:
              "12px",

            padding:
              "10px 13px",

            borderRadius:
              "9px",

            background:
              "#091725",

            border:
              "1px solid rgba(148,163,184,.07)",
          }}
        >
          <div
            style={{
              display: "flex",

              alignItems:
                "center",

              gap: "16px",

              color:
                "#667f96",

              fontSize:
                "7px",
            }}
          >
            <span>
              ● Traffic window:{" "}
              <strong
                style={{
                  color:
                    "#9bb0c4",
                }}
              >
                {rangeLabel}
              </strong>
            </span>

            <span>
              ● Minimum trusted samples:{" "}
              <strong
                style={{
                  color:
                    "#9bb0c4",
                }}
              >
                5
              </strong>
            </span>

            <span>
              ● Analytics refresh:{" "}
              <strong
                style={{
                  color:
                    "#9bb0c4",
                }}
              >
                30 sec
              </strong>
            </span>
          </div>

          <div
            style={{
              color:
                "#526a81",

              fontSize:
                "7px",
            }}
          >
            Traffic Intelligence · City Intelligence
          </div>
        </div>
      </main>
    </div>
  );
}

/* =====================================
   TIME BUTTON
===================================== */

function TimeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={
        onClick
      }
      style={{
        height: "32px",

        padding:
          "0 10px",

        borderRadius:
          "7px",

        border:
          active
            ? "1px solid rgba(59,130,246,.32)"
            : "1px solid rgba(148,163,184,.08)",

        background:
          active
            ? "rgba(37,99,235,.16)"
            : "#0b1a2b",

        color:
          active
            ? "#8cc5ff"
            : "#71869b",

        cursor:
          "pointer",

        fontSize: "7px",

        fontWeight: 650,
      }}
    >
      {label}
    </button>
  );
}

/* =====================================
   INDEX KPI
===================================== */

function IndexMetric({
  value,
  state,
}: {
  value: number;
  state: string;
}) {
  return (
    <div
      style={
        metricCardStyle
      }
    >
      <div
        style={{
          display: "flex",

          alignItems:
            "center",

          gap: "11px",
        }}
      >
        <div
          style={{
            width: "58px",

            height: "58px",

            flexShrink: 0,

            borderRadius:
              "50%",

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            background: `conic-gradient(#fb923c 0 ${value}%, #1a2b3d ${value}% 100%)`,
          }}
        >
          <div
            style={{
              width: "43px",

              height: "43px",

              borderRadius:
                "50%",

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              background:
                "#0b1929",

              fontSize:
                "14px",

              fontWeight:
                750,
            }}
          >
            {value}
          </div>
        </div>

        <div>
          <div
            style={{
              color:
                "#8398ad",

              fontSize:
                "7px",
            }}
          >
            Overall Traffic Index
          </div>

          <div
            style={{
              marginTop:
                "4px",

              color:
                "#f59e0b",

              fontSize:
                "9px",

              fontWeight:
                700,
            }}
          >
            {state}
          </div>

          <div
            style={{
              marginTop:
                "6px",

              color:
                "#f59e0b",

              fontSize:
                "6.5px",
            }}
          >
            +6 vs yesterday
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================
   STANDARD KPI
===================================== */

function TrafficMetric({
  label,
  value,
  detail,
  delta,
  deltaColor,
  icon,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  delta?: string;
  deltaColor?: string;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={
        metricCardStyle
      }
    >
      <div
        style={{
          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          gap: "8px",
        }}
      >
        <div
          style={{
            minWidth: 0,
          }}
        >
          <div
            style={{
              color:
                "#8599ad",

              fontSize:
                "7px",
            }}
          >
            {label}
          </div>

          <div
            style={{
              marginTop:
                "6px",

              fontSize:
                "21px",

              fontWeight:
                740,

              whiteSpace:
                "nowrap",
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            width: "38px",

            height: "38px",

            flexShrink: 0,

            borderRadius:
              "50%",

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            background:
              `${color}12`,

            border:
              `1px solid ${color}25`,

            color,

            fontSize:
              "15px",
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          marginTop: "7px",

          display: "flex",

          gap: "9px",

          alignItems:
            "center",

          flexWrap:
            "wrap",
        }}
      >
        <span
          style={{
            color:
              "#71879d",

            fontSize:
              "6.5px",
          }}
        >
          {detail}
        </span>

        {delta && (
          <span
            style={{
              color:
                deltaColor ??
                "#8da1b5",

              fontSize:
                "6.5px",
            }}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

/* =====================================
   NETWORK KPI
===================================== */

function NetworkMetric({
  value,
}: {
  value: number;
}) {
  return (
    <div
      style={
        metricCardStyle
      }
    >
      <div
        style={{
          display: "flex",

          alignItems:
            "center",

          gap: "11px",
        }}
      >
        <div
          style={{
            width: "57px",

            height: "57px",

            borderRadius:
              "50%",

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            background: `conic-gradient(#4ade80 0 ${value}%, #183246 ${value}% 100%)`,
          }}
        >
          <div
            style={{
              width: "43px",

              height: "43px",

              borderRadius:
                "50%",

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              background:
                "#0b1929",

              fontSize:
                "13px",

              fontWeight:
                750,
            }}
          >
            {value}%
          </div>
        </div>

        <div>
          <div
            style={{
              color:
                "#4ade80",

              fontSize:
                "9px",

              fontWeight:
                700,
            }}
          >
            Optimal
          </div>

          <div
            style={{
              marginTop:
                "4px",

              color:
                "#667e95",

              fontSize:
                "6.5px",
            }}
          >
            Network health
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================
   PANEL HEADER
===================================== */

function PanelHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",

        justifyContent:
          "space-between",

        alignItems:
          "center",

        gap: "12px",

        padding:
          "12px 14px",

        borderBottom:
          "1px solid rgba(148,163,184,.07)",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "11px",

            fontWeight: 700,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: "3px",

            color: "#60788f",

            fontSize: "6.5px",
          }}
        >
          {subtitle}
        </div>
      </div>

      {children}
    </div>
  );
}

/* =====================================
   CORRIDOR ROW
===================================== */

function CorridorRow({
  corridor,
}: {
  corridor: Corridor;
}) {
  const color =
    congestionColor(
      corridor.congestion_band
    );

  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns:
          "1.55fr .9fr .7fr .9fr",

        gap: "8px",

        alignItems:
          "center",

        minHeight:
          "45px",

        borderBottom:
          "1px solid rgba(148,163,184,.055)",
      }}
    >
      <div>
        <div
          style={{
            color:
              "#d5e1ed",

            fontSize:
              "8px",

            fontWeight:
              650,
          }}
        >
          {corridor.name}
        </div>

        <div
          style={{
            marginTop:
              "3px",

            color:
              "#536b82",

            fontSize:
              "6px",
          }}
        >
          {corridor.from_camera_id}
          {" → "}
          {corridor.to_camera_id}
        </div>
      </div>

      <div>
        <span
          style={{
            display:
              "inline-block",

            padding:
              "4px 7px",

            borderRadius:
              "5px",

            background:
              `${color}12`,

            border:
              `1px solid ${color}25`,

            color,

            fontSize:
              "6.5px",

            fontWeight:
              700,

            textTransform:
              "capitalize",
          }}
        >
          {
            corridor.congestion_band
          }
        </span>
      </div>

      <div
        style={{
          color:
            "#d2dfeb",

          fontSize:
            "8px",

          fontWeight:
            650,
        }}
      >
        {
          corridor.trafficIndex
        }
      </div>

      <MiniTrend
        values={
          corridor.trend
        }
        color={
          color
        }
      />
    </div>
  );
}

/* =====================================
   MINI TREND
===================================== */

function MiniTrend({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const max =
    Math.max(
      ...values
    );

  const min =
    Math.min(
      ...values
    );

  const points =
    values
      .map(
        (
          value,
          index
        ) => {
          const x =
            (index /
              (values.length -
                1)) *
            90;

          const y =
            21 -
            ((value -
              min) /
              Math.max(
                1,
                max -
                  min
              )) *
              15;

          return `${x},${y}`;
        }
      )
      .join(" ");

  return (
    <svg
      width="92"
      height="26"
      viewBox="0 0 92 26"
    >
      <polyline
        points={
          points
        }
        fill="none"
        stroke={
          color
        }
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {values.map(
        (
          value,
          index
        ) => {
          const x =
            (index /
              (values.length -
                1)) *
            90;

          const y =
            21 -
            ((value -
              min) /
              Math.max(
                1,
                max -
                  min
              )) *
              15;

          return (
            <circle
              key={
                index
              }
              cx={x}
              cy={y}
              r="1.4"
              fill={
                color
              }
            />
          );
        }
      )}
    </svg>
  );
}

/* =====================================
   INCIDENT ROW
===================================== */

function IncidentRow({
  incident,
}: {
  incident: Incident;
}) {
  const color =
    incidentColor(
      incident.severity
    );

  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns:
          "1.2fr .9fr .55fr .65fr",

        gap: "9px",

        alignItems:
          "center",

        minHeight:
          "55px",

        borderBottom:
          "1px solid rgba(148,163,184,.055)",
      }}
    >
      <div
        style={{
          display: "flex",

          alignItems:
            "center",

          gap: "8px",
        }}
      >
        <div
          style={{
            width: "22px",

            height: "22px",

            flexShrink: 0,

            borderRadius:
              "50%",

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            background:
              `${color}15`,

            color,

            fontSize:
              "8px",

            fontWeight:
              800,
          }}
        >
          !
        </div>

        <div>
          <div
            style={{
              color:
                "#dce7f2",

              fontSize:
                "8px",

              fontWeight:
                700,
            }}
          >
            {incident.title}
          </div>

          <div
            style={{
              marginTop:
                "3px",

              color:
                "#657d94",

              fontSize:
                "6.5px",
            }}
          >
            {
              incident.description
            }
          </div>
        </div>
      </div>

      <div
        style={{
          color:
            "#8296aa",

          fontSize:
            "7px",

          lineHeight: 1.4,
        }}
      >
        {incident.location}
      </div>

      <div>
        <span
          style={{
            padding:
              "4px 7px",

            borderRadius:
              "5px",

            background:
              `${color}12`,

            border:
              `1px solid ${color}22`,

            color,

            fontSize:
              "6px",

            fontWeight:
              700,

            textTransform:
              "capitalize",
          }}
        >
          {incident.severity}
        </span>
      </div>

      <div
        style={{
          color:
            "#7a8fa3",

          fontSize:
            "6.5px",
        }}
      >
        {incident.reported}
      </div>
    </div>
  );
}

/* =====================================
   TRAFFIC TREND
===================================== */

function TrafficTrendChart({
  values,
}: {
  values: number[];
}) {
  const width =
    760;

  const height =
    145;

  const paddingX =
    30;

  const paddingY =
    15;

  const maxValue =
    100;

  const points =
    values.map(
      (
        value,
        index
      ) => {
        const x =
          paddingX +
          (index /
            (values.length -
              1)) *
            (width -
              paddingX *
                2);

        const y =
          height -
          paddingY -
          (value /
            maxValue) *
            (height -
              paddingY *
                2);

        return {
          x,
          y,
          value,
        };
      }
    );

  const polyline =
    points
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(" ");

  const peak =
    points.reduce(
      (
        best,
        point
      ) =>
        point.value >
        best.value
          ? point
          : best,
      points[0]
    );

  const low =
    points.reduce(
      (
        best,
        point
      ) =>
        point.value <
        best.value
          ? point
          : best,
      points[0]
    );

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="165"
        preserveAspectRatio="none"
      >
        {[25, 50, 75, 100].map(
          (
            line
          ) => {
            const y =
              height -
              paddingY -
              (line /
                100) *
                (height -
                  paddingY *
                    2);

            return (
              <g
                key={
                  line
                }
              >
                <line
                  x1={
                    paddingX
                  }
                  y1={y}
                  x2={
                    width -
                    paddingX
                  }
                  y2={y}
                  stroke="rgba(148,163,184,.09)"
                  strokeWidth="1"
                />

                <text
                  x="3"
                  y={
                    y + 3
                  }
                  fill="#50687f"
                  fontSize="7"
                >
                  {line}
                </text>
              </g>
            );
          }
        )}

        <polyline
          points={
            polyline
          }
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map(
          (
            point,
            index
          ) => (
            <circle
              key={
                index
              }
              cx={
                point.x
              }
              cy={
                point.y
              }
              r="2.2"
              fill="#60a5fa"
              stroke="#bfdbfe"
              strokeWidth=".6"
            />
          )
        )}

        <circle
          cx={
            peak.x
          }
          cy={
            peak.y
          }
          r="4"
          fill="#ef4444"
        />

        <rect
          x={
            peak.x -
            13
          }
          y={
            peak.y -
            25
          }
          width="26"
          height="16"
          rx="4"
          fill="#b91c1c"
        />

        <text
          x={
            peak.x
          }
          y={
            peak.y -
            14
          }
          textAnchor="middle"
          fill="#fff"
          fontSize="7"
          fontWeight="700"
        >
          {peak.value}
        </text>

        <circle
          cx={
            low.x
          }
          cy={
            low.y
          }
          r="4"
          fill="#22c55e"
        />

        <rect
          x={
            low.x -
            13
          }
          y={
            low.y -
            25
          }
          width="26"
          height="16"
          rx="4"
          fill="#15803d"
        />

        <text
          x={
            low.x
          }
          y={
            low.y -
            14
          }
          textAnchor="middle"
          fill="#fff"
          fontSize="7"
          fontWeight="700"
        >
          {low.value}
        </text>
      </svg>

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(8,1fr)",

          marginTop: "-9px",

          paddingLeft:
            "25px",

          color:
            "#5c738a",

          fontSize:
            "6px",

          textAlign:
            "center",
        }}
      >
        <span>
          10 AM
        </span>

        <span>
          02 PM
        </span>

        <span>
          06 PM
        </span>

        <span>
          10 PM
        </span>

        <span>
          02 AM
        </span>

        <span>
          06 AM
        </span>

        <span>
          08 AM
        </span>

        <span>
          Now
        </span>
      </div>
    </div>
  );
}

/* =====================================
   HELPERS
===================================== */

function congestionColor(
  band:
    CongestionBand
) {
  if (
    band === "severe"
  ) {
    return "#ef4444";
  }

  if (
    band === "heavy"
  ) {
    return "#f97316";
  }

  if (
    band ===
    "moderate"
  ) {
    return "#eab308";
  }

  return "#22c55e";
}

function incidentColor(
  severity:
    IncidentSeverity
) {
  if (
    severity ===
    "high"
  ) {
    return "#ef4444";
  }

  if (
    severity ===
    "medium"
  ) {
    return "#f97316";
  }

  return "#22c55e";
}

/* =====================================
   STYLES
===================================== */

const metricCardStyle:
  CSSProperties =
  {
    minHeight:
      "94px",

    padding:
      "13px",

    borderRadius:
      "11px",

    background:
      "linear-gradient(145deg,#0b1c2f,#091827)",

    border:
      "1px solid rgba(148,163,184,.09)",

    boxShadow:
      "0 9px 22px rgba(0,0,0,.09)",
  };

const panelStyle:
  CSSProperties =
  {
    background:
      "linear-gradient(180deg,#091a2c,#081725)",

    border:
      "1px solid rgba(148,163,184,.09)",

    borderRadius:
      "11px",

    overflow:
      "hidden",

    boxShadow:
      "0 12px 28px rgba(0,0,0,.11)",
  };

const smallSelectStyle:
  CSSProperties =
  {
    height: "30px",

    borderRadius:
      "7px",

    border:
      "1px solid rgba(148,163,184,.10)",

    background:
      "#0b1b2d",

    color:
      "#bac9d7",

    outline:
      "none",

    padding:
      "0 9px",

    fontSize:
      "7px",
  };