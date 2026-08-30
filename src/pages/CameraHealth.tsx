import { useMemo, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import {
  ALL_CAMERAS,
  CAMERA_ZONES,
  cameraStatus,
} from "../data/cameras";

type CameraStatus =
  | "online"
  | "delayed"
  | "silent";

type CameraItem = {
  id: string;
  name: string;
  zone: string;
  heading: number;
  lastSeen: string;
  status: CameraStatus;
};

// Build camera list from shared registry
function formatLastSeen(minutesOffline: number): string {
  if (minutesOffline === 0) return "< 1 min ago";
  if (minutesOffline < 60) return `${minutesOffline} min ago`;
  return `${Math.floor(minutesOffline / 60)}h ago`;
}

const cameras: CameraItem[] = ALL_CAMERAS.map((c) => ({
  id:       c.id,
  name:     c.name,
  zone:     c.zone,
  heading:  c.heading,
  lastSeen: formatLastSeen(c.minutesOffline),
  status:   cameraStatus(c.minutesOffline),
}));

type ZoneFilter = typeof CAMERA_ZONES[number];

type StatusFilter =
  | "all"
  | CameraStatus;

export default function CameraHealth() {
  const [searchValue, setSearchValue] =
    useState("");

  const [zoneFilter, setZoneFilter] =
    useState<ZoneFilter>("all");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const filteredCameras =
    useMemo(() => {
      const search =
        searchValue
          .trim()
          .toLowerCase();

      return cameras.filter(
        (camera) => {
          const matchesSearch =
            !search ||
            camera.id
              .toLowerCase()
              .includes(search) ||
            camera.name
              .toLowerCase()
              .includes(search) ||
            camera.zone
              .toLowerCase()
              .includes(search);

          const matchesZone =
            zoneFilter === "all" ||
            camera.zone === zoneFilter;

          const matchesStatus =
            statusFilter === "all" ||
            camera.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesZone &&
            matchesStatus
          );
        }
      );
    }, [
      searchValue,
      zoneFilter,
      statusFilter,
    ]);

  const onlineCount =
    cameras.filter(
      (camera) =>
        camera.status === "online"
    ).length;

  const delayedCount =
    cameras.filter(
      (camera) =>
        camera.status === "delayed"
    ).length;

  const silentCount =
    cameras.filter(
      (camera) =>
        camera.status === "silent"
    ).length;

  const attentionCamera =
    cameras.find(
      (camera) =>
        camera.status === "silent"
    );

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
            justifyContent:
              "space-between",
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
              Camera Health
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "12px",
                color: "#7f9dbd",
              }}
            >
              Monitor camera availability, reporting activity and system health
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            <select
              value={zoneFilter}
              onChange={(event) =>
                setZoneFilter(
                  event.target
                    .value as ZoneFilter
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
              {CAMERA_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z === "all" ? "All zones" : z}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter
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
                All statuses
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
            </select>
          </div>
        </div>

        {/* KPIs */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0,1fr))",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <HealthKpi
            label="Total Cameras"
            value={String(
              cameras.length
            )}
            color="#60a5fa"
          />

          <HealthKpi
            label="Online"
            value={String(
              onlineCount
            )}
            color="#22c55e"
          />

          <HealthKpi
            label="Delayed"
            value={String(
              delayedCount
            )}
            color="#f59e0b"
          />

          <HealthKpi
            label="Silent"
            value={String(
              silentCount
            )}
            color="#94a3b8"
          />
        </div>

        {/* MAIN CONTENT */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1fr) 320px",
            gap: "12px",
          }}
        >
          {/* CAMERA TABLE */}

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
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "14px",
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
                  Camera Status
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "10px",
                    color: "#64748b",
                  }}
                >
                  Showing{" "}
                  {
                    filteredCameras.length
                  }{" "}
                  camera
                  {filteredCameras.length ===
                  1
                    ? ""
                    : "s"}
                </div>
              </div>

              <input
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
                placeholder="Search camera, ID or zone..."
                style={{
                  width: "230px",
                  height: "36px",
                  borderRadius: "9px",
                  border:
                    "1px solid rgba(148,163,184,.14)",
                  background: "#0c1b2d",
                  color: "white",
                  padding: "0 11px",
                  outline: "none",
                  fontSize: "11px",
                }}
              />
            </div>

            {/* TABLE HEADER */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  ".7fr 1.4fr 1.1fr .7fr 1fr .8fr",
                gap: "10px",
                padding: "9px 8px",
                color: "#64748b",
                fontSize: "9px",
                textTransform:
                  "uppercase",
                letterSpacing: ".5px",
              }}
            >
              <div>ID</div>
              <div>Camera</div>
              <div>Zone</div>
              <div>Heading</div>
              <div>Last Seen</div>
              <div>Status</div>
            </div>

            {filteredCameras.length >
            0 ? (
              filteredCameras.map(
                (camera) => (
                  <CameraRow
                    key={camera.id}
                    {...camera}
                  />
                )
              )
            ) : (
              <div
                style={{
                  padding: "28px 8px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "11px",
                  borderTop:
                    "1px solid rgba(255,255,255,.05)",
                }}
              >
                No cameras match the current filters.
              </div>
            )}
          </section>

          {/* HEALTH RULES */}

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
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              Health Rules
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "10px",
                color: "#64748b",
              }}
            >
              Status derived from last_seen_at
            </div>

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <RuleCard
                color="#22c55e"
                title="Online"
                description="Camera reported within the last 5 minutes."
              />

              <RuleCard
                color="#f59e0b"
                title="Delayed"
                description="Last report was between 5 and 15 minutes ago."
              />

              <RuleCard
                color="#94a3b8"
                title="Silent"
                description="No camera report for more than 15 minutes."
              />
            </div>

            <div
              style={{
                margin: "20px 0",
                borderTop:
                  "1px solid rgba(255,255,255,.07)",
              }}
            />

            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              Attention Required
            </div>

            {attentionCamera ? (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#0c1b2d",
                  borderLeft:
                    "3px solid #94a3b8",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 650,
                  }}
                >
                  {attentionCamera.id} ·{" "}
                  {
                    attentionCamera.name
                  }
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "10px",
                    color: "#8ba7c5",
                    lineHeight: 1.5,
                  }}
                >
                  Camera has not reported for{" "}
                  {
                    attentionCamera.lastSeen
                  }.
                </div>

                <button
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    height: "34px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#1e293b",
                    color: "#cbd5e1",
                    cursor: "pointer",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  View Camera Details
                </button>
              </div>
            ) : (
              <div
                style={{
                  marginTop: "12px",
                  color: "#64748b",
                  fontSize: "10px",
                }}
              >
                No silent cameras.
              </div>
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

function HealthKpi({
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
// CAMERA ROW
// =====================================

function CameraRow({
  id,
  name,
  zone,
  heading,
  lastSeen,
  status,
}: CameraItem) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          ".7fr 1.4fr 1.1fr .7fr 1fr .8fr",
        gap: "10px",
        padding: "13px 8px",
        borderTop:
          "1px solid rgba(255,255,255,.05)",
        alignItems: "center",
        fontSize: "11px",
      }}
    >
      <div
        style={{
          color: "#93c5fd",
          fontWeight: 650,
        }}
      >
        {id}
      </div>

      <div
        style={{
          fontWeight: 600,
        }}
      >
        {name}
      </div>

      <div
        style={{
          color: "#94a3b8",
        }}
      >
        {zone}
      </div>

      <div
        style={{
          color: "#94a3b8",
        }}
      >
        {heading}°
      </div>

      <div
        style={{
          color: "#94a3b8",
        }}
      >
        {lastSeen}
      </div>

      <StatusBadge
        status={status}
      />
    </div>
  );
}

// =====================================
// STATUS BADGE
// =====================================

function StatusBadge({
  status,
}: {
  status: CameraStatus;
}) {
  const color =
    status === "online"
      ? "#22c55e"
      : status === "delayed"
      ? "#f59e0b"
      : "#94a3b8";

  return (
    <span
      style={{
        width: "fit-content",
        padding: "5px 8px",
        borderRadius: "20px",
        background: `${color}18`,
        color,
        fontSize: "9px",
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      {status}
    </span>
  );
}

// =====================================
// RULE CARD
// =====================================

function RuleCard({
  color,
  title,
  description,
}: {
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        padding: "11px",
        borderRadius: "9px",
        background: "#0c1b2d",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 650,
          color,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "4px",
          fontSize: "10px",
          lineHeight: 1.45,
          color: "#7f9dbd",
        }}
      >
        {description}
      </div>
    </div>
  );
}