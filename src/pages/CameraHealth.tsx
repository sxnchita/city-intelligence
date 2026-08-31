import { useMemo, useState } from "react";

import AppShell, { MapWorkspace } from "../components/layout/AppShell";
import CityMap from "../components/map/CityMap";
import { connectionState } from "../components/common/ConnectionBadge";
import EmptyState, { OFFLINE_HINT } from "../components/common/EmptyState";
import { useApiData } from "../hooks/useApiData";
import {
  Chip,
  FloatingCard,
  Icon,
  Label,
  Rule,
  SidePanel,
} from "../design/ui";
import {
  CAMERA_STATUS,
  agoLabel,
  cameraStatus,
  compassLabel,
  type CameraStatus,
} from "../design/tokens";
import { getCameras } from "../services/mapApi";
import { getDensity } from "../services/analyticsApi";
import { getSystemHealth, type SystemHealth } from "../services/systemApi";

// =====================================================================
// CAMERA HEALTH
//
// Is anything actually arriving, and from where. Health is derived
// from each camera's own last_event_at against the thresholds the
// design's legend states: reporting normally, no data over 2 minutes,
// no data over 10 minutes.
// =====================================================================

const REFRESH_MS = 15_000;

type CameraRow = {
  id: string;
  name: string;
  zone: string;
  heading: number;
  headingLabel: string | null;
  lastEventAt: string | null;
  status: CameraStatus;
  events: number | null;
};

type Filter = "all" | CameraStatus;

export default function CameraHealth() {
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [streamOpen, setStreamOpen] = useState(false);

  const {
    data: fetched,
    loading,
    error,
  } = useApiData<CameraRow[]>(
    async (signal) => {
      const [cameras, density] = await Promise.all([
        getCameras(signal),
        // Per-camera observation counts. /api/cameras carries no event
        // count, but the density series is one per camera.
        getDensity(undefined, undefined, undefined, signal),
      ]);

      const events = new Map<string, number>();
      for (const series of density.series) {
        if (series.camera_id === null) continue;
        events.set(
          series.camera_id,
          series.points.reduce((sum, p) => sum + p.observation_count, 0)
        );
      }

      return cameras.features.map((feature) => {
        const p = feature.properties;
        const minutes = minutesSince(p.last_event_at);

        return {
          id: p.camera_id,
          name: p.name,
          zone: p.zone,
          heading: p.heading_degrees,
          headingLabel: compassLabel(p.heading_degrees),
          lastEventAt: p.last_event_at,
          status: cameraStatus(minutes),
          events: events.get(p.camera_id) ?? null,
        };
      });
    },
    [],
    { refreshMs: REFRESH_MS }
  );

  const { data: health } = useApiData<SystemHealth>(
    (signal) => getSystemHealth(signal),
    [],
    { refreshMs: REFRESH_MS }
  );

  const cameras = useMemo(() => fetched ?? [], [fetched]);

  const counts = useMemo(() => {
    const result = { healthy: 0, degraded: 0, offline: 0 };
    for (const camera of cameras) result[camera.status] += 1;
    return result;
  }, [cameras]);

  const zones = useMemo(
    () => ["all", ...[...new Set(cameras.map((c) => c.zone))].sort()],
    [cameras]
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return cameras.filter(
      (camera) =>
        (!needle ||
          camera.id.toLowerCase().includes(needle) ||
          camera.name.toLowerCase().includes(needle)) &&
        (zone === "all" || camera.zone === zone) &&
        (filter === "all" || camera.status === filter)
    );
  }, [cameras, search, zone, filter]);

  return (
    <AppShell
      connection={connectionState({ loading, error, stream: streamOpen })}
      connectionTitle={error ? error.message : undefined}
    >
      <MapWorkspace
        map={
          <CityMap
            showCameras
            showTraffic={false}
            showTrajectory={false}
            onCameraClick={(id) => setSearch(id)}
            onStreamChange={setStreamOpen}
          />
        }
        panel={
          <SidePanel width="w-[440px]">
            <header className="hairline-b px-6 pt-6 pb-5">
              <h1 className="font-display text-headline-md text-on-surface">
                Camera Health
              </h1>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex flex-1 items-center gap-2 rounded-sm border-b border-outline-variant pb-1.5">
                  <Icon
                    name="search"
                    size={15}
                    className="text-on-surface-variant"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Camera or junction…"
                    className="w-full bg-transparent font-body text-[13px] text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
                  />
                </div>

                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="border-b border-outline-variant bg-transparent pb-1.5 font-body text-[13px] text-on-surface focus:outline-none"
                >
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z === "all" ? "All zones" : z}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                {(
                  ["healthy", "degraded", "offline"] as CameraStatus[]
                ).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setFilter((current) =>
                        current === status ? "all" : status
                      )
                    }
                    className={`flex items-center gap-1.5 font-body text-[13px] transition-opacity ${
                      filter === "all" || filter === status
                        ? "opacity-100"
                        : "opacity-40"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${CAMERA_STATUS[status].dot}`}
                    />
                    <span className={CAMERA_STATUS[status].text}>
                      {counts[status]} {CAMERA_STATUS[status].label}
                    </span>
                  </button>
                ))}
              </div>
            </header>

            <div className="hairline-b grid grid-cols-[auto_1fr_auto] gap-4 px-6 py-2">
              <Label className="text-[10px]">Status</Label>
              <Label className="text-[10px]">Details</Label>
              <Label className="text-[10px]">Events</Label>
            </div>

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
              {visible.length === 0 ? (
                <EmptyState
                  title={
                    error
                      ? "Camera list unavailable"
                      : cameras.length === 0
                        ? "No cameras"
                        : "No cameras match"
                  }
                  detail={
                    error
                      ? OFFLINE_HINT
                      : cameras.length === 0
                        ? "The backend reported no active cameras for this camera set."
                        : undefined
                  }
                  tone={error ? "error" : "neutral"}
                />
              ) : (
                visible.map((camera, index) => (
                  <div key={camera.id}>
                    {index > 0 && <Rule />}
                    <CameraRowView camera={camera} />
                  </div>
                ))
              )}
            </div>

            {health && (
              <div className="hairline-t flex flex-wrap gap-x-5 gap-y-1 px-6 py-3 font-body text-[11px] text-on-surface-variant">
                <Fact
                  label="Observations"
                  value={health.observation_count.toLocaleString()}
                />
                <Fact
                  label="Last ingest"
                  value={agoLabel(health.last_ingest_at)}
                />
                <Fact
                  label="Rejected"
                  value={health.reject_count.toLocaleString()}
                  alarming={health.reject_count > 0}
                />
                {/* Failures that were caught and swallowed. A climbing
                    counter means work is being lost silently. */}
                {Object.entries(health.failures)
                  .filter(([, n]) => n > 0)
                  .map(([name, n]) => (
                    <Fact
                      key={name}
                      label={name.replace(/_/g, " ")}
                      value={String(n)}
                      alarming
                    />
                  ))}
              </div>
            )}
          </SidePanel>
        }
        overlays={
          <FloatingCard className="absolute right-6 bottom-6 z-20 w-56">
            <Label>Camera status</Label>
            <div className="mt-3 flex flex-col gap-2.5">
              {(["healthy", "degraded", "offline"] as CameraStatus[]).map(
                (status) => (
                  <div key={status} className="flex items-start gap-2.5">
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${CAMERA_STATUS[status].dot}`}
                    />
                    <div>
                      <div className="font-body text-[12px] text-on-surface">
                        {CAMERA_STATUS[status].label}
                      </div>
                      <div className="font-body text-[10px] text-on-surface-variant">
                        {CAMERA_STATUS[status].hint}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </FloatingCard>
        }
      />
    </AppShell>
  );
}

function CameraRowView({ camera }: { camera: CameraRow }) {
  const tone = CAMERA_STATUS[camera.status];

  // Degraded and offline rows are tinted, so a problem is visible
  // while scrolling rather than only on inspection.
  const tint =
    camera.status === "offline"
      ? "bg-error-container/25"
      : camera.status === "degraded"
        ? "bg-warning-container/25"
        : "";

  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto] items-start gap-4 px-6 py-3 transition-colors hover:bg-secondary-container/30 ${tint}`}
    >
      <span className={`mt-2 h-2 w-2 rounded-full ${tone.dot}`} />

      <div className="min-w-0">
        <div
          className={`font-body text-data ${
            camera.status === "offline" ? "text-error" : "text-on-surface"
          }`}
        >
          {camera.id}
        </div>
        <div className="font-body text-[13px] text-on-surface-variant">
          {camera.name}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          {camera.headingLabel && (
            <Chip title={`${camera.heading}°`}>{camera.headingLabel}</Chip>
          )}
          <span
            className={`font-body text-[11px] ${
              camera.status === "healthy"
                ? "text-on-surface-variant"
                : tone.text
            }`}
          >
            {agoLabel(camera.lastEventAt)}
          </span>
        </div>
      </div>

      <div className="text-right font-body text-[15px] text-on-surface tabular-nums">
        {camera.events ?? "—"}
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  alarming = false,
}: {
  label: string;
  value: string;
  alarming?: boolean;
}) {
  return (
    <span>
      <span className="uppercase tracking-wider text-[10px] text-on-surface-variant">
        {label}
      </span>{" "}
      <strong className={alarming ? "text-error" : "text-on-surface"}>
        {value}
      </strong>
    </span>
  );
}

function minutesSince(timestamp: string | null): number {
  if (!timestamp) return Number.MAX_SAFE_INTEGER;
  const seen = new Date(timestamp).getTime();
  if (Number.isNaN(seen)) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, (Date.now() - seen) / 60000);
}
