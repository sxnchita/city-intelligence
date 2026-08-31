import { useEffect, useRef, useState } from "react";
import L, { GeoJSON, Map as LeafletMap } from "leaflet";
import type { PathOptions } from "leaflet";

import "leaflet/dist/leaflet.css";

import {
  getCameras,
  getTrafficHeatmap,
  getVehicleTrajectory,
  type CameraCollection,
  type CameraFeature,
  type TrafficFeature,
  type TrajectoryCollection,
  type TrajectoryHopProperties,
  type TrajectorySightingProperties,
} from "../../services/mapApi";

import { connectLiveStream } from "../../services/liveStream";

import {
  HEX,
  LINK,
  agoLabel,
  band,
  cameraStatus,
  clockSeconds,
  distance,
  duration,
  linkKind,
  percent,
} from "../../design/tokens";

// =====================================================================
// CITY MAP
//
// A real GIS base, per spec 6.1 — the hand-drawn map from the design
// is an illustration and is used only on the landing screen. The
// palette is reached instead by warming real tiles with a CSS filter
// (see .leaflet-tile-pane in index.css) over a sand ground, which is
// the same treatment the Stitch markup applies to its own map image.
//
// Every layer here is backend data. Nothing is drawn that was not
// returned by an endpoint.
// =====================================================================

const TRAFFIC_REFRESH_MS = 30_000;

/** How long a live sighting pulse stays on the map. */
const SIGHTING_PULSE_MS = 6_000;

/** Alerts outlive sightings: an alert is meant to be walked over to. */
const ALERT_PIN_MS = 60_000;

// Standard OSM tiles: no API key, and a fix as well as a restyle —
// the previous host (openstreetmap.fr/hot) stopped responding
// entirely, and CARTO's basemaps now serve an "API KEY REQUIRED"
// watermark to unkeyed callers.
//
// Override for a keyed provider in production, where OSM's tile usage
// policy does not cover the traffic:
//   VITE_TILE_URL=https://{s}.example/{z}/{x}/{y}.png
const TILE_URL =
  import.meta.env.VITE_TILE_URL ??
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const TILE_ATTRIBUTION =
  import.meta.env.VITE_TILE_ATTRIBUTION ??
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export type CityMapProps = {
  showCameras?: boolean;
  showTrajectory?: boolean;
  showTraffic?: boolean;

  /**
   * Which vehicle's journey to draw. Omitted means the trajectory
   * layer is not drawn at all — there is no honest journey without one.
   */
  vehicleId?: number;

  /** Heatmap window. Omitting both is live: the backend defaults to 15 min. */
  from?: string;
  to?: string;

  /**
   * Sequence number of the focused sighting. Drives the two-way
   * highlight the spec asks for: the timeline sets this, and the map
   * pans to and enlarges the matching stop.
   */
  focusedStop?: number | null;
  onStopClick?: (sequence: number) => void;

  onCameraClick?: (cameraId: string) => void;
  onError?: (message: string | null) => void;
  onStreamChange?: (open: boolean) => void;
  onLastEvent?: (label: string) => void;
};

export default function CityMap({
  showCameras = true,
  showTrajectory = true,
  showTraffic = true,
  vehicleId,
  from,
  to,
  focusedStop = null,
  onStopClick,
  onCameraClick,
  onError,
  onStreamChange,
  onLastEvent,
}: CityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  const cameraLayerRef = useRef<GeoJSON | null>(null);
  const trajectoryLayerRef = useRef<GeoJSON | null>(null);
  const trafficLayerRef = useRef<GeoJSON | null>(null);
  const stopLayerRef = useRef<L.LayerGroup | null>(null);

  const [cameraSet, setCameraSet] = useState("");

  // Camera positions, so a streamed sighting — which carries only a
  // camera_id — can be pinned without a follow-up call.
  const positionsRef = useRef<Map<string, [number, number]>>(new Map());

  // Stop markers by sequence number, for the timeline<->map highlight.
  const stopMarkersRef = useRef<Map<number, L.Marker>>(new Map());

  const liveMarkersRef = useRef<Set<L.Layer>>(new Set());

  // Props the long-lived loaders read. Refs rather than deps, so
  // changing a window does not tear the Leaflet map down.
  const fromRef = useRef(from);
  fromRef.current = from;
  const toRef = useRef(to);
  toRef.current = to;
  const vehicleIdRef = useRef(vehicleId);
  vehicleIdRef.current = vehicleId;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onStreamChangeRef = useRef(onStreamChange);
  onStreamChangeRef.current = onStreamChange;
  const onLastEventRef = useRef(onLastEvent);
  onLastEventRef.current = onLastEvent;
  const onCameraClickRef = useRef(onCameraClick);
  onCameraClickRef.current = onCameraClick;
  const onStopClickRef = useRef(onStopClick);
  onStopClickRef.current = onStopClick;

  const reloadTrafficRef = useRef<(() => void) | null>(null);
  const reloadTrajectoryRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let disposed = false;
    const liveMarkers = liveMarkersRef.current;
    const stopMarkers = stopMarkersRef.current;

    const map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
      // Replaced by frameMap() from the camera response — the map
      // never hardcodes a city.
    }).setView([20.59, 78.96], 5);

    mapRef.current = map;

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    const fail = (error: unknown) => {
      if (disposed) return;
      onErrorRef.current?.(
        error instanceof Error ? error.message : String(error)
      );
    };

    // -----------------------------------------------------------------
    // CAMERAS
    // -----------------------------------------------------------------

    function cameraMarkerIcon(status: ReturnType<typeof cameraStatus>) {
      const fill =
        status === "healthy"
          ? HEX.primary
          : status === "degraded"
            ? HEX.warning
            : HEX.error;

      // A solid circle with a thin white inner ring and a line-art
      // glyph — the marker spec from the design system.
      return L.divIcon({
        className: "",
        html: `
          <div style="
            width:26px;height:26px;border-radius:50%;
            background:${fill};
            border:2px solid ${HEX.white};
            box-shadow:0 2px 8px rgba(44,51,32,.28);
            display:flex;align-items:center;justify-content:center;
            color:${HEX.white};
          ">
            <span class="material-symbols-outlined" style="font-size:14px;">
              videocam
            </span>
          </div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
    }

    function renderCameras(collection: CameraCollection) {
      if (disposed || !mapRef.current) return;
      cameraLayerRef.current?.remove();

      const placeable = {
        type: "FeatureCollection" as const,
        features: collection.features.filter((f) => f.geometry !== null),
      };

      const layer = L.geoJSON(placeable as never, {
        pointToLayer: (feature, latlng) => {
          const camera = feature as unknown as CameraFeature;
          const minutes = minutesSince(camera.properties.last_event_at);
          return L.marker(latlng, {
            icon: cameraMarkerIcon(cameraStatus(minutes)),
          });
        },
        onEachFeature: (feature, layer) => {
          const camera = feature as unknown as CameraFeature;
          const p = camera.properties;
          const status = cameraStatus(minutesSince(p.last_event_at));

          layer.bindPopup(popup(`
            <div style="font-weight:600;font-size:15px;font-family:'Playfair Display',serif;">
              ${p.name}
            </div>
            ${row("Camera", p.camera_id)}
            ${row("Zone", p.zone)}
            ${row("Heading", `${p.heading_degrees}&deg;`)}
            ${row("Status", status)}
            ${row("Last seen", agoLabel(p.last_event_at))}
          `));

          layer.on("click", () =>
            onCameraClickRef.current?.(p.camera_id)
          );
        },
      });

      cameraLayerRef.current = layer;
      if (showCameras) layer.addTo(map);
    }

    function frameMap(collection: CameraCollection) {
      const { bbox, center, suggested_zoom } = collection;
      if (bbox.length === 4) {
        map.fitBounds(
          [
            [bbox[1], bbox[0]],
            [bbox[3], bbox[2]],
          ],
          { padding: [60, 60] }
        );
      } else if (center.length === 2) {
        map.setView([center[1], center[0]], suggested_zoom);
      }
    }

    async function loadCameras() {
      try {
        const cameras = await getCameras();
        if (disposed) return;

        renderCameras(cameras);
        frameMap(cameras);

        const positions = new Map<string, [number, number]>();
        for (const feature of cameras.features) {
          if (!feature.geometry) continue;
          const [lon, lat] = feature.geometry.coordinates;
          positions.set(feature.properties.camera_id, [lat, lon]);
        }
        positionsRef.current = positions;

        setCameraSet(cameras.camera_set);
        onErrorRef.current?.(null);
      } catch (error) {
        fail(error);
      }
    }

    // -----------------------------------------------------------------
    // TRAJECTORY
    //
    // Hops and sightings alternate in sequence order, so the list is
    // walked straight through. Confidence encoding is spec 6.5: a
    // segment must never look more certain than it is.
    // -----------------------------------------------------------------

    function stopIcon(sequence: number, focused: boolean) {
      const size = focused ? 34 : 26;
      return L.divIcon({
        className: "",
        html: `
          <div style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:${focused ? HEX.primary : HEX.primaryContainer};
            border:2px solid ${HEX.white};
            box-shadow:0 3px 12px rgba(44,51,32,${focused ? ".38" : ".25"});
            display:flex;align-items:center;justify-content:center;
            color:${HEX.white};
            font-family:Inter,sans-serif;font-size:${focused ? 14 : 12}px;
            font-weight:600;
          ">${sequence}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }

    function renderTrajectory(collection: TrajectoryCollection) {
      if (disposed || !mapRef.current) return;

      trajectoryLayerRef.current?.remove();
      stopLayerRef.current?.remove();
      stopMarkersRef.current.clear();

      const lines = {
        type: "FeatureCollection" as const,
        features: collection.features.filter(
          (f) => f.geometry?.type === "LineString"
        ),
      };

      const layer = L.geoJSON(lines as never, {
        style: (feature) =>
          hopStyle(
            (feature as unknown as { properties: TrajectoryHopProperties })
              .properties
          ),
        onEachFeature: (feature, layer) => {
          const p = (
            feature as unknown as { properties: TrajectoryHopProperties }
          ).properties;
          const kind = linkKind(p);

          layer.bindPopup(popup(`
            <div style="font-weight:600;font-size:13px;">
              ${LINK[kind].label}
            </div>
            ${row("Link confidence", percent(p.link_confidence))}
            ${row("Took", duration(p.duration_s))}
            ${row("Typical", duration(p.typical_s))}
            ${row("Distance", distance(p.distance_m))}
            ${row("Geometry", p.geometry_source === "road" ? "real road" : "straight line")}
            ${p.detour_suspected ? row("Detour", "suspected") : ""}
            ${
              p.skipped_cameras?.length
                ? row("Missed by", p.skipped_cameras.join(", "))
                : ""
            }
          `));
        },
      });

      trajectoryLayerRef.current = layer;
      if (showTrajectory) layer.addTo(map);

      // Numbered stops, matching the timeline on the left.
      const stops = L.layerGroup();
      for (const feature of collection.features) {
        if (feature.geometry?.type !== "Point") continue;
        const p = feature.properties as TrajectorySightingProperties;
        const [lon, lat] = feature.geometry.coordinates;

        const marker = L.marker([lat, lon], {
          icon: stopIcon(p.sequence, false),
          zIndexOffset: 500,
        });

        marker.bindPopup(popup(`
          <div style="font-family:'Playfair Display',serif;font-size:15px;font-weight:600;">
            ${p.camera_name ?? p.camera_id}
          </div>
          ${row("Time", clockSeconds(p.timestamp))}
          ${row("Plate read", p.plate_read ?? "unreadable")}
          ${row("Confidence", percent(p.plate_confidence))}
          ${row("Camera", p.camera_id)}
        `));

        marker.on("click", () => onStopClickRef.current?.(p.sequence));

        stopMarkersRef.current.set(p.sequence, marker);
        stops.addLayer(marker);
      }

      stopLayerRef.current = stops;
      if (showTrajectory) stops.addTo(map);

      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [80, 80] });
      }
    }

    async function loadTrajectory() {
      const id = vehicleIdRef.current;

      if (id === undefined) {
        trajectoryLayerRef.current?.remove();
        stopLayerRef.current?.remove();
        trajectoryLayerRef.current = null;
        stopLayerRef.current = null;
        stopMarkersRef.current.clear();
        return;
      }

      try {
        const response = await getVehicleTrajectory(id);
        if (disposed) return;
        renderTrajectory(response.geojson);
        onErrorRef.current?.(null);
      } catch (error) {
        fail(error);
      }
    }

    // -----------------------------------------------------------------
    // TRAFFIC
    // -----------------------------------------------------------------

    function renderTraffic(collection: {
      features: TrafficFeature[];
    }) {
      if (disposed || !mapRef.current) return;
      trafficLayerRef.current?.remove();

      const layer = L.geoJSON(collection as never, {
        style: (feature) =>
          trafficStyle(feature as unknown as TrafficFeature),
        onEachFeature: (feature, layer) => {
          const p = (feature as unknown as TrafficFeature).properties;
          const info = band(p.congestion_band);

          layer.bindPopup(popup(`
            <div style="font-weight:600;font-size:13px;">${info.label}</div>
            ${row("Segment", `${p.from_camera_id} &rarr; ${p.to_camera_id}`)}
            ${row("Traversals", String(p.weight))}
            ${row("Median", duration(p.median_duration_s))}
            ${row("Free flow", duration(p.free_flow_s))}
            ${row(
              "Ratio",
              p.congestion_ratio !== null
                ? `${p.congestion_ratio.toFixed(2)}&times;`
                : "not enough data"
            )}
            ${row("Samples", String(p.sample_count))}
          `));
        },
      });

      trafficLayerRef.current = layer;
      if (showTraffic) layer.addTo(map);
    }

    async function loadTraffic() {
      try {
        const traffic = await getTrafficHeatmap(
          fromRef.current,
          toRef.current
        );
        if (disposed) return;
        renderTraffic(traffic);
        onErrorRef.current?.(null);
      } catch (error) {
        fail(error);
      }
    }

    reloadTrafficRef.current = loadTraffic;
    reloadTrajectoryRef.current = loadTrajectory;

    // Cameras first and awaited: the sighting pulses need the position
    // lookup it builds.
    loadCameras().then(() => {
      if (disposed) return;
      loadTrajectory();
      loadTraffic();
    });

    const trafficTimer = window.setInterval(() => {
      if (!disposed) loadTraffic();
    }, TRAFFIC_REFRESH_MS);

    // -----------------------------------------------------------------
    // LIVE MARKERS
    // -----------------------------------------------------------------

    injectPulseStyle();

    function dropTransient(
      position: [number, number],
      html: string,
      lifetimeMs: number,
      popupHtml?: string
    ) {
      if (disposed || !mapRef.current) return;

      const marker = L.marker(position, {
        icon: L.divIcon({ className: "", html, iconSize: [20, 20], iconAnchor: [10, 10] }),
        zIndexOffset: 2000,
      });

      if (popupHtml) marker.bindPopup(popup(popupHtml));
      marker.addTo(mapRef.current);
      liveMarkers.add(marker);

      window.setTimeout(() => {
        liveMarkers.delete(marker);
        marker.remove();
      }, lifetimeMs);
    }

    const stream = connectLiveStream({
      onOpen: () => !disposed && onStreamChangeRef.current?.(true),
      onError: () => !disposed && onStreamChangeRef.current?.(false),

      onSighting: (data) => {
        if (disposed) return;

        onLastEventRef.current?.(
          `${data.camera_id}${data.plate ? ` · ${data.plate}` : ""}`
        );

        const position = positionsRef.current.get(data.camera_id);
        if (position) {
          dropTransient(
            position,
            `<div class="anpr-pulse"></div>`,
            SIGHTING_PULSE_MS,
            `<div style="font-weight:600;">${data.plate ?? "plate unreadable"}</div>
             ${row("Vehicle", String(data.vehicle_id))}
             ${row("Camera", data.camera_id)}`
          );
        }

        if (
          vehicleIdRef.current !== undefined &&
          data.vehicle_id === vehicleIdRef.current
        ) {
          loadTrajectory();
        }
      },

      onAlert: (data) => {
        if (disposed) return;
        onLastEventRef.current?.(`alert · ${data.alert_type}`);

        const position: [number, number] | null =
          data.lat !== null && data.lon !== null
            ? [data.lat, data.lon]
            : (positionsRef.current.get(data.camera_id ?? "") ?? null);

        if (position) {
          dropTransient(
            position,
            `<div class="anpr-pulse anpr-pulse-alert"></div>`,
            ALERT_PIN_MS,
            `<div style="font-weight:600;">${data.alert_type}</div>
             ${row("Severity", data.severity)}
             ${row("Where", data.camera_name ?? data.camera_id ?? "—")}
             <div style="margin-top:6px;font-size:12px;">${data.message}</div>`
          );
        }
      },
    });

    const resizeTimer = window.setTimeout(() => {
      if (!disposed && mapRef.current) map.invalidateSize();
    }, 250);

    return () => {
      disposed = true;
      window.clearInterval(trafficTimer);
      window.clearTimeout(resizeTimer);
      stream.close();

      liveMarkers.forEach((m) => m.remove());
      liveMarkers.clear();

      cameraLayerRef.current?.remove();
      trajectoryLayerRef.current?.remove();
      trafficLayerRef.current?.remove();
      stopLayerRef.current?.remove();
      cameraLayerRef.current = null;
      trajectoryLayerRef.current = null;
      trafficLayerRef.current = null;
      stopLayerRef.current = null;
      stopMarkers.clear();

      try {
        map.remove();
      } catch {
        // Leaflet can throw during fast route changes.
      }
      mapRef.current = null;

      const el = container as HTMLDivElement & { _leaflet_id?: number };
      delete el._leaflet_id;
      container.innerHTML = "";
    };
    // Mounts once; everything else is driven through refs and the
    // effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Layer visibility ---------------------------------------------------

  useToggle(cameraLayerRef, mapRef, showCameras);
  useToggle(trajectoryLayerRef, mapRef, showTrajectory);
  useToggle(stopLayerRef, mapRef, showTrajectory);
  useToggle(trafficLayerRef, mapRef, showTraffic);

  // Reload when the page changes what it is asking for ------------------

  const settledWindow = useRef(false);
  useEffect(() => {
    if (!settledWindow.current) {
      settledWindow.current = true;
      return;
    }
    reloadTrafficRef.current?.();
  }, [from, to]);

  const settledVehicle = useRef(false);
  useEffect(() => {
    if (!settledVehicle.current) {
      settledVehicle.current = true;
      return;
    }
    reloadTrajectoryRef.current?.();
  }, [vehicleId]);

  // Timeline -> map highlight -------------------------------------------

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    stopMarkersRef.current.forEach((marker, sequence) => {
      const focused = sequence === focusedStop;
      marker.setIcon(stopIconFor(sequence, focused));
      if (focused) {
        marker.setZIndexOffset(1000);
        map.panTo(marker.getLatLng(), { animate: true });
        marker.openPopup();
      } else {
        marker.setZIndexOffset(500);
      }
    });
  }, [focusedStop]);

  return (
    <div className="relative h-full w-full bg-sand">
      <div ref={containerRef} className="h-full w-full" />
      {cameraSet && (
        <span className="pointer-events-none absolute bottom-2 left-3 z-[400] font-body text-label-caps uppercase text-on-surface-variant/60">
          {cameraSet}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------

function useToggle(
  layerRef: React.RefObject<L.Layer | null>,
  mapRef: React.RefObject<LeafletMap | null>,
  visible: boolean
) {
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    if (visible && !map.hasLayer(layer)) layer.addTo(map);
    else if (!visible && map.hasLayer(layer)) map.removeLayer(layer);
  }, [visible, layerRef, mapRef]);
}

function stopIconFor(sequence: number, focused: boolean) {
  const size = focused ? 34 : 26;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${focused ? HEX.primary : HEX.primaryContainer};
        border:2px solid ${HEX.white};
        box-shadow:0 3px 12px rgba(44,51,32,${focused ? ".38" : ".25"});
        display:flex;align-items:center;justify-content:center;
        color:${HEX.white};font-family:Inter,sans-serif;
        font-size:${focused ? 14 : 12}px;font-weight:600;
      ">${sequence}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function hopStyle(p: TrajectoryHopProperties): PathOptions {
  const style = LINK[linkKind(p)];
  return {
    color: style.hex,
    weight: style.weight,
    opacity: style.opacity,
    dashArray: style.dashArray,
    lineCap: "round",
    lineJoin: "round",
  };
}

function trafficStyle(feature: TrafficFeature): PathOptions {
  const { congestion_band, weight } = feature.properties;

  // A null band is the backend declining to claim a level for an edge
  // it saw too few times. Grey is the honest colour for that.
  const info = band(congestion_band);

  return {
    color: info.hex,
    weight: congestion_band
      ? Math.max(3, Math.min(10, 3 + weight / 25))
      : 3,
    opacity: congestion_band ? 0.85 : 0.5,
    lineCap: "round",
  };
}

function minutesSince(timestamp: string | null): number {
  if (!timestamp) return Number.MAX_SAFE_INTEGER;
  const seen = new Date(timestamp).getTime();
  if (Number.isNaN(seen)) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, (Date.now() - seen) / 60000);
}

/** Popup body in the design's type, since Leaflet takes raw HTML. */
function popup(inner: string): string {
  return `<div style="min-width:190px;font-family:Inter,sans-serif;font-size:12px;line-height:1.6;color:${HEX.onSurface};">${inner}</div>`;
}

function row(label: string, value: string): string {
  return `<div style="display:flex;justify-content:space-between;gap:14px;margin-top:3px;">
    <span style="color:${HEX.onSurfaceVariant};text-transform:uppercase;font-size:10px;letter-spacing:.12em;">${label}</span>
    <span style="font-weight:500;">${value}</span>
  </div>`;
}

function injectPulseStyle() {
  if (document.getElementById("anpr-pulse-style")) return;

  const style = document.createElement("style");
  style.id = "anpr-pulse-style";
  style.textContent = `
    @keyframes anpr-pulse {
      0%   { transform: scale(1);   opacity: 1; }
      50%  { transform: scale(1.9); opacity: .35; }
      100% { transform: scale(1);   opacity: 1; }
    }
    .anpr-pulse {
      width: 16px; height: 16px; border-radius: 50%;
      background: ${HEX.primaryContainer};
      border: 2px solid ${HEX.white};
      box-shadow: 0 0 10px rgba(107,123,58,.55);
      animation: anpr-pulse 1.5s ease-in-out infinite;
    }
    .anpr-pulse-alert {
      background: ${HEX.error};
      box-shadow: 0 0 12px rgba(186,26,26,.6);
      animation-duration: 1.1s;
    }`;
  document.head.appendChild(style);
}
