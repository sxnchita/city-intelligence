import { useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import CityMap from "../components/map/CityMap";

type TimeRange =
  | "live"
  | "hour"
  | "today"
  | "custom";

export default function Traffic() {
  const [selectedRange, setSelectedRange] =
    useState<TimeRange>("live");

  const [customFrom, setCustomFrom] =
    useState("");

  const [customTo, setCustomTo] =
    useState("");

  const rangeLabel =
    selectedRange === "live"
      ? "Last 15 minutes"
      : selectedRange === "hour"
      ? "Last 1 hour"
      : selectedRange === "today"
      ? "Today"
      : "Custom time range";

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
              Traffic Intelligence
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "12px",
                color: "#7f9dbd",
              }}
            >
              Road-level traffic volume, congestion and city movement
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <TimeButton
              label="Live · 15m"
              active={
                selectedRange === "live"
              }
              onClick={() =>
                setSelectedRange("live")
              }
            />

            <TimeButton
              label="1 Hour"
              active={
                selectedRange === "hour"
              }
              onClick={() =>
                setSelectedRange("hour")
              }
            />

            <TimeButton
              label="Today"
              active={
                selectedRange === "today"
              }
              onClick={() =>
                setSelectedRange("today")
              }
            />

            <TimeButton
              label="Custom"
              active={
                selectedRange === "custom"
              }
              onClick={() =>
                setSelectedRange("custom")
              }
            />
          </div>
        </div>

        {/* TIME RANGE SUMMARY */}

        <section
          style={{
            background: "#091828",
            border:
              "1px solid rgba(255,255,255,0.07)",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "10px",
                  textTransform:
                    "uppercase",
                  letterSpacing: "1px",
                  color: "#64748b",
                }}
              >
                Active time range
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "13px",
                  fontWeight: 650,
                  color: "#dbeafe",
                }}
              >
                {rangeLabel}
              </div>
            </div>

            {selectedRange ===
              "live" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "10px",
                  color: "#4ade80",
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

                Auto refresh every 30 sec
              </div>
            )}
          </div>

          {/* CUSTOM TIME INPUTS */}

          {selectedRange ===
            "custom" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr auto",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    marginBottom: "5px",
                    fontSize: "9px",
                    color: "#64748b",
                  }}
                >
                  From
                </div>

                <input
                  type="datetime-local"
                  value={customFrom}
                  onChange={(event) =>
                    setCustomFrom(
                      event.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    height: "38px",
                    borderRadius: "9px",
                    border:
                      "1px solid rgba(148,163,184,.16)",
                    background: "#0c1b2d",
                    color: "white",
                    padding: "0 10px",
                    outline: "none",
                    colorScheme: "dark",
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    marginBottom: "5px",
                    fontSize: "9px",
                    color: "#64748b",
                  }}
                >
                  To
                </div>

                <input
                  type="datetime-local"
                  value={customTo}
                  onChange={(event) =>
                    setCustomTo(
                      event.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    height: "38px",
                    borderRadius: "9px",
                    border:
                      "1px solid rgba(148,163,184,.16)",
                    background: "#0c1b2d",
                    color: "white",
                    padding: "0 10px",
                    outline: "none",
                    colorScheme: "dark",
                  }}
                />
              </div>

              <button
                style={{
                  alignSelf: "end",
                  height: "38px",
                  border: "none",
                  borderRadius: "9px",
                  padding: "0 16px",
                  background: "#2563eb",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 650,
                }}
              >
                Apply
              </button>
            </div>
          )}
        </section>

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
          <TrafficKpi
            label="Road Segments"
            value="84"
            detail="Currently monitored"
          />

          <TrafficKpi
            label="Heavy Traffic"
            value="11"
            detail="Road segments"
            color="#f97316"
          />

          <TrafficKpi
            label="Severe Traffic"
            value="4"
            detail="Needs attention"
            color="#ef4444"
          />

          <TrafficKpi
            label="Avg Network Speed"
            value="32 km/h"
            detail={rangeLabel}
            color="#38bdf8"
          />
        </div>

        {/* MAP + PANEL */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 4fr) minmax(260px, 1fr)",
            gap: "12px",
            height: "730px",
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
            <CityMap
              showCamerasInitially={true}
              showTrajectoryInitially={false}
              showTrafficInitially={true}
            />
          </section>

          <aside
            style={{
              background: "#091828",
              border:
                "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              padding: "16px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                Congestion Overview
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "10px",
                  color: "#64748b",
                }}
              >
                {rangeLabel}
              </div>
            </div>

            <CongestionRow
              label="Normal"
              value="52"
              percentage={62}
              color="#22c55e"
            />

            <CongestionRow
              label="Moderate"
              value="17"
              percentage={20}
              color="#eab308"
            />

            <CongestionRow
              label="Heavy"
              value="11"
              percentage={13}
              color="#f97316"
            />

            <CongestionRow
              label="Severe"
              value="4"
              percentage={5}
              color="#ef4444"
            />

            <div
              style={{
                margin: "22px 0",
                borderTop:
                  "1px solid rgba(255,255,255,.07)",
              }}
            />

            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                Most Congested Roads
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "10px",
                  color: "#64748b",
                }}
              >
                Ranked by congestion score
              </div>

              <div
                style={{
                  marginTop: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "9px",
                }}
              >
                <RoadCard
                  rank={1}
                  road="ITO Approach"
                  band="Severe"
                  score="0.96"
                  samples="260"
                  color="#ef4444"
                />

                <RoadCard
                  rank={2}
                  road="Ring Connector"
                  band="Heavy"
                  score="0.78"
                  samples="210"
                  color="#f97316"
                />

                <RoadCard
                  rank={3}
                  road="Central Corridor"
                  band="Moderate"
                  score="0.55"
                  samples="175"
                  color="#eab308"
                />
              </div>
            </div>

            <div
              style={{
                margin: "22px 0",
                borderTop:
                  "1px solid rgba(255,255,255,.07)",
              }}
            />

            <div
              style={{
                padding: "12px",
                background:
                  "rgba(37,99,235,.08)",
                border:
                  "1px solid rgba(96,165,250,.12)",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 650,
                  color: "#93c5fd",
                }}
              >
                How to read the map
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "10px",
                  lineHeight: 1.55,
                  color: "#7f9dbd",
                }}
              >
                Road colour represents congestion.
                Line thickness represents traffic
                volume. Roads with too few samples
                are shown grey to avoid misleading
                results.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// =====================================
// TIME BUTTON
// =====================================

function TimeButton({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: "38px",
        padding: "0 13px",
        borderRadius: "9px",

        border: active
          ? "1px solid rgba(96,165,250,.35)"
          : "1px solid rgba(148,163,184,.12)",

        background: active
          ? "rgba(37,99,235,.22)"
          : "#0c1b2d",

        color: active
          ? "#93c5fd"
          : "#94a3b8",

        fontSize: "11px",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// =====================================
// KPI
// =====================================

function TrafficKpi({
  label,
  value,
  detail,
  color = "#60a5fa",
}: {
  label: string;
  value: string;
  detail: string;
  color?: string;
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
            background: color,
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
// CONGESTION
// =====================================

function CongestionRow({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: string;
  percentage: number;
  color: string;
}) {
  return (
    <div
      style={{
        marginBottom: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: color,
            }}
          />

          <span
            style={{
              fontSize: "11px",
              color: "#a9bdd1",
            }}
          >
            {label}
          </span>
        </div>

        <span
          style={{
            fontSize: "11px",
            fontWeight: 650,
          }}
        >
          {value}
        </span>
      </div>

      <div
        style={{
          height: "5px",
          background: "#102239",
          borderRadius: "100px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: color,
            borderRadius: "100px",
          }}
        />
      </div>
    </div>
  );
}

// =====================================
// ROAD CARD
// =====================================

function RoadCard({
  rank,
  road,
  band,
  score,
  samples,
  color,
}: {
  rank: number;
  road: string;
  band: string;
  score: string;
  samples: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "11px",
        background: "#0c1b2d",
        borderRadius: "9px",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#102239",
              borderRadius: "6px",
              fontSize: "9px",
              color: "#94a3b8",
            }}
          >
            {rank}
          </div>

          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 650,
              }}
            >
              {road}
            </div>

            <div
              style={{
                marginTop: "3px",
                fontSize: "9px",
                color: "#64748b",
              }}
            >
              {samples} samples
            </div>
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: "9px",
              color,
              fontWeight: 700,
            }}
          >
            {band}
          </div>

          <div
            style={{
              marginTop: "3px",
              fontSize: "10px",
              color: "#94a3b8",
            }}
          >
            {score}
          </div>
        </div>
      </div>
    </div>
  );
}