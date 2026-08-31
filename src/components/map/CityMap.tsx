import { useEffect, useRef, useState } from "react";
import L, {
  GeoJSON,
  Map as LeafletMap,
} from "leaflet";

import type { PathOptions } from "leaflet";

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

import { connectLiveStream } from "../../services/liveStream";

const TRAFFIC_REFRESH_MS = 30_000;

// How long a live sighting pulse stays on the map.
// Long enough to notice at a glance, short enough
// that a busy corridor does not turn into a solid
// blob of markers.
const SIGHTING_PULSE_MS = 6_000;

// Alert pins outlive sighting pulses: an alert is
// the thing a viewer is meant to walk over and
// look at.
const ALERT_PIN_MS = 60_000;

type CityMapProps = {
  showCamerasInitially?: boolean;
  showTrajectoryInitially?: boolean;
  showTrafficInitially?: boolean;

  /**
   * Which vehicle's journey to draw. Vehicle ids
   * are numeric on the backend. Omitted means the
   * trajectory layer is simply not drawn -- there
   * is no honest journey to show without one.
   */
  vehicleId?: number;

  /**
   * Window for the traffic heatmap, as ISO
   * instants. Omitting both is the live path: the
   * backend defaults to the last 15 minutes.
   */
  from?: string;
  to?: string;
};

export default function CityMap({
  showCamerasInitially = true,
  showTrajectoryInitially = true,
  showTrafficInitially = true,
  vehicleId,
  from,
  to,
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

  // The last error from any of the three loaders.
  // There is no bundled fallback: if the backend
  // is not answering the map says so rather than
  // drawing another city's geometry.
  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [lastEvent, setLastEvent] =
    useState(
      "Waiting for live stream"
    );

  // Which camera set the backend is serving —
  // shown so the map never has to name a city.
  const [cameraSet, setCameraSet] =
    useState("");

  const [cameraCount, setCameraCount] =
    useState(0);

  // Where each camera is, keyed by camera_id, so a
  // streamed sighting can be pinned without a
  // second call. Filled by loadCameras.
  const cameraPositionsRef = useRef<
    Map<string, [number, number]>
  >(new Map());

  // Transient live markers, so cleanup can remove
  // whatever is still on screen at unmount.
  const liveMarkersRef = useRef<Set<L.Layer>>(
    new Set()
  );

  // The init effect runs once, but the page can
  // change its range afterwards. Refs let the
  // polling loop read the current window without
  // tearing the whole map down and rebuilding it.
  const fromRef = useRef(from);
  fromRef.current = from;

  const toRef = useRef(to);
  toRef.current = to;

  // Filled by the init effect. Lets a range change
  // redraw the heatmap without tearing down the
  // Leaflet map and losing the viewer's pan/zoom.
  const reloadTrafficRef = useRef<
    (() => void) | null
  >(null);

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

    // Captured once so the cleanup below is not
    // reading a ref that may have moved on.
    const liveMarkers = liveMarkersRef.current;

    const map = L.map(
      container,
      {
        zoomControl: true,
        attributionControl: true,
      }
    ).setView(
      // Replaced by frameMap() from the camera
      // response — never hardcode a city.
      [20.59, 78.96],
      5
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

      // Cameras with no coordinates come back as
      // features with null geometry; Leaflet has
      // nothing to place for those.
      const placeable = {
        type: "FeatureCollection" as const,
        features: collection.features.filter(
          (feature) => feature.geometry !== null
        ),
      };

      const layer = L.geoJSON(
        placeable as never,
        {
          pointToLayer: (
            feature,
            latlng
          ) => {
            const camera =
              feature as unknown as CameraFeature;

            const color =
              getCameraHealthColor(
                camera.properties
                  .last_event_at,
                camera.properties.is_active
              );

            const heading =
              camera.properties
                .heading_degrees;

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
              feature as unknown as CameraFeature;

            const health =
              getCameraHealthLabel(
                camera.properties
                  .last_event_at,
                camera.properties.is_active
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
                ${camera.properties.heading_degrees}°

                <br />

                Health:
                <strong>
                  ${health}
                </strong>

                <br />

                Last seen:
                ${formatDateTime(
                  camera.properties
                    .last_event_at
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
              feature as unknown as TrajectoryFeature;

            if (
              item.properties.kind !== "hop"
            ) {
              return {};
            }

            return getTrajectoryStyle(
              item as TrajectoryLineFeature
            );
          },

          pointToLayer: (
            _feature,
            latlng
          ) => {
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
              feature as unknown as TrajectoryFeature;

            if (
              item.properties.kind ===
              "sighting"
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
                  ${
                    point.properties
                      .camera_name ??
                    point.properties.camera_id
                  }

                  <br />

                  Plate read:
                  ${
                    point.properties
                      .plate_read ??
                    "unreadable"
                  }

                  <br />

                  Time:
                  ${formatDateTime(
                    point.properties.timestamp
                  )}

                  ${
                    point.properties
                      .plate_confidence !==
                    null
                      ? `
                        <br />

                        Plate confidence:
                        ${Math.round(
                          (point.properties
                            .plate_confidence ??
                            0) * 100
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
                  ${
                    line.properties
                      .link_confidence !== null
                      ? `${Math.round(
                          (line.properties
                            .link_confidence ??
                            0) * 100
                        )}%`
                      : "unknown"
                  }

                  <br />

                  Travel time:
                  ${formatSeconds(
                    line.properties.duration_s
                  )}
                  ${
                    line.properties.typical_s !==
                    null
                      ? ` (typical ${formatSeconds(
                          line.properties.typical_s
                        )})`
                      : ""
                  }

                  <br />

                  Distance:
                  ${
                    line.properties.distance_m !==
                    null
                      ? `${(
                          (line.properties
                            .distance_m ?? 0) /
                          1000
                        ).toFixed(2)} km`
                      : "unknown"
                  }

                  <br />

                  Path:
                  ${
                    line.properties
                      .geometry_source === "road"
                      ? "road geometry"
                      : "straight line (no road data)"
                  }

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
                      .detour_suspected === null
                      ? "Unknown"
                      : line.properties
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
                      .from_camera_id
                  }
                  &rarr;
                  ${
                    traffic.properties
                      .to_camera_id
                  }
                </strong>

                <br />

                Congestion:
                ${
                  traffic.properties
                    .congestion_band ??
                  "too few samples"
                }
                ${
                  traffic.properties
                    .congestion_ratio !== null
                    ? ` (${traffic.properties.congestion_ratio.toFixed(
                        2
                      )}&times; free flow)`
                    : ""
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
    //
    // The response carries the map's own
    // framing, so the view follows whichever
    // city the backend is configured for.
    // =====================================

    function frameMap(
      collection: CameraCollection
    ) {
      const { bbox, center, suggested_zoom } =
        collection;

      if (bbox.length === 4) {
        map.fitBounds(
          [
            [bbox[1], bbox[0]],
            [bbox[3], bbox[2]],
          ],
          { padding: [40, 40] }
        );

        return;
      }

      if (center.length === 2) {
        map.setView(
          [center[1], center[0]],
          suggested_zoom
        );
      }
    }

    // =====================================
    // LOAD CAMERAS
    //
    // The camera response carries the map's
    // own framing, so this is also what
    // decides which city the map opens on.
    // Nothing here is hardcoded.
    // =====================================

    async function loadCameras() {
      try {
        const cameras =
          await getCameras();

        if (disposed) {
          return;
        }

        renderCameraLayer(cameras);
        frameMap(cameras);

        // Keep every camera's position so a
        // streamed sighting, which carries only a
        // camera_id, can be pinned without a
        // follow-up call.
        const positions = new Map<
          string,
          [number, number]
        >();

        for (const feature of cameras.features) {
          if (feature.geometry === null) {
            continue;
          }

          const [lon, lat] =
            feature.geometry.coordinates;

          positions.set(
            feature.properties.camera_id,
            [lat, lon]
          );
        }

        cameraPositionsRef.current = positions;

        setCameraSet(cameras.camera_set);
        setCameraCount(
          cameras.features.length
        );
        setLoadError(null);
      } catch (error) {
        if (disposed) {
          return;
        }

        // No fallback collection. Drawing another
        // city's cameras here would be a lie that
        // survives all the way to a demo.
        setLoadError(
          error instanceof Error
            ? error.message
            : String(error)
        );
      }
    }

    // =====================================
    // LOAD TRAJECTORY
    //
    // Without a vehicle to follow there is no
    // honest trajectory to draw, so the layer
    // stays empty rather than inventing one.
    //
    // The backend already returns road geometry
    // and labels it geometry_source: "road", so
    // there is nothing to snap here either.
    // =====================================

    async function loadTrajectory() {
      if (vehicleId === undefined) {
        return;
      }

      try {
        const response =
          await getVehicleTrajectory(
            vehicleId
          );

        if (disposed) {
          return;
        }

        renderTrajectoryLayer(
          response.geojson
        );
        setLoadError(null);
      } catch (error) {
        if (disposed) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : String(error)
        );
      }
    }

    // =====================================
    // LOAD TRAFFIC
    //
    // from/to come from the page. Passing
    // neither is the live path: the backend
    // defaults to the last 15 minutes, which
    // is exactly what live mode means.
    // =====================================

    async function loadTraffic() {
      try {
        const traffic =
          await getTrafficHeatmap(
            fromRef.current,
            toRef.current
          );

        if (disposed) {
          return;
        }

        renderTrafficLayer(traffic);
        setLoadError(null);
      } catch (error) {
        if (disposed) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : String(error)
        );
      }
    }

    // =====================================
    // INITIAL DATA LOAD
    //
    // Cameras first and awaited, because the
    // sighting pulses below need the position
    // lookup it builds.
    // =====================================

    loadCameras().then(() => {
      if (!disposed) {
        loadTrajectory();
        loadTraffic();
      }
    });

    reloadTrafficRef.current = loadTraffic;

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
    // LIVE MARKERS
    //
    // The pulse CSS is injected once per
    // document rather than per map, so two
    // mounted maps share one style element.
    // =====================================

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
        .ci-alert-ring {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(239,68,68,0.85);
          border: 2.5px solid #fff;
          box-shadow: 0 0 12px rgba(239,68,68,.7);
          animation: ci-pulse 1.1s ease-in-out infinite;
        }
      `;
      document.head.appendChild(styleEl);
    }

    const sightingIcon = L.divIcon({
      className: "",
      html: `<div class="ci-pulse-ring"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    const alertIcon = L.divIcon({
      className: "",
      html: `<div class="ci-alert-ring"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    /**
     * Drops a marker that removes itself. Every
     * marker is also tracked so unmount can clear
     * whatever is still pulsing.
     */
    function dropTransientMarker(
      position: [number, number],
      icon: L.DivIcon,
      popup: string | null,
      lifetimeMs: number
    ) {
      if (disposed || !mapRef.current) {
        return;
      }

      const marker = L.marker(position, {
        icon,
        zIndexOffset: 2000,
      });

      if (popup) {
        marker.bindPopup(popup);
      }

      marker.addTo(mapRef.current);
      liveMarkersRef.current.add(marker);

      window.setTimeout(() => {
        liveMarkersRef.current.delete(marker);
        marker.remove();
      }, lifetimeMs);
    }

    // =====================================
    // LIVE SSE
    //
    // Events are named on the wire, so they
    // arrive through addEventListener rather
    // than onmessage. Only events newer than
    // the backend's 60 s live window are ever
    // sent, so a backfill never floods this.
    // =====================================

    const stream = connectLiveStream({
      onOpen: () => {
        if (!disposed) {
          setStreamStatus("connected");
        }
      },

      onError: () => {
        if (!disposed) {
          setStreamStatus("disconnected");
        }
      },

      onSighting: (data) => {
        if (disposed) {
          return;
        }

        setLastEvent(
          `sighting · ${data.camera_id}${
            data.plate ? ` · ${data.plate}` : ""
          }`
        );

        const position =
          cameraPositionsRef.current.get(
            data.camera_id
          );

        if (position) {
          dropTransientMarker(
            position,
            sightingIcon,
            `<strong>${
              data.plate ?? "plate unreadable"
            }</strong><br/>vehicle ${
              data.vehicle_id
            }<br/>${data.camera_id}`,
            SIGHTING_PULSE_MS
          );
        }

        // Only redraw when the vehicle on screen
        // is the one that was just seen.
        if (
          vehicleId !== undefined &&
          data.vehicle_id === vehicleId
        ) {
          loadTrajectory();
        }
      },

      onAlert: (data) => {
        if (disposed) {
          return;
        }

        setLastEvent(
          `alert · ${data.alert_type}`
        );

        // The alert payload carries its own
        // position, so an alert pins the map even
        // for a camera the lookup does not know.
        const position: [number, number] | null =
          data.lat !== null && data.lon !== null
            ? [data.lat, data.lon]
            : cameraPositionsRef.current.get(
                data.camera_id ?? ""
              ) ?? null;

        if (position) {
          dropTransientMarker(
            position,
            alertIcon,
            `<strong>${data.alert_type}</strong> (${
              data.severity
            })<br/>${data.message}<br/>${
              data.camera_name ??
              data.camera_id ??
              ""
            }`,
            ALERT_PIN_MS
          );
        }
      },
    });

    // =====================================
    // MAP RESIZE
    // =====================================

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

      liveMarkers.forEach((marker) =>
        marker.remove()
      );
      liveMarkers.clear();

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
  // TRAFFIC WINDOW
  //
  // The page owns the range; the map just
  // refetches when it moves. The init effect has
  // already done the first load, so this only
  // fires on an actual change.
  // =====================================

  const trafficWindowSettled = useRef(false);

  useEffect(() => {
    if (!trafficWindowSettled.current) {
      trafficWindowSettled.current = true;
      return;
    }

    reloadTrafficRef.current?.();
  }, [from, to]);

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
          {loadError ? (
            <strong
              style={{ color: "#ef4444" }}
            >
              Backend unreachable
            </strong>
          ) : (
            <>
              <strong>
                {cameraSet || "Loading"}
              </strong>

              {cameraCount > 0 && (
                <span
                  style={{
                    color: "#64748b",
                  }}
                >
                  {" · "}
                  {cameraCount} cameras
                </span>
              )}
            </>
          )}
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

        {loadError && (
          <div
            style={{
              marginTop: "7px",
              fontSize: "10px",
              lineHeight: 1.45,
              color: "#f87171",
            }}
          >
            {loadError}
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
              label="Free flowing"
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
              label="Too few samples to band"
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

function minutesSince(
  timestamp: string | null
): number | null {
  if (!timestamp) {
    return null;
  }

  const seen = new Date(timestamp).getTime();

  if (Number.isNaN(seen)) {
    return null;
  }

  return (Date.now() - seen) / 1000 / 60;
}

function getCameraHealthColor(
  lastEventAt: string | null,
  isActive = true
) {
  if (!isActive) {
    return "#475569";
  }

  const since = minutesSince(lastEventAt);

  if (since === null) {
    return "#94a3b8";
  }

  if (since <= 5) {
    return "#22c55e";
  }

  if (since <= 15) {
    return "#f59e0b";
  }

  return "#94a3b8";
}

function getCameraHealthLabel(
  lastEventAt: string | null,
  isActive = true
) {
  if (!isActive) {
    return "Deactivated";
  }

  const since = minutesSince(lastEventAt);

  if (since === null) {
    return "Never reported";
  }

  if (since <= 5) {
    return "Online";
  }

  if (since <= 15) {
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

  const color = detour_suspected
    ? "#f59e0b"
    : "#2563eb";

  // An unknown confidence is drawn faintly rather
  // than confidently: the link exists, but the
  // resolver could not score it.
  const confidence = link_confidence ?? 0;

  const opacity =
    link_confidence === null
      ? 0.3
      : confidence < 0.5
      ? 0.35
      : confidence < 0.75
      ? 0.65
      : 1;

  return {
    color,
    weight: 5,
    opacity,
    dashArray:
      skipped_cameras.length > 0
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
  const { congestion_band, weight } =
    feature.properties;

  // A null band is the backend saying this edge was
  // traversed fewer than analytics.min-samples times
  // and it will not claim a congestion level for it.
  // Grey is the honest colour for that; inventing a
  // second, disagreeing threshold here is not.
  if (congestion_band === null) {
    return {
      color: "#94a3b8",
      weight: 4,
      opacity: 0.55,
    };
  }

  const color =
    congestion_band === "moderate"
      ? "#eab308"
      : congestion_band === "heavy"
      ? "#f97316"
      : congestion_band === "severe"
      ? "#ef4444"
      : "#22c55e";

  const lineWidth = Math.max(
    3,
    Math.min(10, 3 + weight / 25)
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
  value: string | null
) {
  if (!value) {
    return "never";
  }

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

function formatSeconds(
  seconds: number | null
) {
  if (seconds === null) {
    return "unknown";
  }

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);

  return rest === 0
    ? `${minutes}m`
    : `${minutes}m ${rest}s`;
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