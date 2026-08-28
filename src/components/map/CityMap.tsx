import { useEffect, useRef, useState } from "react";

import {
  Map,
  Marker,
  NavigationControl,
  Popup,
  GeoJSONSource,
  setWorkerUrl,
} from "maplibre-gl";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import "maplibre-gl/dist/maplibre-gl.css";

import { mockCameras } from "../../data/mockCameras";
import { mockTrajectory } from "../../data/mockTrajectory";
import { mockHeatmap } from "../../data/mockHeatmap";

import {
  getCameras,
  getTrajectory,
  getHeatmap,
} from "../../services/mapApi";

import {
  connectLiveSocket,
  type LiveEvent,
} from "../../services/liveSocket";

import {
  startMockLiveUpdates,
} from "../../services/mockLiveUpdates";

setWorkerUrl(workerUrl);

export default function CityMap() {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<Map | null>(null);

  const [showTrajectory, setShowTrajectory] =
    useState(true);

  const [showHeatmap, setShowHeatmap] =
    useState(true);

  const [connectionStatus, setConnectionStatus] =
    useState<
      "mock" | "connected" | "disconnected"
    >("mock");

  const [lastLiveUpdate, setLastLiveUpdate] =
    useState<string>("Waiting...");

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    // =================================
    // CREATE MAP
    // =================================

    const map = new Map({
      container: mapContainerRef.current,

      style: {
        version: 8,

        sources: {
          osm: {
            type: "raster",

            tiles: [
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],

            tileSize: 256,

            attribution:
              "© OpenStreetMap contributors",
          },
        },

        layers: [
          {
            id: "osm-base",
            type: "raster",
            source: "osm",
          },
        ],
      },

      center: [77.215, 28.63],

      zoom: 12,
    });

    mapRef.current = map;

    map.addControl(
      new NavigationControl(),
      "top-right"
    );

    const markers: Marker[] = [];

    let socket: WebSocket | null = null;

    let stopMockUpdates:
      | (() => void)
      | null = null;

    // =================================
    // MAP LOAD
    // =================================

    map.once("load", async () => {
      console.log("Map loaded");

      // =================================
      // DEFAULT MOCK DATA
      // =================================

      let cameras = mockCameras;
      let trajectory = mockTrajectory;
      let heatmap = mockHeatmap;

      // =================================
      // REST: CAMERAS
      // =================================

      try {
        const backendCameras =
          await getCameras();

        cameras =
          backendCameras.map(
            (camera) => ({
              id: camera.camera_id,

              name: camera.name,

              longitude:
                camera.longitude,

              latitude:
                camera.latitude,

              status:
                camera.status,
            })
          );

        console.log(
          "Using backend cameras"
        );
      } catch {
        console.log(
          "Camera API unavailable. Using mock cameras."
        );
      }

      // =================================
      // REST: TRAJECTORY
      // =================================

      try {
        const backendTrajectory =
          await getTrajectory(
            "UP15AB1234"
          );

        trajectory = {
          type:
            "FeatureCollection",

          features:
            backendTrajectory.segments.map(
              (segment) => ({
                type:
                  "Feature",

                properties: {
                  segmentType:
                    segment.type,

                  confidence:
                    segment.confidence,
                },

                geometry:
                  segment.geometry,
              })
            ),
        } as typeof mockTrajectory;

        console.log(
          "Using backend trajectory"
        );
      } catch {
        console.log(
          "Trajectory API unavailable. Using mock trajectory."
        );
      }

      // =================================
      // REST: HEATMAP
      // =================================

      try {
        const backendHeatmap =
          await getHeatmap();

        heatmap =
          backendHeatmap as typeof mockHeatmap;

        console.log(
          "Using backend heatmap"
        );
      } catch {
        console.log(
          "Heatmap API unavailable. Using mock heatmap."
        );
      }

      // =================================
      // CAMERA MARKERS
      // =================================

      cameras.forEach(
        (camera) => {
          const marker =
            new Marker({
              color:
                camera.status ===
                "online"
                  ? "#22c55e"
                  : camera.status ===
                    "degraded"
                  ? "#f59e0b"
                  : "#ef4444",
            })
              .setLngLat([
                camera.longitude,
                camera.latitude,
              ])

              .setPopup(
                new Popup({
                  offset: 25,
                }).setHTML(`
                  <div
                    style="
                      font-family: Arial;
                      min-width: 150px;
                    "
                  >
                    <strong>
                      ${camera.id}
                    </strong>

                    <br/>

                    ${camera.name}

                    <br/>

                    Status:
                    <strong>
                      ${camera.status}
                    </strong>
                  </div>
                `)
              )

              .addTo(map);

          markers.push(marker);
        }
      );

      // =================================
      // TRAJECTORY SOURCE
      // =================================

      map.addSource(
        "trajectory-data",
        {
          type: "geojson",
          data: trajectory,
        }
      );

      // CONFIRMED

      map.addLayer({
        id:
          "trajectory-confirmed",

        type: "line",

        source:
          "trajectory-data",

        filter: [
          "==",

          ["get", "segmentType"],

          "confirmed",
        ],

        layout: {
          "line-join":
            "round",

          "line-cap":
            "round",
        },

        paint: {
          "line-color":
            "#2563eb",

          "line-width":
            8,

          "line-opacity":
            1,
        },
      });

      // INFERRED

      map.addLayer({
        id:
          "trajectory-inferred",

        type: "line",

        source:
          "trajectory-data",

        filter: [
          "==",

          ["get", "segmentType"],

          "inferred",
        ],

        layout: {
          "line-join":
            "round",

          "line-cap":
            "round",
        },

        paint: {
          "line-color":
            "#f59e0b",

          "line-width":
            8,

          "line-opacity":
            1,

          "line-dasharray": [
            2,
            2,
          ],
        },
      });

      // GAP

      map.addLayer({
        id:
          "trajectory-gap",

        type: "line",

        source:
          "trajectory-data",

        filter: [
          "==",

          ["get", "segmentType"],

          "gap",
        ],

        layout: {
          "line-join":
            "round",

          "line-cap":
            "round",
        },

        paint: {
          "line-color":
            "#64748b",

          "line-width":
            7,

          "line-opacity":
            0.55,

          "line-dasharray": [
            0.5,
            2.5,
          ],
        },
      });

      // =================================
      // HEATMAP SOURCE
      // =================================

      map.addSource(
        "heatmap-data",
        {
          type: "geojson",

          data: heatmap,
        }
      );

      map.addLayer(
        {
          id:
            "traffic-heatmap",

          type:
            "heatmap",

          source:
            "heatmap-data",

          paint: {
            "heatmap-weight": [
              "interpolate",

              ["linear"],

              ["get", "density"],

              0,
              0,

              1,
              1,
            ],

            "heatmap-intensity":
              1.5,

            "heatmap-radius":
              55,

            "heatmap-opacity":
              0.75,

            "heatmap-color": [
              "interpolate",

              ["linear"],

              ["heatmap-density"],

              0,
              "rgba(0,0,255,0)",

              0.2,
              "royalblue",

              0.4,
              "cyan",

              0.6,
              "lime",

              0.8,
              "yellow",

              1,
              "red",
            ],
          },
        },

        "trajectory-confirmed"
      );

      // =================================
      // REAL WEBSOCKET CONNECTION
      // =================================

      socket =
        connectLiveSocket(
          (event) => {
            handleLiveEvent(
              map,
              event
            );

            setLastLiveUpdate(
              event.event
            );
          },

          () => {
            console.log(
              "Live backend connected"
            );

            setConnectionStatus(
              "connected"
            );
          },

          () => {
            console.log(
              "Live backend disconnected"
            );

            setConnectionStatus(
              "disconnected"
            );
          }
        );

      // =================================
      // MOCK LIVE UPDATES
      // =================================
      // This allows us to test realtime
      // behavior before backend is ready.
      // Remove/disable this later when
      // actual WebSocket is working.
      // =================================

      stopMockUpdates =
        startMockLiveUpdates(
          (
            trajectoryData
          ) => {
            handleLiveEvent(
              map,
              {
                event:
                  "trajectory_updated",

                timestamp:
                  new Date().toISOString(),

                data:
                  trajectoryData,
              }
            );

            setLastLiveUpdate(
              "Mock trajectory update"
            );

            console.log(
              "Mock trajectory event received"
            );
          },

          (
            heatmapData
          ) => {
            handleLiveEvent(
              map,
              {
                event:
                  "traffic_update",

                timestamp:
                  new Date().toISOString(),

                data:
                  heatmapData,
              }
            );

            setLastLiveUpdate(
              "Mock traffic update"
            );

            console.log(
              "Mock heatmap event received"
            );
          }
        );

      console.log(
        "Realtime test started"
      );
    });

    // =================================
    // MAP RESIZE
    // =================================

    const resizeTimer =
      window.setTimeout(
        () => {
          map.resize();
        },
        200
      );

    // =================================
    // CLEANUP
    // =================================

    return () => {
      window.clearTimeout(
        resizeTimer
      );

      socket?.close();

      stopMockUpdates?.();

      markers.forEach(
        (marker) => {
          marker.remove();
        }
      );

      map.remove();

      mapRef.current =
        null;
    };
  }, []);

  // =================================
  // TRAJECTORY TOGGLE
  // =================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const visibility =
      showTrajectory
        ? "visible"
        : "none";

    [
      "trajectory-confirmed",
      "trajectory-inferred",
      "trajectory-gap",
    ].forEach(
      (layerId) => {
        if (
          map.getLayer(
            layerId
          )
        ) {
          map.setLayoutProperty(
            layerId,

            "visibility",

            visibility
          );
        }
      }
    );
  }, [showTrajectory]);

  // =================================
  // HEATMAP TOGGLE
  // =================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    if (
      map.getLayer(
        "traffic-heatmap"
      )
    ) {
      map.setLayoutProperty(
        "traffic-heatmap",

        "visibility",

        showHeatmap
          ? "visible"
          : "none"
      );
    }
  }, [showHeatmap]);

  // =================================
  // UI
  // =================================

  return (
    <div
      style={{
        width: "100%",

        height: "100vh",

        position:
          "relative",
      }}
    >
      {/* MAP */}

      <div
        ref={
          mapContainerRef
        }

        style={{
          width: "100%",

          height: "100%",
        }}
      />

      {/* VEHICLE CARD */}

      <div
        style={{
          position:
            "absolute",

          top: 20,

          left: 20,

          zIndex: 10,

          background:
            "rgba(9,21,37,0.93)",

          color:
            "white",

          padding:
            "16px 18px",

          borderRadius:
            "14px",

          minWidth:
            "260px",

          boxShadow:
            "0 10px 30px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            fontSize:
              "11px",

            color:
              "#94a3b8",

            textTransform:
              "uppercase",

            letterSpacing:
              "1px",
          }}
        >
          Vehicle Tracking
        </div>

        <div
          style={{
            fontSize:
              "20px",

            fontWeight:
              700,

            marginTop:
              "6px",
          }}
        >
          UP15AB1234
        </div>

        {/* CONNECTION STATUS */}

        <div
          style={{
            marginTop:
              "10px",

            display:
              "flex",

            alignItems:
              "center",

            gap:
              "7px",

            fontSize:
              "12px",
          }}
        >
          <span
            style={{
              width:
                "8px",

              height:
                "8px",

              borderRadius:
                "50%",

              display:
                "inline-block",

              background:
                connectionStatus ===
                "connected"
                  ? "#22c55e"
                  : connectionStatus ===
                    "disconnected"
                  ? "#ef4444"
                  : "#f59e0b",
            }}
          />

          {connectionStatus ===
          "connected"
            ? "Live backend connected"

            : connectionStatus ===
              "disconnected"
            ? "Backend disconnected"

            : "Using demo data"}
        </div>

        {/* LAST UPDATE */}

        <div
          style={{
            marginTop:
              "8px",

            fontSize:
              "11px",

            color:
              "#94a3b8",
          }}
        >
          Last event:
          {" "}
          <strong
            style={{
              color:
                "#e2e8f0",
            }}
          >
            {lastLiveUpdate}
          </strong>
        </div>
      </div>

      {/* LAYER CONTROLS */}

      <div
        style={{
          position:
            "absolute",

          top: 20,

          right: 70,

          zIndex: 10,

          display:
            "flex",

          gap:
            "8px",

          background:
            "rgba(9,21,37,0.93)",

          padding:
            "8px",

          borderRadius:
            "12px",
        }}
      >
        <button
          onClick={() =>
            setShowTrajectory(
              !showTrajectory
            )
          }

          style={{
            border:
              "none",

            cursor:
              "pointer",

            padding:
              "9px 14px",

            borderRadius:
              "8px",

            background:
              showTrajectory
                ? "#2563eb"
                : "#1e293b",

            color:
              "white",
          }}
        >
          Trajectory
        </button>

        <button
          onClick={() =>
            setShowHeatmap(
              !showHeatmap
            )
          }

          style={{
            border:
              "none",

            cursor:
              "pointer",

            padding:
              "9px 14px",

            borderRadius:
              "8px",

            background:
              showHeatmap
                ? "#0f766e"
                : "#1e293b",

            color:
              "white",
          }}
        >
          Heatmap
        </button>
      </div>

      {/* LEGEND */}

      <div
        style={{
          position:
            "absolute",

          bottom:
            30,

          left:
            20,

          zIndex:
            10,

          background:
            "rgba(9,21,37,0.93)",

          color:
            "white",

          padding:
            "14px 16px",

          borderRadius:
            "12px",

          fontSize:
            "12px",

          boxShadow:
            "0 10px 30px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            fontWeight:
              700,

            marginBottom:
              "10px",
          }}
        >
          Map Legend
        </div>

        <LegendLine
          color="#2563eb"
          label="Confirmed route"
        />

        <LegendLine
          color="#f59e0b"
          label="Inferred route"
          dashed
        />

        <LegendLine
          color="#64748b"
          label="Observation gap"
          dashed
        />

        <LegendDot
          color="#22c55e"
          label="Camera online"
        />

        <LegendDot
          color="#ef4444"
          label="Camera offline"
        />
      </div>
    </div>
  );
}

// =====================================
// LIVE EVENT HANDLER
// =====================================

function handleLiveEvent(
  map: Map,
  event: LiveEvent
) {
  console.log(
    "LIVE EVENT:",
    event
  );

  // =================================
  // TRAJECTORY UPDATE
  // =================================

  if (
    event.event ===
    "trajectory_updated"
  ) {
    const data =
      event.data as {
        vehicle_id:
          string;

        segments: {
          type:
            | "confirmed"
            | "inferred"
            | "gap";

          confidence:
            number;

          geometry: {
            type:
              "LineString";

            coordinates:
              [number, number][];
          };
        }[];
      };

    const geoJson = {
      type:
        "FeatureCollection" as const,

      features:
        data.segments.map(
          (segment) => ({
            type:
              "Feature" as const,

            properties: {
              segmentType:
                segment.type,

              confidence:
                segment.confidence,
            },

            geometry:
              segment.geometry,
          })
        ),
    };

    const source =
      map.getSource(
        "trajectory-data"
      ) as
        | GeoJSONSource
        | undefined;

    if (source) {
      source.setData(
        geoJson
      );

      console.log(
        "Trajectory updated live"
      );
    }
  }

  // =================================
  // HEATMAP UPDATE
  // =================================

  if (
    event.event ===
    "traffic_update"
  ) {
    const data =
      event.data as {
        type:
          "FeatureCollection";

        features: {
          type:
            "Feature";

          geometry: {
            type:
              "Point";

            coordinates:
              [number, number];
          };

          properties: {
            density:
              number;

            vehicle_count?:
              number;
          };
        }[];
      };

    const source =
      map.getSource(
        "heatmap-data"
      ) as
        | GeoJSONSource
        | undefined;

    if (source) {
      source.setData(
        data
      );

      console.log(
        "Heatmap updated live"
      );
    }
  }
}

// =====================================
// LEGEND HELPERS
// =====================================

function LegendLine({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div
      style={{
        display:
          "flex",

        alignItems:
          "center",

        gap:
          "8px",

        marginBottom:
          "7px",
      }}
    >
      <div
        style={{
          width:
            "28px",

          borderTop:
            dashed
              ? `3px dashed ${color}`
              : `3px solid ${color}`,
        }}
      />

      <span>
        {label}
      </span>
    </div>
  );
}

function LegendDot({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div
      style={{
        display:
          "flex",

        alignItems:
          "center",

        gap:
          "8px",

        marginBottom:
          "7px",
      }}
    >
      <div
        style={{
          width:
            "10px",

          height:
            "10px",

          borderRadius:
            "50%",

          background:
            color,
        }}
      />

      <span>
        {label}
      </span>
    </div>
  );
}