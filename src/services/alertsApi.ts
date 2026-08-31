import { getJson } from "./http";

// =====================================
// ALERTS
// GET /api/alerts
// =====================================

export type AlertType =
  | "blacklist_match"
  | "impossible_speed"
  | "restricted_zone_entry"
  | "plate_appearance_mismatch";

/** The backend's ladder is low/medium/high — there is no "critical". */
export type Severity =
  | "low"
  | "medium"
  | "high";

export type AlertSummary = {
  alert_id: number;
  alert_type: AlertType;
  severity: Severity;

  vehicle_id: number | null;
  related_vehicle_id: number | null;

  plate: string | null;
  observation_id: number | null;

  camera_id: string | null;
  camera_name: string | null;
  zone: string | null;

  lat: number | null;
  lon: number | null;

  occurred_at: string;
  created_at: string;

  /** Repeats inside the suppression window collapse into this count. */
  repeat_count: number;

  message: string;
  metadata: Record<string, unknown> | null;
};

export type AlertStats = {
  from: string;
  to: string;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  total: number;
};

export type AlertFilters = {
  type?: AlertType;
  severity?: Severity;
  from?: string;
  to?: string;
  vehicle_id?: number;
  limit?: number;
  offset?: number;
};

/** Human labels — the API has no `title` field. */
export const ALERT_TYPE_LABEL: Record<
  AlertType,
  string
> = {
  blacklist_match:
    "Blacklist Vehicle Detected",
  impossible_speed: "Impossible Speed",
  restricted_zone_entry:
    "Restricted Zone Entry",
  plate_appearance_mismatch:
    "Plate / Appearance Mismatch",
};

export function alertTypeLabel(
  type: string
): string {
  return (
    ALERT_TYPE_LABEL[type as AlertType] ??
    type.replace(/_/g, " ")
  );
}

/** Returns a bare array, newest first. */
export function getAlerts(
  filters: AlertFilters = {},
  signal?: AbortSignal
): Promise<AlertSummary[]> {
  return getJson<AlertSummary[]>(
    "/api/alerts",
    { ...filters },
    signal
  );
}

export function getAlertStats(
  from?: string,
  to?: string,
  signal?: AbortSignal
): Promise<AlertStats> {
  return getJson<AlertStats>(
    "/api/alerts/stats",
    { from, to },
    signal
  );
}

export function getAlert(
  alertId: number,
  signal?: AbortSignal
): Promise<unknown> {
  return getJson<unknown>(
    `/api/alerts/${alertId}`,
    undefined,
    signal
  );
}
