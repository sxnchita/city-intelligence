import { useEffect, useRef } from "react";

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

setWorkerUrl(workerUrl);

export default function CityMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

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
      map.addSource("trajectory-data", {
        type: "geojson",

        data: {
          type: "FeatureCollection",

          features: [
            // Confirmed segment
            {
              type: "Feature",

              properties: {
                segmentType: "confirmed",
              },

              geometry: {
                type: "LineString",

                coordinates: [
                  [77.1909, 28.6519], // Karol Bagh
                  [77.2167, 28.6315], // Connaught Place
                ],
              },
            },

            // Inferred segment
            {
              type: "Feature",

              properties: {
                segmentType: "inferred",
              },

              geometry: {
                type: "LineString",

                coordinates: [
                  [77.2167, 28.6315], // Connaught Place
                  [77.2295, 28.6129], // India Gate
                ],
              },
            },

            // Gap / unobserved segment
            {
              type: "Feature",

              properties: {
                segmentType: "gap",
              },

              geometry: {
                type: "LineString",

                coordinates: [
                  [77.2295, 28.6129], // India Gate
                  [77.241, 28.628],   // ITO
                ],
              },
            },
          ],
        },
      });

      // -----------------------------
      // CONFIRMED
      // -----------------------------

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

      // -----------------------------
      // INFERRED
      // -----------------------------

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

          "line-dasharray": [
            2,
            2,
          ],
        },
      });

      // -----------------------------
      // GAP / UNOBSERVED
      // -----------------------------

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

          "line-dasharray": [
            0.5,
            2.5,
          ],
        },
      });
    });

    const resizeTimer =
      window.setTimeout(() => {
        map.resize();
      }, 200);

    return () => {
      window.clearTimeout(
        resizeTimer
      );

      markers.forEach((marker) => {
        marker.remove();
      });

      map.remove();
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "100vh",
      }}
    />
  );
}