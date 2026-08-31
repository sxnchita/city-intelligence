import { useCallback, useEffect, useState } from "react";

import CityMap from "../components/map/CityMap";
import Sidebar from "../components/layout/Sidebar";
import ConnectionBadge, {
  connectionState,
} from "../components/common/ConnectionBadge";
import EmptyState from "../components/common/EmptyState";
import { getTrajectoryByPlate } from "../services/vehicleApi";
import type {
  AlternateMatch,
  MatchType,
} from "../services/vehicleApi";
import type {
  TrajectoryHopProperties,
  TrajectoryResponse,
  TrajectorySightingProperties,
} from "../services/mapApi";

type VehicleView = {
  plate: string;
  vehicleId?: number;
  sightings: string;
  confidence: string;
  firstSeen: string;
  lastSeen: string;
  timeline: TimelineEntry[];
  matchType?: MatchType | null;
  alternates: AlternateMatch[];
};

function clockTime(
  value: string | null
): string {
  if (!value) {
    return "\u2014";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
}

function percent(
  value: number | null | undefined
): string {
  return value === null ||
    value === undefined
    ? "\u2014"
    : `${Math.round(value * 100)}%`;
}

/**
 * The trajectory features already alternate
 * sighting, hop, sighting in order, so the
 * timeline is a straight walk over them.
 */
function toTimeline(
  trajectory: TrajectoryResponse
): TimelineEntry[] {
  return trajectory.geojson.features.map(
    (feature) => {
      if (
        feature.properties.kind === "sighting"
      ) {
        const p =
          feature.properties as TrajectorySightingProperties;

        return {
          camera: `${p.camera_id} \u00b7 ${
            p.camera_name ?? "unknown"
          }`,
          time: clockTime(p.timestamp),
          confidence: percent(
            p.plate_confidence
          ),
        };
      }

      const p =
        feature.properties as TrajectoryHopProperties;

      const minutes =
        p.duration_s === null
          ? null
          : Math.round(p.duration_s / 60);

      if (p.detour_suspected) {
        return {
          connection: {
            type: "detour" as const,
            label: `Detour suspected${
              minutes !== null
                ? ` \u00b7 ${minutes} min`
                : ""
            }`,
          },
        };
      }

      if (p.skipped_cameras.length > 0) {
        return {
          connection: {
            type: "inferred" as const,
            label: `Skipped ${p.skipped_cameras.join(
              ", "
            )} \u00b7 ${percent(
              p.link_confidence
            )} confidence`,
          },
        };
      }

      return {
        connection: {
          type: "confirmed" as const,
          label: `${
            minutes !== null
              ? `${minutes} min \u00b7 `
              : ""
          }${percent(
            p.link_confidence
          )} confidence`,
        },
      };
    }
  );
}

function toVehicleView(
  trajectory: TrajectoryResponse,
  matchType: MatchType | null,
  alternates: AlternateMatch[]
): VehicleView {
  return {
    plate:
      trajectory.canonical_plate ?? "unknown",
    vehicleId: trajectory.vehicle_id,
    sightings: String(
      trajectory.sighting_count
    ),
    confidence: percent(
      trajectory.mean_link_confidence
    ),
    firstSeen: clockTime(
      trajectory.first_seen_at
    ),
    lastSeen: clockTime(
      trajectory.last_seen_at
    ),
    timeline: toTimeline(trajectory),
    matchType,
    alternates,
  };
}


type TimelineEntry =
  | {
      camera: string;
      time: string;
      confidence: string;
    }
  | {
      connection: {
        type:
          | "confirmed"
          | "inferred"
          | "detour";
        label: string;
      };
    };

export default function VehicleSearch() {
  const [searchValue, setSearchValue] =
    useState("CH01AB1234");

  const [searchMessage, setSearchMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // Null until a search lands. A journey panel
  // with nothing selected shows that, rather than
  // a stand-in vehicle from another city.
  const [vehicle, setVehicle] =
    useState<VehicleView | null>(null);

  const [error, setError] =
    useState<Error | null>(null);

  const runSearch = useCallback(
    async (rawPlate: string) => {
      const plate = rawPlate
        .trim()
        .toUpperCase();

      // The backend requires a plate; an empty
      // one is a 400, not an empty result.
      if (!plate) {
        setSearchMessage(
          "Enter a plate to search."
        );
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result =
          await getTrajectoryByPlate(plate);

        // A miss is 200 with a null trajectory —
        // "no vehicle carries that plate" is a
        // search result, not an error.
        if (!result.trajectory) {
          setVehicle(null);

          setSearchMessage(
            result.alternate_matches.length > 0
              ? `No vehicle carries ${plate}. Closest: ${result.alternate_matches
                  .map(
                    (a) => a.canonical_plate
                  )
                  .join(", ")}`
              : `No vehicle carries ${plate}.`
          );
          return;
        }

        setVehicle(
          toVehicleView(
            result.trajectory,
            result.match_type,
            result.alternate_matches
          )
        );

        setSearchMessage(
          result.match_type &&
            result.match_type !== "exact"
            ? `Matched ${result.matched_plate} by ${result.match_type} search.`
            : ""
        );
      } catch (cause) {
        // There is no bundled vehicle to fall back
        // to: a journey the backend did not return
        // is not a journey.
        setVehicle(null);

        setError(
          cause instanceof Error
            ? cause
            : new Error(String(cause))
        );

        setSearchMessage(
          "Could not reach the backend. Check that it is running on port 8000."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Seed the panel on first paint.
  useEffect(() => {
    runSearch("CH01AB1234");
  }, [runSearch]);

  function handleSearch() {
    runSearch(searchValue);
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
            alignItems: "center",
            justifyContent: "space-between",
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
              Vehicle Search

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
              Search a vehicle and reconstruct its camera-to-camera journey
            </div>
          </div>

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

        {/* SEARCH */}

        <section
          style={{
            background: "#091828",
            border:
              "1px solid rgba(255,255,255,0.07)",
            borderRadius: "14px",
            padding: "14px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <input
              value={searchValue}
              onChange={(event) =>
                setSearchValue(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  handleSearch();
                }
              }}
              placeholder="Enter number plate..."
              style={{
                flex: 1,
                height: "44px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(148,163,184,.16)",
                background: "#0c1b2d",
                color: "white",
                padding: "0 14px",
                outline: "none",
                fontSize: "14px",
                fontWeight: 600,
                textTransform:
                  "uppercase",
              }}
            />

            <button
              onClick={handleSearch}
              style={{
                height: "44px",
                padding: "0 22px",
                border: "none",
                borderRadius: "10px",
                background: "#2563eb",
                color: "white",
                cursor: "pointer",
                fontWeight: 650,
              }}
            >
              Search Vehicle
            </button>
          </div>

          {searchMessage && (
            <div
              style={{
                marginTop: "10px",
                color: "#fca5a5",
                fontSize: "11px",
              }}
            >
              {searchMessage}
            </div>
          )}

          <div
            style={{
              marginTop: "9px",
              fontSize: "10px",
              color: "#64748b",
            }}
          >
            Exact, then skeleton, then fuzzy matching —
            a misread plate still finds the vehicle, and
            the result says which tier hit.
          </div>
        </section>

        {/* WORKSPACE */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 3.4fr) minmax(300px, 1fr)",
            gap: "12px",
            height: "720px",
          }}
        >
          {/* MAP */}

          <section
            style={{
              position: "relative",
              minWidth: 0,
              borderRadius: "16px",
              overflow: "hidden",
              border:
                "1px solid rgba(255,255,255,0.07)",
              background: "#0f172a",
            }}
          >
            <CityMap
              key={vehicle?.vehicleId ?? "none"}
              showCamerasInitially={true}
              showTrajectoryInitially={true}
              showTrafficInitially={false}
              vehicleId={vehicle?.vehicleId}
            />
          </section>

          {/* JOURNEY PANEL */}

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
            {/* SUMMARY */}

            <div
              style={{
                paddingBottom: "15px",
                borderBottom:
                  "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#64748b",
                }}
              >
                Selected vehicle
              </div>

              {!vehicle && (
                <EmptyState
                  title={
                    error
                      ? "Search failed"
                      : "No vehicle selected"
                  }
                  detail={
                    error
                      ? error.message
                      : "Search a plate to reconstruct its camera-to-camera journey."
                  }
                  tone={
                    error ? "error" : "neutral"
                  }
                />
              )}

              {vehicle && (
              <>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "22px",
                  fontWeight: 750,
                }}
              >
                {vehicle.plate}
              </div>

              <div
                style={{
                  marginTop: "10px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                <InfoBox
                  label="Sightings"
                  value={vehicle.sightings}
                />

                <InfoBox
                  label="Route confidence"
                  value={vehicle.confidence}
                />

                <InfoBox
                  label="First seen"
                  value={vehicle.firstSeen}
                />

                <InfoBox
                  label="Last seen"
                  value={vehicle.lastSeen}
                />
              </div>
              </>
              )}
            </div>

            {/* TIMELINE */}

            <div
              style={{
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                Journey Timeline
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "10px",
                  color: "#64748b",
                }}
              >
                Chronological ANPR observations
              </div>

              <div
                style={{
                  marginTop: "16px",
                }}
              >
                {!vehicle ||
                vehicle.timeline.length ===
                  0 ? (
                  <EmptyState
                    title="No journey"
                    detail="A vehicle's timeline appears here once a search matches it."
                  />
                ) : (
                  vehicle.timeline.map(
                  (
                    item,
                    index
                  ) => {
                    if (
                      "camera" in item
                    ) {
                      return (
                        <TimelineItem
                          key={index}
                          camera={
                            item.camera
                          }
                          time={
                            item.time
                          }
                          confidence={
                            item.confidence
                          }
                        />
                      );
                    }

                    if (
                      "connection" in
                      item
                    ) {
                      return (
                        <TimelineConnection
                          key={index}
                          type={
                            item.connection
                              .type
                          }
                          label={
                            item.connection
                              .label
                          }
                        />
                      );
                    }

                    return null;
                  }
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// =====================================
// INFO BOX
// =====================================

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#0c1b2d",
        borderRadius: "9px",
        padding: "10px",
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
          marginTop: "4px",
          fontSize: "13px",
          fontWeight: 650,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// =====================================
// TIMELINE ITEM
// =====================================

function TimelineItem({
  camera,
  time,
  confidence,
}: {
  camera: string;
  time: string;
  confidence: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
      }}
    >
      <div
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          background: "#2563eb",
          border: "2px solid #93c5fd",
          marginTop: "3px",
          flexShrink: 0,
        }}
      />

      <div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 650,
          }}
        >
          {camera}
        </div>

        <div
          style={{
            marginTop: "3px",
            color: "#7f9dbd",
            fontSize: "10px",
          }}
        >
          {time} · {confidence}
        </div>
      </div>
    </div>
  );
}

// =====================================
// TIMELINE CONNECTION
// =====================================

function TimelineConnection({
  type,
  label,
}: {
  type:
    | "confirmed"
    | "inferred"
    | "detour";

  label: string;
}) {
  const color =
    type === "detour"
      ? "#f59e0b"
      : type === "inferred"
      ? "#64748b"
      : "#2563eb";

  return (
    <div
      style={{
        marginLeft: "5px",
        padding: "9px 0 9px 16px",
        borderLeft:
          type === "inferred"
            ? `2px dashed ${color}`
            : `2px solid ${color}`,
        fontSize: "9px",
        color:
          type === "detour"
            ? "#fbbf24"
            : "#64748b",
      }}
    >
      {label}
    </div>
  );
}