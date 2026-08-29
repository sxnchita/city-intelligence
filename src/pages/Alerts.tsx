import { useMemo, useState } from "react";

import Sidebar from "../components/layout/Sidebar";

type Severity =
  | "critical"
  | "high"
  | "medium";

type AlertItem = {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  time: string;
  vehicle?: string;
  camera?: string;
  zone?: string;
  confidence?: string;
};

const demoAlerts: AlertItem[] = [
  {
    id: "A001",
    severity: "critical",
    title: "Blacklist Vehicle Detected",
    description:
      "Vehicle UP15AB1234 detected at C04 · ITO.",
    time: "10:42 PM",
    vehicle: "UP15AB1234",
    camera: "C04 · ITO",
    zone: "Central Delhi",
    confidence: "96%",
  },

  {
    id: "A002",
    severity: "high",
    title: "Impossible Speed",
    description:
      "Travel time between two camera sightings is below the valid threshold.",
    time: "10:36 PM",
    vehicle: "DL8CAF9211",
    camera: "C07",
    zone: "Central Delhi",
    confidence: "91%",
  },

  {
    id: "A003",
    severity: "high",
    title: "Possible Detour",
    description:
      "Vehicle path deviated significantly from the expected road route.",
    time: "10:28 PM",
    vehicle: "V123",
    camera: "C02 · India Gate",
    zone: "Central Delhi",
    confidence: "82%",
  },

  {
    id: "A004",
    severity: "medium",
    title: "Camera Silent",
    description:
      "Camera C08 has stopped reporting recent observations.",
    time: "10:18 PM",
    camera: "C08",
    zone: "West Delhi",
  },

  {
    id: "A005",
    severity: "medium",
    title: "Plate Mismatch",
    description:
      "Observed plate candidates conflict with the current vehicle identity score.",
    time: "10:06 PM",
    vehicle: "HR26DX4821",
    camera: "C11",
    zone: "North Delhi",
    confidence: "69%",
  },
];

type AlertFilter =
  | "all"
  | Severity;

export default function Alerts() {
  const [filter, setFilter] =
    useState<AlertFilter>("all");

  const [selectedAlertId, setSelectedAlertId] =
    useState("A001");

  const filteredAlerts =
    useMemo(() => {
      if (filter === "all") {
        return demoAlerts;
      }

      return demoAlerts.filter(
        (alert) =>
          alert.severity === filter
      );
    }, [filter]);

  const selectedAlert =
    demoAlerts.find(
      (alert) =>
        alert.id === selectedAlertId
    ) ?? demoAlerts[0];

  function handleFilterChange(
    value: AlertFilter
  ) {
    setFilter(value);

    if (value === "all") {
      return;
    }

    const firstMatchingAlert =
      demoAlerts.find(
        (alert) =>
          alert.severity === value
      );

    if (firstMatchingAlert) {
      setSelectedAlertId(
        firstMatchingAlert.id
      );
    }
  }

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
              Alerts
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "12px",
                color: "#7f9dbd",
              }}
            >
              Live incidents, anomalies and system warnings
            </div>
          </div>

          <select
            value={filter}
            onChange={(event) =>
              handleFilterChange(
                event.target
                  .value as AlertFilter
              )
            }
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
            <option value="all">
              All alerts
            </option>

            <option value="critical">
              Critical
            </option>

            <option value="high">
              High
            </option>

            <option value="medium">
              Medium
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
          <AlertKpi
            label="Active Alerts"
            value="7"
            color="#ef4444"
          />

          <AlertKpi
            label="Critical"
            value="1"
            color="#dc2626"
          />

          <AlertKpi
            label="High Priority"
            value="2"
            color="#f97316"
          />

          <AlertKpi
            label="Resolved Today"
            value="18"
            color="#22c55e"
          />
        </div>

        {/* CONTENT */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 2fr) minmax(300px, .8fr)",
            gap: "12px",
          }}
        >
          {/* ALERT FEED */}

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
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  Live Alert Feed
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "10px",
                    color: "#64748b",
                  }}
                >
                  Showing{" "}
                  {filteredAlerts.length}{" "}
                  alert
                  {filteredAlerts.length ===
                  1
                    ? ""
                    : "s"}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#4ade80",
                  fontSize: "10px",
                  fontWeight: 650,
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#22c55e",
                  }}
                />

                Demo feed
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {filteredAlerts.map(
                (alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    selected={
                      alert.id ===
                      selectedAlert.id
                    }
                    onClick={() =>
                      setSelectedAlertId(
                        alert.id
                      )
                    }
                  />
                )
              )}
            </div>
          </section>

          {/* DETAILS */}

          <aside
            style={{
              background: "#091828",
              border:
                "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              padding: "16px",
              alignSelf: "start",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                color: "#64748b",
                letterSpacing: "1px",
              }}
            >
              Selected alert
            </div>

            <div
              style={{
                marginTop: "8px",
                fontSize: "18px",
                fontWeight: 700,
                lineHeight: 1.35,
              }}
            >
              {selectedAlert.title}
            </div>

            <SeverityBadge
              severity={
                selectedAlert.severity
              }
            />

            <div
              style={{
                marginTop: "14px",
                padding: "11px",
                borderRadius: "9px",
                background: "#0c1b2d",
                color: "#8ba7c5",
                fontSize: "11px",
                lineHeight: 1.55,
              }}
            >
              {
                selectedAlert.description
              }
            </div>

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <Detail
                label="Alert ID"
                value={selectedAlert.id}
              />

              {selectedAlert.vehicle && (
                <Detail
                  label="Vehicle"
                  value={
                    selectedAlert.vehicle
                  }
                />
              )}

              {selectedAlert.camera && (
                <Detail
                  label="Camera"
                  value={
                    selectedAlert.camera
                  }
                />
              )}

              {selectedAlert.zone && (
                <Detail
                  label="Zone"
                  value={
                    selectedAlert.zone
                  }
                />
              )}

              <Detail
                label="Time"
                value={
                  selectedAlert.time
                }
              />

              {selectedAlert.confidence && (
                <Detail
                  label="Confidence"
                  value={
                    selectedAlert.confidence
                  }
                />
              )}
            </div>

            {selectedAlert.vehicle && (
              <button
                style={{
                  marginTop: "18px",
                  width: "100%",
                  height: "40px",
                  border: "none",
                  borderRadius: "9px",
                  background: "#2563eb",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 650,
                }}
              >
                Investigate Vehicle
              </button>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

// =====================================
// KPI
// =====================================

function AlertKpi({
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
          fontSize: "24px",
          fontWeight: 750,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// =====================================
// ALERT ROW
// =====================================

function AlertRow({
  alert,
  selected,
  onClick,
}: {
  alert: AlertItem;
  selected: boolean;
  onClick: () => void;
}) {
  const color =
    getSeverityColor(
      alert.severity
    );

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        background: selected
          ? "rgba(37,99,235,.12)"
          : "#0c1b2d",
        borderRadius: "10px",
        padding: "13px",
        border: selected
          ? "1px solid rgba(96,165,250,.30)"
          : "1px solid transparent",
        borderLeft: `3px solid ${color}`,
        color: "white",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: "12px",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 650,
          }}
        >
          {alert.title}
        </div>

        <div
          style={{
            fontSize: "9px",
            color,
            textTransform:
              "uppercase",
            fontWeight: 700,
          }}
        >
          {alert.severity}
        </div>
      </div>

      <div
        style={{
          marginTop: "6px",
          color: "#8ba7c5",
          fontSize: "11px",
          lineHeight: 1.5,
        }}
      >
        {alert.description}
      </div>

      <div
        style={{
          marginTop: "9px",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "9px",
          color: "#64748b",
        }}
      >
        {alert.vehicle && (
          <span>
            Vehicle:{" "}
            {alert.vehicle}
          </span>
        )}

        {alert.camera && (
          <span>
            Camera:{" "}
            {alert.camera}
          </span>
        )}

        <span>
          {alert.time}
        </span>
      </div>
    </button>
  );
}

// =====================================
// SEVERITY
// =====================================

function SeverityBadge({
  severity,
}: {
  severity: Severity;
}) {
  const color =
    getSeverityColor(
      severity
    );

  return (
    <div
      style={{
        display: "inline-block",
        marginTop: "10px",
        padding: "5px 8px",
        borderRadius: "20px",
        background: `${color}20`,
        color,
        fontSize: "9px",
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      {severity}
    </div>
  );
}

function getSeverityColor(
  severity: Severity
) {
  if (
    severity === "critical"
  ) {
    return "#ef4444";
  }

  if (
    severity === "high"
  ) {
    return "#f97316";
  }

  return "#f59e0b";
}

// =====================================
// DETAIL
// =====================================

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: "10px",
        background: "#0c1b2d",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          color: "#64748b",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: "3px",
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}