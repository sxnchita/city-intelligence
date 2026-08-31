import { useState } from "react";
import { Link } from "react-router-dom";

import AppShell, { MapWorkspace } from "../components/layout/AppShell";
import CityMap from "../components/map/CityMap";
import { connectionState } from "../components/common/ConnectionBadge";
import DemoControl from "../components/common/DemoControl";
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
  Rule,
  SidePanel,
} from "../design/ui";
import { clockTime, percent, severity } from "../design/tokens";
import { getSummary } from "../services/analyticsApi";
import {
  alertTypeLabel,
  getAlerts,
  type Severity,
} from "../services/alertsApi";
import { getRecentObservations } from "../services/observationsApi";
import { getCameras } from "../services/mapApi";

// =====================================================================
// DASHBOARD
//
// The glanceable screen: city map behind, a rail of live figures and
// feeds in front. Statistics are set as editorial figures rather than
// filled KPI cards — the design has no card fill anywhere.
// =====================================================================

const REFRESH_MS = 15_000;

type DashboardAlert = {
  severity: Severity;
  title: string;
  description: string;
  time: string;
};

type DashboardSighting = {
  vehicle: string;
  camera: string;
  zone: string;
  time: string;
  confidence: string;
};

type DashboardData = {
  activeCameras: number;
  camerasReporting: number;
  /**
   * Sightings, not distinct vehicles: the backend's unique_vehicles is
   * summed over per-camera buckets, so it counts a vehicle once per
   * camera per bucket. Labelled accordingly.
   */
  sightingCount: number;
  activeAlerts: number;
  highAlerts: number;
  worstRatio: string;
  worstEdge: string;
  alerts: DashboardAlert[];
  sightings: DashboardSighting[];
};

const NOTHING_YET: DashboardData = {
  activeCameras: 0,
  camerasReporting: 0,
  sightingCount: 0,
  activeAlerts: 0,
  highAlerts: 0,
  worstRatio: "—",
  worstEdge: "No corridor ranked yet",
  alerts: [],
  sightings: [],
};

export default function Dashboard() {
  const [streamOpen, setStreamOpen] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState("Waiting for live stream");

  const {
    data: fetched,
    loading,
    error,
  } = useApiData<DashboardData>(
    async (signal) => {
      const [summary, alerts, recent, cameras] = await Promise.all([
        getSummary(undefined, undefined, signal),
        getAlerts({ limit: 4 }, signal),
        getRecentObservations(5, undefined, signal),
        getCameras(signal),
      ]);

      // /api/events/recent carries camera ids but not names or zones;
      // the camera response is where those live.
      const byId = new Map(
        cameras.features.map((f) => [
          f.properties.camera_id,
          f.properties,
        ])
      );

      const bySeverity = summary.alerts_by_severity ?? {};
      const activeAlerts = Object.values(bySeverity).reduce(
        (a, b) => a + b,
        0
      );
      const worst = summary.worst_congested_edge;

      return {
        activeCameras: cameras.features.filter(
          (f) => f.properties.is_active
        ).length,
        camerasReporting: summary.active_cameras_reporting,
        sightingCount: summary.total_observations,
        activeAlerts,
        highAlerts: bySeverity.high ?? 0,
        worstRatio:
          worst?.congestion_ratio != null
            ? `${worst.congestion_ratio.toFixed(2)}×`
            : "—",
        worstEdge: worst
          ? `${worst.from_camera_id} → ${worst.to_camera_id} · ${
              worst.congestion_band ?? "unbanded"
            }`
          : "No corridor ranked yet",

        alerts: alerts.map((row) => ({
          severity: row.severity,
          title: alertTypeLabel(row.alert_type),
          description: row.message,
          time: clockTime(row.occurred_at),
        })),

        sightings: recent.map((row) => {
          const camera = byId.get(row.camera_id);
          return {
            vehicle: row.plate_text ?? "unreadable",
            camera: camera
              ? `${row.camera_id} · ${camera.name}`
              : row.camera_id,
            zone: camera?.zone ?? "—",
            time: clockTime(row.first_seen_at),
            confidence: percent(row.plate_confidence),
          };
        }),
      };
    },
    [],
    { refreshMs: REFRESH_MS }
  );

  const data = fetched ?? NOTHING_YET;
  const hasData =
    fetched !== null &&
    (fetched.sightingCount > 0 || fetched.activeCameras > 0);

  return (
    <AppShell
      connection={connectionState({
        loading,
        error,
        stream: streamOpen,
      })}
      connectionTitle={error ? error.message : lastEvent}
      actions={<DemoControl />}
    >
      <MapWorkspace
        map={
          <CityMap
            showCameras
            showTraffic
            showTrajectory={false}
            onStreamChange={setStreamOpen}
            onLastEvent={setLastEvent}
            onError={setMapError}
          />
        }
        panel={
          <SidePanel width="w-[420px]">
            <div className="hairline-b px-6 pt-6 pb-5">
              <h1 className="font-display text-headline-md text-primary">
                Live Operations
              </h1>
              <p className="mt-1 font-body text-body-sm text-on-surface-variant">
                City-wide vehicle tracking · last 15 minutes
              </p>
            </div>

            {/* Figures, hairline-separated rather than boxed. */}
            <div className="hairline-b grid grid-cols-2">
              <PanelFigure
                value={data.activeCameras.toLocaleString()}
                label="Cameras"
                detail={`${data.camerasReporting} reporting`}
                className="hairline-r hairline-b"
              />
              <PanelFigure
                value={data.sightingCount.toLocaleString()}
                label="Sightings"
                detail="Within the window"
                className="hairline-b"
              />
              <PanelFigure
                value={data.activeAlerts.toLocaleString()}
                label="Alerts"
                detail={`${data.highAlerts} high priority`}
                className="hairline-r"
                accent={data.highAlerts > 0}
              />
              <PanelFigure
                value={data.worstRatio}
                label="Worst corridor"
                detail={data.worstEdge}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <Section
                title="Live alerts"
                action={<Link to="/alerts">View all</Link>}
              >
                {data.alerts.length === 0 ? (
                  <EmptyState
                    title={error ? "Alerts unavailable" : "No alerts"}
                    detail={
                      error
                        ? OFFLINE_HINT
                        : hasData
                          ? "Nothing has fired in this window."
                          : NO_DATA_HINT
                    }
                    tone={error ? "error" : "neutral"}
                  />
                ) : (
                  data.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="flex gap-3 border-l-2 py-3 pl-3"
                      style={{
                        borderColor: severity(alert.severity).hex,
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-body text-[13px] font-semibold text-on-surface">
                            {alert.title}
                          </span>
                          <span className="shrink-0 font-body text-[11px] text-on-surface-variant">
                            {alert.time}
                          </span>
                        </div>
                        <p className="mt-1 font-body text-[12px] leading-relaxed text-on-surface-variant">
                          {alert.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </Section>

              <Section
                title="Recent sightings"
                action={<Link to="/vehicles">Trace</Link>}
              >
                {data.sightings.length === 0 ? (
                  <EmptyState
                    title={
                      error ? "Sightings unavailable" : "No sightings yet"
                    }
                    detail={error ? OFFLINE_HINT : NO_DATA_HINT}
                    tone={error ? "error" : "neutral"}
                  />
                ) : (
                  data.sightings.map((sighting, index) => (
                    <div key={index}>
                      {index > 0 && <Rule />}
                      <div className="flex items-baseline justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <div className="font-body text-data text-on-surface">
                            {sighting.vehicle}
                          </div>
                          <div className="mt-0.5 truncate font-body text-[11px] text-on-surface-variant">
                            {sighting.camera}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-body text-[11px] text-on-surface-variant">
                            {sighting.time}
                          </div>
                          <Chip className="mt-1 bg-secondary-container text-on-secondary-container">
                            {sighting.confidence}
                          </Chip>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Section>
            </div>

            <div className="hairline-t flex items-center gap-2 px-6 py-3">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  streamOpen ? "bg-primary" : "bg-outline-variant"
                }`}
              />
              <span className="truncate font-body text-[11px] text-on-surface-variant">
                {streamOpen ? lastEvent : "Live stream offline"}
              </span>
            </div>
          </SidePanel>
        }
        overlays={
          mapError ? (
            <FloatingCard className="absolute right-6 bottom-6 z-20 max-w-xs">
              <Label className="text-error">Map data unavailable</Label>
              <p className="mt-2 font-body text-[12px] text-on-surface-variant">
                {mapError}
              </p>
            </FloatingCard>
          ) : (
            <FloatingCard className="absolute right-6 bottom-6 z-20">
              <Label>Congestion</Label>
              <div className="mt-2 h-1.5 w-40 rounded-full bg-gradient-to-r from-[#6b7b3a] via-[#b4690e] to-[#ba1a1a]" />
              <div className="mt-1.5 flex justify-between font-body text-[10px] text-on-surface-variant">
                <span>Free flow</span>
                <span>Severe</span>
              </div>
            </FloatingCard>
          )
        }
      />
    </AppShell>
  );
}

function PanelFigure({
  value,
  label,
  detail,
  className = "",
  accent = false,
}: {
  value: string;
  label: string;
  detail: string;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div className={`px-6 py-5 ${className}`}>
      <div
        className={`font-display text-headline-md ${
          accent ? "text-error" : "text-on-surface"
        }`}
      >
        {value}
      </div>
      <Label className="mt-1 block">{label}</Label>
      <div className="mt-1 truncate font-body text-[11px] text-on-surface-variant/80">
        {detail}
      </div>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="hairline-b px-6 py-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-display text-headline-sm text-on-surface">
          {title}
        </h2>
        <span className="font-body text-label-caps uppercase text-primary [&_a]:transition-colors hover:[&_a]:text-primary-container">
          {action}
          <Icon name="arrow_forward" size={12} className="ml-1 align-middle" />
        </span>
      </div>
      {children}
    </section>
  );
}
