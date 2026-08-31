const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "";

// =====================================
// LIVE EVENT TYPES
// =====================================

export type LiveSightingEvent = {
  event: "new_sighting";

  data: {
    vehicle_id: string;
    camera_id: string;

    timestamp: string;

    latitude: number;
    longitude: number;

    confidence?: number;
  };
};

export type LiveAlertEvent = {
  event: "new_alert";

  data: {
    alert_id: string;

    type: string;

    severity:
      | "low"
      | "medium"
      | "high"
      | "critical";

    message: string;

    timestamp: string;

    vehicle_id?: string;

    camera_id?: string;
  };
};

export type LiveEvent =
  | LiveSightingEvent
  | LiveAlertEvent;

// =====================================
// SSE CONNECTION
// GET /api/v1/stream
// =====================================

export function connectLiveStream(
  onEvent: (event: LiveEvent) => void,

  onOpen?: () => void,

  onError?: (error: Event) => void
) {
  const eventSource =
    new EventSource(
      `${API_BASE_URL}/api/stream`
    );

  // =====================================
  // CONNECTION OPENED
  // =====================================

  eventSource.onopen = () => {
    console.log(
      "SSE stream connected"
    );

    onOpen?.();
  };

  // =====================================
  // GENERIC MESSAGE
  // =====================================

  eventSource.onmessage = (
    message
  ) => {
    try {
      const parsed =
        JSON.parse(
          message.data
        ) as LiveEvent;

      onEvent(parsed);
    } catch (error) {
      console.error(
        "Invalid SSE message:",
        error
      );
    }
  };

  // =====================================
  // ERROR / DISCONNECT
  // =====================================

  eventSource.onerror = (
    error
  ) => {
    console.error(
      "SSE connection error:",
      error
    );

    onError?.(
      error
    );
  };

  return eventSource;
}