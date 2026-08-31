import { useMemo } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AppShell from "../components/layout/AppShell";
import { connectionState } from "../components/common/ConnectionBadge";
import EmptyState, {
  NO_DATA_HINT,
  OFFLINE_HINT,
} from "../components/common/EmptyState";
import { useApiData } from "../hooks/useApiData";
import { Chip, Label, Rule } from "../design/ui";
import { HEX, band, duration } from "../design/tokens";
import {
  getCongestion,
  getDensity,
  getOd,
  getSummary,
  type CongestionRow,
} from "../services/analyticsApi";

// =====================================================================
// ANALYTICS
//
// The one screen with no Stitch comp, built to the same system: paper
// ground, hairline rules, editorial figures, no card fills. Charts use
// the palette's own roles — primary for the main series, tertiary for
// the second — rather than a separate chart palette.
//
// Every widget states the basis of its number. The OD matrix in
// particular carries its coverage denominator, because a matrix built
// only from vehicles seen twice under-counts short trips.
// =====================================================================

const WINDOW_HOURS = 24;

type AnalyticsData = {
  totalObservations: number;
  vehiclesTracked: number;
  camerasReporting: number;
  volume: { time: string; observations: number }[];
  flows: { route: string; vehicles: number }[];
  corridors: CongestionRow[];
  coverageFraction: number | null;
  coverageObserved: number;
  coverageUsable: number;
  coverageNote: string;
};

/**
 * Density buckets at analytics.density-bucket-minutes (5), which is
 * 288 points over a day — unreadable as a trend. There is no
 * server-side bucket size to ask for, so they are folded here.
 */
function toHourly(
  points: { bucket_start: string; observation_count: number }[]
) {
  const hours = new Map<number, number>();

  for (const point of points) {
    const at = new Date(point.bucket_start);
    if (Number.isNaN(at.getTime())) continue;
    at.setMinutes(0, 0, 0);
    hours.set(
      at.getTime(),
      (hours.get(at.getTime()) ?? 0) + point.observation_count
    );
  }

  return [...hours.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([key, observations]) => ({
      time: new Date(key).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      observations,
    }));
}

export default function Analytics() {
  const {
    data: fetched,
    loading,
    error,
  } = useApiData<AnalyticsData>(async (signal) => {
    const from = new Date(
      Date.now() - WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();
    const to = new Date().toISOString();

    const [summary, density, od, congestion] = await Promise.all([
      getSummary(from, to, signal),
      getDensity(from, to, undefined, signal),
      getOd(from, to, signal),
      getCongestion(from, to, 6, signal),
    ]);

    const cityWide =
      density.series.find((s) => s.camera_id === null) ??
      density.series[0];

    return {
      totalObservations: summary.total_observations,
      // NOT summary.unique_vehicles — that sums per-camera bucket
      // counts and tracks the observation total. The OD coverage
      // denominator is the only vehicle-keyed count the API exposes.
      vehiclesTracked: od.coverage.vehicles_observed,
      camerasReporting: summary.active_cameras_reporting,
      volume: toHourly(cityWide?.points ?? []),
      flows: [...od.matrix]
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map((cell) => ({
          route: `${cell.origin} → ${cell.destination}`,
          vehicles: cell.count,
        })),
      corridors: congestion.rows,
      coverageFraction: od.coverage.coverage_fraction,
      coverageObserved: od.coverage.vehicles_observed,
      coverageUsable: od.coverage.vehicles_with_both_ends,
      coverageNote: od.coverage.note,
    };
  }, []);

  const data = fetched;

  const axis = useMemo(
    () => ({
      stroke: HEX.outlineVariant,
      tick: {
        fill: HEX.onSurfaceVariant,
        fontSize: 11,
        fontFamily: "Inter, sans-serif",
      },
    }),
    []
  );

  const tooltipStyle = {
    background: "rgba(245,239,229,.97)",
    border: `1px solid ${HEX.hairline}`,
    borderRadius: 16,
    color: HEX.onSurface,
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
    boxShadow: "0 12px 40px rgba(44,51,32,.08)",
  };

  return (
    <AppShell
      connection={connectionState({ loading, error })}
      connectionTitle={error ? error.message : undefined}
    >
      <div className="hide-scrollbar h-full overflow-y-auto bg-paper">
        <div className="mx-auto w-full max-w-7xl px-container py-10">
          <header className="mb-10">
            <h1 className="font-display text-display-lg text-primary">
              Analytics
            </h1>
            <p className="mt-1 font-body text-body-md text-on-surface-variant">
              Movement, corridor performance and origin-destination flow
              across the last {WINDOW_HOURS} hours.
            </p>
          </header>

          {/* Figures on hairlines, not in cards. */}
          <div className="mb-12 grid grid-cols-2 gap-px border-y border-hairline bg-hairline md:grid-cols-4">
            <Stat
              value={data?.totalObservations}
              label="Observations"
              detail="Sightings stored"
            />
            <Stat
              value={data?.vehiclesTracked}
              label="Vehicles tracked"
              detail={
                data
                  ? `${data.coverageUsable.toLocaleString()} usable for flows`
                  : undefined
              }
            />
            <Stat
              value={data?.camerasReporting}
              label="Cameras reporting"
              detail="Across the network"
            />
            <Stat
              value={data?.flows[0]?.vehicles}
              label="Top flow"
              detail={data?.flows[0]?.route}
            />
          </div>

          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
            <Panel
              title="Observation volume"
              subtitle="Sightings per hour, city-wide"
            >
              {!data || data.volume.length === 0 ? (
                <EmptyState
                  title={error ? "Density unavailable" : "No observations"}
                  detail={error ? OFFLINE_HINT : NO_DATA_HINT}
                  tone={error ? "error" : "neutral"}
                />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={data.volume}
                    margin={{ top: 10, right: 16, bottom: 0, left: -12 }}
                  >
                    <CartesianGrid
                      strokeDasharray="2 4"
                      stroke={HEX.hairline}
                      vertical={false}
                    />
                    <XAxis dataKey="time" {...axis} tickLine={false} />
                    <YAxis {...axis} tickLine={false} width={44} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="observations"
                      stroke={HEX.primary}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4, fill: HEX.primary }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Panel>

            <Panel
              title="Origin-destination"
              subtitle="Highest zone-to-zone movement"
            >
              {!data || data.flows.length === 0 ? (
                <EmptyState
                  title={error ? "Flows unavailable" : "No flows"}
                  detail={
                    error
                      ? OFFLINE_HINT
                      : "Only vehicles seen at two or more cameras contribute."
                  }
                  tone={error ? "error" : "neutral"}
                />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={data.flows}
                      layout="vertical"
                      margin={{ top: 4, right: 16, bottom: 0, left: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="2 4"
                        stroke={HEX.hairline}
                        horizontal={false}
                      />
                      <XAxis type="number" {...axis} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="route"
                        {...axis}
                        width={150}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={{ fill: "rgba(107,123,58,.08)" }}
                      />
                      <Bar
                        dataKey="vehicles"
                        fill={HEX.tertiary}
                        radius={[0, 4, 4, 0]}
                        barSize={14}
                      />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* The denominator ships with the matrix. */}
                  <p className="mt-3 font-body text-[11px] italic text-on-surface-variant">
                    {data.coverageNote}{" "}
                    {data.coverageFraction !== null &&
                      `Coverage ${Math.round(
                        data.coverageFraction * 100
                      )}% — ${data.coverageUsable.toLocaleString()} of ${data.coverageObserved.toLocaleString()} vehicles.`}
                  </p>
                </>
              )}
            </Panel>
          </div>

          <div className="mt-12">
            <Panel
              title="Corridor performance"
              subtitle="Median travel time against free flow"
            >
              {!data || data.corridors.length === 0 ? (
                <EmptyState
                  title={
                    error ? "Corridors unavailable" : "No ranked corridors"
                  }
                  detail={error ? OFFLINE_HINT : NO_DATA_HINT}
                  tone={error ? "error" : "neutral"}
                />
              ) : (
                data.corridors.map((row, index) => {
                  const info = band(row.congestion_band);
                  return (
                    <div key={row.edge_id}>
                      {index > 0 && <Rule />}
                      <div className="flex flex-wrap items-center justify-between gap-4 py-4">
                        <div className="min-w-0">
                          <div className="font-display text-body-lg text-on-surface">
                            {row.from_camera_name ?? row.from_camera_id}{" "}
                            <span className="text-on-surface-variant">→</span>{" "}
                            {row.to_camera_name ?? row.to_camera_id}
                          </div>
                          <div className="mt-0.5 font-body text-[12px] text-on-surface-variant">
                            {duration(row.median_duration_s)} median ·{" "}
                            {duration(row.free_flow_s)} free flow ·{" "}
                            {row.sample_count} samples
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <Chip className={info.chip}>{info.label}</Chip>
                          <span
                            className="font-display text-headline-sm"
                            style={{ color: info.hex }}
                          >
                            {row.congestion_ratio !== null
                              ? `${row.congestion_ratio.toFixed(2)}×`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  value,
  label,
  detail,
}: {
  value: number | undefined;
  label: string;
  detail?: string;
}) {
  return (
    <div className="bg-paper px-6 py-6">
      <div className="font-display text-headline-md text-on-surface">
        {value === undefined ? "—" : value.toLocaleString()}
      </div>
      <Label className="mt-1 block">{label}</Label>
      {detail && (
        <div className="mt-1 truncate font-body text-[11px] text-on-surface-variant/80">
          {detail}
        </div>
      )}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="hairline-b mb-5 pb-3">
        <h2 className="font-display text-headline-sm text-on-surface">
          {title}
        </h2>
        <p className="mt-0.5 font-body text-[12px] text-on-surface-variant">
          {subtitle}
        </p>
      </header>
      {children}
    </section>
  );
}
