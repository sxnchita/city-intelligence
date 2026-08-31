import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  backfill,
  getSimStatus,
  rebuildIdentity,
  startSim,
  stopSim,
  type SimStatus,
} from "../../services/simApi";

// =====================================
// DEMO CONTROL
//
// The database starts empty, so without
// this the only way to get anything on
// screen is three curls in another
// terminal. Backfill generates history,
// rebuild resolves identities in time
// order (required — the simulator posts
// from eight threads at once), and start
// opens the live tap.
//
// Renders only when /api/sim/status
// answers. A production build has no sim
// beans and 404s, and buttons that
// cannot work should not be offered.
// =====================================

const BACKFILL_HOURS = 2;

// Spreads slowdowns unevenly across corridors so
// the congestion map has a range of bands to show
// rather than one uniform shift.
const CONGESTION_FACTOR = 2.6;

const VEHICLES_PER_MINUTE = 30;

const STATUS_POLL_MS = 5000;

type Step =
  | "idle"
  | "backfill"
  | "rebuild"
  | "toggle";

export default function DemoControl() {
  const [available, setAvailable] =
    useState(false);

  const [status, setStatus] =
    useState<SimStatus | null>(null);

  const [busy, setBusy] =
    useState<Step>("idle");

  const [message, setMessage] =
    useState("");

  const [open, setOpen] = useState(true);

  // A backfill or rebuild takes tens of seconds;
  // the status poll must not fight with it, and
  // an unmount must not set state afterwards.
  const disposedRef = useRef(false);

  useEffect(() => {
    disposedRef.current = false;

    return () => {
      disposedRef.current = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await getSimStatus();

      if (disposedRef.current) {
        return;
      }

      setStatus(next);
      setAvailable(true);
    } catch {
      if (!disposedRef.current) {
        setAvailable(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();

    const timer = window.setInterval(
      refresh,
      STATUS_POLL_MS
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [refresh]);

  const run = useCallback(
    async (
      step: Step,
      action: () => Promise<string>
    ) => {
      setBusy(step);
      setMessage("");

      try {
        const result = await action();

        if (!disposedRef.current) {
          setMessage(result);
        }
      } catch (error) {
        if (!disposedRef.current) {
          setMessage(
            error instanceof Error
              ? error.message
              : String(error)
          );
        }
      } finally {
        if (!disposedRef.current) {
          setBusy("idle");
          refresh();
        }
      }
    },
    [refresh]
  );

  if (!available) {
    return null;
  }

  const running = status?.running ?? false;
  const working = busy !== "idle";

  return (
    <section
      style={{
        background: "#091828",
        border:
          "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
        padding: "14px 16px",
        marginBottom: "16px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() =>
            setOpen((v) => !v)
          }
          style={{
            background: "none",
            border: "none",
            color: "#e2e8f0",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: ".4px",
            textTransform: "uppercase",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {open ? "▾" : "▸"} Demo
          control
        </button>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "10px",
            fontWeight: 650,
            letterSpacing: ".4px",
            textTransform: "uppercase",
            color: running
              ? "#22c55e"
              : "#64748b",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: running
                ? "#22c55e"
                : "#64748b",
            }}
          />
          {running
            ? "Traffic running"
            : "Traffic stopped"}
        </span>

        {status && (
          <span
            style={{
              fontSize: "11px",
              color: "#64748b",
              marginLeft: "auto",
            }}
          >
            {status.vehicles_spawned.toLocaleString()}{" "}
            vehicles &middot;{" "}
            {status.events_sent.toLocaleString()}{" "}
            events sent
            {status.events_rejected > 0 &&
              ` · ${status.events_rejected.toLocaleString()} rejected`}
          </span>
        )}
      </header>

      {open && (
        <>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginTop: "12px",
            }}
          >
            <DemoButton
              disabled={working}
              busy={busy === "backfill"}
              label={`1 · Backfill ${BACKFILL_HOURS} h`}
              busyLabel="Generating history…"
              onClick={() =>
                run("backfill", async () => {
                  const result =
                    await backfill({
                      hours: BACKFILL_HOURS,
                      congestionFactor:
                        CONGESTION_FACTOR,
                    });

                  return `Backfilled ${result.vehicles} vehicles, ${result.events_sent} events in ${(
                    result.elapsed_ms / 1000
                  ).toFixed(1)} s. Now rebuild identities.`;
                })
              }
            />

            <DemoButton
              disabled={working}
              busy={busy === "rebuild"}
              label="2 · Rebuild identities"
              busyLabel="Resolving…"
              onClick={() =>
                run("rebuild", async () => {
                  const result =
                    await rebuildIdentity();

                  return `Resolved ${result.observations_processed} observations into ${result.vehicles_created} vehicles (${result.links_made} links) in ${(
                    result.elapsed_ms / 1000
                  ).toFixed(1)} s. Analytics recomputed.`;
                })
              }
            />

            <DemoButton
              disabled={working}
              busy={busy === "toggle"}
              label={
                running
                  ? "3 · Stop live traffic"
                  : "3 · Start live traffic"
              }
              busyLabel="Working…"
              tone={running ? "stop" : "go"}
              onClick={() =>
                run("toggle", async () => {
                  if (running) {
                    await stopSim();
                    return "Live traffic stopped.";
                  }

                  await startSim({
                    vehiclesPerMinute:
                      VEHICLES_PER_MINUTE,
                    durationMinutes: 0,
                  });

                  return `Live traffic running at ${VEHICLES_PER_MINUTE} vehicles/min. Sightings appear on the map within seconds.`;
                })
              }
            />
          </div>

          <p
            style={{
              margin: "10px 0 0",
              fontSize: "11px",
              lineHeight: 1.5,
              color: message
                ? "#94a3b8"
                : "#64748b",
            }}
          >
            {message ||
              "Run 1 then 2 to fill the dashboard with history, then 3 for a live feed. Backfill and rebuild block for a few seconds each."}
          </p>
        </>
      )}
    </section>
  );
}

function DemoButton({
  label,
  busyLabel,
  busy,
  disabled,
  onClick,
  tone = "go",
}: {
  label: string;
  busyLabel: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  tone?: "go" | "stop";
}) {
  const accent =
    tone === "stop" ? "#f59e0b" : "#38bdf8";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,.04)",
        border: `1px solid ${accent}44`,
        borderRadius: "8px",
        color: disabled ? "#475569" : accent,
        fontSize: "11px",
        fontWeight: 650,
        padding: "8px 12px",
        cursor: disabled
          ? "not-allowed"
          : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {busy ? busyLabel : label}
    </button>
  );
}
