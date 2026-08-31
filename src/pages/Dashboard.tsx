import {
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Sidebar from "../components/layout/Sidebar";
import CityMap from "../components/map/CityMap";

/* =========================================================
   BACKEND-AWARE DEMO DATA

   Later these sections can be replaced by:

   /api/analytics/summary
   /api/analytics/congestion
   /api/analytics/density
   /api/alerts
   /api/alerts/stats
   /api/cameras
========================================================= */

type AlertSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low";

type RecentAlert = {
  id: string;
  title: string;
  plate?: string;
  cameraId: string;
  cameraName: string;
  zone: string;
  severity: AlertSeverity;
  time: string;
};

type CongestionBand =
  | "severe"
  | "heavy"
  | "moderate"
  | "smooth";

type Corridor = {
  name: string;
  fromCamera: string;
  toCamera: string;
  trafficIndex: number;
  congestionRatio: number;
  congestionBand: CongestionBand;
  sampleCount: number;
  trend: number[];
};

const recentAlerts: RecentAlert[] = [
  {
    id: "ALT-1248",
    title: "Blacklisted Vehicle Detected",
    plate: "CH01AB1234",
    cameraId: "CHD_CAM_01",
    cameraName: "Sector 22_23 Junction",
    zone: "Sector 22",
    severity: "critical",
    time: "2 min ago",
  },
  {
    id: "ALT-1247",
    title: "Wrong Way Movement",
    plate: "CH01CD5678",
    cameraId: "CHD_CAM_04",
    cameraName: "Sector 17_21 Junction",
    zone: "Sector 17",
    severity: "high",
    time: "5 min ago",
  },
  {
    id: "ALT-1246",
    title: "Congestion Detected",
    cameraId: "CHD_CAM_07",
    cameraName: "Sector 8_18 Junction",
    zone: "Sector 8",
    severity: "medium",
    time: "7 min ago",
  },
  {
    id: "ALT-1245",
    title: "Plate Mismatch",
    plate: "PB10EF9012",
    cameraId: "CHD_CAM_03",
    cameraName: "IT Park Chowk",
    zone: "IT Park",
    severity: "high",
    time: "12 min ago",
  },
  {
    id: "ALT-1244",
    title: "Camera Reporting Delay",
    cameraId: "CHD_CAM_12",
    cameraName: "Sector 6_26 Junction",
    zone: "Sector 26",
    severity: "low",
    time: "18 min ago",
  },
];

const corridors: Corridor[] = [
  {
    name: "Sector 17 → 22",
    fromCamera: "CHD_CAM_02",
    toCamera: "CHD_CAM_01",
    trafficIndex: 85,
    congestionRatio: 2.35,
    congestionBand: "severe",
    sampleCount: 61,
    trend: [
      68, 72, 69, 76, 74,
      82, 79, 86, 81, 84,
    ],
  },
  {
    name: "Sector 22 → 35",
    fromCamera: "CHD_CAM_01",
    toCamera: "CHD_CAM_05",
    trafficIndex: 72,
    congestionRatio: 1.84,
    congestionBand: "heavy",
    sampleCount: 54,
    trend: [
      55, 61, 59, 65, 63,
      70, 67, 73, 69, 72,
    ],
  },
  {
    name: "Sector 8 → 26",
    fromCamera: "CHD_CAM_06",
    toCamera: "CHD_CAM_08",
    trafficIndex: 58,
    congestionRatio: 1.37,
    congestionBand: "moderate",
    sampleCount: 48,
    trend: [
      48, 52, 50, 55, 53,
      60, 56, 59, 54, 57,
    ],
  },
  {
    name: "Sector 35 → 52",
    fromCamera: "CHD_CAM_05",
    toCamera: "CHD_CAM_12",
    trafficIndex: 55,
    congestionRatio: 1.29,
    congestionBand: "moderate",
    sampleCount: 39,
    trend: [
      45, 50, 47, 53, 51,
      58, 55, 60, 54, 56,
    ],
  },
  {
    name: "Airport Road",
    fromCamera: "CHD_CAM_11",
    toCamera: "CHD_CAM_14",
    trafficIndex: 32,
    congestionRatio: 0.96,
    congestionBand: "smooth",
    sampleCount: 71,
    trend: [
      28, 33, 31, 36, 34,
      39, 36, 42, 38, 40,
    ],
  },
];

const zoneData = [
  {
    zone: "Sector 17",
    vehicles: 3245,
  },
  {
    zone: "Sector 22",
    vehicles: 2562,
  },
  {
    zone: "Sector 35",
    vehicles: 2148,
  },
  {
    zone: "Airport",
    vehicles: 1785,
  },
  {
    zone: "Sector 8",
    vehicles: 1256,
  },
  {
    zone: "Industrial",
    vehicles: 849,
  },
];

const trafficTrend = [
  { time: "10 AM", value: 48 },
  { time: "12 PM", value: 62 },
  { time: "02 PM", value: 74 },
  { time: "04 PM", value: 63 },
  { time: "06 PM", value: 78 },
  { time: "08 PM", value: 85 },
  { time: "10 PM", value: 73 },
  { time: "12 AM", value: 70 },
  { time: "02 AM", value: 46 },
  { time: "04 AM", value: 35 },
  { time: "06 AM", value: 24 },
  { time: "08 AM", value: 50 },
  { time: "Now", value: 68 },
];

const alertSeverityData = [
  {
    name: "Critical",
    value: 4,
    color: "#ef4444",
  },
  {
    name: "High",
    value: 8,
    color: "#f97316",
  },
  {
    name: "Medium",
    value: 18,
    color: "#eab308",
  },
  {
    name: "Low",
    value: 11,
    color: "#3b82f6",
  },
];

const cameraHealth = [
  {
    name: "Online",
    value: 7,
    color: "#22c55e",
  },
  {
    name: "Delayed",
    value: 3,
    color: "#f59e0b",
  },
  {
    name: "Silent",
    value: 3,
    color: "#ef4444",
  },
  {
    name: "Inactive",
    value: 1,
    color: "#64748b",
  },
];

const insights = [
  {
    title: "High Congestion Alert",
    text:
      "Sector 17 → 22 currently has the highest congestion ratio.",
    time: "2 min ago",
    color: "#ef4444",
    icon: "△",
  },
  {
    title: "Alert Concentration",
    text:
      "Critical and high-severity events account for the most urgent active incidents.",
    time: "15 min ago",
    color: "#f59e0b",
    icon: "!",
  },
  {
    title: "Traffic Improvement",
    text:
      "Airport Road remains the best-performing monitored corridor.",
    time: "30 min ago",
    color: "#22c55e",
    icon: "↗",
  },
  {
    title: "Camera Network",
    text:
      "Most active cameras are currently reporting recent observations.",
    time: "1 hr ago",
    color: "#3b82f6",
    icon: "i",
  },
];

export default function Dashboard() {
  const totalCameraCount =
    cameraHealth.reduce(
      (
        total,
        item
      ) =>
        total +
        item.value,
      0
    );

  const onlineCameraCount =
    cameraHealth.find(
      (
        item
      ) =>
        item.name ===
        "Online"
    )?.value ?? 0;

  const alertCount =
    alertSeverityData.reduce(
      (
        total,
        item
      ) =>
        total +
        item.value,
      0
    );

  const meanCongestionRatio =
    useMemo(
      () =>
        corridors.reduce(
          (
            total,
            corridor
          ) =>
            total +
            corridor.congestionRatio,
          0
        ) /
        corridors.length,
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
            "18px 20px 14px",

          background:
            "radial-gradient(circle at top right, rgba(37,99,235,.055), transparent 34%), #07111d",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            display: "flex",

            alignItems:
              "flex-start",

            justifyContent:
              "space-between",

            gap: "18px",

            marginBottom:
              "15px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "26px",

                fontWeight: 760,

                letterSpacing:
                  "-.5px",
              }}
            >
              Operations Dashboard
            </div>

            <div
              style={{
                marginTop: "5px",

                color: "#7c92a8",

                fontSize: "10px",
              }}
            >
              City-wide ANPR observations, traffic intelligence and operational alerts
            </div>
          </div>

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
                display: "flex",

                alignItems:
                  "center",

                gap: "6px",

                color: "#4ade80",

                fontSize: "7px",

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
                    "0 0 9px rgba(34,197,94,.65)",
                }}
              />

              System Live
            </div>

            <span
              style={{
                width: "1px",
                height: "14px",

                background:
                  "rgba(148,163,184,.18)",
              }}
            />

            <span
              style={{
                color: "#70869b",

                fontSize: "7px",
              }}
            >
              Updated 12 sec ago
            </span>

            <select
              defaultValue="today"
              style={
                headerControlStyle
              }
            >
              <option value="today">
                Today
              </option>

              <option value="week">
                Last 7 days
              </option>
            </select>

            <select
              defaultValue="24h"
              style={
                headerControlStyle
              }
            >
              <option value="15m">
                Last 15 min
              </option>

              <option value="1h">
                Last 1 hour
              </option>

              <option value="24h">
                Last 24 hours
              </option>
            </select>

            <Link
              to="/alerts"
              style={{
                position: "relative",

                width: "32px",
                height: "32px",

                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                borderRadius:
                  "8px",

                border:
                  "1px solid rgba(148,163,184,.09)",

                background:
                  "#0b1b2d",

                color: "#9eb1c4",

                textDecoration:
                  "none",
              }}
            >
              ♧

              <span
                style={{
                  position:
                    "absolute",

                  top: "-5px",
                  right: "-5px",

                  minWidth: "17px",
                  height: "17px",

                  padding:
                    "0 4px",

                  borderRadius:
                    "20px",

                  display: "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  background:
                    "#dc2626",

                  color: "white",

                  fontSize: "6px",

                  fontWeight: 800,
                }}
              >
                {
                  recentAlerts.length
                }
              </span>
            </Link>
          </div>
        </div>

        {/* =================================================
            KPI STRIP
        ================================================= */}

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
          <DashboardMetric
            title="Total Observations"
            value="12,845"
            detail="+18.5% vs yesterday"
            detailColor="#22c55e"
            icon="▣"
            color="#3b82f6"
            trend={[
              40, 45, 43, 51, 46,
              48, 44, 49, 47, 55,
            ]}
          />

          <DashboardMetric
            title="Active Alerts"
            value={String(
              alertCount
            )}
            detail="Critical + high priority"
            detailColor="#ef4444"
            icon="△"
            color="#ef4444"
            trend={[
              38, 49, 42, 46, 39,
              41, 37, 44, 42, 51,
            ]}
          />

          <DashboardMetric
            title="Mean Congestion Ratio"
            value={
              meanCongestionRatio.toFixed(
                2
              )
            }
            detail="Across ranked corridors"
            detailColor="#f59e0b"
            icon="⌁"
            color="#f59e0b"
            trend={[
              43, 50, 47, 54, 45,
              51, 48, 52, 55, 59,
            ]}
          />

          <DashboardMetric
            title="Unique Vehicles"
            value="6,281"
            detail="Resolved identities"
            detailColor="#8b5cf6"
            icon="◉"
            color="#8b5cf6"
            trend={[
              35, 40, 46, 43, 49,
              44, 51, 47, 52, 56,
            ]}
          />

          <HealthMetric
            title="Camera Health"
            value={`${Math.round(
              (onlineCameraCount /
                totalCameraCount) *
                100
            )}%`}
            detail="Network reporting"
            color="#22c55e"
          />

          <HealthMetric
            title="Active Cameras"
            value={`${onlineCameraCount} / ${totalCameraCount}`}
            detail="Currently online"
            color="#3b82f6"
          />
        </div>

        {/* =================================================
            MAP + ALERTS + CAMERA HEALTH
        ================================================= */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "minmax(0,1.25fr) minmax(330px,.85fr) minmax(285px,.72fr)",

            gap: "12px",

            marginBottom:
              "12px",
          }}
        >
          {/* MAP */}

          <section
            style={{
              ...panelStyle,

              minWidth: 0,
            }}
          >
            <PanelHeader
              title="Live City Overview"
              subtitle="Traffic, camera and observation context"
            >
              <div
                style={{
                  height: "29px",

                  display: "flex",

                  alignItems:
                    "center",

                  gap: "6px",

                  padding:
                    "0 10px",

                  borderRadius:
                    "6px",

                  background:
                    "#0b1b2d",

                  border:
                    "1px solid rgba(148,163,184,.10)",

                  color: "#c1d1df",

                  fontSize: "7px",
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
                  }}
                />

                Live
              </div>
            </PanelHeader>

            {/*
              IMPORTANT:
              CityMap is left untouched.
              Mapping remains your teammate's area.
            */}

            <div
              style={{
                height: "340px",

                overflow: "hidden",

                background:
                  "#081420",
              }}
            >
              <CityMap />
            </div>
          </section>

          {/* RECENT ALERTS */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Recent Alerts"
              subtitle="Latest backend-compatible alert events"
            >
              <Link
                to="/alerts"
                style={{
                  color: "#52a8ff",

                  textDecoration:
                    "none",

                  fontSize: "7px",
                }}
              >
                View all
              </Link>
            </PanelHeader>

            <div
              style={{
                padding:
                  "5px 10px 8px",
              }}
            >
              {recentAlerts.map(
                (
                  alert
                ) => (
                  <RecentAlertRow
                    key={
                      alert.id
                    }
                    alert={
                      alert
                    }
                  />
                )
              )}
            </div>
          </section>

          {/* CAMERA HEALTH */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Camera Health Summary"
              subtitle="Deployment reporting state"
            >
              <Link
                to="/cameras"
                style={{
                  color: "#52a8ff",

                  textDecoration:
                    "none",

                  fontSize: "7px",
                }}
              >
                View all
              </Link>
            </PanelHeader>

            <div
              style={{
                position: "relative",

                height: "165px",

                marginTop: "5px",
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={
                      cameraHealth
                    }
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={66}
                    stroke="none"
                  >
                    {cameraHealth.map(
                      (
                        item
                      ) => (
                        <Cell
                          key={
                            item.name
                          }
                          fill={
                            item.color
                          }
                        />
                      )
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div
                style={{
                  position:
                    "absolute",

                  left: "50%",
                  top: "50%",

                  transform:
                    "translate(-50%,-50%)",

                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize: "22px",

                    fontWeight: 760,
                  }}
                >
                  {
                    totalCameraCount
                  }
                </div>

                <div
                  style={{
                    marginTop: "1px",

                    color: "#6c8399",

                    fontSize: "6px",
                  }}
                >
                  Total
                </div>
              </div>
            </div>

            <div
              style={{
                padding:
                  "0 14px 12px",
              }}
            >
              {cameraHealth.map(
                (
                  item
                ) => (
                  <LegendValue
                    key={
                      item.name
                    }
                    label={
                      item.name
                    }
                    value={`${item.value} (${Math.round(
                      (item.value /
                        totalCameraCount) *
                        100
                    )}%)`}
                    color={
                      item.color
                    }
                  />
                )
              )}
            </div>
          </section>
        </div>

        {/* =================================================
            SECOND ROW
        ================================================= */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "1.05fr 1fr .72fr 1.05fr",

            gap: "12px",
          }}
        >
          {/* CORRIDORS */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Top Congested Corridors"
              subtitle="Ranked by congestion ratio"
            >
              <Link
                to="/traffic"
                style={
                  viewAllStyle
                }
              >
                View all
              </Link>
            </PanelHeader>

            <div
              style={{
                padding:
                  "0 12px 8px",
              }}
            >
              <div
                style={{
                  display: "grid",

                  gridTemplateColumns:
                    "1.4fr .7fr .6fr .7fr",

                  gap: "7px",

                  padding:
                    "9px 0",

                  color: "#657c92",

                  fontSize: "6px",

                  fontWeight: 700,

                  textTransform:
                    "uppercase",

                  borderBottom:
                    "1px solid rgba(148,163,184,.06)",
                }}
              >
                <div>
                  Corridor
                </div>

                <div>
                  Band
                </div>

                <div>
                  Ratio
                </div>

                <div>
                  Trend
                </div>
              </div>

              {corridors.map(
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
            </div>
          </section>

          {/* TRAFFIC BY ZONE */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Traffic by Zone"
              subtitle="Observed vehicle volume"
            />

            <div
              style={{
                height: "225px",

                padding:
                  "10px",
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    zoneData
                  }
                >
                  <CartesianGrid
                    stroke="rgba(148,163,184,.07)"
                    vertical={
                      false
                    }
                  />

                  <XAxis
                    dataKey="zone"
                    tick={{
                      fill:
                        "#60778e",
                      fontSize: 6,
                    }}
                    stroke="rgba(148,163,184,.08)"
                  />

                  <YAxis
                    tick={{
                      fill:
                        "#60778e",
                      fontSize: 6,
                    }}
                    stroke="rgba(148,163,184,.08)"
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        "#0b1b2d",

                      border:
                        "1px solid rgba(148,163,184,.10)",

                      borderRadius:
                        "7px",

                      color: "white",

                      fontSize:
                        "8px",
                    }}
                  />

                  <Bar
                    dataKey="vehicles"
                    fill="#2563eb"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ALERT BREAKDOWN */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Alert Severity"
              subtitle="Current alert distribution"
            >
              <Link
                to="/alerts"
                style={
                  viewAllStyle
                }
              >
                View all
              </Link>
            </PanelHeader>

            <div
              style={{
                padding:
                  "15px 13px",
              }}
            >
              {alertSeverityData.map(
                (
                  item
                ) => (
                  <SeverityBar
                    key={
                      item.name
                    }
                    item={
                      item
                    }
                    total={
                      alertCount
                    }
                  />
                )
              )}
            </div>
          </section>

          {/* INSIGHTS */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Key Insights"
              subtitle="Derived operational observations"
            >
              <Link
                to="/analytics"
                style={
                  viewAllStyle
                }
              >
                View all
              </Link>
            </PanelHeader>

            <div
              style={{
                padding:
                  "6px 11px 8px",
              }}
            >
              {insights.map(
                (
                  insight
                ) => (
                  <InsightRow
                    key={
                      insight.title
                    }
                    {...insight}
                  />
                )
              )}
            </div>
          </section>
        </div>

        {/* =================================================
            TRAFFIC TREND
        ================================================= */}

        <section
          style={{
            ...panelStyle,

            marginTop: "12px",
          }}
        >
          <PanelHeader
            title="Traffic Trend"
            subtitle="Traffic index across the selected time window"
          >
            <span
              style={{
                color: "#657c92",

                fontSize: "7px",
              }}
            >
              Derived from analytics feed
            </span>
          </PanelHeader>

          <div
            style={{
              height: "155px",

              padding:
                "8px 14px 5px",
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={
                  trafficTrend
                }
              >
                <CartesianGrid
                  stroke="rgba(148,163,184,.06)"
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="time"
                  tick={{
                    fill:
                      "#61788e",
                    fontSize: 6,
                  }}
                  stroke="rgba(148,163,184,.08)"
                />

                <YAxis
                  domain={[
                    0,
                    100,
                  ]}
                  tick={{
                    fill:
                      "#61788e",
                    fontSize: 6,
                  }}
                  stroke="rgba(148,163,184,.08)"
                />

                <Tooltip
                  contentStyle={{
                    background:
                      "#0b1b2d",

                    border:
                      "1px solid rgba(148,163,184,.10)",

                    borderRadius:
                      "7px",

                    color: "white",

                    fontSize: "8px",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{
                    r: 2.2,
                    fill:
                      "#60a5fa",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          style={{
            marginTop: "12px",

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

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

              gap: "17px",

              color: "#61798f",

              fontSize: "7px",
            }}
          >
            <span>
              ◉ Times shown in IST
            </span>

            <span>
              ◉ Analytics refresh every 30 sec
            </span>

            <span>
              ◉ Insights are derived from operational data
            </span>
          </div>

          <div
            style={{
              color: "#526a81",

              fontSize: "7px",
            }}
          >
            City Intelligence · Operations
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   KPI CARD
========================================================= */

function DashboardMetric({
  title,
  value,
  detail,
  detailColor,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string;
  detail: string;
  detailColor: string;
  icon: string;
  color: string;
  trend: number[];
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

          gap: "10px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",

            flexShrink: 0,

            borderRadius:
              "50%",

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            background:
              `${color}13`,

            border:
              `1px solid ${color}25`,

            color,

            fontSize: "15px",
          }}
        >
          {icon}
        </div>

        <div>
          <div
            style={{
              color: "#8499ad",

              fontSize: "7px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop: "3px",

              fontSize: "20px",

              fontWeight: 750,
            }}
          >
            {value}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "7px",

          color:
            detailColor,

          fontSize: "6px",
        }}
      >
        {detail}
      </div>

      <MiniSparkline
        values={
          trend
        }
        color={
          color
        }
      />
    </div>
  );
}

/* =========================================================
   HEALTH KPI
========================================================= */

function HealthMetric({
  title,
  value,
  detail,
  color,
}: {
  title: string;
  value: string;
  detail: string;
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
          color: "#8298ad",

          fontSize: "7px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "6px",

          fontSize: "21px",

          fontWeight: 750,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "5px",

          color,

          fontSize: "6px",

          fontWeight: 650,
        }}
      >
        {detail}
      </div>

      <div
        style={{
          marginTop: "10px",

          height: "4px",

          overflow: "hidden",

          borderRadius:
            "100px",

          background:
            "#13273a",
        }}
      >
        <div
          style={{
            width: "92%",

            height: "100%",

            borderRadius:
              "100px",

            background:
              color,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   PANEL HEADER
========================================================= */

function PanelHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "50px",

        display: "flex",

        justifyContent:
          "space-between",

        alignItems:
          "center",

        gap: "10px",

        padding:
          "10px 12px",

        borderBottom:
          "1px solid rgba(148,163,184,.07)",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "10px",

            fontWeight: 700,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: "3px",

            color: "#5e768d",

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

/* =========================================================
   ALERT ROW
========================================================= */

function RecentAlertRow({
  alert,
}: {
  alert: RecentAlert;
}) {
  const color =
    severityColor(
      alert.severity
    );

  return (
    <Link
      to="/alerts"
      style={{
        display: "grid",

        gridTemplateColumns:
          "54px 1fr",

        gap: "8px",

        alignItems:
          "center",

        minHeight: "56px",

        padding:
          "7px 4px",

        borderBottom:
          "1px solid rgba(148,163,184,.055)",

        color: "inherit",

        textDecoration:
          "none",
      }}
    >
      <div
        style={{
          padding:
            "4px 5px",

          width: "fit-content",

          borderRadius:
            "5px",

          color,

          background:
            `${color}12`,

          border:
            `1px solid ${color}22`,

          fontSize: "6px",

          fontWeight: 750,

          textTransform:
            "uppercase",
        }}
      >
        {alert.severity}
      </div>

      <div
        style={{
          minWidth: 0,
        }}
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
          <span
            style={{
              color: "#dae6f2",

              fontSize: "8px",

              fontWeight: 700,

              overflow:
                "hidden",

              whiteSpace:
                "nowrap",

              textOverflow:
                "ellipsis",
            }}
          >
            {alert.title}
          </span>

          <span
            style={{
              color: "#647b91",

              fontSize: "6px",

              whiteSpace:
                "nowrap",
            }}
          >
            {alert.time}
          </span>
        </div>

        <div
          style={{
            marginTop: "4px",

            color: "#6c8298",

            fontSize: "6.5px",
          }}
        >
          {alert.plate
            ? `${alert.plate} · `
            : ""}
          {alert.zone} ·{" "}
          {alert.cameraId}
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   CAMERA LEGEND
========================================================= */

function LegendValue({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns:
          "9px 1fr auto",

        gap: "7px",

        alignItems:
          "center",

        marginBottom:
          "7px",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",

          borderRadius:
            "50%",

          background:
            color,
        }}
      />

      <span
        style={{
          color: "#aebdcb",

          fontSize: "7px",
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: "#71879c",

          fontSize: "6.5px",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   CORRIDOR ROW
========================================================= */

function CorridorRow({
  corridor,
}: {
  corridor: Corridor;
}) {
  const color =
    congestionColor(
      corridor.congestionBand
    );

  return (
    <div
      style={{
        minHeight: "40px",

        display: "grid",

        gridTemplateColumns:
          "1.4fr .7fr .6fr .7fr",

        gap: "7px",

        alignItems:
          "center",

        borderBottom:
          "1px solid rgba(148,163,184,.05)",
      }}
    >
      <div>
        <div
          style={{
            color: "#d3e0eb",

            fontSize: "7px",

            fontWeight: 650,
          }}
        >
          {corridor.name}
        </div>

        <div
          style={{
            marginTop: "2px",

            color: "#536b82",

            fontSize: "5.5px",
          }}
        >
          {
            corridor.fromCamera
          }
          {" → "}
          {
            corridor.toCamera
          }
        </div>
      </div>

      <span
        style={{
          width: "fit-content",

          padding:
            "3px 6px",

          borderRadius:
            "5px",

          color,

          background:
            `${color}11`,

          border:
            `1px solid ${color}20`,

          fontSize: "5.5px",

          fontWeight: 700,

          textTransform:
            "capitalize",
        }}
      >
        {
          corridor.congestionBand
        }
      </span>

      <div
        style={{
          color: "#d9e6f1",

          fontSize: "7px",

          fontWeight: 700,
        }}
      >
        {corridor.congestionRatio.toFixed(
          2
        )}
      </div>

      <MiniSparkline
        values={
          corridor.trend
        }
        color={
          color
        }
        compact
      />
    </div>
  );
}

/* =========================================================
   ALERT SEVERITY
========================================================= */

function SeverityBar({
  item,
  total,
}: {
  item: {
    name: string;
    value: number;
    color: string;
  };
  total: number;
}) {
  const percentage =
    Math.round(
      (item.value /
        total) *
        100
    );

  return (
    <div
      style={{
        marginBottom:
          "14px",
      }}
    >
      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          marginBottom:
            "5px",
        }}
      >
        <span
          style={{
            color: "#bac8d5",

            fontSize: "7px",
          }}
        >
          {item.name}
        </span>

        <span
          style={{
            color: "#6f859a",

            fontSize: "6px",
          }}
        >
          {item.value} ·{" "}
          {percentage}%
        </span>
      </div>

      <div
        style={{
          height: "6px",

          borderRadius:
            "100px",

          overflow: "hidden",

          background:
            "#13263a",
        }}
      >
        <div
          style={{
            width:
              `${percentage}%`,

            height: "100%",

            borderRadius:
              "100px",

            background:
              item.color,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   INSIGHT
========================================================= */

function InsightRow({
  title,
  text,
  time,
  color,
  icon,
}: {
  title: string;
  text: string;
  time: string;
  color: string;
  icon: string;
}) {
  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns:
          "28px 1fr",

        gap: "8px",

        padding:
          "8px 0",

        borderBottom:
          "1px solid rgba(148,163,184,.05)",
      }}
    >
      <div
        style={{
          width: "27px",
          height: "27px",

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
            `1px solid ${color}20`,

          color,

          fontSize: "9px",

          fontWeight: 750,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            display: "flex",

            justifyContent:
              "space-between",

            gap: "8px",
          }}
        >
          <span
            style={{
              color,

              fontSize: "7px",

              fontWeight: 700,
            }}
          >
            {title}
          </span>

          <span
            style={{
              color: "#587087",

              fontSize: "5.5px",

              whiteSpace:
                "nowrap",
            }}
          >
            {time}
          </span>
        </div>

        <div
          style={{
            marginTop: "3px",

            color: "#71879c",

            fontSize: "6px",

            lineHeight: 1.45,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SPARKLINE
========================================================= */

function MiniSparkline({
  values,
  color,
  compact = false,
}: {
  values: number[];
  color: string;
  compact?: boolean;
}) {
  const width =
    compact
      ? 70
      : 150;

  const height =
    compact
      ? 20
      : 22;

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
              Math.max(
                1,
                values.length -
                  1
              )) *
            width;

          const y =
            height -
            2 -
            ((value -
              min) /
              Math.max(
                1,
                max -
                  min
              )) *
              (height -
                5);

          return `${x},${y}`;
        }
      )
      .join(" ");

  return (
    <svg
      width={
        compact
          ? "70"
          : "100%"
      }
      height={
        height
      }
      viewBox={`0 0 ${width} ${height}`}
      style={{
        marginTop:
          compact
            ? 0
            : "7px",
      }}
    >
      <polyline
        points={
          points
        }
        fill="none"
        stroke={
          color
        }
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function severityColor(
  severity:
    AlertSeverity
) {
  if (
    severity ===
    "critical"
  ) {
    return "#ef4444";
  }

  if (
    severity ===
    "high"
  ) {
    return "#f97316";
  }

  if (
    severity ===
    "medium"
  ) {
    return "#eab308";
  }

  return "#3b82f6";
}

function congestionColor(
  band:
    CongestionBand
) {
  if (
    band ===
    "severe"
  ) {
    return "#ef4444";
  }

  if (
    band ===
    "heavy"
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

/* =========================================================
   SHARED STYLES
========================================================= */

const metricCardStyle:
  CSSProperties =
  {
    minHeight: "100px",

    padding: "12px",

    borderRadius:
      "11px",

    background:
      "linear-gradient(145deg,#0b1c2f,#091827)",

    border:
      "1px solid rgba(148,163,184,.09)",

    boxShadow:
      "0 9px 22px rgba(0,0,0,.08)",
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

const headerControlStyle:
  CSSProperties =
  {
    height: "32px",

    borderRadius:
      "7px",

    border:
      "1px solid rgba(148,163,184,.10)",

    background:
      "#0b1b2d",

    color:
      "#b7c7d6",

    padding:
      "0 9px",

    outline: "none",

    fontSize: "7px",
  };

const viewAllStyle:
  CSSProperties =
  {
    color: "#52a8ff",

    textDecoration:
      "none",

    fontSize: "7px",
  };