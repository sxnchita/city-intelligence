import { useMemo, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import CityMap from "../components/map/CityMap";
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
  type CongestionResponse,
} from "../services/analyticsApi";
import type { CongestionBand } from "../services/mapApi";

const BAND_COLOR: Record<
  CongestionBand,
  string
> = {
  free: "#22c55e",
  moderate: "#eab308",
  heavy: "#f97316",
  severe: "#ef4444",
};

const BAND_LABEL: Record<
  CongestionBand,
  string
> = {
  free: "Free flowing",
  moderate: "Moderate",
  heavy: "Heavy",
  severe: "Severe",
};

// An empty window is a real answer, so the page has
// a shape to render for it rather than a fixture.
const NOTHING_YET: CongestionResponse = {
  from: "",
  to: "",
  min_samples: 0,
  excluded_low_sample_edges: 0,
  rows: [],
};

// Live mode polls; the backend defaults to the last
// 15 minutes when called with no range.
const REFRESH_MS = 15_000;

function edgeLabel(row: {
  from_camera_name: string | null;
  from_camera_id: string;
  to_camera_name: string | null;
  to_camera_id: string;
}): string {
  const from =
    row.from_camera_name ?? row.from_camera_id;
  const to =
    row.to_camera_name ?? row.to_camera_id;

  return `${from} \u2192 ${to}`;
}

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

  // The range is resolved inside the fetcher
  // rather than during render: Date.now() is
  // impure, and the fetcher runs in an effect.
  // Resolved once per render so the same window
  // drives both the table and the map's heatmap.
  const [mapWindow, setMapWindow] = useState<{
    from?: string;
    to?: string;
  }>({});

  const {
    data: fetched,
    loading,
    error,
  } = useApiData<CongestionResponse>(
    (signal) => {
      const now = Date.now();

      // "live" sends no range at all — the
      // backend defaults to the last 15 minutes,
      // which is exactly what live mode means.
      let from: string | undefined;
      let to: string | undefined;

      if (selectedRange === "hour") {
        from = new Date(
          now - 60 * 60 * 1000
        ).toISOString();
        to = new Date(now).toISOString();
      } else if (selectedRange === "today") {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        from = start.toISOString();
        to = new Date(now).toISOString();
      } else if (selectedRange === "custom") {
        from = customFrom
          ? new Date(customFrom).toISOString()
          : undefined;
        to = customTo
          ? new Date(customTo).toISOString()
          : undefined;
      }

      setMapWindow({ from, to });

      return getCongestion(
        from,
        to,
        20,
        signal
      );
    },
    [selectedRange, customFrom, customTo],
    {
      // Only live mode keeps moving. A fixed range
      // returns the same rows every time, so polling
      // it is pure noise.
      refreshMs:
        selectedRange === "live"
          ? REFRESH_MS
          : undefined,
    }
  );

  const congestion = fetched ?? NOTHING_YET;

  const bandCounts = useMemo(() => {
    const counts: Record<
      CongestionBand,
      number
    > = {
      free: 0,
      moderate: 0,
      heavy: 0,
      severe: 0,
    };

    for (const row of congestion.rows) {
      if (row.congestion_band) {
        counts[row.congestion_band] += 1;
      }
    }

    return counts;
  }, [congestion]);

  const rankedRows = useMemo(
    () => congestion.rows.slice(0, 3),
    [congestion]
  );

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
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              Traffic Intelligence

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
            value={String(
              congestion.rows.length
            )}
            detail="Ranked this window"
          />

          <TrafficKpi
            label="Heavy Traffic"
            value={String(bandCounts.heavy)}
            detail="Road segments"
            color="#f97316"
          />

          <TrafficKpi
            label="Severe Traffic"
            value={String(bandCounts.severe)}
            detail="Needs attention"
            color="#ef4444"
          />

          <TrafficKpi
            label="Excluded"
            value={String(
              congestion.excluded_low_sample_edges
            )}
            detail={`Under ${congestion.min_samples} samples`}
            color="#94a3b8"
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
              from={mapWindow.from}
              to={mapWindow.to}
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

            {(
              [
                "free",
                "moderate",
                "heavy",
                "severe",
              ] as CongestionBand[]
            ).map((band) => {
              const count = bandCounts[band];
              const total =
                congestion.rows.length || 1;

              return (
                <CongestionRow
                  key={band}
                  label={BAND_LABEL[band]}
                  value={String(count)}
                  percentage={Math.round(
                    (count / total) * 100
                  )}
                  color={BAND_COLOR[band]}
                />
              );
            })}

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
                {rankedRows.length === 0 ? (
                  <EmptyState
                    title={
                      error
                        ? "Congestion unavailable"
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
                  rankedRows.map(
                  (row, index) => (
                    <RoadCard
                      key={row.edge_id}
                      rank={index + 1}
                      road={edgeLabel(row)}
                      band={
                        row.congestion_band
                          ? BAND_LABEL[
                              row.congestion_band
                            ]
                          : "Unbanded"
                      }
                      score={
                        row.congestion_ratio !==
                        null
                          ? row.congestion_ratio.toFixed(
                              2
                            )
                          : "\u2014"
                      }
                      samples={String(
                        row.sample_count
                      )}
                      color={
                        row.congestion_band
                          ? BAND_COLOR[
                              row.congestion_band
                            ]
                          : "#94a3b8"
                      }
                    />
                  )
                ))}
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