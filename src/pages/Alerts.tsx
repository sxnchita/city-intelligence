import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import Sidebar from "../components/layout/Sidebar";

type Severity =
  | "critical"
  | "medium"
  | "low";

type AlertStatus =
  | "active"
  | "resolved";

type AlertItem = {
  alertId: string;
  title: string;
  type: string;
  severity: Severity;
  status: AlertStatus;

  plate?: string;

  cameraId: string;
  cameraName: string;

  zone: string;

  location: string;

  description: string;

  occurredAt: string;

  relativeTime: string;

  repeatCount: number;

  vehicleType?: string;

  vehicleColour?: string;

  confidence?: number;

  firstSeen?: string;

  lastSeen?: string;
};

const demoAlerts: AlertItem[] = [
  {
    alertId:
      "ALRT_2025_1248",

    title:
      "Blacklisted Vehicle Detected",

    type:
      "BLACKLIST_MATCH",

    severity:
      "critical",

    status:
      "active",

    plate:
      "CH01AB1234",

    cameraId:
      "CHD_CAM_01",

    cameraName:
      "Sector 22_23 Junction",

    zone:
      "Sector 22_23",

    location:
      "Sector 22_23 Junction",

    description:
      "Vehicle detected in blacklist database. Stolen vehicle case reported and requires immediate review.",

    occurredAt:
      "09:36:45 AM",

    relativeTime:
      "2 min ago",

    repeatCount: 3,

    vehicleType:
      "SUV",

    vehicleColour:
      "White",

    confidence:
      96,

    firstSeen:
      "12 May 2025, 09:31 AM",

    lastSeen:
      "12 May 2025, 09:36 AM",
  },

  {
    alertId:
      "ALRT_2025_1247",

    title:
      "Wrong Way Driving",

    type:
      "WRONG_WAY",

    severity:
      "medium",

    status:
      "active",

    plate:
      "CH01CD5678",

    cameraId:
      "CHD_CAM_04",

    cameraName:
      "Sector 17_21 Junction",

    zone:
      "Sector 17_21",

    location:
      "Sector 17_21 Junction",

    description:
      "Vehicle detected moving in the wrong direction.",

    occurredAt:
      "09:33:20 AM",

    relativeTime:
      "5 min ago",

    repeatCount: 1,

    vehicleType:
      "Sedan",

    vehicleColour:
      "Silver",

    confidence:
      91,
  },

  {
    alertId:
      "ALRT_2025_1246",

    title:
      "Congestion Detected",

    type:
      "CONGESTION",

    severity:
      "low",

    status:
      "active",

    cameraId:
      "CHD_CAM_07",

    cameraName:
      "Sector 8_18 Junction",

    zone:
      "Sector 8_18",

    location:
      "Sector 8_18 Junction",

    description:
      "High traffic density detected.",

    occurredAt:
      "09:31:04 AM",

    relativeTime:
      "7 min ago",

    repeatCount: 2,

    confidence:
      88,
  },

  {
    alertId:
      "ALRT_2025_1245",

    title:
      "Blacklisted Vehicle Detected",

    type:
      "BLACKLIST_MATCH",

    severity:
      "critical",

    status:
      "active",

    plate:
      "PB10EF9012",

    cameraId:
      "CHD_CAM_03",

    cameraName:
      "IT Park Chowk",

    zone:
      "IT Park",

    location:
      "IT Park Chowk",

    description:
      "Vehicle flagged in blacklist database.",

    occurredAt:
      "09:26:10 AM",

    relativeTime:
      "12 min ago",

    repeatCount: 2,

    vehicleType:
      "Hatchback",

    vehicleColour:
      "Black",

    confidence:
      94,
  },

  {
    alertId:
      "ALRT_2025_1244",

    title:
      "No Helmet Detected",

    type:
      "NO_HELMET",

    severity:
      "medium",

    status:
      "active",

    cameraId:
      "CHD_CAM_05",

    cameraName:
      "Sector 35_36 Crossing",

    zone:
      "Sector 35_36",

    location:
      "Sector 35_36 Crossing",

    description:
      "Motorcycle rider detected without helmet.",

    occurredAt:
      "09:23:11 AM",

    relativeTime:
      "15 min ago",

    repeatCount: 1,

    confidence:
      89,
  },

  {
    alertId:
      "ALRT_2025_1243",

    title:
      "Signal Jumping",

    type:
      "SIGNAL_VIOLATION",

    severity:
      "medium",

    status:
      "active",

    cameraId:
      "CHD_CAM_02",

    cameraName:
      "Elante Mall Junction",

    zone:
      "Industrial Area",

    location:
      "Elante Mall Junction",

    description:
      "Red light violation detected.",

    occurredAt:
      "09:20:34 AM",

    relativeTime:
      "18 min ago",

    repeatCount: 1,

    confidence:
      92,
  },
];

type TypeFilter =
  | "all"
  | string;

type SeverityFilter =
  | "all"
  | Severity;

type ZoneFilter =
  | "all"
  | string;

export default function Alerts() {
  const [
    selectedId,
    setSelectedId,
  ] =
    useState(
      demoAlerts[0]
        .alertId
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<TypeFilter>(
      "all"
    );

  const [
    severityFilter,
    setSeverityFilter,
  ] =
    useState<SeverityFilter>(
      "all"
    );

  const [
    zoneFilter,
    setZoneFilter,
  ] =
    useState<ZoneFilter>(
      "all"
    );

  const [
    showToast,
    setShowToast,
  ] =
    useState(true);

  const [
    resolvedIds,
    setResolvedIds,
  ] =
    useState<
      string[]
    >([]);

  const selectedAlert =
    demoAlerts.find(
      (alert) =>
        alert.alertId ===
        selectedId
    ) ??
    demoAlerts[0];

  const filtered =
    useMemo(
      () => {
        const value =
          search
            .trim()
            .toLowerCase();

        return demoAlerts.filter(
          (
            alert
          ) => {
            const matchesSearch =
              !value ||
              alert.title
                .toLowerCase()
                .includes(
                  value
                ) ||
              alert.plate
                ?.toLowerCase()
                .includes(
                  value
                ) ||
              alert.cameraId
                .toLowerCase()
                .includes(
                  value
                ) ||
              alert.location
                .toLowerCase()
                .includes(
                  value
                );

            const matchesType =
              typeFilter ===
                "all" ||
              alert.type ===
                typeFilter;

            const matchesSeverity =
              severityFilter ===
                "all" ||
              alert.severity ===
                severityFilter;

            const matchesZone =
              zoneFilter ===
                "all" ||
              alert.zone ===
                zoneFilter;

            return (
              matchesSearch &&
              matchesType &&
              matchesSeverity &&
              matchesZone
            );
          }
        );
      },
      [
        search,
        typeFilter,
        severityFilter,
        zoneFilter,
      ]
    );

  const activeAlerts =
    demoAlerts.filter(
      (
        alert
      ) =>
        !resolvedIds.includes(
          alert.alertId
        )
    ).length;

  const highPriority =
    demoAlerts.filter(
      (
        alert
      ) =>
        alert.severity ===
          "critical" &&
        !resolvedIds.includes(
          alert.alertId
        )
    ).length;

  const zones =
    Array.from(
      new Set(
        demoAlerts.map(
          (
            alert
          ) =>
            alert.zone
        )
      )
    );

  const types =
    Array.from(
      new Set(
        demoAlerts.map(
          (
            alert
          ) =>
            alert.type
        )
      )
    );

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () =>
            setShowToast(
              false
            ),
          6000
        );

      return () =>
        window.clearTimeout(
          timer
        );
    },
    []
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

      {/* =============================
          POPUP NOTIFICATION
      ============================== */}

      {showToast && (
        <div
          style={{
            position:
              "fixed",

            right:
              "24px",

            top:
              "24px",

            zIndex:
              9999,

            width:
              "320px",

            padding:
              "14px",

            borderRadius:
              "12px",

            background:
              "rgba(17,29,46,.97)",

            border:
              "1px solid rgba(239,68,68,.40)",

            boxShadow:
              "0 20px 50px rgba(0,0,0,.35), 0 0 22px rgba(239,68,68,.12)",

            backdropFilter:
              "blur(12px)",
          }}
        >
          <div
            style={{
              display:
                "flex",

              gap:
                "10px",

              alignItems:
                "flex-start",
            }}
          >
            <div
              style={{
                width:
                  "38px",

                height:
                  "38px",

                borderRadius:
                  "50%",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                background:
                  "rgba(239,68,68,.15)",

                border:
                  "1px solid rgba(239,68,68,.35)",

                color:
                  "#ff6b6b",

                fontSize:
                  "17px",
              }}
            >
              !
            </div>

            <div
              style={{
                flex:
                  1,
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "space-between",
                }}
              >
                <div
                  style={{
                    color:
                      "#ff8585",

                    fontSize:
                      "10px",

                    fontWeight:
                      700,
                  }}
                >
                  New critical alert
                </div>

                <button
                  onClick={() =>
                    setShowToast(
                      false
                    )
                  }
                  style={{
                    border:
                      "none",

                    background:
                      "transparent",

                    color:
                      "#748ba3",

                    cursor:
                      "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  marginTop:
                    "5px",

                  fontSize:
                    "11px",

                  fontWeight:
                    700,
                }}
              >
                Blacklisted Vehicle Detected
              </div>

              <div
                style={{
                  marginTop:
                    "4px",

                  color:
                    "#8298af",

                  fontSize:
                    "8px",
                }}
              >
                CH01AB1234 · Sector 22_23
              </div>
            </div>
          </div>
        </div>
      )}

      <main
        style={{
          flex:
            1,

          minWidth:
            0,

          padding:
            "20px 20px 16px",

          background:
            "radial-gradient(circle at top right, rgba(37,99,235,.055), transparent 35%), #07111d",
        }}
      >
        {/* =============================
            HEADER
        ============================== */}

        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            gap:
              "18px",

            marginBottom:
              "18px",
          }}
        >
          <div
            style={{
              flex:
                1,
            }}
          >
            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "9px",
              }}
            >
              <span
                style={{
                  color:
                    "#ef4444",

                  fontSize:
                    "24px",
                }}
              >
                ♧
              </span>

              <div
                style={{
                  fontSize:
                    "26px",

                  fontWeight:
                    760,

                  letterSpacing:
                    "-.5px",
                }}
              >
                Alerts
              </div>
            </div>

            <div
              style={{
                marginTop:
                  "3px",

                marginLeft:
                  "33px",

                color:
                  "#7d92a8",

                fontSize:
                  "10px",
              }}
            >
              Real-time alerts and incident management
            </div>
          </div>

          {/* SEARCH */}

          <div
            style={{
              width:
                "360px",

              height:
                "40px",

              borderRadius:
                "9px",

              display:
                "flex",

              alignItems:
                "center",

              gap:
                "9px",

              padding:
                "0 12px",

              background:
                "#0b1726",

              border:
                "1px solid rgba(148,163,184,.14)",
            }}
          >
            <span
              style={{
                color:
                  "#617890",
              }}
            >
              ⌕
            </span>

            <input
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search alerts, plates, cameras..."
              style={{
                flex:
                  1,

                border:
                  "none",

                outline:
                  "none",

                background:
                  "transparent",

                color:
                  "white",

                fontSize:
                  "9px",
              }}
            />

            <span
              style={{
                padding:
                  "4px 6px",

                borderRadius:
                  "5px",

                background:
                  "#172436",

                color:
                  "#758ca3",

                fontSize:
                  "7px",
              }}
            >
              Ctrl /
            </span>
          </div>

          <div
            style={{
              position:
                "relative",

              width:
                "34px",

              height:
                "34px",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              color:
                "#b9c8d7",
            }}
          >
            ♧

            <span
              style={{
                position:
                  "absolute",

                top:
                  "-4px",

                right:
                  "-4px",

                minWidth:
                  "17px",

                height:
                  "17px",

                padding:
                  "0 4px",

                borderRadius:
                  "20px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                background:
                  "#dc2626",

                fontSize:
                  "7px",

                fontWeight:
                  800,
              }}
            >
              {activeAlerts}
            </span>
          </div>

          <div
            style={{
              width:
                "34px",

              height:
                "34px",

              borderRadius:
                "50%",

              background:
                "linear-gradient(145deg,#e2e8f0,#94a3b8)",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              color:
                "#334155",
            }}
          >
            ●
          </div>

          <div>
            <div
              style={{
                fontSize:
                  "10px",

                fontWeight:
                  700,
              }}
            >
              Admin User
            </div>

            <div
              style={{
                marginTop:
                  "2px",

                color:
                  "#778ca2",

                fontSize:
                  "8px",
              }}
            >
              Administrator
            </div>
          </div>
        </div>

        {/* =============================
            KPI CARDS
        ============================== */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(5,minmax(0,1fr))",

            gap:
              "11px",

            marginBottom:
              "14px",
          }}
        >
          <MetricCard
            title="Total Alerts"
            value="1,248"
            detail="All time"
            icon="!"
            color="#ef4444"
          />

          <MetricCard
            title="Active Alerts"
            value={String(
              activeAlerts
            )}
            detail="Last 24 hours"
            icon="⌁"
            color="#f97316"
          />

          <MetricCard
            title="High Priority"
            value={String(
              highPriority
            )}
            detail="Requires attention"
            icon="△"
            color="#ef4444"
          />

          <MetricCard
            title="Resolved Today"
            value="28"
            detail="+8 vs yesterday"
            icon="✓"
            color="#22c55e"
          />

          <MetricCard
            title="Repeat Incidents"
            value="7"
            detail="Last 24 hours"
            icon="⟳"
            color="#a855f7"
          />
        </div>

        {/* =============================
            MAIN
        ============================== */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "minmax(480px,1.05fr) minmax(500px,.95fr)",

            gap:
              "12px",
          }}
        >
          {/* =============================
              LEFT ALERTS FEED
          ============================== */}

          <section
            style={
              panelStyle
            }
          >
            {/* title */}

            <div
              style={{
                padding:
                  "14px 15px 9px",

                fontSize:
                  "15px",

                fontWeight:
                  700,
              }}
            >
              Alerts Feed
            </div>

            {/* filters */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "1fr 1fr 1fr auto",

                gap:
                  "7px",

                padding:
                  "0 12px 11px",
              }}
            >
              <select
                value={
                  typeFilter
                }
                onChange={(
                  event
                ) =>
                  setTypeFilter(
                    event.target
                      .value
                  )
                }
                style={
                  selectStyle
                }
              >
                <option value="all">
                  All Types
                </option>

                {types.map(
                  (
                    type
                  ) => (
                    <option
                      key={
                        type
                      }
                      value={
                        type
                      }
                    >
                      {type
                        .replaceAll(
                          "_",
                          " "
                        )
                        .toLowerCase()}
                    </option>
                  )
                )}
              </select>

              <select
                value={
                  severityFilter
                }
                onChange={(
                  event
                ) =>
                  setSeverityFilter(
                    event.target
                      .value as SeverityFilter
                  )
                }
                style={
                  selectStyle
                }
              >
                <option value="all">
                  All Severity
                </option>

                <option value="critical">
                  High
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="low">
                  Low
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
                  selectStyle
                }
              >
                <option value="all">
                  All Zones
                </option>

                {zones.map(
                  (
                    zone
                  ) => (
                    <option
                      key={
                        zone
                      }
                      value={
                        zone
                      }
                    >
                      {zone}
                    </option>
                  )
                )}
              </select>

              <button
                onClick={() => {
                  setTypeFilter(
                    "all"
                  );

                  setSeverityFilter(
                    "all"
                  );

                  setZoneFilter(
                    "all"
                  );

                  setSearch(
                    ""
                  );
                }}
                style={{
                  height:
                    "37px",

                  borderRadius:
                    "8px",

                  border:
                    "1px solid rgba(148,163,184,.11)",

                  background:
                    "#0d1b2c",

                  color:
                    "#8ca1b6",

                  padding:
                    "0 14px",

                  cursor:
                    "pointer",

                  fontSize:
                    "8px",
                }}
              >
                ⌁ Filter
              </button>
            </div>

            {/* rows */}

            <div
              style={{
                padding:
                  "0 10px",
              }}
            >
              {filtered.map(
                (
                  alert
                ) => (
                  <AlertRow
                    key={
                      alert.alertId
                    }
                    alert={
                      alert
                    }
                    selected={
                      alert.alertId ===
                      selectedAlert.alertId
                    }
                    resolved={
                      resolvedIds.includes(
                        alert.alertId
                      )
                    }
                    onClick={() =>
                      setSelectedId(
                        alert.alertId
                      )
                    }
                  />
                )
              )}
            </div>

            {/* pagination */}

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                padding:
                  "13px 14px",

                borderTop:
                  "1px solid rgba(148,163,184,.07)",
              }}
            >
              <div
                style={{
                  color:
                    "#71869a",

                  fontSize:
                    "8px",
                }}
              >
                Showing 1 to{" "}
                {
                  filtered.length
                }{" "}
                of 50 alerts
              </div>

              <div
                style={{
                  display:
                    "flex",

                  gap:
                    "5px",
                }}
              >
                {[
                  "‹",
                  "1",
                  "2",
                  "3",
                  "...",
                  "9",
                  "›",
                ].map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item
                      }
                      style={{
                        width:
                          "30px",

                        height:
                          "30px",

                        borderRadius:
                          "7px",

                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        border:
                          item ===
                          "1"
                            ? "1px solid rgba(239,68,68,.55)"
                            : "1px solid rgba(148,163,184,.07)",

                        background:
                          item ===
                          "1"
                            ? "rgba(239,68,68,.10)"
                            : "#0b1726",

                        color:
                          item ===
                          "1"
                            ? "#ff7373"
                            : "#71869c",

                        fontSize:
                          "8px",
                      }}
                    >
                      {item}
                    </div>
                  )
                )}
              </div>
            </div>
          </section>

          {/* =============================
              ALERT DETAILS
          ============================== */}

          <section
            style={
              panelStyle
            }
          >
            {/* top */}

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                padding:
                  "15px",

                borderBottom:
                  "1px solid rgba(148,163,184,.07)",
              }}
            >
              <div
                style={{
                  fontSize:
                    "15px",

                  fontWeight:
                    700,
                }}
              >
                Alert Details
              </div>

              <div
                style={{
                  color:
                    "#7a8fa5",

                  fontSize:
                    "16px",
                }}
              >
                ×
              </div>
            </div>

            <div
              style={{
                padding:
                  "15px",
              }}
            >
              {/* severity / id */}

              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "space-between",
                }}
              >
                <SeverityTag
                  severity={
                    selectedAlert.severity
                  }
                />

                <div
                  style={{
                    color:
                      "#71869b",

                    fontSize:
                      "7px",
                  }}
                >
                  Alert ID:{" "}
                  {
                    selectedAlert.alertId
                  }
                </div>
              </div>

              {/* title */}

              <div
                style={{
                  marginTop:
                    "10px",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "space-between",

                  gap:
                    "12px",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "21px",

                    fontWeight:
                      760,

                    letterSpacing:
                      "-.3px",
                  }}
                >
                  {
                    selectedAlert.title
                  }
                </div>

                <span
                  style={{
                    padding:
                      "5px 10px",

                    borderRadius:
                      "5px",

                    color:
                      "#ff6f6f",

                    border:
                      "1px solid rgba(239,68,68,.32)",

                    background:
                      "rgba(239,68,68,.08)",

                    fontSize:
                      "7px",

                    fontWeight:
                      700,
                  }}
                >
                  {resolvedIds.includes(
                    selectedAlert.alertId
                  )
                    ? "RESOLVED"
                    : "ACTIVE"}
                </span>
              </div>

              {/* identity cards */}

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(4,1fr)",

                  gap:
                    "8px",

                  marginTop:
                    "13px",
                }}
              >
                <IdentityCard
                  icon="▣"
                  value={
                    selectedAlert.plate ??
                    "—"
                  }
                  label="Vehicle Plate"
                />

                <IdentityCard
                  icon="⌖"
                  value={
                    selectedAlert.zone
                  }
                  label="Camera Location"
                />

                <IdentityCard
                  icon="▰"
                  value={
                    selectedAlert.cameraId
                  }
                  label="Camera ID"
                />

                <IdentityCard
                  icon="◷"
                  value={
                    selectedAlert.relativeTime
                  }
                  label="Detected At"
                />
              </div>

              {/* tabs */}

              <div
                style={{
                  display:
                    "flex",

                  gap:
                    "28px",

                  marginTop:
                    "18px",

                  borderBottom:
                    "1px solid rgba(148,163,184,.08)",
                }}
              >
                {[
                  "Overview",
                  "Vehicle Info",
                  "Location",
                  "Snapshot",
                  "History",
                ].map(
                  (
                    tab,
                    index
                  ) => (
                    <div
                      key={
                        tab
                      }
                      style={{
                        position:
                          "relative",

                        padding:
                          "0 0 11px",

                        color:
                          index ===
                          0
                            ? "#f8fafc"
                            : "#8398ac",

                        fontSize:
                          "8px",

                        fontWeight:
                          index ===
                          0
                            ? 650
                            : 500,
                      }}
                    >
                      {tab}

                      {index ===
                        0 && (
                        <span
                          style={{
                            position:
                              "absolute",

                            left:
                              0,

                            right:
                              0,

                            bottom:
                              "-1px",

                            height:
                              "2px",

                            background:
                              "#ef4444",
                          }}
                        />
                      )}
                    </div>
                  )
                )}
              </div>

              {/* detail overview */}

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    ".75fr 1.25fr",

                  gap:
                    "14px",

                  padding:
                    "16px 0",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",

                    flexDirection:
                      "column",

                    gap:
                      "10px",
                  }}
                >
                  <OverviewDetail
                    icon="♧"
                    label="Alert Type"
                    value={
                      selectedAlert.title
                    }
                  />

                  <OverviewDetail
                    icon="△"
                    label="Severity"
                    value={
                      selectedAlert.severity ===
                      "critical"
                        ? "High"
                        : selectedAlert.severity ===
                          "medium"
                        ? "Medium"
                        : "Low"
                    }
                  />

                  <OverviewDetail
                    icon="⌖"
                    label="Zone"
                    value={
                      selectedAlert.zone
                    }
                  />

                  <OverviewDetail
                    icon="⟳"
                    label="Repeat Count"
                    value={`${selectedAlert.repeatCount} times`}
                  />

                  <OverviewDetail
                    icon="◷"
                    label="First Seen"
                    value={
                      selectedAlert.firstSeen ??
                      "12 May 2025, 09:31 AM"
                    }
                  />

                  <OverviewDetail
                    icon="◷"
                    label="Last Seen"
                    value={
                      selectedAlert.lastSeen ??
                      "12 May 2025, 09:36 AM"
                    }
                  />
                </div>

                <div>
                  <div
                    style={{
                      marginBottom:
                        "7px",

                      fontSize:
                        "9px",

                      fontWeight:
                        700,
                    }}
                  >
                    Snapshot
                  </div>

                  <VehicleSnapshot
                    plate={
                      selectedAlert.plate ??
                      "CH01AB1234"
                    }
                  />
                </div>
              </div>

              {/* description */}

              <div
                style={{
                  padding:
                    "13px",

                  borderRadius:
                    "9px",

                  background:
                    "#0b1828",

                  border:
                    "1px solid rgba(148,163,184,.08)",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "9px",

                    fontWeight:
                      700,
                  }}
                >
                  Alert Description
                </div>

                <div
                  style={{
                    marginTop:
                      "8px",

                    color:
                      "#8095aa",

                    fontSize:
                      "8px",

                    lineHeight:
                      1.6,
                  }}
                >
                  {
                    selectedAlert.description
                  }
                </div>

                {selectedAlert.plate && (
                  <div
                    style={{
                      marginTop:
                        "4px",

                      color:
                        "#8095aa",

                      fontSize:
                        "8px",
                    }}
                  >
                    Last reported incident:{" "}

                    <span
                      style={{
                        color:
                          "#ff6262",
                      }}
                    >
                      Stolen vehicle
                    </span>{" "}

                    case registered at Chandigarh PS.
                  </div>
                )}
              </div>

              {/* bottom actions */}

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "1fr .9fr .9fr",

                  gap:
                    "8px",

                  marginTop:
                    "14px",
                }}
              >
                <button
                  onClick={() =>
                    setResolvedIds(
                      (
                        current
                      ) =>
                        current.includes(
                          selectedAlert.alertId
                        )
                          ? current
                          : [
                              ...current,
                              selectedAlert.alertId,
                            ]
                    )
                  }
                  style={{
                    ...actionButton,

                    background:
                      resolvedIds.includes(
                        selectedAlert.alertId
                      )
                        ? "rgba(34,197,94,.15)"
                        : "#dc2f39",

                    border:
                      resolvedIds.includes(
                        selectedAlert.alertId
                      )
                        ? "1px solid rgba(34,197,94,.35)"
                        : "1px solid #ef4444",

                    color:
                      resolvedIds.includes(
                        selectedAlert.alertId
                      )
                        ? "#4ade80"
                        : "white",
                  }}
                >
                  ✓{" "}
                  {resolvedIds.includes(
                    selectedAlert.alertId
                  )
                    ? "Resolved"
                    : "Mark as Resolved"}
                </button>

                <button
                  style={
                    actionButton
                  }
                >
                  ▣ Create Report
                </button>

                <button
                  style={
                    actionButton
                  }
                >
                  ⋮ More Actions⌄
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* =============================
            BOTTOM SYSTEM STATUS
        ============================== */}

        <div
          style={{
            marginTop:
              "12px",

            minHeight:
              "72px",

            display:
              "grid",

            gridTemplateColumns:
              "1.05fr 1fr 1.2fr .8fr 1fr 1fr",

            borderRadius:
              "10px",

            overflow:
              "hidden",

            background:
              "#0a1726",

            border:
              "1px solid rgba(148,163,184,.09)",
          }}
        >
          <StatusCell
            label="System Status"
            value="Operational"
            color="#22c55e"
          />

          <StatusCell
            label="Active Cameras"
            value="42 / 48"
            color="#dbeafe"
          />

          <div
            style={
              statusCellStyle
            }
          >
            <div
              style={
                statusLabelStyle
              }
            >
              System Load
            </div>

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "11px",

                marginTop:
                  "7px",
              }}
            >
              <span
                style={{
                  fontSize:
                    "16px",

                  fontWeight:
                    700,
                }}
              >
                62%
              </span>

              <svg
                viewBox="0 0 100 28"
                width="90"
                height="24"
              >
                <path
                  d="M0 20 C15 20,18 17,28 18 C40 19,44 14,55 15 C68 17,70 5,79 4 C88 4,90 19,100 18"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          <StatusCell
            label="Network"
            value="98%"
            color="#e2e8f0"
          />

          <StatusCell
            label="Database"
            value="Healthy"
            color="#e2e8f0"
          />

          <StatusCell
            label="Last Updated"
            value="09:36:45 AM"
            color="#e2e8f0"
          />
        </div>
      </main>
    </div>
  );
}

/* ====================================
   ALERT ROW
==================================== */

function AlertRow({
  alert,
  selected,
  resolved,
  onClick,
}: {
  alert: AlertItem;
  selected: boolean;
  resolved: boolean;
  onClick: () => void;
}) {
  const colour =
    severityColor(
      alert.severity
    );

  return (
    <button
      onClick={
        onClick
      }
      style={{
        width:
          "100%",

        display:
          "grid",

        gridTemplateColumns:
          "54px minmax(0,1fr) 175px 64px",

        gap:
          "10px",

        alignItems:
          "center",

        marginBottom:
          "7px",

        padding:
          "11px",

        borderRadius:
          "8px",

        border:
          selected
            ? `1px solid ${colour}55`
            : "1px solid rgba(148,163,184,.07)",

        borderLeft:
          `3px solid ${colour}`,

        background:
          selected
            ? `linear-gradient(90deg,${colour}18,rgba(15,27,43,.96))`
            : "#0d1a2b",

        textAlign:
          "left",

        color:
          "white",

        cursor:
          "pointer",

        opacity:
          resolved
            ? 0.5
            : 1,
      }}
    >
      <div
        style={{
          width:
            "44px",

          height:
            "44px",

          borderRadius:
            "50%",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          color:
            colour,

          background:
            `${colour}12`,

          border:
            `1px solid ${colour}25`,

          fontSize:
            "18px",
        }}
      >
        {alert.type ===
        "CONGESTION"
          ? "♙"
          : alert.type ===
            "NO_HELMET"
          ? "◉"
          : "△"}
      </div>

      <div>
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
          <span
            style={{
              fontSize:
                "10px",

              fontWeight:
                700,
            }}
          >
            {
              alert.title
            }
          </span>

          {selected && (
            <span
              style={{
                padding:
                  "2px 5px",

                borderRadius:
                  "4px",

                background:
                  "#dc2626",

                color:
                  "white",

                fontSize:
                  "6px",

                fontWeight:
                  800,
              }}
            >
              NEW
            </span>
          )}
        </div>

        {alert.plate && (
          <div
            style={{
              width:
                "fit-content",

              marginTop:
                "4px",

              padding:
                "3px 7px",

              borderRadius:
                "6px",

              background:
                "#172335",

              color:
                "#e1e8ef",

              fontSize:
                "7px",
            }}
          >
            {alert.plate}
          </div>
        )}

        <div
          style={{
            marginTop:
              "5px",

            color:
              "#7e92a6",

            fontSize:
              "7px",
          }}
        >
          {
            alert.description
          }
        </div>
      </div>

      <div
        style={{
          color:
            "#8da0b3",

          fontSize:
            "8px",

          lineHeight:
            1.6,
        }}
      >
        <div>
          {
            alert.location
          }
        </div>

        <div>
          {
            alert.cameraId
          }
        </div>

        <div>
          {
            alert.relativeTime
          }
        </div>
      </div>

      <SeverityTag
        severity={
          alert.severity
        }
      />
    </button>
  );
}

/* ====================================
   KPI
==================================== */

function MetricCard({
  title,
  value,
  detail,
  icon,
  color,
}: {
  title: string;
  value: string;
  detail: string;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        minHeight:
          "112px",

        padding:
          "14px",

        borderRadius:
          "10px",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "space-between",

        gap:
          "10px",

        background:
          "linear-gradient(145deg,#0c1929,#101d2d)",

        border:
          "1px solid rgba(148,163,184,.10)",
      }}
    >
      <div>
        <div
          style={{
            color:
              "#a3b2c1",

            fontSize:
              "8px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop:
              "6px",

            fontSize:
              "27px",

            fontWeight:
              600,
          }}
        >
          {value}
        </div>

        <div
          style={{
            marginTop:
              "4px",

            color:
              detail.startsWith(
                "+"
              )
                ? "#22c55e"
                : "#7f93a7",

            fontSize:
              "8px",
          }}
        >
          {detail}
        </div>
      </div>

      <div
        style={{
          width:
            "58px",

          height:
            "58px",

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

          color,

          background:
            `${color}19`,

          fontSize:
            "24px",
        }}
      >
        {icon}
      </div>
    </div>
  );
}

/* ====================================
   SEVERITY
==================================== */

function SeverityTag({
  severity,
}: {
  severity: Severity;
}) {
  const colour =
    severityColor(
      severity
    );

  return (
    <span
      style={{
        width:
          "fit-content",

        padding:
          "5px 9px",

        borderRadius:
          "5px",

        color:
          colour,

        background:
          `${colour}12`,

        border:
          `1px solid ${colour}28`,

        fontSize:
          "7px",

        fontWeight:
          750,

        textTransform:
          "uppercase",
      }}
    >
      {severity ===
      "critical"
        ? "HIGH"
        : severity ===
          "medium"
        ? "MEDIUM"
        : "LOW"}
    </span>
  );
}

function severityColor(
  severity: Severity
) {
  if (
    severity ===
    "critical"
  ) {
    return "#ef4444";
  }

  if (
    severity ===
    "medium"
  ) {
    return "#f59e0b";
  }

  return "#8b5cf6";
}

/* ====================================
   IDENTITY CARD
==================================== */

function IdentityCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <div
      style={{
        minHeight:
          "62px",

        padding:
          "9px",

        borderRadius:
          "8px",

        display:
          "flex",

        alignItems:
          "center",

        gap:
          "8px",

        background:
          "#0c1a2b",

        border:
          "1px solid rgba(148,163,184,.08)",
      }}
    >
      <div
        style={{
          color:
            "#60a5fa",

          fontSize:
            "14px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          minWidth:
            0,
        }}
      >
        <div
          style={{
            color:
              "#eef6ff",

            fontSize:
              "8px",

            fontWeight:
              650,

            whiteSpace:
              "nowrap",

            overflow:
              "hidden",

            textOverflow:
              "ellipsis",
          }}
        >
          {value}
        </div>

        <div
          style={{
            marginTop:
              "3px",

            color:
              "#647a90",

            fontSize:
              "6.5px",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

/* ====================================
   OVERVIEW DETAILS
==================================== */

function OverviewDetail({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display:
          "grid",

        gridTemplateColumns:
          "20px 1fr",

        gap:
          "7px",
      }}
    >
      <div
        style={{
          color:
            "#8299b0",

          fontSize:
            "12px",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color:
              "#768ca1",

            fontSize:
              "6.5px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            marginTop:
              "2px",

            color:
              "#dce7f2",

            fontSize:
              "8px",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* ====================================
   VEHICLE SNAPSHOT
==================================== */

function VehicleSnapshot({
  plate,
}: {
  plate: string;
}) {
  return (
    <div
      style={{
        position:
          "relative",

        width:
          "100%",

        height:
          "190px",

        overflow:
          "hidden",

        borderRadius:
          "9px",

        background:
          "linear-gradient(#89a3b4 0%,#8fa9b9 43%,#35414a 44%,#3e464c 100%)",

        border:
          "1px solid rgba(148,163,184,.10)",
      }}
    >
      {/* TREE LINES */}

      <div
        style={{
          position:
            "absolute",

          top:
            0,

          left:
            0,

          right:
            0,

          height:
            "70px",

          background:
            "linear-gradient(90deg,#334d37 0 8%,transparent 8% 14%,#436142 14% 22%,transparent 22% 77%,#436142 77% 85%,transparent 85% 92%,#334d37 92%)",

          opacity:
            .9,
        }}
      />

      {/* ROAD */}

      <div
        style={{
          position:
            "absolute",

          inset:
            "70px 0 0",

          background:
            "#444c52",
        }}
      />

      <div
        style={{
          position:
            "absolute",

          left:
            "21%",

          bottom:
            0,

          width:
            "8px",

          height:
            "70px",

          background:
            "rgba(255,255,255,.75)",

          transform:
            "skew(-10deg)",
        }}
      />

      <div
        style={{
          position:
            "absolute",

          right:
            "21%",

          bottom:
            0,

          width:
            "8px",

          height:
            "70px",

          background:
            "rgba(255,255,255,.75)",

          transform:
            "skew(10deg)",
        }}
      />

      {/* CAR */}

      <div
        style={{
          position:
            "absolute",

          left:
            "50%",

          bottom:
            "19px",

          transform:
            "translateX(-50%)",

          width:
            "190px",

          height:
            "90px",

          borderRadius:
            "20px 20px 13px 13px",

          background:
            "linear-gradient(#eef2f4,#d9dde0 55%,#b5bdc4)",

          boxShadow:
            "0 18px 20px rgba(0,0,0,.35)",
        }}
      >
        {/* REAR WINDOW */}

        <div
          style={{
            position:
              "absolute",

            left:
              "35px",

            right:
              "35px",

            top:
              "8px",

            height:
              "30px",

            borderRadius:
              "18px 18px 4px 4px",

            background:
              "#2d3942",
          }}
        />

        {/* LIGHTS */}

        <div
          style={{
            position:
              "absolute",

            left:
              "8px",

            top:
              "45px",

            width:
              "40px",

            height:
              "16px",

            borderRadius:
              "6px",

            background:
              "#b43030",
          }}
        />

        <div
          style={{
            position:
              "absolute",

            right:
              "8px",

            top:
              "45px",

            width:
              "40px",

            height:
              "16px",

            borderRadius:
              "6px",

            background:
              "#b43030",
          }}
        />

        {/* PLATE */}

        <div
          style={{
            position:
              "absolute",

            left:
              "50%",

            bottom:
              "14px",

            transform:
              "translateX(-50%)",

            padding:
              "4px 8px",

            borderRadius:
              "2px",

            background:
              "#f8fafc",

            border:
              "1px solid #111827",

            color:
              "#111827",

            fontSize:
              "7px",

            fontWeight:
              800,
          }}
        >
          {plate}
        </div>
      </div>

      <div
        style={{
          position:
            "absolute",

          right:
            "8px",

          top:
            "8px",

          width:
            "26px",

          height:
            "26px",

          borderRadius:
            "6px",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "rgba(7,17,29,.72)",

          color:
            "#c7d4df",
        }}
      >
        ↗
      </div>
    </div>
  );
}

/* ====================================
   STATUS
==================================== */

function StatusCell({
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
      style={
        statusCellStyle
      }
    >
      <div
        style={
          statusLabelStyle
        }
      >
        {label}
      </div>

      <div
        style={{
          marginTop:
            "7px",

          color,

          fontSize:
            "12px",

          fontWeight:
            650,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ====================================
   SHARED STYLES
==================================== */

const panelStyle:
  CSSProperties =
  {
    background:
      "linear-gradient(180deg,#0a1727,#091624)",

    border:
      "1px solid rgba(148,163,184,.10)",

    borderRadius:
      "11px",

    overflow:
      "hidden",

    boxShadow:
      "0 15px 35px rgba(0,0,0,.13)",
  };

const selectStyle:
  CSSProperties =
  {
    height:
      "37px",

    borderRadius:
      "8px",

    border:
      "1px solid rgba(148,163,184,.10)",

    background:
      "#0d1b2c",

    color:
      "#a9b9c9",

    outline:
      "none",

    padding:
      "0 10px",

    fontSize:
      "8px",
  };

const actionButton:
  CSSProperties =
  {
    height:
      "40px",

    borderRadius:
      "7px",

    border:
      "1px solid rgba(148,163,184,.11)",

    background:
      "#0e1c2d",

    color:
      "#d3dfeb",

    cursor:
      "pointer",

    fontSize:
      "8px",

    fontWeight:
      650,
  };

const statusCellStyle:
  CSSProperties =
  {
    padding:
      "13px 18px",

    borderRight:
      "1px solid rgba(148,163,184,.07)",
  };

const statusLabelStyle:
  CSSProperties =
  {
    color:
      "#6f8499",

    fontSize:
      "7px",
  };