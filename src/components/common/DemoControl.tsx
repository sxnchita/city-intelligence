import { useCallback, useEffect, useRef, useState } from "react";

import { Button, Icon, Label, Rule } from "../../design/ui";
import {
  backfill,
  getSimStatus,
  rebuildIdentity,
  startSim,
  stopSim,
  type SimStatus,
} from "../../services/simApi";

// =====================================================================
// DEMO CONTROL
//
// The database starts empty, so without this the only way to get
// anything on screen is three curls in another terminal. Backfill
// generates history, rebuild resolves identities in time order
// (required — the simulator posts from eight threads at once), and
// start opens the live tap.
//
// Renders only when /api/sim/status answers. A production build has no
// simulator beans and 404s, and buttons that cannot work should not be
// offered.
// =====================================================================

const BACKFILL_HOURS = 2;

/** Spreads slowdowns unevenly, so the map shows a range of bands. */
const CONGESTION_FACTOR = 2.6;

const VEHICLES_PER_MINUTE = 30;

const STATUS_POLL_MS = 5000;

type Step = "idle" | "backfill" | "rebuild" | "toggle";

export default function DemoControl() {
  const [available, setAvailable] = useState(false);
  const [status, setStatus] = useState<SimStatus | null>(null);
  const [busy, setBusy] = useState<Step>("idle");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const disposed = useRef(false);
  useEffect(() => {
    disposed.current = false;
    return () => {
      disposed.current = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await getSimStatus();
      if (disposed.current) return;
      setStatus(next);
      setAvailable(true);
    } catch {
      if (!disposed.current) setAvailable(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, STATUS_POLL_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const run = useCallback(
    async (step: Step, action: () => Promise<string>) => {
      setBusy(step);
      setMessage("");
      try {
        const result = await action();
        if (!disposed.current) setMessage(result);
      } catch (error) {
        if (!disposed.current) {
          setMessage(
            error instanceof Error ? error.message : String(error)
          );
        }
      } finally {
        if (!disposed.current) {
          setBusy("idle");
          refresh();
        }
      }
    },
    [refresh]
  );

  if (!available) return null;

  const running = status?.running ?? false;
  const working = busy !== "idle";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full ghost-border px-3 py-1.5 font-body text-label-caps uppercase text-on-surface-variant transition-colors hover:text-primary"
        title="Seed and drive the demo"
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            running ? "animate-pulse bg-primary" : "bg-outline-variant"
          }`}
        />
        Demo
      </button>

      {open && (
        <>
          {/* Click-away, behind the panel. */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="glass-panel ambient-shadow absolute right-0 z-50 mt-2 w-[340px] rounded-[16px] border border-hairline p-5">
            <div className="flex items-center justify-between">
              <Label>Demo control</Label>
              <span
                className={`font-body text-label-caps uppercase ${
                  running ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {running ? "Traffic running" : "Stopped"}
              </span>
            </div>

            {status && (
              <div className="mt-2 font-body text-[11px] text-on-surface-variant">
                {status.vehicles_spawned.toLocaleString()} vehicles ·{" "}
                {status.events_sent.toLocaleString()} events sent
                {status.events_rejected > 0 &&
                  ` · ${status.events_rejected.toLocaleString()} rejected`}
              </div>
            )}

            <Rule className="my-4" />

            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                disabled={working}
                className="w-full justify-start"
                onClick={() =>
                  run("backfill", async () => {
                    const result = await backfill({
                      hours: BACKFILL_HOURS,
                      congestionFactor: CONGESTION_FACTOR,
                    });
                    return `Backfilled ${result.vehicles} vehicles, ${
                      result.events_sent
                    } events in ${(result.elapsed_ms / 1000).toFixed(
                      1
                    )}s. Now rebuild identities.`;
                  })
                }
              >
                <Icon name="history" size={15} />
                {busy === "backfill"
                  ? "Generating history…"
                  : `1 · Backfill ${BACKFILL_HOURS}h`}
              </Button>

              <Button
                variant="ghost"
                disabled={working}
                className="w-full justify-start"
                onClick={() =>
                  run("rebuild", async () => {
                    const result = await rebuildIdentity();
                    return `Resolved ${
                      result.observations_processed
                    } observations into ${
                      result.vehicles_created
                    } vehicles (${result.links_made} links) in ${(
                      result.elapsed_ms / 1000
                    ).toFixed(1)}s.`;
                  })
                }
              >
                <Icon name="hub" size={15} />
                {busy === "rebuild"
                  ? "Resolving…"
                  : "2 · Rebuild identities"}
              </Button>

              <Button
                variant={running ? "ghost" : "primary"}
                disabled={working}
                className="w-full justify-start"
                onClick={() =>
                  run("toggle", async () => {
                    if (running) {
                      await stopSim();
                      return "Live traffic stopped.";
                    }
                    await startSim({
                      vehiclesPerMinute: VEHICLES_PER_MINUTE,
                      durationMinutes: 0,
                    });
                    return `Live traffic running at ${VEHICLES_PER_MINUTE} vehicles/min.`;
                  })
                }
              >
                <Icon
                  name={running ? "stop_circle" : "play_circle"}
                  size={15}
                />
                {busy === "toggle"
                  ? "Working…"
                  : running
                    ? "3 · Stop live traffic"
                    : "3 · Start live traffic"}
              </Button>
            </div>

            <p className="mt-3 font-body text-[11px] leading-relaxed text-on-surface-variant">
              {message ||
                "Run 1 then 2 to fill the dashboard with history, then 3 for a live feed. Backfill and rebuild block for a few seconds each."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
