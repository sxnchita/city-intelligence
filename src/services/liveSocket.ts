const WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL ||
  "ws://localhost:8000";

export type LiveEventType =
  | "vehicle_observation"
  | "trajectory_updated"
  | "traffic_update"
  | "new_alert"
  | "camera_status";

export type LiveEvent = {
  event: LiveEventType;
  timestamp: string;
  data: unknown;
};

export function connectLiveSocket(
  onMessage: (event: LiveEvent) => void,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (error: Event) => void
) {
  const socket = new WebSocket(
    `${WS_BASE_URL}/ws/live`
  );

  socket.onopen = () => {
    console.log("WebSocket connected");

    onOpen?.();
  };

  socket.onmessage = (message) => {
    try {
      const parsed: LiveEvent =
        JSON.parse(message.data);

      onMessage(parsed);
    } catch (error) {
      console.error(
        "Invalid WebSocket message:",
        error
      );
    }
  };

  socket.onerror = (error) => {
    console.error(
      "WebSocket error:",
      error
    );

    onError?.(error);
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");

    onClose?.();
  };

  return socket;
}