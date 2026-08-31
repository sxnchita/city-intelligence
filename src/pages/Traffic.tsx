import { useMemo, useState } from "react";

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
  Rule,
  Segmented,
  SidePanel,
  Sparkline,
} from "../design/ui";
import { band, clockTime, duration } from "../design/tokens";
import {
  getCongestion,
  getDensity,
  getOd,
  type CongestionResponse,
  type OdResponse,
} from "../services/analyticsApi";

// =====================================================================
// TRAFFIC HEATMAP
//
// The map is coloured by congestion; the rail ranks the worst
// corridors. Both read the same window, so the scrubber at the bottom
// moves the whole screen at once.
//
// Segments the backend saw too few times to band are counted and
// stated rather than dropped — a ranking that quietly omits its thin
// data is not a ranking.
// =====================================================================

const REFRESH_MS = 15_000;

/** How far back the scrubber can reach. */
const SCRUB_WINDOW_MINUTES = 120;

/** Width of the window the scrubber selects. */
const SCRUB_SLICE_MINUTES = 15;

type Mode = "congestion" | "od";

type TrafficData = {
  congestion: CongestionResponse;
  od: OdResponse;
  flow: number[];
};

export default function Traffic() {
  const [mode, setMode] = useState<Mode>("congestion");
  const [streamOpen, setStreamOpen] = useState(false);

  // null = live. A number is "minutes back from now" for the end of
  // the selected slice.
  const [scrubMinutes, setScrubMinutes] = useState<number | null>(null);

  const window_ = useMemo(() => {
    if (scrubMinutes === null) return { from: undefined, to: undefined };

    const end = Date.now() - scrubMinutes * 60_000;
    return {
      from: new Date(
        end - SCRUB_SLICE_MINUTES * 60_000
      ).toISOString(),
      to: new Date(end).toISOString(),
    };
  }, [scrubMinutes]);

  const {
    data: fetched,
    loading,
    error,
  } = useApiData<TrafficData>(
    async (signal) => {
      const [congestion, od, density] = await Promise.all([
        getCongestion(window_.from, window_.to, 20, signal),
        getOd(window_.from, window_.to, signal),
        getDensity(window_.from, window_.to, undefined, signal),
      ]);

      // City-wide series is the one with a null camera_id.
      const cityWide =
        density.series.find((s) => s.camera_id === null) ??
        density.series[0];

      return {
        congestion,
        od,
        flow: (cityWide?.points ?? []).map((p) => p.observation_count),
      };
    },
    [window_.from, window_.to],
    {
      // Only live mode keeps moving; a fixed slice returns the same
      // rows every time, so polling it is pure noise.
      refreshMs: scrubMinutes === null ? REFRESH_MS : undefined,
    }
  );

  const congestion = fetched?.congestion;

  const rows = useMemo(
    () => congestion?.rows ?? [],
    [congestion]
  );

  const odRows = useMemo(
    () =>
      [...(fetched?.od.matrix ?? [])]
        .sort((a, b) => b.count - a.count)
        .slice(0, 12),
    [fetched]
  );

  const bandCounts = useMemo(() => {
    const counts = { free: 0, moderate: 0, heavy: 0, severe: 0 };
    for (const row of rows) {
      if (row.congestion_band && row.congestion_band in counts) {
        counts[row.congestion_band as keyof typeof counts] += 1;
      }
    }
    return counts;
  }, [rows]);

  return (
    <AppShell
      connection={connectionState({ loading, error, stream: streamOpen })}
      connectionTitle={error ? error.message : undefined}
    >
      <MapWorkspace
        map={
          <CityMap
            showCameras
            showTraffic
            showTrajectory={false}
            from={window_.from}
            to={window_.to}
            onStreamChange={setStreamOpen}
          />
        }
        panel={
          <SidePanel width="w-[400px]">
            <header className="hairline-b px-6 pt-6 pb-5">
              <h1 className="font-display text-headline-md text-on-surface">
                Traffic Heatmap
              </h1>

              <div className="mt-4">
                <Segmented
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: "congestion", label: "Congestion" },
                    { value: "od", label: "Origin-Dest" },
                  ]}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-3 font-body text-[11px] text-on-surface-variant">
                <span>
                  <strong className="text-warning">
                    {bandCounts.heavy}
                  </strong>{" "}
                  heavy
                </span>
                <span>
                  <strong className="text-error">
                    {bandCounts.severe}
                  </strong>{" "}
                  severe
                </span>
                <span>
                  <strong className="text-on-surface">
                    {rows.length}
                  </strong>{" "}
                  ranked
                </span>
              </div>
            </header>

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {mode === "congestion" ? (
                rows.length === 0 ? (
                  <EmptyState
                    title={
                      error
                        ? "Congestion unavailable"
                        : "No ranked corridors"
                    }
                    detail={error ? OFFLINE_HINT : NO_DATA_HINT}
                    tone={error ? "error" : "neutral"}
                  />
                ) : (
                  <>
                    {rows.map((row, index) => {
                      const info = band(row.congestion_band);
                      return (
                        <div key={row.edge_id}>
                          {index > 0 && <Rule className="my-1" />}
                          <div className="py-3">
                            <div className="flex items-start justify-between gap-3">
                              <Chip className={info.chip}>
                                {info.label}
                              </Chip>
                              <span
                                className="shrink-0 font-body text-[15px] font-semibold"
                                style={{ color: info.hex }}
                              >
                                {row.congestion_ratio !== null
                                  ? `${row.congestion_ratio.toFixed(1)}×`
                                  : "—"}
                              </span>
                            </div>

                            <div className="mt-1.5 font-display text-body-lg leading-snug text-on-surface">
                              {row.from_camera_name ?? row.from_camera_id}{" "}
                              <span className="text-on-surface-variant">
                                →
                              </span>{" "}
                              {row.to_camera_name ?? row.to_camera_id}
                            </div>

                            <div className="mt-1 flex justify-between font-body text-[11px] text-on-surface-variant">
                              <span>
                                Time:{" "}
                                <strong className="text-on-surface">
                                  {duration(row.median_duration_s)}
                                </strong>
                              </span>
                              <span>
                                Norm: {duration(row.free_flow_s)} ·{" "}
                                {row.sample_count} samples
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* The denominator, never hidden. */}
                    {congestion &&
                      congestion.excluded_low_sample_edges > 0 && (
                        <p className="mt-4 font-body text-[11px] italic text-on-surface-variant">
                          {congestion.excluded_low_sample_edges} segments
                          hidden — fewer than {congestion.min_samples}{" "}
                          samples
                        </p>
                      )}
                  </>
                )
              ) : odRows.length === 0 ? (
                <EmptyState
                  title={error ? "Flows unavailable" : "No flows"}
                  detail={
                    error
                      ? OFFLINE_HINT
                      : "Only vehicles seen at two or more cameras contribute to this matrix."
                  }
                  tone={error ? "error" : "neutral"}
                />
              ) : (
                <>
                  {odRows.map((cell, index) => (
                    <div key={`${cell.origin}-${cell.destination}`}>
                      {index > 0 && <Rule className="my-1" />}
                      <div className="flex items-center justify-between gap-3 py-2.5">
                        <span className="min-w-0 truncate font-body text-[13px] text-on-surface">
                          {cell.origin}{" "}
                          <span className="text-on-surface-variant">→</span>{" "}
                          {cell.destination}
                        </span>
                        <span className="shrink-0 font-display text-[16px] text-on-surface">
                          {cell.count}
                        </span>
                      </div>
                    </div>
                  ))}

                  {fetched && (
                    <p className="mt-4 font-body text-[11px] italic text-on-surface-variant">
                      {fetched.od.coverage.note} Coverage:{" "}
                      {fetched.od.coverage.vehicles_with_both_ends.toLocaleString()}{" "}
                      of{" "}
                      {fetched.od.coverage.vehicles_observed.toLocaleString()}{" "}
                      vehicles.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="hairline-t px-6 py-4">
              <Label>City flow volume</Label>
              <Sparkline
                points={fetched?.flow ?? []}
                height={44}
                className="mt-2"
              />
            </div>
          </SidePanel>
        }
        overlays={
          <>
            <FloatingCard className="absolute right-6 bottom-28 z-20">
              <Label>Congestion level</Label>
              <div className="mt-2 h-1.5 w-44 rounded-full bg-gradient-to-r from-[#6b7b3a] via-[#b4690e] to-[#ba1a1a]" />
              <div className="mt-1.5 flex justify-between font-body text-[10px] text-on-surface-variant">
                <span>Free flow</span>
                <span>Severe</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-outline-variant" />
                <span className="font-body text-[10px] text-on-surface-variant">
                  Too few samples to band
                </span>
              </div>
            </FloatingCard>

            {/* Playback scrubber — moves the map and the rail together. */}
            <FloatingCard className="absolute right-6 bottom-6 left-[424px] z-20 flex items-center gap-4">
              <button
                type="button"
                onClick={() => setScrubMinutes(null)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-label-caps uppercase transition-colors ${
                  scrubMinutes === null
                    ? "bg-error-container text-on-error-container"
                    : "bg-surface-container text-on-surface-variant hover:text-primary"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    scrubMinutes === null
                      ? "animate-pulse bg-error"
                      : "bg-outline"
                  }`}
                />
                Live
              </button>

              <button
                type="button"
                title="Step back 15 minutes"
                onClick={() =>
                  setScrubMinutes((current) =>
                    Math.min(
                      SCRUB_WINDOW_MINUTES,
                      (current ?? 0) + SCRUB_SLICE_MINUTES
                    )
                  )
                }
                className="shrink-0 text-on-surface-variant transition-colors hover:text-primary"
              >
                <Icon name="skip_previous" size={20} />
              </button>

              <input
                type="range"
                min={0}
                max={SCRUB_WINDOW_MINUTES}
                step={5}
                // Live sits at the right-hand end: the axis runs
                // oldest on the left to now on the right.
                value={
                  scrubMinutes === null
                    ? SCRUB_WINDOW_MINUTES
                    : SCRUB_WINDOW_MINUTES - scrubMinutes
                }
                onChange={(e) => {
                  const back =
                    SCRUB_WINDOW_MINUTES - Number(e.target.value);
                  setScrubMinutes(back === 0 ? null : back);
                }}
                className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-hairline accent-primary"
              />

              <span className="shrink-0 rounded-full bg-surface-container px-3 py-1.5 font-body text-data text-on-surface">
                {scrubMinutes === null
                  ? "Last 15 min"
                  : `${clockTime(window_.from!)} – ${clockTime(window_.to!)}`}
              </span>
            </FloatingCard>
          </>
        }
      />
    </AppShell>
  );
}
