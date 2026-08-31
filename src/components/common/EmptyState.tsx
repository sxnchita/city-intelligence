// =====================================
// EMPTY STATE
//
// What a panel shows when the backend
// answered but had nothing to say, or
// did not answer at all. Both are real
// answers and neither is an excuse to
// draw invented data.
// =====================================

export default function EmptyState({
  title,
  detail,
  tone = "neutral",
}: {
  title: string;
  detail?: string;
  tone?: "neutral" | "error";
}) {
  const color =
    tone === "error" ? "#ef4444" : "#64748b";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "28px 18px",
        textAlign: "center",
        color: "#94a3b8",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 650,
          color,
        }}
      >
        {title}
      </div>

      {detail && (
        <div
          style={{
            fontSize: "11px",
            lineHeight: 1.5,
            maxWidth: "340px",
            color: "#64748b",
          }}
        >
          {detail}
        </div>
      )}
    </div>
  );
}

/**
 * The one sentence every page repeats when the
 * database is up but empty. Kept here so the
 * instruction is worded identically everywhere.
 */
export const NO_DATA_HINT =
  "No data in this window. Use Demo Control on the dashboard to backfill history and start live traffic.";

export const OFFLINE_HINT =
  "Could not reach the backend on /api. Check that it is running on port 8000 and that this page is served through the dev server on :5173.";
