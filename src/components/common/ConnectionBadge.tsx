// =====================================
// CONNECTION BADGE
//
// Always visible on every screen so it is
// never ambiguous whether what is on the
// wall is reaching the backend. There is
// no "demo" state any more — the backend
// is the only source of data, so the only
// question is whether it answered.
// =====================================

export type ConnectionState =
  | "loading"
  | "live"
  | "connected"
  | "offline";

const PRESENTATION: Record<
  ConnectionState,
  { color: string; label: string }
> = {
  loading: {
    color: "#94a3b8",
    label: "Loading",
  },
  live: { color: "#22c55e", label: "Live" },
  connected: {
    color: "#38bdf8",
    label: "Connected",
  },
  offline: {
    color: "#ef4444",
    label: "Backend offline",
  },
};

/**
 * @param error   the last fetch error, if any
 * @param loading true while the first load is in flight
 * @param stream  true when an SSE feed is open, which is
 *                the difference between "connected" and
 *                genuinely "live"
 */
export function connectionState({
  loading = false,
  error = null,
  stream = false,
}: {
  loading?: boolean;
  error?: Error | null;
  stream?: boolean;
}): ConnectionState {
  if (error) {
    return "offline";
  }

  if (loading) {
    return "loading";
  }

  return stream ? "live" : "connected";
}

export default function ConnectionBadge({
  state,
  title,
}: {
  state: ConnectionState;
  title?: string;
}) {
  const { color, label } =
    PRESENTATION[state];

  return (
    <div
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 9px",
        borderRadius: "999px",
        background: "rgba(255,255,255,.04)",
        border: `1px solid ${color}33`,
        color,
        fontSize: "10px",
        fontWeight: 650,
        letterSpacing: ".4px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />

      {label}
    </div>
  );
}
