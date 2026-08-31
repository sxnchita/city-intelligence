import {
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import Sidebar from "../components/layout/Sidebar";
import CityMap from "../components/map/CityMap";

type MatchType =
  | "exact"
  | "fuzzy";

type VehicleStatus =
  | "normal"
  | "watchlist";

type Sighting = {
  cameraId: string;
  cameraName: string;
  zone: string;
  time: string;
  confidence: number;
};

type VehicleRecord = {
  canonical_plate: string;
  match_type: MatchType;
  match_score: number;
  sighting_count: number;

  first_seen_at: string;
  last_seen_at: string;

  first_camera_id: string;
  last_camera_id: string;

  status: VehicleStatus;

  vehicle_id: string;

  vehicle_type: string;
  vehicle_colour: string;

  make_model: string;

  sightings: Sighting[];
};

const demoVehicles: Record<
  string,
  VehicleRecord
> = {
  CH01AB1234: {
    canonical_plate:
      "CH01AB1234",

    match_type:
      "exact",

    match_score:
      0.987,

    sighting_count:
      12,

    first_seen_at:
      "12 May 2025, 06:21 AM",

    last_seen_at:
      "12 May 2025, 09:42 AM",

    first_camera_id:
      "CHD_CAM_14",

    last_camera_id:
      "CHD_CAM_01",

    status:
      "watchlist",

    vehicle_id:
      "VCH-8F3A2D1E",

    vehicle_type:
      "SUV / Sedan",

    vehicle_colour:
      "White",

    make_model:
      "Maruti Suzuki / Dzire",

    sightings: [
      {
        cameraId:
          "CHD_CAM_01",

        cameraName:
          "Sector 22_23 Junction",

        zone:
          "Sector 22",

        time:
          "09:42 AM",

        confidence:
          98.7,
      },
      {
        cameraId:
          "CHD_CAM_05",

        cameraName:
          "Sector 35_36 Junction",

        zone:
          "Sector 35",

        time:
          "09:28 AM",

        confidence:
          97.9,
      },
      {
        cameraId:
          "CHD_CAM_08",

        cameraName:
          "Sector 8_9 Junction",

        zone:
          "Sector 8",

        time:
          "08:57 AM",

        confidence:
          96.3,
      },
      {
        cameraId:
          "CHD_CAM_11",

        cameraName:
          "Airport Road Entry",

        zone:
          "Airport Road",

        time:
          "07:51 AM",

        confidence:
          95.8,
      },
      {
        cameraId:
          "CHD_CAM_14",

        cameraName:
          "Zirakpur Entry Point",

        zone:
          "Airport Road",

        time:
          "06:21 AM",

        confidence:
          94.1,
      },
    ],
  },

  CH01AB1235: {
    canonical_plate:
      "CH01AB1235",

    match_type:
      "fuzzy",

    match_score:
      0.762,

    sighting_count:
      3,

    first_seen_at:
      "12 May 2025, 07:18 AM",

    last_seen_at:
      "12 May 2025, 08:51 AM",

    first_camera_id:
      "CHD_CAM_06",

    last_camera_id:
      "CHD_CAM_09",

    status:
      "normal",

    vehicle_id:
      "VCH-184CC2F0",

    vehicle_type:
      "Hatchback",

    vehicle_colour:
      "Silver",

    make_model:
      "Unknown",

    sightings: [
      {
        cameraId:
          "CHD_CAM_06",

        cameraName:
          "Sector 8_18 Junction",

        zone:
          "Sector 8",

        time:
          "07:18 AM",

        confidence:
          76.2,
      },
      {
        cameraId:
          "CHD_CAM_07",

        cameraName:
          "Sector 7_19 Junction",

        zone:
          "Sector 19",

        time:
          "08:02 AM",

        confidence:
          74.8,
      },
      {
        cameraId:
          "CHD_CAM_09",

        cameraName:
          "Sector 3_4 Junction",

        zone:
          "Sector 4",

        time:
          "08:51 AM",

        confidence:
          72.4,
      },
    ],
  },

  CH01AB1243: {
    canonical_plate:
      "CH01AB1243",

    match_type:
      "fuzzy",

    match_score:
      0.621,

    sighting_count:
      1,

    first_seen_at:
      "12 May 2025, 07:45 AM",

    last_seen_at:
      "12 May 2025, 07:45 AM",

    first_camera_id:
      "CHD_CAM_04",

    last_camera_id:
      "CHD_CAM_04",

    status:
      "normal",

    vehicle_id:
      "VCH-A9D3910E",

    vehicle_type:
      "Sedan",

    vehicle_colour:
      "Grey",

    make_model:
      "Unknown",

    sightings: [
      {
        cameraId:
          "CHD_CAM_04",

        cameraName:
          "Sector 17_21 Junction",

        zone:
          "Sector 17",

        time:
          "07:45 AM",

        confidence:
          62.1,
      },
    ],
  },
};

const quickAlternates = [
  {
    plate:
      "CH01AB1235",
    confidence:
      76.2,
  },
  {
    plate:
      "CH01AB1243",
    confidence:
      62.1,
  },
];

export default function VehicleSearch() {
  const [
    searchValue,
    setSearchValue,
  ] =
    useState(
      "CH01AB1234"
    );

  const [
    selectedPlate,
    setSelectedPlate,
  ] =
    useState(
      "CH01AB1234"
    );

  const [
    searchMode,
    setSearchMode,
  ] =
    useState<
      "exact" | "fuzzy"
    >("exact");

  const [
    searchMessage,
    setSearchMessage,
  ] =
    useState("");

  const vehicle =
    demoVehicles[
      selectedPlate
    ] ??
    demoVehicles.CH01AB1234;

  const latestSighting =
    vehicle.sightings[0];

  const firstSighting =
    vehicle.sightings[
      vehicle.sightings
        .length - 1
    ];

  const averageConfidence =
    useMemo(
      () =>
        vehicle.sightings.reduce(
          (
            total,
            item
          ) =>
            total +
            item.confidence,
          0
        ) /
        Math.max(
          1,
          vehicle.sightings
            .length
        ),
      [
        vehicle,
      ]
    );

  function handleSearch() {
    const normalized =
      searchValue
        .trim()
        .toUpperCase();

    if (
      normalized in
      demoVehicles
    ) {
      setSelectedPlate(
        normalized
      );

      setSearchValue(
        normalized
      );

      setSearchMessage(
        ""
      );

      return;
    }

    if (
      searchMode ===
      "fuzzy"
    ) {
      const fuzzyMatch =
        Object.keys(
          demoVehicles
        ).find(
          (
            plate
          ) =>
            plate.startsWith(
              normalized.slice(
                0,
                Math.max(
                  4,
                  normalized.length -
                    2
                )
              )
            )
        );

      if (
        fuzzyMatch
      ) {
        setSelectedPlate(
          fuzzyMatch
        );

        setSearchMessage(
          "Showing closest demo match."
        );

        return;
      }
    }

    setSearchMessage(
      "No vehicle match found in demo data."
    );
  }

  function clearSearch() {
    setSearchValue(
      ""
    );

    setSearchMessage(
      ""
    );
  }

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
            "18px 20px 16px",

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
              "15px",
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
              Vehicle Search
            </div>

            <div
              style={{
                marginTop:
                  "5px",

                color:
                  "#7b91a7",

                fontSize:
                  "10px",
              }}
            >
              Search and investigate vehicles using ANPR observations
            </div>
          </div>

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "8px",
            }}
          >
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
                    "0 0 9px rgba(34,197,94,.65)",
                }}
              />

              System Live
            </div>

            <span
              style={{
                width:
                  "1px",

                height:
                  "14px",

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
                Last 7 Days
              </option>
            </select>

            <select
              defaultValue="24h"
              style={
                headerControl
              }
            >
              <option value="15m">
                Last 15 Min
              </option>

              <option value="1h">
                Last 1 Hour
              </option>

              <option value="24h">
                Last 24 Hours
              </option>
            </select>
          </div>
        </div>

        {/* =====================================
            SEARCH BAR
        ===================================== */}

        <section
          style={{
            ...panelStyle,

            padding:
              "10px",

            marginBottom:
              "12px",
          }}
        >
          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "130px minmax(0,1fr) 92px 72px 205px",

              gap:
                "8px",

              alignItems:
                "center",
            }}
          >
            <select
              value={
                searchMode
              }
              onChange={(
                event
              ) =>
                setSearchMode(
                  event.target
                    .value as
                    | "exact"
                    | "fuzzy"
                )
              }
              style={{
                ...inputStyle,
                padding:
                  "0 10px",
              }}
            >
              <option value="exact">
                Exact Search
              </option>

              <option value="fuzzy">
                Fuzzy Search
              </option>
            </select>

            <div
              style={{
                height:
                  "39px",

                display:
                  "flex",

                alignItems:
                  "center",

                borderRadius:
                  "8px",

                border:
                  "1px solid rgba(148,163,184,.11)",

                background:
                  "#0b1b2d",

                overflow:
                  "hidden",
              }}
            >
              <input
                value={
                  searchValue
                }
                onChange={(
                  event
                ) =>
                  setSearchValue(
                    event.target
                      .value
                      .toUpperCase()
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    handleSearch();
                  }
                }}
                placeholder="Enter full plate number..."
                style={{
                  flex:
                    1,

                  height:
                    "100%",

                  border:
                    "none",

                  outline:
                    "none",

                  background:
                    "transparent",

                  color:
                    "white",

                  padding:
                    "0 12px",

                  fontSize:
                    "10px",

                  fontWeight:
                    650,

                  letterSpacing:
                    ".5px",
                }}
              />

              <div
                style={{
                  height:
                    "19px",

                  width:
                    "1px",

                  background:
                    "rgba(148,163,184,.13)",
                }}
              />

              <div
                style={{
                  padding:
                    "0 12px",

                  color:
                    "#5d748a",

                  fontSize:
                    "7px",
                }}
              >
                Full or partial plate
              </div>
            </div>

            <button
              onClick={
                handleSearch
              }
              style={{
                height:
                  "39px",

                border:
                  "1px solid rgba(59,130,246,.35)",

                borderRadius:
                  "8px",

                background:
                  "#2563eb",

                color:
                  "white",

                cursor:
                  "pointer",

                fontSize:
                  "8px",

                fontWeight:
                  700,
              }}
            >
              ⌕ Search
            </button>

            <button
              onClick={
                clearSearch
              }
              style={{
                height:
                  "39px",

                borderRadius:
                  "8px",

                border:
                  "1px solid rgba(59,130,246,.22)",

                background:
                  "#0c1c2f",

                color:
                  "#9bc7f7",

                cursor:
                  "pointer",

                fontSize:
                  "8px",

                fontWeight:
                  650,
              }}
            >
              Clear
            </button>

            <div
              style={{
                padding:
                  "7px 9px",

                minHeight:
                  "39px",

                borderRadius:
                  "8px",

                background:
                  "rgba(37,99,235,.06)",

                border:
                  "1px solid rgba(59,130,246,.12)",
              }}
            >
              <div
                style={{
                  color:
                    "#69b2ff",

                  fontSize:
                    "7px",

                  fontWeight:
                    700,
                }}
              >
                ◉ Search Tips
              </div>

              <div
                style={{
                  marginTop:
                    "3px",

                  color:
                    "#6f859a",

                  fontSize:
                    "6px",

                  lineHeight:
                    1.4,
                }}
              >
                Exact plate gives the highest precision.
              </div>
            </div>
          </div>

          {searchMessage && (
            <div
              style={{
                marginTop:
                  "8px",

                color:
                  searchMessage.includes(
                    "closest"
                  )
                    ? "#f59e0b"
                    : "#ef4444",

                fontSize:
                  "7px",
              }}
            >
              {searchMessage}
            </div>
          )}
        </section>

        {/* =====================================
            MATCH RESULT STRIP
        ===================================== */}

        <section
          style={{
            ...panelStyle,

            marginBottom:
              "12px",
          }}
        >
          <PanelHeader
            title="Match Result"
            subtitle="Backend-aware vehicle identity summary"
          />

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "1.2fr .9fr .9fr 1.05fr",

              gap:
                "8px",

              padding:
                "10px",
            }}
          >
            <div
              style={{
                padding:
                  "13px",

                borderRadius:
                  "9px",

                background:
                  "linear-gradient(145deg,rgba(34,197,94,.08),rgba(10,27,45,.9))",

                border:
                  "1px solid rgba(34,197,94,.42)",

                boxShadow:
                  "inset 3px 0 0 #22c55e",
              }}
            >
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
                }}
              >
                ✓ Best Match
              </div>

              <div
                style={{
                  marginTop:
                    "9px",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "space-between",

                  gap:
                    "10px",
                }}
              >
                <div>
                  <div
                    style={{
                      display:
                        "flex",

                      alignItems:
                        "center",

                      gap:
                        "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "21px",

                        fontWeight:
                          760,

                        letterSpacing:
                          ".5px",
                      }}
                    >
                      {
                        vehicle.canonical_plate
                      }
                    </span>

                    <MatchBadge
                      type={
                        vehicle.match_type
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    textAlign:
                      "right",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#6a8096",

                      fontSize:
                        "6px",
                    }}
                  >
                    Confidence Score
                  </div>

                  <div
                    style={{
                      marginTop:
                        "3px",

                      color:
                        "#4ade80",

                      fontSize:
                        "19px",

                      fontWeight:
                        760,
                    }}
                  >
                    {(
                      vehicle.match_score *
                      100
                    ).toFixed(
                      1
                    )}
                    %
                  </div>
                </div>
              </div>
            </div>

            <SummaryBox
              icon="◉"
              label="Total Sightings"
              value={String(
                vehicle.sighting_count
              )}
              detail={`First seen · ${vehicle.first_seen_at}`}
            />

            <SummaryBox
              icon="◷"
              label="Last Seen"
              value={
                vehicle.last_seen_at
              }
              detail={`Unique cameras · ${vehicle.sightings.length}`}
            />

            <div
              style={{
                padding:
                  "12px",

                borderRadius:
                  "9px",

                background:
                  vehicle.status ===
                  "watchlist"
                    ? "linear-gradient(145deg,rgba(245,158,11,.09),rgba(10,27,45,.9))"
                    : "#0b1b2d",

                border:
                  vehicle.status ===
                  "watchlist"
                    ? "1px solid rgba(245,158,11,.35)"
                    : "1px solid rgba(148,163,184,.08)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  gap:
                    "9px",

                  alignItems:
                    "flex-start",
                }}
              >
                <div
                  style={{
                    width:
                      "35px",

                    height:
                      "35px",

                    borderRadius:
                      "50%",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    background:
                      "rgba(245,158,11,.12)",

                    color:
                      "#f59e0b",

                    border:
                      "1px solid rgba(245,158,11,.25)",
                  }}
                >
                  △
                </div>

                <div>
                  <div
                    style={{
                      color:
                        "#f59e0b",

                      fontSize:
                        "7px",

                      fontWeight:
                        700,
                    }}
                  >
                    Watchlist Status
                  </div>

                  <div
                    style={{
                      marginTop:
                        "4px",

                      color:
                        "#f6c85f",

                      fontSize:
                        "11px",

                      fontWeight:
                        700,
                    }}
                  >
                    {vehicle.status ===
                    "watchlist"
                      ? "Flagged Vehicle"
                      : "Clear"}
                  </div>

                  <div
                    style={{
                      marginTop:
                        "5px",

                      color:
                        "#7f94a9",

                      fontSize:
                        "6.5px",

                      lineHeight:
                        1.45,
                    }}
                  >
                    {vehicle.status ===
                    "watchlist"
                      ? "Related alert context available"
                      : "No active watchlist flag"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================
            MAIN INVESTIGATION ROW
        ===================================== */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "minmax(310px,.82fr) minmax(340px,.95fr) minmax(420px,1.2fr)",

            gap:
              "12px",

            marginBottom:
              "12px",
          }}
        >
          {/* VEHICLE SUMMARY */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Vehicle Summary"
              subtitle="Resolved identity and observation metadata"
            />

            <div
              style={{
                padding:
                  "12px",
              }}
            >
              <VehiclePreview
                plate={
                  vehicle.canonical_plate
                }
              />

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "1fr 1fr",

                  gap:
                    "10px",

                  marginTop:
                    "12px",
                }}
              >
                <DetailItem
                  label="Plate Number"
                  value={
                    vehicle.canonical_plate
                  }
                />

                <DetailItem
                  label="Vehicle ID"
                  value={
                    vehicle.vehicle_id
                  }
                />

                <DetailItem
                  label="Vehicle Type"
                  value={
                    vehicle.vehicle_type
                  }
                />

                <DetailItem
                  label="Colour"
                  value={
                    vehicle.vehicle_colour
                  }
                />

                <DetailItem
                  label="Make / Model"
                  value={
                    vehicle.make_model
                  }
                />

                <DetailItem
                  label="Match Type"
                  value={
                    vehicle.match_type ===
                    "exact"
                      ? "Exact Match"
                      : "Fuzzy Match"
                  }
                />
              </div>

              <div
                style={{
                  marginTop:
                    "12px",

                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(4,1fr)",

                  borderRadius:
                    "8px",

                  overflow:
                    "hidden",

                  border:
                    "1px solid rgba(148,163,184,.07)",
                }}
              >
                <SmallMetric
                  label="Avg Confidence"
                  value={`${averageConfidence.toFixed(
                    1
                  )}%`}
                />

                <SmallMetric
                  label="First Camera"
                  value={
                    vehicle.first_camera_id
                  }
                />

                <SmallMetric
                  label="Last Camera"
                  value={
                    vehicle.last_camera_id
                  }
                />

                <SmallMetric
                  label="Status"
                  value={
                    vehicle.status ===
                    "watchlist"
                      ? "Flagged"
                      : "Normal"
                  }
                />
              </div>
            </div>
          </section>

          {/* TIMELINE */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Sighting Timeline"
              subtitle="Chronological ANPR observations"
            >
              <select
                defaultValue="all"
                style={
                  smallControl
                }
              >
                <option value="all">
                  All Cameras
                </option>
              </select>
            </PanelHeader>

            <div
              style={{
                padding:
                  "8px 10px 10px",
              }}
            >
              {vehicle.sightings.map(
                (
                  sighting,
                  index
                ) => (
                  <SightingRow
                    key={
                      `${sighting.cameraId}-${index}`
                    }
                    sighting={
                      sighting
                    }
                    active={
                      index ===
                      0
                    }
                    last={
                      index ===
                      vehicle.sightings
                        .length -
                        1
                    }
                  />
                )
              )}

              <button
                style={{
                  width:
                    "100%",

                  height:
                    "31px",

                  marginTop:
                    "4px",

                  border:
                    "none",

                  background:
                    "transparent",

                  color:
                    "#52a8ff",

                  cursor:
                    "pointer",

                  fontSize:
                    "7px",
                }}
              >
                ◷ View Full Timeline
              </button>
            </div>
          </section>

          {/* MAP / LAST LOCATION */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Last Observed Location"
              subtitle={`${vehicle.last_camera_id} · ${latestSighting.cameraName}`}
            >
              <span
                style={{
                  color:
                    "#71869b",

                  fontSize:
                    "6px",
                }}
              >
                2 min ago
              </span>
            </PanelHeader>

            {/*
              IMPORTANT:
              CityMap remains untouched.
              Your teammate still owns the mapping implementation.
            */}

            <div
              style={{
                height:
                  "300px",

                overflow:
                  "hidden",

                background:
                  "#081420",
              }}
            >
              <CityMap
                showCamerasInitially={
                  true
                }
                showTrajectoryInitially={
                  true
                }
                showTrafficInitially={
                  false
                }
              />
            </div>

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(3,1fr)",

                borderTop:
                  "1px solid rgba(148,163,184,.07)",
              }}
            >
              <LocationInfo
                label="Last Camera"
                value={
                  latestSighting.cameraId
                }
              />

              <LocationInfo
                label="Current Zone"
                value={
                  latestSighting.zone
                }
              />

              <LocationInfo
                label="Confidence"
                value={`${latestSighting.confidence}%`}
              />
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
              ".75fr .9fr 1.8fr",

            gap:
              "12px",
          }}
        >
          {/* PLATE HISTORY */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Plate History"
              subtitle="Past observation summary"
            />

            <div
              style={{
                padding:
                  "12px",
              }}
            >
              <HistoryCard
                plate={
                  vehicle.canonical_plate
                }
                value={`${vehicle.sighting_count} sightings`}
                active
              />

              <HistoryCard
                plate="CH01AB1234"
                value="3 sightings"
              />

              <HistoryCard
                plate="CH01AB1234"
                value="1 sighting"
              />

              <button
                style={{
                  marginTop:
                    "8px",

                  height:
                    "31px",

                  padding:
                    "0 10px",

                  borderRadius:
                    "7px",

                  border:
                    "1px solid rgba(59,130,246,.24)",

                  background:
                    "rgba(37,99,235,.10)",

                  color:
                    "#91c6ff",

                  cursor:
                    "pointer",

                  fontSize:
                    "7px",
                }}
              >
                View All History
              </button>
            </div>
          </section>

          {/* ALTERNATE MATCHES */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Alternate Matches"
              subtitle="Potential fuzzy candidates"
            />

            <div
              style={{
                padding:
                  "10px 12px",
              }}
            >
              {quickAlternates.map(
                (
                  item,
                  index
                ) => (
                  <AlternateMatch
                    key={
                      item.plate
                    }
                    index={
                      index + 1
                    }
                    plate={
                      item.plate
                    }
                    confidence={
                      item.confidence
                    }
                    onClick={() => {
                      setSearchValue(
                        item.plate
                      );

                      setSelectedPlate(
                        item.plate
                      );

                      setSearchMode(
                        "fuzzy"
                      );
                    }}
                  />
                )
              )}

              <button
                style={{
                  width:
                    "100%",

                  height:
                    "30px",

                  marginTop:
                    "5px",

                  border:
                    "none",

                  background:
                    "transparent",

                  color:
                    "#52a8ff",

                  cursor:
                    "pointer",

                  fontSize:
                    "7px",

                  textAlign:
                    "right",
                }}
              >
                View All Alternates →
              </button>
            </div>
          </section>

          {/* CAMERA EVIDENCE */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Camera Evidence"
              subtitle="Latest ANPR sightings"
            >
              <button
                style={{
                  border:
                    "none",

                  background:
                    "transparent",

                  color:
                    "#52a8ff",

                  cursor:
                    "pointer",

                  fontSize:
                    "7px",
                }}
              >
                View All Evidence
              </button>
            </PanelHeader>

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(5,minmax(0,1fr))",

                gap:
                  "8px",

                padding:
                  "10px",
              }}
            >
              {vehicle.sightings
                .slice(
                  0,
                  5
                )
                .map(
                  (
                    sighting,
                    index
                  ) => (
                    <EvidenceCard
                      key={
                        sighting.cameraId
                      }
                      sighting={
                        sighting
                      }
                      plate={
                        vehicle.canonical_plate
                      }
                      index={
                        index
                      }
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

            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            padding:
              "10px 12px",

            borderRadius:
              "9px",

            background:
              "#091725",

            border:
              "1px solid rgba(148,163,184,.07)",

            color:
              "#5f778e",

            fontSize:
              "7px",
          }}
        >
          <span>
            Vehicle search uses ANPR observations and fuzzy matching. Confidence scores represent match quality.
          </span>

          <span>
            City Intelligence · Vehicle Investigation
          </span>
        </div>
      </main>
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
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight:
          "50px",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "space-between",

        gap:
          "10px",

        padding:
          "10px 12px",

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
              "#60788f",

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
   MATCH BADGE
===================================== */

function MatchBadge({
  type,
}: {
  type: MatchType;
}) {
  const color =
    type ===
    "exact"
      ? "#22c55e"
      : "#f59e0b";

  return (
    <span
      style={{
        padding:
          "4px 7px",

        borderRadius:
          "5px",

        background:
          `${color}12`,

        border:
          `1px solid ${color}24`,

        color,

        fontSize:
          "6px",

        fontWeight:
          700,
      }}
    >
      {type ===
      "exact"
        ? "Exact Match"
        : "Fuzzy Match"}
    </span>
  );
}

/* =====================================
   SUMMARY
===================================== */

function SummaryBox({
  icon,
  label,
  value,
  detail,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      style={{
        padding:
          "12px",

        borderRadius:
          "9px",

        background:
          "#0b1b2d",

        border:
          "1px solid rgba(148,163,184,.08)",
      }}
    >
      <div
        style={{
          display:
            "flex",

          gap:
            "8px",

          alignItems:
            "flex-start",
        }}
      >
        <div
          style={{
            color:
              "#60a5fa",

            fontSize:
              "11px",
          }}
        >
          {icon}
        </div>

        <div>
          <div
            style={{
              color:
                "#6c8298",

              fontSize:
                "6.5px",
            }}
          >
            {label}
          </div>

          <div
            style={{
              marginTop:
                "4px",

              color:
                "#e0ebf5",

              fontSize:
                "10px",

              fontWeight:
                700,
            }}
          >
            {value}
          </div>

          <div
            style={{
              marginTop:
                "5px",

              color:
                "#627990",

              fontSize:
                "6px",

              lineHeight:
                1.4,
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
   VEHICLE PREVIEW
===================================== */

function VehiclePreview({
  plate,
}: {
  plate: string;
}) {
  return (
    <div
      style={{
        height:
          "148px",

        position:
          "relative",

        overflow:
          "hidden",

        borderRadius:
          "9px",

        background:
          "linear-gradient(#8aa1ae 0 45%,#39454c 46% 100%)",

        border:
          "1px solid rgba(148,163,184,.08)",
      }}
    >
      <div
        style={{
          position:
            "absolute",

          left:
            "50%",

          bottom:
            "16px",

          transform:
            "translateX(-50%)",

          width:
            "190px",

          height:
            "80px",

          borderRadius:
            "18px 18px 9px 9px",

          background:
            "linear-gradient(#f2f4f5,#cfd5d9)",

          boxShadow:
            "0 18px 25px rgba(0,0,0,.35)",
        }}
      >
        <div
          style={{
            position:
              "absolute",

            left:
              "34px",

            right:
              "34px",

            top:
              "8px",

            height:
              "25px",

            borderRadius:
              "15px 15px 4px 4px",

            background:
              "#31404a",
          }}
        />

        <div
          style={{
            position:
              "absolute",

            left:
              "12px",

            top:
              "42px",

            width:
              "35px",

            height:
              "12px",

            borderRadius:
              "5px",

            background:
              "#ba2c35",
          }}
        />

        <div
          style={{
            position:
              "absolute",

            right:
              "12px",

            top:
              "42px",

            width:
              "35px",

            height:
              "12px",

            borderRadius:
              "5px",

            background:
              "#ba2c35",
          }}
        />

        <div
          style={{
            position:
              "absolute",

            left:
              "50%",

            bottom:
              "10px",

            transform:
              "translateX(-50%)",

            padding:
              "3px 8px",

            background:
              "white",

            border:
              "1px solid #111827",

            color:
              "#111827",

            fontSize:
              "6px",

            fontWeight:
              800,
          }}
        >
          {plate}
        </div>
      </div>
    </div>
  );
}

/* =====================================
   DETAIL ITEM
===================================== */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          color:
            "#657d94",

          fontSize:
            "6px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop:
            "3px",

          color:
            "#d8e5f0",

          fontSize:
            "8px",

          fontWeight:
            650,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =====================================
   SMALL METRIC
===================================== */

function SmallMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding:
          "9px",

        borderRight:
          "1px solid rgba(148,163,184,.06)",
      }}
    >
      <div
        style={{
          color:
            "#5d748a",

          fontSize:
            "5.5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop:
            "3px",

          color:
            "#d5e1ed",

          fontSize:
            "6.5px",

          fontWeight:
            650,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =====================================
   SIGHTING TIMELINE
===================================== */

function SightingRow({
  sighting,
  active,
  last,
}: {
  sighting: Sighting;
  active: boolean;
  last: boolean;
}) {
  return (
    <div
      style={{
        position:
          "relative",

        display:
          "grid",

        gridTemplateColumns:
          "72px 1fr",

        gap:
          "8px",

        paddingBottom:
          last
            ? "0"
            : "8px",
      }}
    >
      {!last && (
        <span
          style={{
            position:
              "absolute",

            left:
              "8px",

            top:
              "23px",

            bottom:
              "-2px",

            width:
              "1px",

            background:
              "#2a4661",
          }}
        />
      )}

      <div
        style={{
          position:
            "relative",

          paddingLeft:
            "20px",
        }}
      >
        <span
          style={{
            position:
              "absolute",

            left:
              "4px",

            top:
              "5px",

            width:
              "9px",

            height:
              "9px",

            borderRadius:
              "50%",

            background:
              active
                ? "#22c55e"
                : "#2563eb",

            boxShadow:
              active
                ? "0 0 9px rgba(34,197,94,.55)"
                : "0 0 8px rgba(37,99,235,.35)",
          }}
        />

        <div
          style={{
            color:
              "#d6e2ed",

            fontSize:
              "8px",

            fontWeight:
              700,
          }}
        >
          {
            sighting.time
          }
        </div>

        <div
          style={{
            marginTop:
              "3px",

            color:
              "#61788f",

            fontSize:
              "6px",
          }}
        >
          {active
            ? "Latest"
            : "Earlier"}
        </div>
      </div>

      <div
        style={{
          padding:
            "8px",

          borderRadius:
            "8px",

          background:
            active
              ? "rgba(34,197,94,.075)"
              : "#0b1b2d",

          border:
            active
              ? "1px solid rgba(34,197,94,.33)"
              : "1px solid rgba(148,163,184,.06)",
        }}
      >
        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "flex-start",

            gap:
              "8px",
          }}
        >
          <div>
            <div
              style={{
                color:
                  "#dce8f4",

                fontSize:
                  "8px",

                fontWeight:
                  700,
              }}
            >
              {
                sighting.cameraId
              }
            </div>

            <div
              style={{
                marginTop:
                  "3px",

                color:
                  "#73899f",

                fontSize:
                  "6px",
              }}
            >
              {
                sighting.cameraName
              }
            </div>

            <div
              style={{
                marginTop:
                  "2px",

                color:
                  "#5e758b",

                fontSize:
                  "5.5px",
              }}
            >
              ◉{" "}
              {
                sighting.zone
              }
            </div>
          </div>

          <div
            style={{
              textAlign:
                "right",
            }}
          >
            <div
              style={{
                color:
                  active
                    ? "#4ade80"
                    : "#a9bfd2",

                fontSize:
                  "8px",

                fontWeight:
                  700,
              }}
            >
              {
                sighting.confidence
              }
              %
            </div>

            <div
              style={{
                marginTop:
                  "2px",

                color:
                  "#5f768d",

                fontSize:
                  "5.5px",
              }}
            >
              Confidence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================
   LOCATION INFO
===================================== */

function LocationInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding:
          "11px",

        borderRight:
          "1px solid rgba(148,163,184,.07)",
      }}
    >
      <div
        style={{
          color:
            "#61788f",

          fontSize:
            "6px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop:
            "4px",

          color:
            "#d9e5ef",

          fontSize:
            "7px",

          fontWeight:
            650,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =====================================
   HISTORY
===================================== */

function HistoryCard({
  plate,
  value,
  active = false,
}: {
  plate: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      style={{
        display:
          "inline-block",

        marginRight:
          "6px",

        marginBottom:
          "6px",

        padding:
          "8px 9px",

        borderRadius:
          "7px",

        background:
          active
            ? "rgba(34,197,94,.08)"
            : "#0b1b2d",

        border:
          active
            ? "1px solid rgba(34,197,94,.20)"
            : "1px solid rgba(148,163,184,.06)",
      }}
    >
      <div
        style={{
          color:
            "#dbe7f2",

          fontSize:
            "7px",

          fontWeight:
            700,
        }}
      >
        {plate}
      </div>

      <div
        style={{
          marginTop:
            "4px",

          color:
            active
              ? "#4ade80"
              : "#637a91",

          fontSize:
            "6px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =====================================
   ALTERNATE MATCH
===================================== */

function AlternateMatch({
  index,
  plate,
  confidence,
  onClick,
}: {
  index: number;
  plate: string;
  confidence: number;
  onClick: () => void;
}) {
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
          "22px 1fr auto",

        gap:
          "8px",

        alignItems:
          "center",

        padding:
          "9px 0",

        border:
          "none",

        borderBottom:
          "1px solid rgba(148,163,184,.055)",

        background:
          "transparent",

        color:
          "white",

        textAlign:
          "left",

        cursor:
          "pointer",
      }}
    >
      <div
        style={{
          width:
            "19px",

          height:
            "19px",

          borderRadius:
            "50%",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "rgba(37,99,235,.14)",

          color:
            "#8ec5ff",

          fontSize:
            "6px",

          fontWeight:
            700,
        }}
      >
        {index}
      </div>

      <div>
        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            gap:
              "6px",
          }}
        >
          <span
            style={{
              color:
                "#dce7f2",

              fontSize:
                "7px",

              fontWeight:
                700,
            }}
          >
            {plate}
          </span>

          <span
            style={{
              padding:
                "2px 5px",

              borderRadius:
                "4px",

              background:
                "rgba(245,158,11,.10)",

              color:
                "#f59e0b",

              fontSize:
                "5px",

              fontWeight:
                700,
            }}
          >
            Fuzzy Match
          </span>
        </div>
      </div>

      <div
        style={{
          textAlign:
            "right",
        }}
      >
        <div
          style={{
            color:
              "#4ade80",

            fontSize:
              "7px",

            fontWeight:
              700,
          }}
        >
          {
            confidence
          }
          %
        </div>

        <div
          style={{
            width:
              "55px",

            height:
              "3px",

            marginTop:
              "4px",

            borderRadius:
              "100px",

            background:
              "#13263a",

            overflow:
              "hidden",
          }}
        >
          <div
            style={{
              width:
                `${confidence}%`,

              height:
                "100%",

              background:
                "#22c55e",
            }}
          />
        </div>
      </div>
    </button>
  );
}

/* =====================================
   EVIDENCE CARD
===================================== */

function EvidenceCard({
  sighting,
  plate,
  index,
}: {
  sighting: Sighting;
  plate: string;
  index: number;
}) {
  return (
    <div
      style={{
        overflow:
          "hidden",

        borderRadius:
          "8px",

        background:
          "#0b1b2d",

        border:
          "1px solid rgba(148,163,184,.07)",
      }}
    >
      <div
        style={{
          height:
            "78px",

          position:
            "relative",

          background:
            "linear-gradient(#8b9eaa 0 43%,#3b454b 44% 100%)",
        }}
      >
        <div
          style={{
            position:
              "absolute",

            left:
              "50%",

            bottom:
              "7px",

            transform:
              "translateX(-50%)",

            width:
              "88px",

            height:
              "42px",

            borderRadius:
              "10px 10px 5px 5px",

            background:
              index % 2 ===
              0
                ? "#dfe4e7"
                : "#bcc4c9",

            boxShadow:
              "0 8px 14px rgba(0,0,0,.28)",
          }}
        >
          <div
            style={{
              position:
                "absolute",

              left:
                "50%",

              bottom:
                "5px",

              transform:
                "translateX(-50%)",

              padding:
                "1px 4px",

              background:
                "white",

              color:
                "#111827",

              fontSize:
                "4px",

              fontWeight:
                800,
            }}
          >
            {plate}
          </div>
        </div>
      </div>

      <div
        style={{
          padding:
            "7px",
        }}
      >
        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            gap:
              "6px",
          }}
        >
          <span
            style={{
              color:
                "#e0ebf5",

              fontSize:
                "6px",

              fontWeight:
                700,
            }}
          >
            {
              sighting.cameraId
            }
          </span>

          <span
            style={{
              padding:
                "2px 4px",

              borderRadius:
                "4px",

              background:
                "rgba(34,197,94,.12)",

              color:
                "#4ade80",

              fontSize:
                "5px",

              fontWeight:
                700,
            }}
          >
            {
              sighting.confidence
            }
            %
          </span>
        </div>

        <div
          style={{
            marginTop:
              "3px",

            color:
              "#60778e",

            fontSize:
              "5.5px",
          }}
        >
          {
            sighting.cameraName
          }
        </div>

        <div
          style={{
            marginTop:
              "2px",

            color:
              "#536a81",

            fontSize:
              "5px",
          }}
        >
          {sighting.time}
        </div>
      </div>
    </div>
  );
}

/* =====================================
   STYLES
===================================== */

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

const inputStyle:
  CSSProperties =
  {
    height:
      "39px",

    borderRadius:
      "8px",

    border:
      "1px solid rgba(148,163,184,.11)",

    background:
      "#0b1b2d",

    color:
      "#c6d4e0",

    outline:
      "none",

    fontSize:
      "7px",
  };

const headerControl:
  CSSProperties =
  {
    height:
      "32px",

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

    outline:
      "none",

    fontSize:
      "7px",
  };

const smallControl:
  CSSProperties =
  {
    height:
      "28px",

    borderRadius:
      "6px",

    border:
      "1px solid rgba(148,163,184,.10)",

    background:
      "#0b1b2d",

    color:
      "#b7c7d6",

    padding:
      "0 8px",

    outline:
      "none",

    fontSize:
      "6px",
  };