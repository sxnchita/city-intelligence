import { useState } from "react";

import CityMap from "../components/map/CityMap";
import Sidebar from "../components/layout/Sidebar";

const demoVehicles = {
  UP15AB1234: {
    plate: "UP15AB1234",
    sightings: "4",
    confidence: "86%",
    firstSeen: "9:54 PM",
    lastSeen: "10:42 PM",
    timeline: [
      {
        camera: "C03 · Karol Bagh",
        time: "9:54 PM",
        confidence: "97%",
      },
      {
        connection: {
          type: "confirmed" as const,
          label: "8 min · high confidence",
        },
      },
      {
        camera: "C01 · Connaught Place",
        time: "10:02 PM",
        confidence: "95%",
      },
      {
        connection: {
          type: "inferred" as const,
          label: "Skipped C05 · 68% confidence",
        },
      },
      {
        camera: "C02 · India Gate",
        time: "10:28 PM",
        confidence: "91%",
      },
      {
        connection: {
          type: "detour" as const,
          label: "Detour suspected",
        },
      },
      {
        camera: "C04 · ITO",
        time: "10:42 PM",
        confidence: "96%",
      },
    ],
  },

  DL8CAF9211: {
    plate: "DL8CAF9211",
    sightings: "3",
    confidence: "92%",
    firstSeen: "10:04 PM",
    lastSeen: "10:39 PM",
    timeline: [
      {
        camera: "C02 · India Gate",
        time: "10:04 PM",
        confidence: "94%",
      },
      {
        connection: {
          type: "confirmed" as const,
          label: "12 min · high confidence",
        },
      },
      {
        camera: "C01 · Connaught Place",
        time: "10:16 PM",
        confidence: "96%",
      },
      {
        connection: {
          type: "confirmed" as const,
          label: "23 min · high confidence",
        },
      },
      {
        camera: "C04 · ITO",
        time: "10:39 PM",
        confidence: "91%",
      },
    ],
  },

  HR26DX4821: {
    plate: "HR26DX4821",
    sightings: "3",
    confidence: "79%",
    firstSeen: "9:48 PM",
    lastSeen: "10:34 PM",
    timeline: [
      {
        camera: "C05 · Rajiv Chowk",
        time: "9:48 PM",
        confidence: "88%",
      },
      {
        connection: {
          type: "inferred" as const,
          label: "Possible missed sighting · 72% confidence",
        },
      },
      {
        camera: "C01 · Connaught Place",
        time: "10:09 PM",
        confidence: "81%",
      },
      {
        connection: {
          type: "confirmed" as const,
          label: "25 min · high confidence",
        },
      },
      {
        camera: "C03 · Karol Bagh",
        time: "10:34 PM",
        confidence: "85%",
      },
    ],
  },
};

type VehicleKey = keyof typeof demoVehicles;

export default function VehicleSearch() {
  const [searchValue, setSearchValue] =
    useState("UP15AB1234");

  const [selectedPlate, setSelectedPlate] =
    useState<VehicleKey>("UP15AB1234");

  const [searchMessage, setSearchMessage] =
    useState("");

  const vehicle =
    demoVehicles[selectedPlate];

  function handleSearch() {
    const normalizedPlate =
      searchValue
        .trim()
        .toUpperCase();

    if (
      normalizedPlate in
      demoVehicles
    ) {
      setSelectedPlate(
        normalizedPlate as VehicleKey
      );

      setSearchValue(
        normalizedPlate
      );

      setSearchMessage("");
    } else {
      setSearchMessage(
        "Vehicle not found in demo data."
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
              }}
            >
              Vehicle Search
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
            Demo vehicles: UP15AB1234, DL8CAF9211, HR26DX4821
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
              showCamerasInitially={true}
              showTrajectoryInitially={true}
              showTrafficInitially={false}
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
                {vehicle.timeline.map(
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
                )}
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