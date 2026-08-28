import { useEffect, useRef, useState } from "react";

import {
  Map,
  Marker,
  NavigationControl,
  Popup,
  setWorkerUrl,
} from "maplibre-gl";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import "maplibre-gl/dist/maplibre-gl.css";

import { mockCameras } from "../../data/mockCameras";
import { mockTrajectory } from "../../data/mockTrajectory";
import { mockHeatmap } from "../../data/mockHeatmap";

setWorkerUrl(workerUrl);

export default function CityMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  useEffect(() => {
    if (!mapContainerRef.current) return;

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
            attribution: "© OpenStreetMap contributors",
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

    mockCameras.forEach((camera) => {
      const marker = new Marker({
        color:
          camera.status === "online"
            ? "#22c55e"
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
            <div style="font-family: Arial; min-width: 150px;">
              <strong>${camera.id}</strong><br/>
              ${camera.name}<br/>
              Status: <strong>${camera.status}</strong>
            </div>
          `)
        )
        .addTo(map);

      markers.push(marker);
    });

    map.once("load", () => {
      // ---------------------------------
      // TRAJECTORY SOURCE
      // ---------------------------------

      map.addSource("trajectory-data", {
        type: "geojson",
        data: mockTrajectory,
      });

      // Confirmed
      map.addLayer({
        id: "trajectory-confirmed",
        type: "line",
        source: "trajectory-data",

        filter: [
          "==",
          ["get", "segmentType"],
          "confirmed",
        ],

        layout: {
          "line-join": "round",
          "line-cap": "round",
        },

        paint: {
          "line-color": "#2563eb",
          "line-width": 8,
          "line-opacity": 1,
        },
      });

      // Inferred
      map.addLayer({
        id: "trajectory-inferred",
        type: "line",
        source: "trajectory-data",

        filter: [
          "==",
          ["get", "segmentType"],
          "inferred",
        ],

        layout: {
          "line-join": "round",
          "line-cap": "round",
        },

        paint: {
          "line-color": "#f59e0b",
          "line-width": 8,
          "line-opacity": 1,
          "line-dasharray": [2, 2],
        },
      });

      // Gap
      map.addLayer({
        id: "trajectory-gap",
        type: "line",
        source: "trajectory-data",

        filter: [
          "==",
          ["get", "segmentType"],
          "gap",
        ],

        layout: {
          "line-join": "round",
          "line-cap": "round",
        },

        paint: {
          "line-color": "#64748b",
          "line-width": 7,
          "line-opacity": 0.55,
          "line-dasharray": [0.5, 2.5],
        },
      });

      // ---------------------------------
      // HEATMAP SOURCE
      // ---------------------------------

      map.addSource("heatmap-data", {
        type: "geojson",
        data: mockHeatmap,
      });

      // ---------------------------------
      // HEATMAP LAYER
      // ---------------------------------

      map.addLayer(
        {
          id: "traffic-heatmap",
          type: "heatmap",
          source: "heatmap-data",

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

            "heatmap-intensity": 1.5,

            "heatmap-radius": 55,

            "heatmap-opacity": 0.75,

            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],

              0,
              "rgba(0, 0, 255, 0)",

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
    });

    const resizeTimer = window.setTimeout(() => {
      map.resize();
    }, 200);

    return () => {
      window.clearTimeout(resizeTimer);

      markers.forEach((marker) => {
        marker.remove();
      });

      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ---------------------------------
  // TOGGLE TRAJECTORY
  // ---------------------------------

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const visibility =
      showTrajectory ? "visible" : "none";

    [
      "trajectory-confirmed",
      "trajectory-inferred",
      "trajectory-gap",
    ].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          "visibility",
          visibility
        );
      }
    });
  }, [showTrajectory]);

  // ---------------------------------
  // TOGGLE HEATMAP
  // ---------------------------------

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getLayer("traffic-heatmap")) {
      map.setLayoutProperty(
        "traffic-heatmap",
        "visibility",
        showHeatmap ? "visible" : "none"
      );
    }
  }, [showHeatmap]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
      }}
    >
      {/* MAP */}
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {/* TOP LEFT VEHICLE CARD */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,

          background: "rgba(9, 21, 37, 0.92)",
          color: "white",

          padding: "16px 18px",
          borderRadius: "14px",

          minWidth: "240px",

          boxShadow:
            "0 10px 30px rgba(0,0,0,0.25)",

          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Vehicle Tracking
        </div>

        <div
          style={{
            fontSize: "20px",
            fontWeight: 700,
            marginTop: "6px",
          }}
        >
          UP15AB1234
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "#cbd5e1",
            marginTop: "6px",
          }}
        >
          Black Car
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            marginTop: "8px",
          }}
        >
          Last seen: Camera C04
        </div>
      </div>

      {/* TOGGLE CONTROLS */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 70,
          zIndex: 10,

          display: "flex",
          gap: "8px",

          background: "rgba(9, 21, 37, 0.92)",

          padding: "8px",

          borderRadius: "12px",

          boxShadow:
            "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <button
          onClick={() =>
            setShowTrajectory(!showTrajectory)
          }
          style={{
            border: "none",
            cursor: "pointer",

            padding: "9px 14px",

            borderRadius: "8px",

            background:
              showTrajectory
                ? "#2563eb"
                : "#1e293b",

            color: "white",

            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          Trajectory
        </button>

        <button
          onClick={() =>
            setShowHeatmap(!showHeatmap)
          }
          style={{
            border: "none",
            cursor: "pointer",

            padding: "9px 14px",

            borderRadius: "8px",

            background:
              showHeatmap
                ? "#0f766e"
                : "#1e293b",

            color: "white",

            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          Heatmap
        </button>
      </div>

      {/* LEGEND */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 20,
          zIndex: 10,

          background: "rgba(9, 21, 37, 0.92)",
          color: "white",

          padding: "14px 16px",

          borderRadius: "12px",

          minWidth: "180px",

          boxShadow:
            "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#94a3b8",
            marginBottom: "10px",
          }}
        >
          MAP LEGEND
        </div>

        <LegendItem
          color="#2563eb"
          label="Confirmed route"
        />

        <LegendItem
          color="#f59e0b"
          label="Inferred route"
          dashed
        />

        <LegendItem
          color="#64748b"
          label="Unobserved gap"
          dotted
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

function LegendItem({
  color,
  label,
  dashed = false,
  dotted = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  dotted?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "8px",
        fontSize: "12px",
        color: "#cbd5e1",
      }}
    >
      <div
        style={{
          width: "30px",

          borderTop: dotted
            ? `3px dotted ${color}`
            : dashed
            ? `3px dashed ${color}`
            : `3px solid ${color}`,
        }}
      />

      <span>{label}</span>
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
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "8px",
        fontSize: "12px",
        color: "#cbd5e1",
      }}
    >
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: color,
        }}
      />

      <span>{label}</span>
    </div>
  );
}