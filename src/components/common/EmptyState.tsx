// =====================================================================
// EMPTY STATE
//
// What a panel shows when the backend answered but had nothing to say,
// or did not answer at all. Both are real answers and neither is an
// excuse to draw invented data.
// =====================================================================

export default function EmptyState({
  title,
  detail,
  tone = "neutral",
}: {
  title: string;
  detail?: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-8 text-center">
      <div
        className={`font-body text-[12px] font-semibold ${
          tone === "error" ? "text-error" : "text-on-surface-variant"
        }`}
      >
        {title}
      </div>

      {detail && (
        <p className="max-w-[340px] font-body text-[11px] leading-relaxed text-on-surface-variant/80">
          {detail}
        </p>
      )}
    </div>
  );
}

/** The one sentence every page repeats when the database is empty. */
export const NO_DATA_HINT =
  "No data in this window. Use Demo Control to backfill history and start live traffic.";

export const OFFLINE_HINT =
  "Could not reach the backend on /api. Check that it is running on port 8000 and that this page is served through the dev server on :5173.";
