import { Link } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import CityMap from "../components/map/CityMap";

export default function Dashboard() {
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
              }}
            >
              Live Operations Dashboard
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
            value="24"
            detail="21 currently online"
          />

          <KpiCard
            label="Vehicles Detected"
            value="1,482"
            detail="Within last 15 min"
          />

          <KpiCard
            label="Active Alerts"
            value="7"
            detail="2 high priority"
            accent="#ef4444"
          />

          <KpiCard
            label="Severe Roads"
            value="4"
            detail="Current congestion"
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
              <AlertCard
                severity="high"
                title="Possible Detour"
                description="Vehicle V123 deviated from expected camera path."
                time="2 min ago"
              />

              <AlertCard
                severity="medium"
                title="Camera Silent"
                description="Camera C08 has stopped reporting recent sightings."
                time="8 min ago"
              />

              <AlertCard
                severity="low"
                title="Congestion Increase"
                description="Traffic density is rising near Central Corridor."
                time="11 min ago"
              />

              <AlertCard
                severity="high"
                title="Low Confidence Link"
                description="Trajectory hop confidence dropped below threshold."
                time="13 min ago"
              />
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

          <SightingRow
            vehicle="UP15AB1234"
            camera="C04 · ITO"
            zone="Central Delhi"
            time="10:42 PM"
            confidence="96%"
          />

          <SightingRow
            vehicle="DL8CAF9211"
            camera="C01 · Connaught Place"
            zone="Central Delhi"
            time="10:39 PM"
            confidence="93%"
          />

          <SightingRow
            vehicle="HR26DX4821"
            camera="C03 · Karol Bagh"
            zone="West Delhi"
            time="10:34 PM"
            confidence="89%"
          />
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