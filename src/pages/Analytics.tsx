import {
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import Sidebar from "../components/layout/Sidebar";

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

type TimeRange =
  | "1h"
  | "6h"
  | "24h"
  | "7d"
  | "30d";

const trafficTrend = [
  { time: "10 AM", index: 52 },
  { time: "12 PM", index: 66 },
  { time: "02 PM", index: 74 },
  { time: "04 PM", index: 63 },
  { time: "06 PM", index: 77 },
  { time: "08 PM", index: 85 },
  { time: "10 PM", index: 73 },
  { time: "12 AM", index: 71 },
  { time: "02 AM", index: 48 },
  { time: "04 AM", index: 37 },
  { time: "06 AM", index: 24 },
  { time: "08 AM", index: 42 },
  { time: "Now", index: 68 },
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
    zone: "Airport Road",
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

const corridorSpeed = [
  {
    corridor: "Airport Road",
    speed: 42,
    status: "Smooth",
  },
  {
    corridor: "Sector 17 → 22",
    speed: 28,
    status: "Moderate",
  },
  {
    corridor: "Sector 22 → 35",
    speed: 24,
    status: "Heavy",
  },
  {
    corridor: "Sector 8 → 26",
    speed: 26,
    status: "Heavy",
  },
  {
    corridor: "Sector 35 → 52",
    speed: 22,
    status: "Severe",
  },
];

const violationData = [
  {
    name: "No Helmet",
    value: 96,
    color: "#ef4444",
  },
  {
    name: "Red Light Jump",
    value: 64,
    color: "#f97316",
  },
  {
    name: "Wrong Way",
    value: 42,
    color: "#eab308",
  },
  {
    name: "No Seatbelt",
    value: 28,
    color: "#22c55e",
  },
  {
    name: "Others",
    value: 18,
    color: "#6366f1",
  },
];

const insights = [
  {
    title: "High Congestion Alert",
    text:
      "Sector 17 → 22 corridor has high congestion during peak hours.",
    time: "2 min ago",
    color: "#ef4444",
    icon: "△",
  },
  {
    title: "Violation Hotspot",
    text:
      "No Helmet violations are high around Sector 22 and Sector 35.",
    time: "15 min ago",
    color: "#f59e0b",
    icon: "!",
  },
  {
    title: "Traffic Improvement",
    text:
      "Average speed improved by 8% on Airport Road corridor.",
    time: "30 min ago",
    color: "#22c55e",
    icon: "↗",
  },
  {
    title: "System Performance",
    text:
      "All active cameras are operational with healthy reporting.",
    time: "1 hr ago",
    color: "#3b82f6",
    icon: "i",
  },
];

export default function Analytics() {
  const [
    selectedRange,
    setSelectedRange,
  ] =
    useState<TimeRange>(
      "24h"
    );

  const [
    zoneFilter,
    setZoneFilter,
  ] =
    useState("all");

  const [
    zoneMetric,
    setZoneMetric,
  ] =
    useState<
      "vehicles" | "violations"
    >("vehicles");

  const totalViolations =
    violationData.reduce(
      (
        total,
        item
      ) =>
        total +
        item.value,
      0
    );

  const filteredZoneData =
    useMemo(
      () => {
        if (
          zoneFilter ===
          "all"
        ) {
          return zoneData;
        }

        return zoneData.filter(
          (
            zone
          ) =>
            zone.zone ===
            zoneFilter
        );
      },
      [
        zoneFilter,
      ]
    );

  return (
    <div
      style={{
        width:
          "100%",

        minHeight:
          "100vh",

        display:
          "flex",

        background:
          "#07111d",

        color:
          "#f8fafc",

        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <Sidebar />

      <main
        style={{
          flex:
            1,

          minWidth:
            0,

          padding:
            "18px 20px 22px",

          background:
            "radial-gradient(circle at top right, rgba(37,99,235,.055), transparent 34%), #07111d",
        }}
      >
        {/* =====================================
            HEADER
        ===================================== */}

        <div
          style={{
            display:
              "flex",

            alignItems:
              "flex-start",

            justifyContent:
              "space-between",

            gap:
              "18px",

            marginBottom:
              "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize:
                  "27px",

                fontWeight:
                  760,

                letterSpacing:
                  "-.5px",
              }}
            >
              Analytics
            </div>

            <div
              style={{
                marginTop:
                  "5px",

                color:
                  "#7d92a8",

                fontSize:
                  "10px",
              }}
            >
              Deep insights into traffic patterns, violations and system performance
            </div>
          </div>

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "7px",
            }}
          >
            <select
              defaultValue="today"
              style={
                headerControl
              }
            >
              <option value="today">
                Today
              </option>

              <option value="week">
                Last 7 days
              </option>

              <option value="month">
                Last 30 days
              </option>
            </select>

            <select
              value={
                selectedRange
              }
              onChange={(
                event
              ) =>
                setSelectedRange(
                  event.target
                    .value as TimeRange
                )
              }
              style={
                headerControl
              }
            >
              <option value="1h">
                Last 1 Hour
              </option>

              <option value="6h">
                Last 6 Hours
              </option>

              <option value="24h">
                Last 24 Hours
              </option>

              <option value="7d">
                Last 7 Days
              </option>

              <option value="30d">
                Last 30 Days
              </option>
            </select>

            <select
              value={
                zoneFilter
              }
              onChange={(
                event
              ) =>
                setZoneFilter(
                  event.target
                    .value
                )
              }
              style={
                headerControl
              }
            >
              <option value="all">
                All Zones
              </option>

              {zoneData.map(
                (
                  zone
                ) => (
                  <option
                    key={
                      zone.zone
                    }
                    value={
                      zone.zone
                    }
                  >
                    {
                      zone.zone
                    }
                  </option>
                )
              )}
            </select>

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "6px",

                color:
                  "#4ade80",

                fontSize:
                  "7px",

                fontWeight:
                  700,

                marginLeft:
                  "5px",
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
                    "0 0 9px rgba(34,197,94,.6)",
                }}
              />

              Live Data
            </div>

            <span
              style={{
                height:
                  "14px",

                width:
                  "1px",

                background:
                  "rgba(148,163,184,.18)",
              }}
            />

            <span
              style={{
                color:
                  "#70869b",

                fontSize:
                  "7px",
              }}
            >
              Updated 12 sec ago
            </span>

            <button
              style={{
                height:
                  "34px",

                padding:
                  "0 12px",

                borderRadius:
                  "7px",

                border:
                  "1px solid rgba(59,130,246,.28)",

                background:
                  "rgba(37,99,235,.14)",

                color:
                  "#8fc6ff",

                cursor:
                  "pointer",

                fontSize:
                  "7px",

                fontWeight:
                  650,
              }}
            >
              ⇩ Export Report
            </button>
          </div>
        </div>

        {/* =====================================
            KPI ROW
        ===================================== */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(6,minmax(0,1fr))",

            gap:
              "10px",

            marginBottom:
              "12px",
          }}
        >
          <AnalyticsMetric
            title="Total Vehicles"
            value="12,845"
            detail="+18.5% vs yesterday"
            detailColor="#22c55e"
            icon="▣"
            color="#3b82f6"
          />

          <AnalyticsMetric
            title="Violations Detected"
            value={String(
              totalViolations
            )}
            detail="+12.3% vs yesterday"
            detailColor="#ef4444"
            icon="⬟"
            color="#ef4444"
          />

          <AnalyticsMetric
            title="Avg Congestion Index"
            value="68"
            detail="+6 vs yesterday"
            detailColor="#f59e0b"
            icon="↗"
            color="#f59e0b"
          />

          <AnalyticsMetric
            title="Avg Speed"
            value="28 km/h"
            detail="-4 km/h vs yesterday"
            detailColor="#ef4444"
            icon="⌁"
            color="#8b5cf6"
          />

          <AnalyticsMetric
            title="Traffic Incidents"
            value="12"
            detail="-3 vs yesterday"
            detailColor="#22c55e"
            icon="△"
            color="#22c55e"
          />

          <AnalyticsMetric
            title="System Health"
            value="92%"
            detail="Optimal"
            detailColor="#22c55e"
            icon="⌁"
            color="#22c55e"
          />
        </div>

        {/* =====================================
            TOP CONTENT ROW
        ===================================== */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "1.05fr 1.05fr .95fr",

            gap:
              "12px",

            marginBottom:
              "12px",
          }}
        >
          {/* HEATMAP */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Traffic Heatmap"
              subtitle="Vehicle density across the city"
            >
              <select
                defaultValue="density"
                style={
                  smallSelect
                }
              >
                <option value="density">
                  Vehicle Density
                </option>

                <option value="congestion">
                  Congestion
                </option>
              </select>
            </PanelHeader>

            <div
              style={{
                position:
                  "relative",

                height:
                  "250px",

                overflow:
                  "hidden",

                background:
                  "#071523",
              }}
            >
              <div
                style={{
                  position:
                    "absolute",

                  inset:
                    0,

                  backgroundImage:
                    "linear-gradient(rgba(96,165,250,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,.035) 1px, transparent 1px)",

                  backgroundSize:
                    "30px 30px",
                }}
              />

              <svg
                width="100%"
                height="100%"
                viewBox="0 0 600 300"
                preserveAspectRatio="none"
                style={{
                  position:
                    "absolute",

                  inset:
                    0,

                  opacity:
                    .45,
                }}
              >
                <path
                  d="M20 100 C120 80 170 140 250 110 C340 80 400 40 580 70"
                  fill="none"
                  stroke="#31516d"
                  strokeWidth="2"
                />

                <path
                  d="M0 180 C100 160 170 200 250 170 C330 140 450 150 600 180"
                  fill="none"
                  stroke="#31516d"
                  strokeWidth="2"
                />

                <path
                  d="M100 0 C130 70 100 130 150 200 C180 240 260 250 300 300"
                  fill="none"
                  stroke="#31516d"
                  strokeWidth="2"
                />

                <path
                  d="M370 0 C330 60 360 120 400 180 C440 240 500 250 530 300"
                  fill="none"
                  stroke="#31516d"
                  strokeWidth="2"
                />
              </svg>

              <HeatBlob
                left="47%"
                top="48%"
                size={110}
                color="#ef4444"
                label="City Center"
              />

              <HeatBlob
                left="33%"
                top="27%"
                size={72}
                color="#eab308"
                label="Sector 17"
              />

              <HeatBlob
                left="20%"
                top="66%"
                size={64}
                color="#22c55e"
                label="Sector 35"
              />

              <HeatBlob
                left="70%"
                top="63%"
                size={65}
                color="#eab308"
                label="Industrial"
              />

              <HeatBlob
                left="78%"
                top="23%"
                size={55}
                color="#22c55e"
                label="Airport"
              />

              <div
                style={{
                  position:
                    "absolute",

                  left:
                    "10px",

                  top:
                    "15px",

                  padding:
                    "9px",

                  borderRadius:
                    "8px",

                  background:
                    "rgba(7,17,29,.88)",

                  border:
                    "1px solid rgba(148,163,184,.08)",

                  fontSize:
                    "6px",

                  color:
                    "#91a5b9",
                }}
              >
                <LegendRow
                  color="#ef4444"
                  label="High Density"
                />

                <LegendRow
                  color="#eab308"
                  label="Moderate"
                />

                <LegendRow
                  color="#22c55e"
                  label="Low Density"
                />
              </div>
            </div>
          </section>

          {/* TREND */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Traffic Trend"
              subtitle="Traffic index over time"
            >
              <select
                defaultValue="index"
                style={
                  smallSelect
                }
              >
                <option value="index">
                  Traffic Index
                </option>

                <option value="speed">
                  Average Speed
                </option>
              </select>
            </PanelHeader>

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "flex-end",

                gap:
                  "4px",

                padding:
                  "8px 12px 0",
              }}
            >
              {[
                "1H",
                "6H",
                "24H",
                "7D",
                "30D",
              ].map(
                (
                  range
                ) => {
                  const active =
                    range.toLowerCase() ===
                    selectedRange;

                  return (
                    <button
                      key={
                        range
                      }
                      onClick={() =>
                        setSelectedRange(
                          range.toLowerCase() as TimeRange
                        )
                      }
                      style={{
                        width:
                          "37px",

                        height:
                          "25px",

                        borderRadius:
                          "5px",

                        border:
                          active
                            ? "1px solid rgba(59,130,246,.40)"
                            : "1px solid rgba(148,163,184,.06)",

                        background:
                          active
                            ? "#2563eb"
                            : "#0b1b2d",

                        color:
                          active
                            ? "white"
                            : "#788ea3",

                        cursor:
                          "pointer",

                        fontSize:
                          "6px",

                        fontWeight:
                          700,
                      }}
                    >
                      {range}
                    </button>
                  );
                }
              )}
            </div>

            <div
              style={{
                height:
                  "205px",

                padding:
                  "4px 10px 8px",
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
                    stroke="rgba(148,163,184,.08)"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                    tick={{
                      fill:
                        "#61778d",
                      fontSize: 7,
                    }}
                    stroke="rgba(148,163,184,.10)"
                  />

                  <YAxis
                    domain={[
                      0,
                      100,
                    ]}
                    tick={{
                      fill:
                        "#61778d",
                      fontSize: 7,
                    }}
                    stroke="rgba(148,163,184,.10)"
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        "#0b1b2d",
                      border:
                        "1px solid rgba(148,163,184,.10)",
                      borderRadius:
                        "7px",
                      color:
                        "#fff",
                      fontSize:
                        "8px",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="index"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{
                      r: 2.6,
                      fill:
                        "#60a5fa",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* VIOLATION DONUT */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Violation Breakdown"
              subtitle="By violation type"
            />

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "1fr 1fr",

                alignItems:
                  "center",

                gap:
                  "8px",

                minHeight:
                  "255px",

                padding:
                  "10px",
              }}
            >
              <div
                style={{
                  position:
                    "relative",

                  height:
                    "190px",
                }}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={
                        violationData
                      }
                      dataKey="value"
                      nameKey="name"
                      innerRadius={47}
                      outerRadius={70}
                      stroke="none"
                    >
                      {violationData.map(
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

                    left:
                      "50%",

                    top:
                      "50%",

                    transform:
                      "translate(-50%,-50%)",

                    textAlign:
                      "center",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "23px",

                      fontWeight:
                        750,
                    }}
                  >
                    {
                      totalViolations
                    }
                  </div>

                  <div
                    style={{
                      marginTop:
                        "2px",

                      color:
                        "#6e8499",

                      fontSize:
                        "7px",
                    }}
                  >
                    Total
                  </div>
                </div>
              </div>

              <div>
                {violationData.map(
                  (
                    item
                  ) => (
                    <ViolationLegend
                      key={
                        item.name
                      }
                      item={
                        item
                      }
                      total={
                        totalViolations
                      }
                    />
                  )
                )}
              </div>
            </div>

            <div
              style={{
                padding:
                  "0 12px 11px",

                textAlign:
                  "right",

                color:
                  "#ef4444",

                fontSize:
                  "7px",
              }}
            >
              +12.3% vs yesterday
            </div>
          </section>
        </div>

        {/* =====================================
            BOTTOM ROW
        ===================================== */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "1.05fr 1.05fr .95fr",

            gap:
              "12px",
          }}
        >
          {/* TRAFFIC BY ZONE */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Traffic by Zone"
              subtitle="Vehicle count by zone"
            >
              <div
                style={{
                  display:
                    "flex",

                  gap:
                    "4px",
                }}
              >
                <ToggleButton
                  label="Vehicles"
                  active={
                    zoneMetric ===
                    "vehicles"
                  }
                  onClick={() =>
                    setZoneMetric(
                      "vehicles"
                    )
                  }
                />

                <ToggleButton
                  label="Violations"
                  active={
                    zoneMetric ===
                    "violations"
                  }
                  onClick={() =>
                    setZoneMetric(
                      "violations"
                    )
                  }
                />
              </div>
            </PanelHeader>

            <div
              style={{
                height:
                  "240px",

                padding:
                  "11px",
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    filteredZoneData
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
                      fontSize: 7,
                    }}
                    stroke="rgba(148,163,184,.10)"
                  />

                  <YAxis
                    tick={{
                      fill:
                        "#60778e",
                      fontSize: 7,
                    }}
                    stroke="rgba(148,163,184,.10)"
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        "#0b1b2d",
                      border:
                        "1px solid rgba(148,163,184,.10)",
                      borderRadius:
                        "7px",
                      color:
                        "white",
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

          {/* SPEED BY CORRIDOR */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Average Speed by Corridor"
              subtitle="Average speed in km/h"
            />

            <div
              style={{
                padding:
                  "14px 15px",
              }}
            >
              {corridorSpeed.map(
                (
                  corridor
                ) => (
                  <SpeedRow
                    key={
                      corridor.corridor
                    }
                    corridor={
                      corridor.corridor
                    }
                    speed={
                      corridor.speed
                    }
                    status={
                      corridor.status
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
              subtitle="AI-powered operational insights"
            />

            <div
              style={{
                padding:
                  "8px 12px",
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

        {/* =====================================
            FOOTER
        ===================================== */}

        <div
          style={{
            marginTop:
              "12px",

            padding:
              "10px 13px",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

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
              color:
                "#657d94",

              fontSize:
                "7px",
            }}
          >
            ◇ Analytics are generated from real-time feeds and historical data. Insights update continuously.
          </div>

          <div
            style={{
              color:
                "#526a81",

              fontSize:
                "7px",
            }}
          >
            City Intelligence · Analytics Engine
          </div>
        </div>
      </main>
    </div>
  );
}

/* =====================================
   KPI
===================================== */

function AnalyticsMetric({
  title,
  value,
  detail,
  detailColor,
  icon,
  color,
}: {
  title: string;
  value: string;
  detail: string;
  detailColor: string;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={
        metricStyle
      }
    >
      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            "10px",
        }}
      >
        <div
          style={{
            width:
              "40px",

            height:
              "40px",

            flexShrink:
              0,

            borderRadius:
              "50%",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            background:
              `${color}13`,

            border:
              `1px solid ${color}25`,

            color,

            fontSize:
              "15px",
          }}
        >
          {icon}
        </div>

        <div>
          <div
            style={{
              color:
                "#8298ad",

              fontSize:
                "7px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop:
                "3px",

              fontSize:
                "19px",

              fontWeight:
                750,
            }}
          >
            {value}
          </div>

          <div
            style={{
              marginTop:
                "3px",

              color:
                detailColor,

              fontSize:
                "6px",
            }}
          >
            {detail}
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
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight:
          "52px",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "space-between",

        gap:
          "10px",

        padding:
          "11px 13px",

        borderBottom:
          "1px solid rgba(148,163,184,.07)",
      }}
    >
      <div>
        <div
          style={{
            fontSize:
              "10px",

            fontWeight:
              700,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop:
              "3px",

            color:
              "#60778f",

            fontSize:
              "6.5px",
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
   HEATMAP
===================================== */

function HeatBlob({
  left,
  top,
  size,
  color,
  label,
}: {
  left: string;
  top: string;
  size: number;
  color: string;
  label: string;
}) {
  return (
    <div
      style={{
        position:
          "absolute",

        left,
        top,

        transform:
          "translate(-50%,-50%)",

        width:
          `${size}px`,

        height:
          `${size}px`,

        borderRadius:
          "50%",

        background:
          `radial-gradient(circle, ${color}dd 0%, ${color}77 25%, ${color}25 55%, transparent 74%)`,

        filter:
          "blur(2px)",

        boxShadow:
          `0 0 ${size / 2}px ${color}55`,
      }}
    >
      <div
        style={{
          position:
            "absolute",

          left:
            "50%",

          top:
            "50%",

          transform:
            "translate(-50%,-50%)",

          color:
            "#eaf3fb",

          whiteSpace:
            "nowrap",

          fontSize:
            "6px",

          fontWeight:
            650,

          textShadow:
            "0 2px 6px #000",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div
      style={{
        display:
          "flex",

        alignItems:
          "center",

        gap:
          "6px",

        marginBottom:
          "6px",
      }}
    >
      <span
        style={{
          width:
            "4px",

          height:
            "19px",

          borderRadius:
            "5px",

          background:
            color,
        }}
      />

      <span>
        {label}
      </span>
    </div>
  );
}

/* =====================================
   VIOLATION LEGEND
===================================== */

function ViolationLegend({
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
  return (
    <div
      style={{
        display:
          "grid",

        gridTemplateColumns:
          "9px 1fr auto",

        gap:
          "7px",

        alignItems:
          "center",

        marginBottom:
          "9px",
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
            item.color,
        }}
      />

      <div
        style={{
          color:
            "#c4d1dd",

          fontSize:
            "7px",
        }}
      >
        {item.name}
      </div>

      <div
        style={{
          color:
            "#93a8bc",

          fontSize:
            "6.5px",

          textAlign:
            "right",
        }}
      >
        {item.value}{" "}
        (
        {(
          (item.value /
            total) *
          100
        ).toFixed(1)}
        %)
      </div>
    </div>
  );
}

/* =====================================
   SPEED ROW
===================================== */

function SpeedRow({
  corridor,
  speed,
  status,
}: {
  corridor: string;
  speed: number;
  status: string;
}) {
  const color =
    status ===
    "Smooth"
      ? "#22c55e"
      : status ===
        "Moderate"
      ? "#eab308"
      : status ===
        "Heavy"
      ? "#f97316"
      : "#ef4444";

  return (
    <div
      style={{
        display:
          "grid",

        gridTemplateColumns:
          "130px 1fr 42px",

        gap:
          "10px",

        alignItems:
          "center",

        marginBottom:
          "16px",
      }}
    >
      <div
        style={{
          color:
            "#bac8d5",

          fontSize:
            "7px",
        }}
      >
        {corridor}
      </div>

      <div
        style={{
          height:
            "11px",

          borderRadius:
            "2px",

          background:
            "#12263a",

          overflow:
            "hidden",
        }}
      >
        <div
          style={{
            width:
              `${Math.min(
                100,
                (speed / 50) *
                  100
              )}%`,

            height:
              "100%",

            background:
              color,
          }}
        />
      </div>

      <div
        style={{
          color:
            "#dce8f3",

          fontSize:
            "7px",

          fontWeight:
            650,
        }}
      >
        {speed} km/h
      </div>
    </div>
  );
}

/* =====================================
   INSIGHT
===================================== */

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
        display:
          "grid",

        gridTemplateColumns:
          "32px 1fr auto",

        gap:
          "9px",

        alignItems:
          "flex-start",

        padding:
          "9px 0",

        borderBottom:
          "1px solid rgba(148,163,184,.055)",
      }}
    >
      <div
        style={{
          width:
            "30px",

          height:
            "30px",

          borderRadius:
            "50%",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          color,

          background:
            `${color}13`,

          border:
            `1px solid ${color}20`,

          fontSize:
            "10px",

          fontWeight:
            750,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color,

            fontSize:
              "7px",

            fontWeight:
              700,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop:
              "3px",

            color:
              "#748ba1",

            fontSize:
              "6.5px",

            lineHeight:
              1.45,
          }}
        >
          {text}
        </div>
      </div>

      <div
        style={{
          color:
            "#61788e",

          fontSize:
            "6px",

          whiteSpace:
            "nowrap",
        }}
      >
        {time}
      </div>
    </div>
  );
}

/* =====================================
   TOGGLE
===================================== */

function ToggleButton({
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
        height:
          "27px",

        padding:
          "0 8px",

        borderRadius:
          "5px",

        border:
          active
            ? "1px solid rgba(59,130,246,.38)"
            : "1px solid rgba(148,163,184,.07)",

        background:
          active
            ? "#2563eb"
            : "#0b1b2d",

        color:
          active
            ? "white"
            : "#758ba1",

        cursor:
          "pointer",

        fontSize:
          "6px",

        fontWeight:
          650,
      }}
    >
      {label}
    </button>
  );
}

/* =====================================
   STYLES
===================================== */

const metricStyle:
  CSSProperties =
  {
    minHeight:
      "90px",

    padding:
      "13px",

    borderRadius:
      "11px",

    display:
      "flex",

    alignItems:
      "center",

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

const headerControl:
  CSSProperties =
  {
    height:
      "34px",

    borderRadius:
      "7px",

    border:
      "1px solid rgba(148,163,184,.10)",

    background:
      "#0b1b2d",

    color:
      "#b9c8d7",

    outline:
      "none",

    padding:
      "0 9px",

    fontSize:
      "7px",
  };

const smallSelect:
  CSSProperties =
  {
    height:
      "29px",

    borderRadius:
      "6px",

    border:
      "1px solid rgba(148,163,184,.10)",

    background:
      "#0b1b2d",

    color:
      "#b8c7d5",

    outline:
      "none",

    padding:
      "0 8px",

    fontSize:
      "6.5px",
  };