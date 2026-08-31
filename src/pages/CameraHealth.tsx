import {
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import Sidebar from "../components/layout/Sidebar";

type BackendCamera = {
  camera_id: string;
  name: string;
  heading_degrees: number | null;
  zone: string | null;
  is_provisional: boolean;
  is_active: boolean;
  last_event_at: string | null;
};

type CameraHealthStatus =
  | "online"
  | "delayed"
  | "silent"
  | "inactive";

type CameraViewModel =
  BackendCamera & {
    health_status: CameraHealthStatus;
    health_score: number;
    last_seen_label: string;
  };

const mockBackendCameras: BackendCamera[] = [
  {
    camera_id: "CHD_CAM_01",
    name: "Sector_22_23_Junction",
    heading_degrees: 143,
    zone: "Sector_22",
    is_provisional: false,
    is_active: true,
    last_event_at: new Date(
      Date.now() - 20 * 1000
    ).toISOString(),
  },
  {
    camera_id: "CHD_CAM_02",
    name: "Sector_17_21_Junction",
    heading_degrees: 143,
    zone: "Sector_17",
    is_provisional: false,
    is_active: true,
    last_event_at: new Date(
      Date.now() - 50 * 1000
    ).toISOString(),
  },
  {
    camera_id: "CHD_CAM_03",
    name: "Sector_18_20_Junction",
    heading_degrees: 143,
    zone: "Sector_20",
    is_provisional: false,
    is_active: true,
    last_event_at: new Date(
      Date.now() - 3 * 60 * 1000
    ).toISOString(),
  },
  {
    camera_id: "CHD_CAM_04",
    name: "Sector_19_30_Junction",
    heading_degrees: 143,
    zone: "Sector_19",
    is_provisional: false,
    is_active: true,
    last_event_at: new Date(
      Date.now() - 8 * 60 * 1000
    ).toISOString(),
  },
  {
    camera_id: "CHD_CAM_05",
    name: "Sector_9_10_Junction",
    heading_degrees: 323,
    zone: "Sector_10",
    is_provisional: false,
    is_active: true,
    last_event_at: new Date(
      Date.now() - 25 * 1000
    ).toISOString(),
  },
  {
    camera_id: "CHD_CAM_06",
    name: "Sector_8_18_Junction",
    heading_degrees: 323,
    zone: "Sector_18",
    is_provisional: false,
    is_active: true,
    last_event_at: new Date(
      Date.now() - 12 * 60 * 1000
    ).toISOString(),
  },
  {
    camera_id: "CHD_CAM_07",
    name: "Sector_7_19_Junction",
    heading_degrees: 323,
    zone: "Sector_19",
    is_provisional: false,
    is_active: true,
    last_event_at: new Date(
      Date.now() - 35 * 1000
    ).toISOString(),
  },
  {
    camera_id: "CHD_CAM_08",
    name: "Sector_19_26_Junction",
    heading_degrees: 323,
    zone: "Sector_26",
    is_provisional: false,
    is_active: true,
    last_event_at: new Date(
      Date.now() - 22 * 60 * 1000
    ).toISOString(),
  },
  {
    camera_id: "CHD_CAM_09",
    name: "Sector_3_4_Junction",
    heading_degrees: 143,
    zone: "Sector_4",
    is_provisional: false,
    is_active: true,
    last_event_at: new Date(
      Date.now() - 1 * 60 * 1000
    ).toISOString(),
  },
  {
    camera_id: "CHD_CAM_10",
    name: "Sector_4_5_Junction",
    heading_degrees: 143,
    zone: "Sector_5",
    is_provisional: true,
    is_active: true,
    last_event_at: new Date(
      Date.now() - 6 * 60 * 1000
    ).toISOString(),
  },
  {
    camera_id: "CHD_CAM_11",
    name: "Sector_5_6_Junction",
    heading_degrees: 143,
    zone: "Sector_6",
    is_provisional: false,
    is_active: true,
    last_event_at: new Date(
      Date.now() - 40 * 1000
    ).toISOString(),
  },
  {
    camera_id: "CHD_CAM_12",
    name: "Sector_6_26_Junction",
    heading_degrees: 143,
    zone: "Sector_26",
    is_provisional: false,
    is_active: true,
    last_event_at: new Date(
      Date.now() - 18 * 60 * 1000
    ).toISOString(),
  },
  {
    camera_id: "CHD_CAM_13",
    name: "Sector_8_18_Junction_SE",
    heading_degrees: 143,
    zone: "Sector_8",
    is_provisional: false,
    is_active: true,
    last_event_at: new Date(
      Date.now() -
        2 *
          60 *
          60 *
          1000
    ).toISOString(),
  },
  {
    camera_id: "CHD_CAM_14",
    name: "Sector_18_20_Junction_NW",
    heading_degrees: 323,
    zone: "Sector_18",
    is_provisional: false,
    is_active: false,
    last_event_at: new Date(
      Date.now() -
        4 *
          60 *
          60 *
          1000
    ).toISOString(),
  },
];

type StatusFilter =
  | "all"
  | CameraHealthStatus;

function deriveHealth(
  camera: BackendCamera
): CameraViewModel {
  if (!camera.is_active) {
    return {
      ...camera,
      health_status: "inactive",
      health_score: 0,
      last_seen_label:
        formatLastSeen(
          camera.last_event_at
        ),
    };
  }

  if (
    !camera.last_event_at
  ) {
    return {
      ...camera,
      health_status: "silent",
      health_score: 10,
      last_seen_label:
        "No recent event",
    };
  }

  const last =
    new Date(
      camera.last_event_at
    ).getTime();

  const diffMinutes =
    (Date.now() - last) /
    60000;

  let status:
    CameraHealthStatus;

  let score: number;

  if (
    diffMinutes <= 5
  ) {
    status = "online";

    score = Math.max(
      92,
      100 -
        Math.round(
          diffMinutes * 2
        )
    );
  } else if (
    diffMinutes <= 15
  ) {
    status = "delayed";

    score = Math.max(
      55,
      82 -
        Math.round(
          diffMinutes * 2
        )
    );
  } else {
    status = "silent";

    score = Math.max(
      5,
      42 -
        Math.round(
          diffMinutes / 5
        )
    );
  }

  return {
    ...camera,
    health_status:
      status,
    health_score:
      score,
    last_seen_label:
      formatLastSeen(
        camera.last_event_at
      ),
  };
}

export default function CameraHealth() {
  const cameras =
    useMemo(
      () =>
        mockBackendCameras.map(
          deriveHealth
        ),
      []
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    zoneFilter,
    setZoneFilter,
  ] =
    useState("all");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all"
    );

  const [
    selectedCameraId,
    setSelectedCameraId,
  ] =
    useState(
      cameras[0].camera_id
    );

  const selectedCamera =
    cameras.find(
      (camera) =>
        camera.camera_id ===
        selectedCameraId
    ) ??
    cameras[0];

  const zones =
    Array.from(
      new Set(
        cameras
          .map(
            (camera) =>
              camera.zone
          )
          .filter(
            Boolean
          ) as string[]
      )
    );

  const filtered =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return cameras.filter(
          (camera) => {
            const matchesSearch =
              !query ||
              camera.camera_id
                .toLowerCase()
                .includes(
                  query
                ) ||
              camera.name
                .toLowerCase()
                .includes(
                  query
                ) ||
              camera.zone
                ?.toLowerCase()
                .includes(
                  query
                );

            const matchesZone =
              zoneFilter ===
                "all" ||
              camera.zone ===
                zoneFilter;

            const matchesStatus =
              statusFilter ===
                "all" ||
              camera.health_status ===
                statusFilter;

            return (
              matchesSearch &&
              matchesZone &&
              matchesStatus
            );
          }
        );
      },
      [
        cameras,
        search,
        zoneFilter,
        statusFilter,
      ]
    );

  const onlineCount =
    cameras.filter(
      (camera) =>
        camera.health_status ===
        "online"
    ).length;

  const delayedCount =
    cameras.filter(
      (camera) =>
        camera.health_status ===
        "delayed"
    ).length;

  const silentCount =
    cameras.filter(
      (camera) =>
        camera.health_status ===
        "silent"
    ).length;

  const provisionalCount =
    cameras.filter(
      (camera) =>
        camera.is_provisional
    ).length;

  const activeCount =
    cameras.filter(
      (camera) =>
        camera.is_active
    ).length;

  const networkHealth =
    Math.round(
      cameras
        .filter(
          (camera) =>
            camera.is_active
        )
        .reduce(
          (
            total,
            camera
          ) =>
            total +
            camera.health_score,
          0
        ) /
        Math.max(
          1,
          activeCount
        )
    );

  const attentionCameras =
    cameras
      .filter(
        (camera) =>
          camera.health_status ===
            "silent" ||
          camera.health_status ===
            "delayed"
      )
      .sort(
        (a, b) =>
          a.health_score -
          b.health_score
      )
      .slice(
        0,
        3
      );

  const nodePositions = [
    {
      left: "10%",
      top: "15%",
    },
    {
      left: "29%",
      top: "15%",
    },
    {
      left: "48%",
      top: "15%",
    },
    {
      left: "69%",
      top: "15%",
    },
    {
      left: "89%",
      top: "15%",
    },

    {
      left: "10%",
      top: "48%",
    },
    {
      left: "29%",
      top: "44%",
    },

    {
      left: "70%",
      top: "44%",
    },
    {
      left: "89%",
      top: "48%",
    },

    {
      left: "10%",
      top: "78%",
    },
    {
      left: "29%",
      top: "75%",
    },
    {
      left: "48%",
      top: "79%",
    },
    {
      left: "70%",
      top: "75%",
    },
    {
      left: "89%",
      top: "78%",
    },
  ];

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
            "20px",

          background:
            "radial-gradient(circle at top right, rgba(37,99,235,.055), transparent 34%), #07111d",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display:
              "flex",

            alignItems:
              "flex-start",

            justifyContent:
              "space-between",

            gap:
              "16px",

            marginBottom:
              "18px",
          }}
        >
          <div>
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
              Camera Health
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
              Monitor active cameras, heartbeat activity and deployment health
            </div>
          </div>

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "11px",

              paddingTop:
                "5px",
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
                  "8px",

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
                    "0 0 10px rgba(34,197,94,.7)",
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
                  "#6f8499",

                fontSize:
                  "8px",
              }}
            >
              Backend contract ready
            </span>
          </div>
        </div>

        {/* KPI CARDS */}

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
          <HealthMetric
            title="Total Cameras"
            value={String(
              cameras.length
            )}
            detail="Active deployment"
            color="#3b82f6"
            icon="▣"
          />

          <HealthMetric
            title="Online"
            value={String(
              onlineCount
            )}
            detail="Reporting normally"
            color="#22c55e"
            icon="✓"
          />

          <HealthMetric
            title="Delayed"
            value={String(
              delayedCount
            )}
            detail="Heartbeat delayed"
            color="#f59e0b"
            icon="◷"
          />

          <HealthMetric
            title="Silent"
            value={String(
              silentCount
            )}
            detail="No recent events"
            color="#ef4444"
            icon="!"
          />

          <HealthMetric
            title="Provisional"
            value={String(
              provisionalCount
            )}
            detail="Pending validation"
            color="#8b5cf6"
            icon="◇"
          />

          <HealthRing
            value={
              networkHealth
            }
          />
        </div>

        {/* NETWORK + ATTENTION */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "minmax(0,1.65fr) minmax(320px,.75fr)",

            gap:
              "12px",

            marginBottom:
              "12px",
          }}
        >
          {/* NETWORK OVERVIEW */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Network Overview"
              subtitle="Frontend status derived from backend last_event_at"
            />

            <div
              style={{
                position:
                  "relative",

                minHeight:
                  "300px",

                padding:
                  "20px",

                overflow:
                  "hidden",
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
                    "25px 25px",
                }}
              />

              {/* CONNECTION LINES */}

              <svg
                viewBox="0 0 1000 320"
                preserveAspectRatio="none"
                style={{
                  position:
                    "absolute",

                  inset:
                    0,

                  width:
                    "100%",

                  height:
                    "100%",

                  opacity:
                    .45,

                  pointerEvents:
                    "none",
                }}
              >
                <path
                  d="M100 55 L500 160 L900 55"
                  fill="none"
                  stroke="#48627d"
                  strokeWidth="1"
                />

                <path
                  d="M105 150 L420 150"
                  fill="none"
                  stroke="#48627d"
                  strokeWidth="1"
                />

                <path
                  d="M580 150 L895 150"
                  fill="none"
                  stroke="#48627d"
                  strokeWidth="1"
                />

                <path
                  d="M110 260 L500 160 L890 260"
                  fill="none"
                  stroke="#48627d"
                  strokeWidth="1"
                />

                <path
                  d="M290 55 L430 135"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  opacity=".5"
                />

                <path
                  d="M710 55 L570 135"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  opacity=".5"
                />

                <path
                  d="M290 250 L430 185"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  opacity=".5"
                />

                <path
                  d="M710 250 L570 185"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  opacity=".5"
                />
              </svg>

              {/* CITY CORE */}

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

                  width:
                    "84px",

                  height:
                    "84px",

                  zIndex:
                    4,

                  borderRadius:
                    "25px",

                  display:
                    "flex",

                  flexDirection:
                    "column",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  background:
                    "linear-gradient(145deg,#102a48,#0a192a)",

                  border:
                    "1px solid rgba(59,130,246,.30)",

                  boxShadow:
                    "0 0 36px rgba(37,99,235,.15)",
                }}
              >
                <div
                  style={{
                    color:
                      "#dbeafe",

                    fontSize:
                      "9px",

                    fontWeight:
                      700,
                  }}
                >
                  CITY
                </div>

                <div
                  style={{
                    marginTop:
                      "2px",

                    color:
                      "#60a5fa",

                    fontSize:
                      "9px",

                    fontWeight:
                      800,
                  }}
                >
                  CORE
                </div>
              </div>

              {/* CAMERA NODES */}

              <div
                style={{
                  position:
                    "absolute",

                  inset:
                    0,

                  zIndex:
                    3,
                }}
              >
                {cameras.map(
                  (
                    camera,
                    index
                  ) => {
                    const position =
                      nodePositions[
                        index
                      ];

                    if (
                      !position
                    ) {
                      return null;
                    }

                    return (
                      <div
                        key={
                          camera.camera_id
                        }
                        style={{
                          position:
                            "absolute",

                          left:
                            position.left,

                          top:
                            position.top,

                          transform:
                            "translate(-50%,-50%)",
                        }}
                      >
                        <CameraNode
                          camera={
                            camera
                          }
                          selected={
                            camera.camera_id ===
                            selectedCamera.camera_id
                          }
                          onClick={() =>
                            setSelectedCameraId(
                              camera.camera_id
                            )
                          }
                        />
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>

          {/* ATTENTION */}

          <section
            style={
              panelStyle
            }
          >
            <PanelHeader
              title="Needs Attention"
              subtitle="Cameras with stale heartbeat activity"
              danger
            />

            <div
              style={{
                padding:
                  "10px",

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "8px",
              }}
            >
              {attentionCameras.map(
                (
                  camera
                ) => (
                  <AttentionCard
                    key={
                      camera.camera_id
                    }
                    camera={
                      camera
                    }
                    onClick={() =>
                      setSelectedCameraId(
                        camera.camera_id
                      )
                    }
                  />
                )
              )}
            </div>
          </section>
        </div>

        {/* SELECTED CAMERA DETAILS */}

        <section
          style={{
            ...panelStyle,

            marginBottom:
              "12px",
          }}
        >
          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "1.2fr repeat(6,1fr)",

              alignItems:
                "center",
            }}
          >
            <div
              style={{
                padding:
                  "13px 15px",

                borderRight:
                  "1px solid rgba(148,163,184,.07)",
              }}
            >
              <div
                style={{
                  color:
                    "#668097",

                  fontSize:
                    "7px",

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    ".7px",
                }}
              >
                Selected Camera
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
                {
                  selectedCamera.camera_id
                }
              </div>

              <div
                style={{
                  marginTop:
                    "3px",

                  color:
                    "#778da3",

                  fontSize:
                    "7px",
                }}
              >
                {formatCameraName(
                  selectedCamera.name
                )}
              </div>
            </div>

            <InfoBox
              label="Zone"
              value={
                selectedCamera.zone ??
                "Unknown"
              }
            />

            <InfoBox
              label="Heading"
              value={
                selectedCamera.heading_degrees !==
                null
                  ? `${headingLabel(
                      selectedCamera.heading_degrees
                    )} (${selectedCamera.heading_degrees}°)`
                  : "—"
              }
            />

            <InfoBox
              label="Last Event"
              value={
                selectedCamera.last_seen_label
              }
            />

            <InfoBox
              label="Health"
              value={`${selectedCamera.health_score}%`}
            />

            <InfoBox
              label="Deployment"
              value={
                selectedCamera.is_active
                  ? "Active"
                  : "Inactive"
              }
            />

            <InfoBox
              label="Provisioning"
              value={
                selectedCamera.is_provisional
                  ? "Provisional"
                  : "Validated"
              }
            />
          </div>
        </section>

        {/* FILTER BAR */}

        <section
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "minmax(260px,1fr) 180px 180px auto",

            gap:
              "8px",

            padding:
              "9px",

            marginBottom:
              "10px",

            borderRadius:
              "10px",

            background:
              "#091827",

            border:
              "1px solid rgba(148,163,184,.09)",
          }}
        >
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
            placeholder="Search camera ID, name or zone..."
            style={
              controlStyle
            }
          />

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

          <select
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target
                  .value as StatusFilter
              )
            }
            style={
              selectStyle
            }
          >
            <option value="all">
              All Status
            </option>

            <option value="online">
              Online
            </option>

            <option value="delayed">
              Delayed
            </option>

            <option value="silent">
              Silent
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>

          <button
            onClick={() => {
              setSearch(
                ""
              );

              setZoneFilter(
                "all"
              );

              setStatusFilter(
                "all"
              );
            }}
            style={{
              height:
                "38px",

              padding:
                "0 14px",

              borderRadius:
                "8px",

              border:
                "1px solid rgba(148,163,184,.10)",

              background:
                "#0b1b2d",

              color:
                "#8498ac",

              cursor:
                "pointer",

              fontSize:
                "8px",
            }}
          >
            Clear Filters
          </button>
        </section>

        {/* CAMERA TABLE */}

        <section
          style={
            panelStyle
          }
        >
          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "1.1fr 1.6fr 1fr .9fr 1fr 1fr .9fr .9fr",

              gap:
                "10px",

              padding:
                "11px 14px",

              background:
                "#0d2035",

              color:
                "#8195aa",

              fontSize:
                "7px",

              textTransform:
                "uppercase",

              letterSpacing:
                ".5px",

              fontWeight:
                700,
            }}
          >
            <div>
              Camera ID
            </div>

            <div>
              Name
            </div>

            <div>
              Zone
            </div>

            <div>
              Heading
            </div>

            <div>
              Last Event
            </div>

            <div>
              Health
            </div>

            <div>
              Status
            </div>

            <div>
              Deployment
            </div>
          </div>

          {filtered.length >
          0 ? (
            filtered.map(
              (
                camera
              ) => (
                <CameraRow
                  key={
                    camera.camera_id
                  }
                  camera={
                    camera
                  }
                  selected={
                    camera.camera_id ===
                    selectedCamera.camera_id
                  }
                  onClick={() =>
                    setSelectedCameraId(
                      camera.camera_id
                    )
                  }
                />
              )
            )
          ) : (
            <div
              style={{
                padding:
                  "30px",

                textAlign:
                  "center",

                color:
                  "#61768b",

                fontSize:
                  "9px",
              }}
            >
              No cameras match the current filters.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function CameraNode({
  camera,
  selected,
  onClick,
}: {
  camera: CameraViewModel;
  selected: boolean;
  onClick: () => void;
}) {
  const color =
    statusColor(
      camera.health_status
    );

  return (
    <button
      onClick={
        onClick
      }
      title={`${camera.camera_id} · ${formatCameraName(
        camera.name
      )}`}
      style={{
        width:
          "48px",

        height:
          "48px",

        borderRadius:
          "50%",

        border:
          selected
            ? `2px solid ${color}`
            : `1px solid ${color}60`,

        background:
          `radial-gradient(circle, ${color}26, ${color}0c)`,

        color,

        cursor:
          "pointer",

        boxShadow:
          selected
            ? `0 0 20px ${color}55`
            : `0 0 10px ${color}20`,

        opacity:
          camera.is_active
            ? 1
            : .45,
      }}
    >
      <div
        style={{
          fontSize:
            "9px",
        }}
      >
        ◉
      </div>

      <div
        style={{
          marginTop:
            "1px",

          color:
            "#e2edf7",

          fontSize:
            "6.5px",

          fontWeight:
            700,
        }}
      >
        {camera.camera_id.replace(
          "CHD_CAM_",
          "C"
        )}
      </div>
    </button>
  );
}

function AttentionCard({
  camera,
  onClick,
}: {
  camera: CameraViewModel;
  onClick: () => void;
}) {
  const color =
    statusColor(
      camera.health_status
    );

  return (
    <div
      style={{
        padding:
          "11px",

        borderRadius:
          "9px",

        background:
          "#0b1b2d",

        border:
          `1px solid ${color}22`,

        boxShadow:
          `inset 3px 0 0 ${color}`,
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

          gap:
            "8px",
        }}
      >
        <div>
          <div
            style={{
              color:
                "#e1ebf5",

              fontSize:
                "9px",

              fontWeight:
                700,
            }}
          >
            {
              camera.camera_id
            }
          </div>

          <div
            style={{
              marginTop:
                "3px",

              color:
                "#72879d",

              fontSize:
                "7px",
            }}
          >
            {formatCameraName(
              camera.name
            )}
          </div>
        </div>

        <StatusBadge
          status={
            camera.health_status
          }
        />
      </div>

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "1fr 1fr",

          gap:
            "8px",

          marginTop:
            "10px",
        }}
      >
        <SmallDetail
          label="Last Event"
          value={
            camera.last_seen_label
          }
        />

        <SmallDetail
          label="Health"
          value={`${camera.health_score}%`}
        />
      </div>

      <button
        onClick={
          onClick
        }
        style={{
          width:
            "100%",

          height:
            "29px",

          marginTop:
            "10px",

          border:
            "1px solid rgba(59,130,246,.18)",

          borderRadius:
            "7px",

          background:
            "rgba(37,99,235,.12)",

          color:
            "#aad2ff",

          cursor:
            "pointer",

          fontSize:
            "7px",

          fontWeight:
            650,
        }}
      >
        Inspect Camera
      </button>
    </div>
  );
}

function CameraRow({
  camera,
  selected,
  onClick,
}: {
  camera: CameraViewModel;
  selected: boolean;
  onClick: () => void;
}) {
  const color =
    statusColor(
      camera.health_status
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
          "1.1fr 1.6fr 1fr .9fr 1fr 1fr .9fr .9fr",

        gap:
          "10px",

        alignItems:
          "center",

        padding:
          "11px 14px",

        border:
          "none",

        borderTop:
          "1px solid rgba(148,163,184,.055)",

        background:
          selected
            ? "rgba(37,99,235,.075)"
            : "transparent",

        color:
          "#aebfd0",

        cursor:
          "pointer",

        textAlign:
          "left",

        fontSize:
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
            "7px",

          color:
            "#dce8f5",

          fontWeight:
            700,
        }}
      >
        <span
          style={{
            width:
              "6px",

            height:
              "6px",

            borderRadius:
              "50%",

            background:
              color,

            boxShadow:
              `0 0 7px ${color}55`,
          }}
        />

        {
          camera.camera_id
        }
      </div>

      <div>
        {formatCameraName(
          camera.name
        )}
      </div>

      <div>
        <ZoneBadge
          zone={
            camera.zone
          }
        />
      </div>

      <div
        style={{
          color:
            "#7e93a8",
        }}
      >
        {camera.heading_degrees !==
        null
          ? `${headingLabel(
              camera.heading_degrees
            )} (${camera.heading_degrees}°)`
          : "—"}
      </div>

      <div
        style={{
          color,
        }}
      >
        {
          camera.last_seen_label
        }
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
        <div
          style={{
            width:
              "52px",

            height:
              "3px",

            borderRadius:
              "100px",

            background:
              "#12253a",

            overflow:
              "hidden",
          }}
        >
          <div
            style={{
              width:
                `${camera.health_score}%`,

              height:
                "100%",

              background:
                color,
            }}
          />
        </div>

        <span>
          {
            camera.health_score
          }%
        </span>
      </div>

      <StatusBadge
        status={
          camera.health_status
        }
      />

      <div
        style={{
          display:
            "flex",

          gap:
            "5px",

          flexWrap:
            "wrap",
        }}
      >
        <DeploymentBadge
          active={
            camera.is_active
          }
        />

        {camera.is_provisional && (
          <span
            style={{
              padding:
                "3px 6px",

              borderRadius:
                "5px",

              color:
                "#a78bfa",

              background:
                "rgba(139,92,246,.10)",

              border:
                "1px solid rgba(139,92,246,.18)",

              fontSize:
                "6px",

              fontWeight:
                700,
            }}
          >
            Provisional
          </span>
        )}
      </div>
    </button>
  );
}

function HealthMetric({
  title,
  value,
  detail,
  color,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  color: string;
  icon: string;
}) {
  return (
    <div
      style={{
        minHeight:
          "92px",

        padding:
          "13px",

        borderRadius:
          "11px",

        display:
          "flex",

        alignItems:
          "center",

        gap:
          "10px",

        background:
          "linear-gradient(145deg,#0b1c2f,#091827)",

        border:
          "1px solid rgba(148,163,184,.09)",
      }}
    >
      <div
        style={{
          width:
            "42px",

          height:
            "42px",

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
            `${color}13`,

          border:
            `1px solid ${color}40`,

          fontSize:
            "16px",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color:
              "#8298ae",

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
              "21px",

            fontWeight:
              760,
          }}
        >
          {value}
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
          {detail}
        </div>
      </div>
    </div>
  );
}

function HealthRing({
  value,
}: {
  value: number;
}) {
  return (
    <div
      style={{
        minHeight:
          "92px",

        padding:
          "12px",

        borderRadius:
          "11px",

        display:
          "flex",

        alignItems:
          "center",

        gap:
          "10px",

        background:
          "linear-gradient(145deg,#0b1c2f,#091827)",

        border:
          "1px solid rgba(148,163,184,.09)",
      }}
    >
      <div
        style={{
          width:
            "50px",

          height:
            "50px",

          borderRadius:
            "50%",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            `conic-gradient(#3b82f6 0 ${value}%, #13283f ${value}% 100%)`,
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
              "#091827",

            fontSize:
              "10px",

            fontWeight:
              750,
          }}
        >
          {value}%
        </div>
      </div>

      <div>
        <div
          style={{
            color:
              "#8399af",

            fontSize:
              "7px",
          }}
        >
          Network Health
        </div>

        <div
          style={{
            marginTop:
              "4px",

            color:
              value >=
              80
                ? "#4ade80"
                : "#f59e0b",

            fontSize:
              "9px",

            fontWeight:
              700,
          }}
        >
          {value >=
          90
            ? "Excellent"
            : value >=
              75
            ? "Healthy"
            : "Needs Review"}
        </div>
      </div>
    </div>
  );
}

function PanelHeader({
  title,
  subtitle,
  danger = false,
}: {
  title: string;
  subtitle: string;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        padding:
          "11px 13px",

        borderBottom:
          "1px solid rgba(148,163,184,.07)",
      }}
    >
      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            "7px",

          fontSize:
            "10px",

          fontWeight:
            700,
        }}
      >
        <span
          style={{
            color:
              danger
                ? "#ef4444"
                : "#3b82f6",
          }}
        >
          {danger
            ? "△"
            : "⌘"}
        </span>

        {title}
      </div>

      <div
        style={{
          marginTop:
            "3px",

          color:
            "#59718a",

          fontSize:
            "6.5px",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

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
        padding:
          "12px",

        borderRight:
          "1px solid rgba(148,163,184,.07)",
      }}
    >
      <div
        style={{
          color:
            "#5d758c",

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
            "#d9e5f0",

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

function SmallDetail({
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
            "#5d748a",

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
            "#cbd8e5",

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

function StatusBadge({
  status,
}: {
  status: CameraHealthStatus;
}) {
  const color =
    statusColor(
      status
    );

  return (
    <span
      style={{
        width:
          "fit-content",

        padding:
          "4px 7px",

        borderRadius:
          "5px",

        color,

        background:
          `${color}12`,

        border:
          `1px solid ${color}20`,

        fontSize:
          "6px",

        fontWeight:
          700,

        textTransform:
          "capitalize",
      }}
    >
      {status}
    </span>
  );
}

function DeploymentBadge({
  active,
}: {
  active: boolean;
}) {
  const color =
    active
      ? "#22c55e"
      : "#64748b";

  return (
    <span
      style={{
        padding:
          "3px 6px",

        borderRadius:
          "5px",

        color,

        background:
          `${color}10`,

        border:
          `1px solid ${color}18`,

        fontSize:
          "6px",

        fontWeight:
          700,
      }}
    >
      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
}

function ZoneBadge({
  zone,
}: {
  zone: string | null;
}) {
  return (
    <span
      style={{
        display:
          "inline-block",

        padding:
          "4px 7px",

        borderRadius:
          "5px",

        background:
          "rgba(59,130,246,.09)",

        border:
          "1px solid rgba(59,130,246,.15)",

        color:
          "#79b7ff",

        fontSize:
          "6px",

        fontWeight:
          650,
      }}
    >
      {zone ??
        "Unknown"}
    </span>
  );
}

function formatLastSeen(
  dateString:
    | string
    | null
) {
  if (
    !dateString
  ) {
    return "No event";
  }

  const diffSeconds =
    Math.max(
      0,
      Math.floor(
        (Date.now() -
          new Date(
            dateString
          ).getTime()) /
          1000
      )
    );

  if (
    diffSeconds <
    60
  ) {
    return `${diffSeconds} sec ago`;
  }

  const minutes =
    Math.floor(
      diffSeconds /
        60
    );

  if (
    minutes <
    60
  ) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  return `${hours}h ${
    minutes % 60
  }m ago`;
}

function statusColor(
  status:
    CameraHealthStatus
) {
  if (
    status ===
    "online"
  ) {
    return "#22c55e";
  }

  if (
    status ===
    "delayed"
  ) {
    return "#f59e0b";
  }

  if (
    status ===
    "silent"
  ) {
    return "#ef4444";
  }

  return "#64748b";
}

function headingLabel(
  heading: number
) {
  if (
    heading >=
      337.5 ||
    heading <
      22.5
  ) {
    return "N";
  }

  if (
    heading <
    67.5
  ) {
    return "NE";
  }

  if (
    heading <
    112.5
  ) {
    return "E";
  }

  if (
    heading <
    157.5
  ) {
    return "SE";
  }

  if (
    heading <
    202.5
  ) {
    return "S";
  }

  if (
    heading <
    247.5
  ) {
    return "SW";
  }

  if (
    heading <
    292.5
  ) {
    return "W";
  }

  return "NW";
}

function formatCameraName(
  name: string
) {
  return name.replaceAll(
    "_",
    " "
  );
}

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

const controlStyle:
  CSSProperties =
  {
    height:
      "38px",

    borderRadius:
      "8px",

    border:
      "1px solid rgba(148,163,184,.10)",

    background:
      "#0b1b2d",

    color:
      "white",

    outline:
      "none",

    padding:
      "0 11px",

    fontSize:
      "8px",
  };

const selectStyle:
  CSSProperties =
  {
    height:
      "38px",

    borderRadius:
      "8px",

    border:
      "1px solid rgba(148,163,184,.10)",

    background:
      "#0b1b2d",

    color:
      "#b4c4d4",

    outline:
      "none",

    padding:
      "0 10px",

    fontSize:
      "8px",
  };