// =====================================================================
// CONNECTION BADGE
//
// Whether what is on the wall is reaching the backend. There is no
// "demo" state: the backend is the only source of data, so the only
// question is whether it answered.
// =====================================================================

export type ConnectionState =
  | "loading"
  | "live"
  | "connected"
  | "offline";

const PRESENTATION: Record<
  ConnectionState,
  { label: string; className: string; dot: string }
> = {
  loading: {
    label: "Loading",
    className: "text-on-surface-variant",
    dot: "bg-outline-variant",
  },
  live: {
    label: "Live",
    className: "text-primary",
    dot: "bg-primary animate-pulse",
  },
  connected: {
    label: "Connected",
    className: "text-on-surface-variant",
    dot: "bg-primary-container",
  },
  offline: {
    label: "Backend offline",
    className: "text-error",
    dot: "bg-error",
  },
};

/**
 * @param stream true when an SSE feed is open, which is the difference
 *               between "connected" and genuinely "live"
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
  if (error) return "offline";
  if (loading) return "loading";
  return stream ? "live" : "connected";
}

export default function ConnectionBadge({
  state,
  title,
}: {
  state: ConnectionState;
  title?: string;
}) {
  const { label, className, dot } = PRESENTATION[state];

  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full ghost-border px-3 py-1.5 font-body text-label-caps uppercase whitespace-nowrap ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
