import { useEffect, useRef, useState } from "react";
import L, {
  GeoJSON,
  Map as LeafletMap,
  PathOptions,
} from "leaflet";

import "leaflet/dist/leaflet.css";

import {
  getCameras,
  getTrafficHeatmap,
  getVehicleTrajectory,
  type CameraCollection,
  type CameraFeature,
  type TrafficCollection,
  type TrafficFeature,
  type TrajectoryCollection,
  type TrajectoryFeature,
  type TrajectoryLineFeature,
  type TrajectoryPointFeature,
} from "../../services/mapApi";

import {
  connectLiveStream,
  type LiveEvent,
} from "../../services/liveStream";

import { getRoadRoute } from "../../services/routingService";

import {
  mockCameraGeoJson,
  mockTrajectoryGeoJson,
  mockTrafficGeoJson,
  DEMO_VEHICLE_ROUTES,
} from "../../data/mockBackendGeoJson";

import { CAMERA_BY_ID } from "../../data/cameras";

const DEFAULT_VEHICLE_ID = "V123";
const TRAFFIC_REFRESH_MS = 30_000;
const MIN_TRAFFIC_SAMPLE_COUNT = 10;

type CityMapProps = {
  showCamerasInitially?: boolean;
  showTrajectoryInitially?: boolean;
  showTrafficInitially?: boolean;
};

export default function CityMap({
  showCamerasInitially = true,
  showTrajectoryInitially = true,
  showTrafficInitially = true,
}: CityMapProps) {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<LeafletMap | null>(null);

  const cameraLayerRef =
    useRef<GeoJSON | null>(null);

  const trajectoryLayerRef =
    useRef<GeoJSON | null>(null);

  const trafficLayerRef =
    useRef<GeoJSON | null>(null);

  const [showCameras, setShowCameras] =
    useState(showCamerasInitially);

  const [
    showTrajectory,
    setShowTrajectory,
  ] = useState(
    showTrajectoryInitially
  );

  const [showTraffic, setShowTraffic] =
    useState(showTrafficInitially);

  const [
    streamStatus,
    setStreamStatus,
  ] = useState<
    | "connecting"
    | "connected"
    | "disconnected"
  >("connecting");

  const [dataMode, setDataMode] =
    useState<
      "backend" | "demo"
    >("demo");

  const [lastEvent, setLastEvent] =
    useState(
      "Waiting for live stream"
    );

  // Live vehicle simulation state
  const [liveLabel, setLiveLabel] =
    useState("");

  const liveMarkerRef =
    useRef<L.Marker | null>(null);

  // =====================================
  // INITIALIZE MAP
  // =====================================

  useEffect(() => {
    const container =
      mapContainerRef.current;

    if (!container) {
      return;
    }

    // Prevent duplicate Leaflet map
    // creation during React StrictMode.
    if (mapRef.current) {
      return;
    }

    let disposed = false;

    const map = L.map(
      container,
      {
        zoomControl: true,
        attributionControl: true,
      }
    ).setView(
      [28.63, 77.215],
      12
    );

    mapRef.current = map;

    // =====================================
    // BASEMAP
    // =====================================

    L.tileLayer(
      "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team',
        subdomains: "abc",
        maxZoom: 20,
      }
    ).addTo(map);

    // =====================================
    // CAMERA LAYER
    // =====================================

    function renderCameraLayer(
      collection: CameraCollection
    ) {
      if (
        disposed ||
        !mapRef.current
      ) {
        return;
      }

      cameraLayerRef.current?.remove();

      const layer = L.geoJSON(
        collection,
        {
          pointToLayer: (
            feature,
            latlng
          ) => {
            const camera =
              feature as CameraFeature;

            const color =
              getCameraHealthColor(
                camera.properties
                  .last_seen_at
              );

            const heading =
              camera.properties
                .heading;

            const icon =
              L.divIcon({
                className:
                  "camera-marker-wrapper",

                html: `
                  <div
                    style="
                      width: 28px;
                      height: 28px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      transform: rotate(${heading}deg);
                    "
                  >
                    <div
                      style="
                        width: 0;
                        height: 0;
                        border-left: 8px solid transparent;
                        border-right: 8px solid transparent;
                        border-bottom: 18px solid ${color};
                        filter: drop-shadow(
                          0 2px 4px rgba(0,0,0,.45)
                        );
                      "
                    ></div>
                  </div>
                `,

                iconSize: [28, 28],
                iconAnchor: [14, 14],
              });

            return L.marker(
              latlng,
              {
                icon,
              }
            );
          },

          onEachFeature: (
            feature,
            layer
          ) => {
            const camera =
              feature as CameraFeature;

            const health =
              getCameraHealthLabel(
                camera.properties
                  .last_seen_at
              );

            layer.bindPopup(`
              <div
                style="
                  min-width: 190px;
                  font-family: Arial, sans-serif;
                  line-height: 1.5;
                "
              >
                <strong style="font-size:14px;">
                  ${camera.properties.name}
                </strong>

                <br />

                Camera ID:
                ${camera.properties.camera_id}

                <br />

                Zone:
                ${camera.properties.zone}

                <br />

                Heading:
                ${camera.properties.heading}°

                <br />

                Health:
                <strong>
                  ${health}
                </strong>

                <br />

                Last seen:
                ${formatDateTime(
                  camera.properties
                    .last_seen_at
                )}
              </div>
            `);
          },
        }
      );

      cameraLayerRef.current =
        layer;

      if (
        showCamerasInitially &&
        !disposed
      ) {
        layer.addTo(map);
      }
    }

    // =====================================
    // TRAJECTORY LAYER
    // =====================================

    function renderTrajectoryLayer(
      collection: TrajectoryCollection
    ) {
      if (
        disposed ||
        !mapRef.current
      ) {
        return;
      }

      trajectoryLayerRef.current?.remove();

      const layer = L.geoJSON(
        collection,
        {
          style: (
            feature
          ): PathOptions => {
            const item =
              feature as TrajectoryFeature;

            if (
              item.geometry.type !==
              "LineString"
            ) {
              return {};
            }

            return getTrajectoryStyle(
              item as TrajectoryLineFeature
            );
          },

          pointToLayer: (
            feature,
            latlng
          ) => {
            const point =
              feature as TrajectoryPointFeature;

            return L.circleMarker(
              latlng,
              {
                radius: 6,
                color: "#ffffff",
                weight: 2,
                fillColor:
                  "#2563eb",
                fillOpacity: 1,
              }
            );
          },

          onEachFeature: (
            feature,
            layer
          ) => {
            const item =
              feature as TrajectoryFeature;

            if (
              item.geometry.type ===
              "Point"
            ) {
              const point =
                item as TrajectoryPointFeature;

              layer.bindPopup(`
                <div
                  style="
                    font-family: Arial, sans-serif;
                    min-width: 175px;
                    line-height: 1.5;
                  "
                >
                  <strong>
                    Vehicle sighting
                  </strong>

                  <br />

                  Camera:
                  ${point.properties.camera_id}

                  <br />

                  Time:
                  ${formatDateTime(
                    point.properties.timestamp
                  )}

                  ${
                    point.properties
                      .confidence !==
                    undefined
                      ? `
                        <br />

                        Confidence:
                        ${Math.round(
                          point.properties
                            .confidence *
                            100
                        )}%
                      `
                      : ""
                  }
                </div>
              `);
            } else {
              const line =
                item as TrajectoryLineFeature;

              layer.bindPopup(`
                <div
                  style="
                    font-family: Arial, sans-serif;
                    min-width: 200px;
                    line-height: 1.5;
                  "
                >
                  <strong>
                    Route hop
                  </strong>

                  <br />

                  Link confidence:
                  ${Math.round(
                    line.properties
                      .link_confidence *
                      100
                  )}%

                  <br />

                  Skipped cameras:
                  ${
                    line.properties
                      .skipped_cameras
                      .length > 0
                      ? line.properties
                          .skipped_cameras
                          .join(", ")
                      : "None"
                  }

                  <br />

                  Detour suspected:
                  ${
                    line.properties
                      .detour_suspected
                      ? "Yes"
                      : "No"
                  }
                </div>
              `);
            }
          },
        }
      );

      trajectoryLayerRef.current =
        layer;

      if (
        showTrajectoryInitially &&
        !disposed
      ) {
        layer.addTo(map);
      }
    }

    // =====================================
    // TRAFFIC LAYER
    // =====================================

    function renderTrafficLayer(
      collection: TrafficCollection
    ) {
      if (
        disposed ||
        !mapRef.current
      ) {
        return;
      }

      trafficLayerRef.current?.remove();

      const layer = L.geoJSON(
        collection,
        {
          style: (
            feature
          ): PathOptions => {
            return getTrafficStyle(
              feature as TrafficFeature
            );
          },

          onEachFeature: (
            feature,
            layer
          ) => {
            const traffic =
              feature as TrafficFeature;

            layer.bindPopup(`
              <div
                style="
                  font-family: Arial, sans-serif;
                  min-width: 195px;
                  line-height: 1.5;
                "
              >
                <strong>
                  ${
                    traffic.properties
                      .road_name ||
                    "Road segment"
                  }
                </strong>

                <br />

                Congestion:
                ${
                  traffic.properties
                    .congestion_band
                }

                <br />

                Normalized:
                ${traffic.properties.normalized.toFixed(
                  2
                )}

                <br />

                Weight:
                ${traffic.properties.weight}

                <br />

                Samples:
                ${
                  traffic.properties
                    .sample_count
                }
              </div>
            `);
          },
        }
      );

      trafficLayerRef.current =
        layer;

      if (
        showTrafficInitially &&
        !disposed
      ) {
        layer.addTo(map);
      }
    }

    // =====================================
    // LOAD CAMERAS
    // =====================================

    async function loadCameras() {
      try {
        const cameras =
          await getCameras();

        if (disposed) {
          return;
        }

        renderCameraLayer(
          cameras
        );

        setDataMode(
          "backend"
        );
      } catch {
        if (disposed) {
          return;
        }

        renderCameraLayer(
          mockCameraGeoJson
        );

        setDataMode(
          "demo"
        );
      }
    }

    // =====================================
    // ROAD-SNAP TRAJECTORY
    // Replace every hop LineString's straight
    // coordinates with OSRM road geometry.
    // Falls back silently per-feature on error.
    // =====================================

    async function snapToRoads(
      collection: TrajectoryCollection
    ): Promise<TrajectoryCollection> {
      const snapped = await Promise.all(
        collection.features.map(async (feature) => {
          // Only process LineString hops
          if (feature.geometry.type !== "LineString") {
            return feature;
          }

          const coords =
            feature.geometry.coordinates as [
              number,
              number,
            ][];

          const from = coords[0] as [
            number,
            number,
          ];
          const to = coords[
            coords.length - 1
          ] as [number, number];

          try {
            const roadCoords =
              await getRoadRoute(from, to);

            return {
              ...feature,
              geometry: {
                ...feature.geometry,
                coordinates: roadCoords,
              },
            };
          } catch {
            // OSRM unavailable — keep straight line
            return feature;
          }
        })
      );

      return {
        ...collection,
        features:
          snapped as TrajectoryFeature[],
      };
    }

    // =====================================
    // LOAD TRAJECTORY
    // =====================================

    async function loadTrajectory() {
      let raw: TrajectoryCollection;

      try {
        raw = await getVehicleTrajectory(
          DEFAULT_VEHICLE_ID
        );
        setDataMode("backend");
      } catch {
        raw = mockTrajectoryGeoJson;
        setDataMode("demo");
      }

      if (disposed) return;

      // Snap hops to real roads
      const roadSnapped =
        await snapToRoads(raw);

      if (disposed) return;

      renderTrajectoryLayer(roadSnapped);
    }

    // =====================================
    // LOAD TRAFFIC
    // =====================================

    async function loadTraffic() {
      try {
        const now =
          new Date();

        const fifteenMinutesAgo =
          new Date(
            now.getTime() -
              15 *
                60 *
                1000
          );

        const traffic =
          await getTrafficHeatmap(
            fifteenMinutesAgo.toISOString(),
            now.toISOString()
          );

        if (disposed) {
          return;
        }

        renderTrafficLayer(
          traffic
        );
      } catch {
        if (disposed) {
          return;
        }

        renderTrafficLayer(
          mockTrafficGeoJson
        );
      }
    }

    // =====================================
    // INITIAL DATA LOAD
    // =====================================

    loadCameras();
    loadTrajectory();
    loadTraffic();

    // =====================================
    // TRAFFIC POLLING
    // =====================================

    const trafficTimer =
      window.setInterval(
        () => {
          if (!disposed) {
            loadTraffic();
          }
        },
        TRAFFIC_REFRESH_MS
      );

    // =====================================
    // LIVE SSE
    // =====================================

    const stream =
      connectLiveStream(
        (event) => {
          if (disposed) {
            return;
          }

          handleLiveEvent(
            event
          );

          setLastEvent(
            event.event
          );
        },

        () => {
          if (!disposed) {
            setStreamStatus(
              "connected"
            );
          }
        },

        () => {
          if (!disposed) {
            setStreamStatus(
              "disconnected"
            );
          }
        }
      );

    function handleLiveEvent(
      event: LiveEvent
    ) {
      if (
        event.event ===
        "new_sighting"
      ) {
        loadTrajectory();
      }

      if (
        event.event ===
        "new_alert"
      ) {
        console.log(
          "New alert:",
          event.data
        );
      }
    }

    // =====================================
    // MAP RESIZE
    // =====================================

    // =====================================
    // DEMO LIVE SIMULATION
    // Cycles a pulsing vehicle marker through
    // each vehicle's camera waypoints so the
    // map feels alive when there is no backend.
    // =====================================

    // Inject pulse keyframe CSS once
    if (!document.getElementById("ci-pulse-style")) {
      const styleEl = document.createElement("style");
      styleEl.id = "ci-pulse-style";
      styleEl.textContent = `
        @keyframes ci-pulse {
          0%   { transform: scale(1);   opacity: 1; }
          50%  { transform: scale(1.9); opacity: 0.35; }
          100% { transform: scale(1);   opacity: 1; }
        }
        .ci-pulse-ring {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(34,197,94,0.85);
          border: 2.5px solid #fff;
          box-shadow: 0 0 8px rgba(34,197,94,.6);
          animation: ci-pulse 1.5s ease-in-out infinite;
        }
      `;
      document.head.appendChild(styleEl);
    }

    const pulsingIcon = L.divIcon({
      className: "",
      html: `<div class="ci-pulse-ring"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    // Flatten all routes into one sequence:
    // each entry: { vehicleId, cameraId, latlng }
    const sequence = DEMO_VEHICLE_ROUTES.flatMap((route) =>
      route.cameraIds.map((camId, idx) => ({
        vehicleId: route.vehicleId,
        cameraId:  camId,
        latlng:    [
          route.waypoints[idx][1], // lat
          route.waypoints[idx][0], // lng
        ] as [number, number],
        cameraName: CAMERA_BY_ID[camId]?.name ?? camId,
      }))
    );

    let seqIndex = 0;

    function advanceLiveMarker() {
      if (disposed || !mapRef.current) return;

      const step = sequence[seqIndex];
      seqIndex = (seqIndex + 1) % sequence.length;

      if (liveMarkerRef.current) {
        liveMarkerRef.current.setLatLng(step.latlng);
      } else {
        liveMarkerRef.current = L.marker(
          step.latlng,
          { icon: pulsingIcon, zIndexOffset: 2000 }
        ).addTo(map);
      }

      setLiveLabel(
        `${step.vehicleId} · ${step.cameraName}`
      );
    }

    // Start immediately then every 6 s
    advanceLiveMarker();
    const liveTimer = window.setInterval(
      advanceLiveMarker,
      6_000
    );

    const resizeTimer =
      window.setTimeout(
        () => {
          if (
            !disposed &&
            mapRef.current
          ) {
            map.invalidateSize();
          }
        },
        250
      );

    // =====================================
    // CLEANUP
    // =====================================

    return () => {
      disposed = true;

      window.clearInterval(
        trafficTimer
      );

      window.clearTimeout(
        resizeTimer
      );

      stream.close();

      window.clearInterval(liveTimer);

      liveMarkerRef.current?.remove();
      liveMarkerRef.current = null;

      cameraLayerRef.current?.remove();
      trajectoryLayerRef.current?.remove();
      trafficLayerRef.current?.remove();

      cameraLayerRef.current =
        null;

      trajectoryLayerRef.current =
        null;

      trafficLayerRef.current =
        null;

      try {
        map.remove();
      } catch {
        // Prevent Leaflet cleanup
        // errors during fast navigation.
      }

      mapRef.current =
        null;

      /*
       * Leaflet stores an internal ID
       * on the DOM element.
       *
       * React may reuse the same DOM
       * node during route navigation.
       * Clearing it prevents:
       *
       * "Map container is already initialized"
       */

      const leafletContainer =
        container as HTMLDivElement & {
          _leaflet_id?: number;
        };

      delete leafletContainer._leaflet_id;

      container.innerHTML =
        "";
    };

    /*
     * IMPORTANT:
     *
     * This effect intentionally runs
     * once per CityMap mount.
     *
     * Layer visibility is handled by
     * the separate effects below.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================
  // CAMERA TOGGLE
  // =====================================

  useEffect(() => {
    const map =
      mapRef.current;

    const layer =
      cameraLayerRef.current;

    if (!map || !layer) {
      return;
    }

    if (showCameras) {
      if (
        !map.hasLayer(layer)
      ) {
        layer.addTo(map);
      }
    } else if (
      map.hasLayer(layer)
    ) {
      map.removeLayer(layer);
    }
  }, [showCameras]);

  // =====================================
  // TRAJECTORY TOGGLE
  // =====================================

  useEffect(() => {
    const map =
      mapRef.current;

    const layer =
      trajectoryLayerRef.current;

    if (!map || !layer) {
      return;
    }

    if (showTrajectory) {
      if (
        !map.hasLayer(layer)
      ) {
        layer.addTo(map);
      }
    } else if (
      map.hasLayer(layer)
    ) {
      map.removeLayer(layer);
    }
  }, [showTrajectory]);

  // =====================================
  // TRAFFIC TOGGLE
  // =====================================

  useEffect(() => {
    const map =
      mapRef.current;

    const layer =
      trafficLayerRef.current;

    if (!map || !layer) {
      return;
    }

    if (showTraffic) {
      if (
        !map.hasLayer(layer)
      ) {
        layer.addTo(map);
      }
    } else if (
      map.hasLayer(layer)
    ) {
      map.removeLayer(layer);
    }
  }, [showTraffic]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "420px",
        position: "relative",
        overflow: "hidden",
        background: "#e5e7eb",
      }}
    >
      {/* MAP */}

      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "420px",
        }}
      />

      {/* STATUS CARD */}

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1000,
          background:
            "rgba(8,17,31,.94)",
          color: "white",
          padding: "14px 16px",
          borderRadius: "12px",
          minWidth: "230px",
          border:
            "1px solid rgba(255,255,255,.08)",
          boxShadow:
            "0 10px 30px rgba(0,0,0,.22)",
          backdropFilter:
            "blur(8px)",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            color: "#94a3b8",
            textTransform:
              "uppercase",
            letterSpacing:
              "1.2px",
          }}
        >
          Map Status
        </div>

        <div
          style={{
            marginTop: "5px",
            fontSize: "17px",
            fontWeight: 700,
          }}
        >
          Live Operations
        </div>

        <div
          style={{
            marginTop: "9px",
            fontSize: "11px",
            color: "#cbd5e1",
          }}
        >
          Data:{" "}
          <strong>
            {dataMode ===
            "backend"
              ? "Backend"
              : "Demo GeoJSON"}
          </strong>
        </div>

        <div
          style={{
            marginTop: "8px",
            display: "flex",
            alignItems:
              "center",
            gap: "7px",
            fontSize: "11px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius:
                "50%",
              display:
                "inline-block",
              background:
                streamStatus ===
                "connected"
                  ? "#22c55e"
                  : streamStatus ===
                    "disconnected"
                  ? "#ef4444"
                  : "#f59e0b",
            }}
          />

          {streamStatus ===
          "connected"
            ? "Live stream connected"
            : streamStatus ===
              "disconnected"
            ? "Live stream offline"
            : "Connecting to stream"}
        </div>

        <div
          style={{
            marginTop: "7px",
            fontSize: "10px",
            color: "#64748b",
          }}
        >
          Last event:{" "}
          <strong
            style={{
              color: "#cbd5e1",
            }}
          >
            {lastEvent}
          </strong>
        </div>

        {liveLabel && (
          <div
            style={{
              marginTop: "7px",
              fontSize: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#4ade80",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#22c55e",
                flexShrink: 0,
              }}
            />
            {liveLabel}
          </div>
        )}
      </div>

      {/* LAYER CONTROLS */}

      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 1000,
          display: "flex",
          gap: "6px",
          background:
            "rgba(8,17,31,.94)",
          padding: "7px",
          borderRadius: "11px",
          border:
            "1px solid rgba(255,255,255,.08)",
          backdropFilter:
            "blur(8px)",
        }}
      >
        <LayerButton
          active={showCameras}
          label="Cameras"
          onClick={() =>
            setShowCameras(
              (value) =>
                !value
            )
          }
        />

        <LayerButton
          active={
            showTrajectory
          }
          label="Trajectory"
          onClick={() =>
            setShowTrajectory(
              (value) =>
                !value
            )
          }
        />

        <LayerButton
          active={showTraffic}
          label="Traffic"
          onClick={() =>
            setShowTraffic(
              (value) =>
                !value
            )
          }
        />
      </div>

      {/* LEGEND */}

      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          zIndex: 1000,
          background:
            "rgba(8,17,31,.94)",
          color: "white",
          padding: "12px 14px",
          borderRadius: "11px",
          fontSize: "11px",
          border:
            "1px solid rgba(255,255,255,.08)",
          boxShadow:
            "0 10px 30px rgba(0,0,0,.2)",
          backdropFilter:
            "blur(8px)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: "9px",
          }}
        >
          Legend
        </div>

        {showTraffic && (
          <>
            <LegendLine
              color="#22c55e"
              label="Normal"
            />

            <LegendLine
              color="#eab308"
              label="Moderate"
            />

            <LegendLine
              color="#f97316"
              label="Heavy"
            />

            <LegendLine
              color="#ef4444"
              label="Severe"
            />

            <LegendLine
              color="#94a3b8"
              label="Low samples"
            />
          </>
        )}

        {showTraffic &&
          showTrajectory && (
            <div
              style={{
                margin:
                  "8px 0",
                borderTop:
                  "1px solid rgba(255,255,255,.12)",
              }}
            />
          )}

        {showTrajectory && (
          <>
            <LegendLine
              color="#2563eb"
              label="Trajectory"
            />

            <LegendLine
              color="#f59e0b"
              label="Detour"
            />
          </>
        )}

        {!showTraffic &&
          !showTrajectory && (
            <div
              style={{
                color: "#64748b",
                fontSize: "10px",
              }}
            >
              Camera layer only
            </div>
          )}
      </div>
    </div>
  );
}

// =====================================
// CAMERA HEALTH
// =====================================

function getCameraHealthColor(
  lastSeenAt: string
) {
  const lastSeen =
    new Date(
      lastSeenAt
    ).getTime();

  const minutesSinceSeen =
    (Date.now() -
      lastSeen) /
    1000 /
    60;

  if (
    minutesSinceSeen <= 5
  ) {
    return "#22c55e";
  }

  if (
    minutesSinceSeen <= 15
  ) {
    return "#f59e0b";
  }

  return "#94a3b8";
}

function getCameraHealthLabel(
  lastSeenAt: string
) {
  const lastSeen =
    new Date(
      lastSeenAt
    ).getTime();

  const minutesSinceSeen =
    (Date.now() -
      lastSeen) /
    1000 /
    60;

  if (
    minutesSinceSeen <= 5
  ) {
    return "Online";
  }

  if (
    minutesSinceSeen <= 15
  ) {
    return "Delayed";
  }

  return "Offline / Silent";
}

// =====================================
// TRAJECTORY STYLE
// =====================================

function getTrajectoryStyle(
  feature: TrajectoryLineFeature
): PathOptions {
  const {
    link_confidence,
    skipped_cameras,
    detour_suspected,
  } = feature.properties;

  const color =
    detour_suspected
      ? "#f59e0b"
      : "#2563eb";

  const opacity =
    link_confidence < 0.5
      ? 0.35
      : link_confidence <
          0.75
      ? 0.65
      : 1;

  return {
    color,
    weight: 5,
    opacity,
    dashArray:
      skipped_cameras.length >
      0
        ? "8 8"
        : undefined,
  };
}

// =====================================
// TRAFFIC STYLE
// =====================================

function getTrafficStyle(
  feature: TrafficFeature
): PathOptions {
  const {
    congestion_band,
    sample_count,
    weight,
  } = feature.properties;

  if (
    sample_count <
    MIN_TRAFFIC_SAMPLE_COUNT
  ) {
    return {
      color: "#94a3b8",
      weight: 4,
      opacity: 0.55,
    };
  }

  let color =
    "#22c55e";

  if (
    congestion_band ===
    "moderate"
  ) {
    color =
      "#eab308";
  }

  if (
    congestion_band ===
    "heavy"
  ) {
    color =
      "#f97316";
  }

  if (
    congestion_band ===
    "severe"
  ) {
    color =
      "#ef4444";
  }

  const lineWidth =
    Math.max(
      3,
      Math.min(
        10,
        3 + weight / 25
      )
    );

  return {
    color,
    weight: lineWidth,
    opacity: 0.85,
  };
}

// =====================================
// DATE FORMAT
// =====================================

function formatDateTime(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}

// =====================================
// LAYER BUTTON
// =====================================

function LayerButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        cursor: "pointer",
        padding: "8px 11px",
        borderRadius: "7px",
        background: active
          ? "#2563eb"
          : "#1e293b",
        color: "white",
        fontSize: "11px",
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}

// =====================================
// LEGEND
// =====================================

function LegendLine({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "6px",
      }}
    >
      <div
        style={{
          width: "24px",
          borderTop: `4px solid ${color}`,
        }}
      />

      <span>{label}</span>
    </div>
  );
}