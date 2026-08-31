import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import AppShell, { MapWorkspace } from "../components/layout/AppShell";
import CityMap from "../components/map/CityMap";
import { connectionState } from "../components/common/ConnectionBadge";
import EmptyState from "../components/common/EmptyState";
import {
  Chip,
  FloatingCard,
  Icon,
  Label,
  SidePanel,
} from "../design/ui";
import {
  HEX,
  LINK,
  clockSeconds,
  distance,
  duration,
  linkKind,
  percent,
} from "../design/tokens";
import { getTrajectoryByPlate } from "../services/vehicleApi";
import type { AlternateMatch, MatchType } from "../services/vehicleApi";
import type {
  ScoreBreakdown,
  TrajectoryHopProperties,
  TrajectoryResponse,
  TrajectorySightingProperties,
} from "../services/mapApi";

// =====================================================================
// VEHICLE JOURNEY
//
// The screen that demonstrates what the system actually does, so it
// gets the most detail. A numbered timeline on the left mirrors the
// numbered stops on the map, and clicking either focuses the other.
//
// The link between two stops is never presented as a fact. Each one
// carries its confidence, and an expandable card shows the three
// scores the resolver summed to accept it.
// =====================================================================

/** identity.threshold in application.yml — a link must clear this. */
const LINK_THRESHOLD = 4.0;

type Stop = {
  kind: "stop";
  sequence: number;
  cameraId: string;
  cameraName: string | null;
  zone: string | null;
  timestamp: string;
  plateRead: string | null;
  plateConfidence: number | null;
};

type Hop = {
  kind: "hop";
  sequence: number;
  linkConfidence: number | null;
  durationS: number | null;
  distanceM: number | null;
  scoreBreakdown: ScoreBreakdown | null;
  link: ReturnType<typeof linkKind>;
  skippedCameras: string[];
  detourSuspected: boolean | null;
};

type Entry = Stop | Hop;

type VehicleView = {
  plate: string;
  vehicleId: number;
  status: string;
  sightings: number;
  meanConfidence: number | null;
  totalDistanceM: number | null;
  totalDurationS: number | null;
  entries: Entry[];
  matchType: MatchType | null;
  alternates: AlternateMatch[];
};

function toView(
  trajectory: TrajectoryResponse,
  matchType: MatchType | null,
  alternates: AlternateMatch[]
): VehicleView {
  const entries: Entry[] = [];

  // Features alternate hop, sighting, hop, sighting... in sequence
  // order, so the list is walked straight through without sorting.
  for (const feature of trajectory.geojson.features) {
    const p = feature.properties as
      | TrajectorySightingProperties
      | TrajectoryHopProperties;

    if (p.kind === "sighting") {
      entries.push({
        kind: "stop",
        sequence: p.sequence,
        cameraId: p.camera_id,
        cameraName: p.camera_name,
        zone: p.zone,
        timestamp: p.timestamp,
        plateRead: p.plate_read,
        plateConfidence: p.plate_confidence,
      });
    } else {
      entries.push({
        kind: "hop",
        sequence: p.sequence,
        linkConfidence: p.link_confidence,
        durationS: p.duration_s,
        distanceM: p.distance_m,
        scoreBreakdown: p.score_breakdown,
        link: linkKind(p),
        skippedCameras: p.skipped_cameras ?? [],
        detourSuspected: p.detour_suspected,
      });
    }
  }

  return {
    plate: trajectory.canonical_plate ?? "unknown",
    vehicleId: trajectory.vehicle_id,
    status: trajectory.status,
    sightings: trajectory.sighting_count,
    meanConfidence: trajectory.mean_link_confidence,
    totalDistanceM: trajectory.total_distance_m,
    totalDurationS: trajectory.total_duration_s,
    entries,
    matchType,
    alternates,
  };
}

export default function VehicleSearch() {
  // ?plate= lets an alert link straight to the vehicle it names, which
  // is the drill-down the spec asks for. Falls back to the scenario's
  // blacklisted lorry, which is the demo story.
  const [params, setParams] = useSearchParams();
  const initialPlate = params.get("plate") ?? "CH01AB1234";

  const [searchValue, setSearchValue] = useState(initialPlate);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [vehicle, setVehicle] = useState<VehicleView | null>(null);
  const [streamOpen, setStreamOpen] = useState(false);

  // Drives the two-way highlight between timeline and map.
  const [focusedStop, setFocusedStop] = useState<number | null>(null);
  const [openHop, setOpenHop] = useState<number | null>(null);

  const runSearch = useCallback(async (rawPlate: string) => {
    const plate = rawPlate.trim().toUpperCase();

    // The backend requires a plate; an empty one is a 400.
    if (!plate) {
      setMessage("Enter a plate to search.");
      return;
    }

    setLoading(true);
    setError(null);
    setFocusedStop(null);
    setOpenHop(null);

    try {
      const result = await getTrajectoryByPlate(plate);

      // A miss is 200 with a null trajectory — "no vehicle carries
      // that plate" is a search result, not an error.
      if (!result.trajectory) {
        setVehicle(null);
        setMessage(
          result.alternate_matches.length > 0
            ? `No vehicle carries ${plate}. Closest: ${result.alternate_matches
                .map((a) => a.canonical_plate)
                .join(", ")}`
            : `No vehicle carries ${plate}.`
        );
        return;
      }

      setVehicle(
        toView(
          result.trajectory,
          result.match_type,
          result.alternate_matches
        )
      );

      setMessage(
        result.match_type && result.match_type !== "exact"
          ? `Matched ${result.matched_plate} by ${result.match_type} search.`
          : ""
      );
    } catch (cause) {
      setVehicle(null);
      setError(
        cause instanceof Error ? cause : new Error(String(cause))
      );
      setMessage(
        "Could not reach the backend. Check that it is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-runs whenever the URL names a different plate, so navigating
  // from an alert to a second vehicle actually reloads the journey.
  const urlPlate = params.get("plate");
  useEffect(() => {
    const plate = urlPlate ?? "CH01AB1234";
    setSearchValue(plate);
    runSearch(plate);
  }, [runSearch, urlPlate]);

  return (
    <AppShell
      connection={connectionState({ loading, error, stream: streamOpen })}
      connectionTitle={error ? error.message : undefined}
      actions={
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setParams({ plate: searchValue.trim().toUpperCase() });
          }}
          className="flex items-center gap-2"
        >
          <div className="flex items-center gap-2 rounded-full bg-surface-container px-4 py-2">
            <Icon
              name="search"
              size={16}
              className="text-on-surface-variant"
            />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search plate…"
              spellCheck={false}
              className="w-44 bg-transparent font-body text-data uppercase text-on-surface placeholder:text-on-surface-variant/60 placeholder:normal-case focus:outline-none"
            />
            {vehicle?.matchType && (
              <Chip>{vehicle.matchType} match</Chip>
            )}
          </div>
        </form>
      }
    >
      <MapWorkspace
        map={
          <CityMap
            showCameras
            showTrajectory
            showTraffic={false}
            vehicleId={vehicle?.vehicleId}
            focusedStop={focusedStop}
            onStopClick={setFocusedStop}
            onStreamChange={setStreamOpen}
          />
        }
        panel={
          <SidePanel width="w-[420px]">
            {vehicle ? (
              <>
                <header className="hairline-b px-6 pt-6 pb-5">
                  <div className="flex items-center gap-3">
                    <h1 className="font-body text-[24px] tracking-wider text-on-surface">
                      {vehicle.plate}
                    </h1>
                    <Chip className="bg-secondary-container text-on-secondary-container capitalize">
                      {vehicle.status}
                    </Chip>
                  </div>

                  <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1 font-body text-body-sm text-on-surface-variant">
                    <span>{vehicle.sightings} sightings</span>
                    <span>{distance(vehicle.totalDistanceM)}</span>
                    <span>{duration(vehicle.totalDurationS)}</span>
                    {vehicle.meanConfidence !== null && (
                      <span>
                        {percent(vehicle.meanConfidence)} mean confidence
                      </span>
                    )}
                  </div>

                  {message && (
                    <p className="mt-2 font-body text-[11px] text-primary">
                      {message}
                    </p>
                  )}
                </header>

                <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <Timeline
                    entries={vehicle.entries}
                    focusedStop={focusedStop}
                    openHop={openHop}
                    onStopClick={(sequence) =>
                      setFocusedStop((current) =>
                        current === sequence ? null : sequence
                      )
                    }
                    onHopToggle={(sequence) =>
                      setOpenHop((current) =>
                        current === sequence ? null : sequence
                      )
                    }
                  />
                </div>

                {vehicle.alternates.length > 0 && (
                  <div className="hairline-t px-6 py-4">
                    <Label>Other plates matched</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {vehicle.alternates.map((a) => (
                        <button
                          key={a.vehicle_id}
                          type="button"
                          onClick={() =>
                            setParams({
                              plate: a.canonical_plate ?? "",
                            })
                          }
                          className="rounded-full bg-surface-container px-3 py-1 font-body text-[12px] text-on-surface transition-colors hover:bg-secondary-container"
                        >
                          {a.canonical_plate}
                          <span className="ml-1.5 text-on-surface-variant">
                            {a.sighting_count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full flex-col justify-center px-6">
                <EmptyState
                  title={
                    error ? "Search failed" : loading ? "Searching…" : "No vehicle"
                  }
                  detail={
                    error
                      ? error.message
                      : message ||
                        "Search a plate to reconstruct its camera-to-camera journey."
                  }
                  tone={error ? "error" : "neutral"}
                />
              </div>
            )}
          </SidePanel>
        }
        overlays={
          <FloatingCard className="absolute right-6 bottom-6 z-20 w-64">
            <Label>Route confidence</Label>
            <div className="mt-3 flex flex-col gap-2.5">
              {(["certain", "inferred", "unobserved"] as const).map(
                (kind) => (
                  <div key={kind} className="flex items-center gap-3">
                    <svg width="34" height="8" className="shrink-0">
                      <line
                        x1="0"
                        y1="4"
                        x2="34"
                        y2="4"
                        stroke={LINK[kind].hex}
                        strokeWidth={LINK[kind].weight}
                        strokeOpacity={LINK[kind].opacity}
                        strokeDasharray={LINK[kind].dashArray}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="font-body text-[11px] text-on-surface-variant">
                      {LINK[kind].label}
                    </span>
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

// ---------------------------------------------------------------------

function Timeline({
  entries,
  focusedStop,
  openHop,
  onStopClick,
  onHopToggle,
}: {
  entries: Entry[];
  focusedStop: number | null;
  openHop: number | null;
  onStopClick: (sequence: number) => void;
  onHopToggle: (sequence: number) => void;
}) {
  return (
    <div className="relative">
      {/* The spine the numbered stops sit on. */}
      <div className="absolute top-3 bottom-3 left-[13px] w-px bg-hairline" />

      {entries.map((entry) =>
        entry.kind === "stop" ? (
          <StopRow
            key={`s${entry.sequence}`}
            stop={entry}
            focused={entry.sequence === focusedStop}
            onClick={() => onStopClick(entry.sequence)}
          />
        ) : (
          <HopRow
            key={`h${entry.sequence}`}
            hop={entry}
            open={entry.sequence === openHop}
            onToggle={() => onHopToggle(entry.sequence)}
          />
        )
      )}
    </div>
  );
}

function StopRow({
  stop,
  focused,
  onClick,
}: {
  stop: Stop;
  focused: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full gap-4 rounded-sm py-2 pr-2 text-left transition-colors ${
        focused ? "bg-secondary-container/40" : "hover:bg-surface-container/60"
      }`}
    >
      <span
        className={`z-10 mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2 border-white font-body text-[12px] font-semibold text-white ${
          focused ? "bg-primary" : "bg-primary-container"
        }`}
      >
        {stop.sequence}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-body text-[11px] tracking-wider text-on-surface-variant">
          {clockSeconds(stop.timestamp)}
        </span>
        <span className="mt-0.5 block font-display text-body-lg leading-snug text-on-surface">
          {stop.cameraName ?? stop.cameraId}
        </span>

        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {stop.plateRead ? (
            <>
              <Chip className="bg-surface-container font-body tracking-wider text-on-surface">
                {stop.plateRead}
              </Chip>
              <Chip>{percent(stop.plateConfidence)}</Chip>
            </>
          ) : (
            // A plate the camera could not read is stated, never
            // quietly filled in from the resolved identity.
            <Chip className="bg-error-container text-on-error-container">
              <Icon name="warning" size={12} />
              Plate unreadable
            </Chip>
          )}
        </span>
      </span>
    </button>
  );
}

function HopRow({
  hop,
  open,
  onToggle,
}: {
  hop: Hop;
  open: boolean;
  onToggle: () => void;
}) {
  const style = LINK[hop.link];
  const breakdown = hop.scoreBreakdown;

  return (
    <div className="relative py-1 pl-[42px]">
      <button
        type="button"
        onClick={onToggle}
        disabled={!breakdown}
        className="flex w-full items-center gap-2 py-1 text-left disabled:cursor-default"
      >
        <span className="font-body text-[11px] text-on-surface-variant">
          {duration(hop.durationS)} · {distance(hop.distanceM)}
        </span>

        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] font-body text-[11px] leading-none"
          style={{
            backgroundColor:
              hop.link === "unobserved" ? "#ffdad6" : "#d8e6a8",
            color: hop.link === "unobserved" ? "#93000a" : "#5b6836",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: style.hex }}
          />
          {hop.linkConfidence !== null
            ? `${percent(hop.linkConfidence)} match`
            : style.label}
        </span>

        {breakdown && (
          <Icon
            name={open ? "expand_less" : "expand_more"}
            size={16}
            className="ml-auto text-on-surface-variant"
          />
        )}
      </button>

      {/* Honest about what the map is showing before anyone clicks. */}
      {hop.detourSuspected && (
        <div className="mt-1 flex items-center gap-1 font-body text-[11px] text-error">
          <Icon name="alt_route" size={13} />
          Detour suspected — took far longer than this road normally does
        </div>
      )}
      {hop.skippedCameras.length > 0 && (
        <div className="mt-1 flex items-center gap-1 font-body text-[11px] text-warning">
          <Icon name="visibility_off" size={13} />
          Not seen by {hop.skippedCameras.join(", ")} on the way
        </div>
      )}

      {open && breakdown && <ScoreCard breakdown={breakdown} />}
    </div>
  );
}

/**
 * "Why this link was made" — the resolver's own arithmetic, shown
 * rather than summarised. Three signals are scored independently and
 * summed; the total has to clear the threshold and beat the runner-up.
 */
function ScoreCard({ breakdown }: { breakdown: ScoreBreakdown }) {
  const rows = [
    {
      label: "Plate match",
      value: breakdown.plate,
      note: breakdown.plate_rule ?? undefined,
    },
    {
      label: "Travel time",
      value: breakdown.travel_time,
      note:
        breakdown.elapsed_seconds != null &&
        breakdown.typical_seconds != null
          ? `${duration(breakdown.elapsed_seconds)} vs ${duration(
              breakdown.typical_seconds
            )} typical`
          : undefined,
    },
    {
      label: "Appearance",
      value: breakdown.appearance,
      note:
        breakdown.cosine_similarity != null
          ? `cosine ${breakdown.cosine_similarity.toFixed(2)}`
          : undefined,
    },
  ];

  // Bars are scaled against the largest contribution so a negative
  // appearance penalty still reads as a bar in the other direction.
  const scale = Math.max(
    ...rows.map((r) => Math.abs(r.value)),
    1
  );

  const cleared = breakdown.total >= LINK_THRESHOLD;

  return (
    <div className="mt-2 rounded-[16px] border border-hairline bg-surface-container-low p-4">
      <div className="font-display text-[14px] font-semibold text-on-surface">
        Why this link was made
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-body text-[11px] text-on-surface-variant">
                {row.label}
              </span>
              <span
                className={`font-body text-[12px] font-semibold ${
                  row.value < 0 ? "text-error" : "text-on-surface"
                }`}
              >
                {row.value >= 0 ? "+" : ""}
                {row.value.toFixed(1)}
              </span>
            </div>

            <div className="mt-1 h-[3px] w-full rounded-full bg-hairline">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (Math.abs(row.value) / scale) * 100)}%`,
                  backgroundColor:
                    row.value < 0 ? HEX.error : HEX.primary,
                }}
              />
            </div>

            {row.note && (
              <div className="mt-1 font-body text-[10px] text-on-surface-variant/80">
                {row.note}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hairline-t mt-3 flex items-baseline justify-between pt-3">
        <Label>Total score</Label>
        <span className="font-body text-[15px] font-semibold text-on-surface">
          {breakdown.total.toFixed(1)}
          <span
            className={`ml-2 font-body text-[11px] font-normal ${
              cleared ? "text-primary" : "text-error"
            }`}
          >
            {cleared ? "above" : "below"} threshold {LINK_THRESHOLD.toFixed(1)}
          </span>
        </span>
      </div>

      {/* A close runner-up is why the resolver might have been wrong,
          so it is shown rather than hidden. */}
      {breakdown.runner_up_total != null && (
        <div className="mt-1 text-right font-body text-[10px] text-on-surface-variant">
          next best candidate scored{" "}
          {breakdown.runner_up_total.toFixed(1)}
        </div>
      )}
    </div>
  );
}
