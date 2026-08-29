import Sidebar from "../components/layout/Sidebar";

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

const speedData = [
  { time: "18:00", speed: 42 },
  { time: "19:00", speed: 39 },
  { time: "20:00", speed: 35 },
  { time: "21:00", speed: 31 },
  { time: "22:00", speed: 28 },
  { time: "23:00", speed: 33 },
];

const flowData = [
  {
    route: "Central → East",
    vehicles: 420,
  },
  {
    route: "West → Central",
    vehicles: 365,
  },
  {
    route: "North → Central",
    vehicles: 310,
  },
  {
    route: "Central → South",
    vehicles: 284,
  },
  {
    route: "East → South",
    vehicles: 248,
  },
];

export default function Analytics() {
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
              }}
            >
              Analytics
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
            value="18,420"
            detail="Today"
          />

          <Kpi
            label="Unique Vehicles"
            value="6,281"
            detail="Estimated"
          />

          <Kpi
            label="Average Speed"
            value="32 km/h"
            detail="Across corridors"
          />

          <Kpi
            label="Top OD Flow"
            value="420"
            detail="Central → East"
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
            title="Average Corridor Speed"
            subtitle="Hourly speed trend"
          >
            <ResponsiveContainer
              width="100%"
              height={280}
            >
              <LineChart
                data={speedData}
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
                  dataKey="speed"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{
                    r: 3,
                    fill: "#38bdf8",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Top Origin-Destination Flows"
            subtitle="Highest vehicle movement pairs"
          >
            <ResponsiveContainer
              width="100%"
              height={280}
            >
              <BarChart
                data={flowData}
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
              <CorridorRow
                name="Central Corridor"
                speed="27 km/h"
                travelTime="18 min"
                status="Heavy"
                color="#f97316"
              />

              <CorridorRow
                name="ITO Approach"
                speed="19 km/h"
                travelTime="24 min"
                status="Severe"
                color="#ef4444"
              />

              <CorridorRow
                name="Pusa Road"
                speed="41 km/h"
                travelTime="11 min"
                status="Normal"
                color="#22c55e"
              />

              <CorridorRow
                name="Ring Connector"
                speed="31 km/h"
                travelTime="15 min"
                status="Moderate"
                color="#eab308"
              />
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
                text="Central → East is currently the strongest OD flow."
              />

              <Insight
                title="Slowest corridor"
                text="ITO Approach has the lowest average speed and highest travel delay."
              />

              <Insight
                title="Traffic trend"
                text="Average network speed dropped during the 21:00–22:00 interval."
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