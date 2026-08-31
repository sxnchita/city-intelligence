import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import AppShell, { MapWorkspace } from "../components/layout/AppShell";
import CityMap from "../components/map/CityMap";
import { connectionState } from "../components/common/ConnectionBadge";
import EmptyState, {
  NO_DATA_HINT,
  OFFLINE_HINT,
} from "../components/common/EmptyState";
import { useApiData } from "../hooks/useApiData";
import {
  Chip,
  FloatingCard,
  Icon,
  Label,
  SidePanel,
  Sparkline,
} from "../design/ui";
import { agoLabel, percent, severity } from "../design/tokens";
import {
  alertTypeLabel,
  getAlert,
  getAlerts,
  type AlertDetail,
  type AlertSummary,
  type AlertType,
} from "../services/alertsApi";
import {
  connectLiveStream,
  type AlertEventData,
} from "../services/liveStream";

// =====================================================================
// LIVE ALERTS
//
// A feed of things worth looking at, over the map they happened on.
// Each card is keyed to its severity by a coloured left rule rather
// than a filled background — the palette stays calm even when the
// content is not.
//
// A clone alert expands to show both vehicles side by side, because
// naming only one of them would hide the whole point of the alert.
// =====================================================================

type Filter = "all" | AlertType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "blacklist_match", label: "Blacklist" },
  { value: "plate_appearance_mismatch", label: "Cloned plate" },
  { value: "impossible_speed", label: "Speed" },
  { value: "restricted_zone_entry", label: "Restricted zone" },
];

/** The stream sends a narrower row than /api/alerts. */
function fromStream(data: AlertEventData): AlertSummary {
  return {
    alert_id: data.alert_id,
    alert_type: data.alert_type,
    severity: data.severity,
    vehicle_id: data.vehicle_id,
    related_vehicle_id: data.related_vehicle_id,
    plate: null,
    observation_id: null,
    camera_id: data.camera_id,
    camera_name: data.camera_name,
    zone: null,
    lat: data.lat,
    lon: data.lon,
    occurred_at: data.occurred_at,
    created_at: data.occurred_at,
    repeat_count: 1,
    message: data.message,
    metadata: data.metadata,
  };
}

export default function Alerts() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [streamOpen, setStreamOpen] = useState(false);
  const [streamed, setStreamed] = useState<AlertSummary[]>([]);

  const {
    data: fetchedAlerts,
    loading,
    error,
    reload,
  } = useApiData<AlertSummary[]>(
    (signal) => getAlerts({ limit: 50 }, signal),
    []
  );

  const fetched = useMemo(
    () => fetchedAlerts ?? [],
    [fetchedAlerts]
  );

  // A blacklisted vehicle crossing the city fires alerts in bursts.
  // One refetch per alert would be a request every few hundred ms.
  const lastReload = useRef(0);
  const REFETCH_THROTTLE_MS = 3000;

  useEffect(() => {
    const stream = connectLiveStream({
      onOpen: () => setStreamOpen(true),
      onError: () => setStreamOpen(false),
      onAlert: (data) => {
        setStreamed((current) => [fromStream(data), ...current]);

        const now = Date.now();
        if (now - lastReload.current > REFETCH_THROTTLE_MS) {
          lastReload.current = now;
          reload();
        }
      },
    });

    return () => stream.close();
  }, [reload]);

  // The fetched row wins: it carries the plate, zone and repeat count
  // the stream payload does not send.
  const alerts = useMemo(() => {
    const seen = new Set<number>();
    return [...fetched, ...streamed].filter((alert) => {
      if (seen.has(alert.alert_id)) return false;
      seen.add(alert.alert_id);
      return true;
    });
  }, [fetched, streamed]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? alerts
        : alerts.filter((a) => a.alert_type === filter),
    [alerts, filter]
  );

  const lastHour = useMemo(() => {
    const cutoff = Date.now() - 60 * 60 * 1000;
    return alerts.filter(
      (a) => new Date(a.occurred_at).getTime() >= cutoff
    );
  }, [alerts]);

  // Alerts per 5-minute bucket across the last hour, for the sparkline.
  const rateSeries = useMemo(() => {
    const buckets = new Array(12).fill(0);
    const now = Date.now();
    for (const alert of lastHour) {
      const minutesAgo =
        (now - new Date(alert.occurred_at).getTime()) / 60000;
      const index = 11 - Math.floor(minutesAgo / 5);
      if (index >= 0 && index < 12) buckets[index] += 1;
    }
    return buckets;
  }, [lastHour]);

  return (
    <AppShell
      connection={connectionState({
        loading,
        error,
        stream: streamOpen,
      })}
      connectionTitle={error ? error.message : undefined}
    >
      <MapWorkspace
        map={
          <CityMap
            showCameras
            showTraffic={false}
            showTrajectory={false}
            onStreamChange={setStreamOpen}
          />
        }
        panel={
          <SidePanel width="w-[420px]">
            <header className="hairline-b px-6 pt-6 pb-5">
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-headline-md text-on-surface">
                  Live Alerts
                </h1>
                <span
                  className={`h-2 w-2 rounded-full ${
                    streamOpen
                      ? "animate-pulse bg-primary"
                      : "bg-outline-variant"
                  }`}
                  title={
                    streamOpen ? "Streaming" : "Stream closed"
                  }
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {FILTERS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilter(option.value)}
                    className={`rounded-full px-3 py-1.5 font-body text-label-caps uppercase transition-colors ${
                      filter === option.value
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </header>

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {visible.length === 0 ? (
                <EmptyState
                  title={
                    error
                      ? "Alert feed unavailable"
                      : alerts.length === 0
                        ? "No alerts"
                        : "No alerts of this type"
                  }
                  detail={
                    error
                      ? OFFLINE_HINT
                      : alerts.length === 0
                        ? NO_DATA_HINT
                        : undefined
                  }
                  tone={error ? "error" : "neutral"}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {visible.map((alert) => (
                    <AlertCard
                      key={alert.alert_id}
                      alert={alert}
                      expanded={alert.alert_id === selectedId}
                      onToggle={() =>
                        setSelectedId((current) =>
                          current === alert.alert_id
                            ? null
                            : alert.alert_id
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </SidePanel>
        }
        overlays={
          <FloatingCard className="absolute bottom-6 left-[452px] z-20 w-56">
            <Label>Last 60 minutes</Label>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-headline-md text-on-surface">
                {lastHour.length}
              </span>
              <span className="font-body text-[12px] text-on-surface-variant">
                Alerts
              </span>
            </div>
            <Sparkline points={rateSeries} height={40} className="mt-2" />
          </FloatingCard>
        }
      />
    </AppShell>
  );
}

// ---------------------------------------------------------------------

function AlertCard({
  alert,
  expanded,
  onToggle,
}: {
  alert: AlertSummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tone = severity(alert.severity);

  // Detail is fetched only when a card is opened — the feed does not
  // need N+1 requests to render.
  const { data: detail } = useApiData<AlertDetail | null>(
    (signal) => (expanded ? getAlert(alert.alert_id, signal) : Promise.resolve(null)),
    [expanded, alert.alert_id]
  );

  return (
    <article
      className="overflow-hidden rounded-[16px] bg-surface-container-low"
      style={{ borderLeft: `3px solid ${tone.hex}` }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 text-left"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span
            className="font-body text-label-caps uppercase"
            style={{ color: tone.hex }}
          >
            {alertTypeLabel(alert.alert_type)}
          </span>
          <span className="shrink-0 font-body text-[11px] text-on-surface-variant">
            {agoLabel(alert.occurred_at)}
          </span>
        </div>

        <p className="mt-1.5 font-body text-[13px] leading-relaxed text-on-surface">
          {alert.message}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {alert.plate && (
            <Chip className="bg-surface-container font-body tracking-wider text-on-surface">
              {alert.plate}
            </Chip>
          )}
          {alert.camera_name && (
            <span className="font-body text-[11px] text-on-surface-variant">
              {alert.camera_id} · {alert.camera_name}
            </span>
          )}
          {/* Repeats inside the suppression window collapse into one
              row, so the count is the signal, not a duplicate feed. */}
          {alert.repeat_count > 1 && (
            <Chip className="bg-secondary-container text-on-secondary-container">
              ×{alert.repeat_count}
            </Chip>
          )}
        </div>
      </button>

      {expanded && detail && (
        <div className="hairline-t px-4 py-3">
          {detail.vehicle && detail.related_vehicle ? (
            <>
              <Label>Two vehicles wearing this plate</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <VehicleFace
                  title="Vehicle 1"
                  vehicle={detail.vehicle}
                />
                <VehicleFace
                  title="Vehicle 2"
                  vehicle={detail.related_vehicle}
                />
              </div>

              {/* Why the resolver refused to call these one vehicle:
                  the plates match exactly, but the appearance vectors
                  do not, so the total never cleared the threshold. */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-body text-[12px] text-on-surface-variant">
                {typeof detail.alert.metadata?.cosine_similarity ===
                  "number" && (
                  <span>
                    Appearance similarity:{" "}
                    <strong className="text-on-surface">
                      {(
                        detail.alert.metadata
                          .cosine_similarity as number
                      ).toFixed(2)}
                    </strong>
                  </span>
                )}
                {typeof detail.alert.metadata?.total_score ===
                  "number" && (
                  <span>
                    Link score:{" "}
                    <strong className="text-error">
                      {(
                        detail.alert.metadata.total_score as number
                      ).toFixed(1)}
                    </strong>{" "}
                    — below threshold
                  </span>
                )}
              </div>
            </>
          ) : (
            detail.vehicle && (
              <>
                <Label>Vehicle</Label>
                <div className="mt-2">
                  <VehicleFace title="" vehicle={detail.vehicle} />
                </div>
              </>
            )
          )}

          {detail.observation && (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-body text-[11px] text-on-surface-variant">
              <span>
                Read:{" "}
                <strong className="text-on-surface">
                  {detail.observation.plate_text ?? "unreadable"}
                </strong>
              </span>
              <span>
                Confidence:{" "}
                {percent(detail.observation.plate_confidence)}
              </span>
              {detail.observation.vehicle_colour && (
                <span>
                  {detail.observation.vehicle_colour}{" "}
                  {detail.observation.vehicle_type}
                </span>
              )}
            </div>
          )}

          {/* Drill-down: open the journey of the vehicle this alert
              names. A clone alert offers both. */}
          {detail.vehicle?.canonical_plate && (
            <div className="mt-3 flex gap-2">
              <Link
                to={`/vehicles?plate=${encodeURIComponent(
                  detail.vehicle.canonical_plate
                )}`}
                className="ambient-shadow inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary-container px-4 py-2.5 font-body text-label-caps uppercase text-on-primary-container transition-colors hover:bg-primary"
              >
                <Icon name="timeline" size={14} />
                {detail.related_vehicle
                  ? "Journey 1"
                  : "Open journey"}
              </Link>

              {detail.related_vehicle?.canonical_plate && (
                <Link
                  to={`/vehicles?plate=${encodeURIComponent(
                    detail.related_vehicle.canonical_plate
                  )}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full ghost-border px-4 py-2.5 font-body text-label-caps uppercase text-primary transition-colors hover:bg-secondary-container/50"
                >
                  <Icon name="timeline" size={14} />
                  Journey 2
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function VehicleFace({
  title,
  vehicle,
}: {
  title: string;
  vehicle: NonNullable<AlertDetail["vehicle"]>;
}) {
  return (
    <div className="rounded-[8px] border border-hairline bg-surface-container-lowest/60 p-2.5">
      {title && <Label className="text-[10px]">{title}</Label>}
      <div className="mt-1 font-body text-[13px] font-semibold text-on-surface capitalize">
        {[vehicle.vehicle_colour, vehicle.vehicle_type]
          .filter(Boolean)
          .join(" ") || `Vehicle ${vehicle.vehicle_id}`}
      </div>
      <div className="mt-0.5 font-body text-[11px] text-on-surface-variant">
        {vehicle.last_camera_id ?? "—"}
      </div>
      <div className="font-body text-[11px] text-on-surface-variant">
        {agoLabel(vehicle.last_seen_at)}
      </div>
    </div>
  );
}
