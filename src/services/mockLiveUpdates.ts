export function startMockLiveUpdates(
  onTrajectoryUpdate: (data: unknown) => void,
  onHeatmapUpdate: (data: unknown) => void
) {
  const trajectoryTimer = window.setInterval(() => {
    onTrajectoryUpdate({
      vehicle_id: "V123",

      segments: [
        {
          type: "confirmed",
          confidence: 0.98,

          geometry: {
            type: "LineString",

            coordinates: [
              [77.1909, 28.6519],
              [77.2167, 28.6315],
              [77.2295, 28.6129],
            ],
          },
        },

        {
          type: "inferred",
          confidence: 0.72,

          geometry: {
            type: "LineString",

            coordinates: [
              [77.2295, 28.6129],
              [77.241, 28.628],
            ],
          },
        },
      ],
    });
  }, 5000);

  const heatmapTimer = window.setInterval(() => {
    onHeatmapUpdate({
      type: "FeatureCollection",

      features: [
        {
          type: "Feature",

          geometry: {
            type: "Point",
            coordinates: [77.2167, 28.6315],
          },

          properties: {
            density: Math.random(),
            vehicle_count: Math.floor(
              Math.random() * 200
            ),
          },
        },

        {
          type: "Feature",

          geometry: {
            type: "Point",
            coordinates: [77.2295, 28.6129],
          },

          properties: {
            density: Math.random(),
            vehicle_count: Math.floor(
              Math.random() * 200
            ),
          },
        },

        {
          type: "Feature",

          geometry: {
            type: "Point",
            coordinates: [77.241, 28.628],
          },

          properties: {
            density: Math.random(),
            vehicle_count: Math.floor(
              Math.random() * 200
            ),
          },
        },
      ],
    });
  }, 3000);

  return () => {
    window.clearInterval(trajectoryTimer);
    window.clearInterval(heatmapTimer);
  };
}