import { API_BASE } from "./http";
import type { AlertType, Severity } from "./alertsApi";

// =====================================
// LIVE EVENT TYPES
// GET /api/stream  (Server-Sent Events)
//
// The backend sends NAMED events via
// SseEmitter.event().name(...), so these
// arrive through addEventListener and
// never through onmessage.
// =====================================

export type SightingEventData = {
  camera_id: string;
  vehicle_id: number;
  plate: string | null;
  timestamp: string;
  is_new_vehicle: boolean;
  link_confidence: number | null;
};

/**
 * Narrower than the AlertSummary rows served by
 * GET /api/alerts — no zone, plate, created_at,
 * observation_id or repeat_count.
 */
export type AlertEventData = {
  alert_id: number;
  alert_type: AlertType;
  severity: Severity;

  vehicle_id: number | null;
  related_vehicle_id: number | null;

  camera_id: string | null;
  camera_name: string | null;

  lat: number | null;
  lon: number | null;

  occurred_at: string;
  message: string;
  metadata: Record<string, unknown> | null;
};

export type LiveEvent =
  | { event: "sighting"; data: SightingEventData }
  | { event: "alert"; data: AlertEventData };

export type StreamStatus =
  | "connecting"
  | "connected"
  | "disconnected";

export type LiveStreamHandlers = {
  onSighting?: (
    data: SightingEventData
  ) => void;

  onAlert?: (data: AlertEventData) => void;

  /** Fires for either kind, after the specific handler. */
  onAny?: (event: LiveEvent) => void;

  onOpen?: () => void;
  onError?: (error: Event) => void;
};

// =====================================
// CONNECT
// =====================================

export function connectLiveStream(
  handlers: LiveStreamHandlers
): EventSource {
  const source = new EventSource(
    `${API_BASE}/api/stream`
  );

  source.onopen = () => {
    handlers.onOpen?.();
  };

  source.onerror = (error) => {
    // EventSource reconnects on its own; the
    // backend also refuses connections past
    // stream.max-emitters (50) with a 503.
    handlers.onError?.(error);
  };

  source.addEventListener(
    "sighting",
    (message) => {
      const data =
        parse<SightingEventData>(message);

      if (!data) {
        return;
      }

      handlers.onSighting?.(data);
      handlers.onAny?.({
        event: "sighting",
        data,
      });
    }
  );

  source.addEventListener(
    "alert",
    (message) => {
      const data =
        parse<AlertEventData>(message);

      if (!data) {
        return;
      }

      handlers.onAlert?.(data);
      handlers.onAny?.({
        event: "alert",
        data,
      });
    }
  );

  return source;
}

function parse<T>(
  message: MessageEvent
): T | null {
  try {
    return JSON.parse(message.data) as T;
  } catch (error) {
    console.error(
      "Invalid SSE payload:",
      error
    );

    return null;
  }
}
