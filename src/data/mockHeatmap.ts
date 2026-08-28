export const mockHeatmap = {
  type: "FeatureCollection" as const,

  features: [
    {
      type: "Feature" as const,
      properties: {
        density: 0.9,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [77.2167, 28.6315],
      },
    },

    {
      type: "Feature" as const,
      properties: {
        density: 0.7,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [77.2295, 28.6129],
      },
    },

    {
      type: "Feature" as const,
      properties: {
        density: 0.5,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [77.1909, 28.6519],
      },
    },

    {
      type: "Feature" as const,
      properties: {
        density: 1.0,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [77.241, 28.628],
      },
    },
  ],
};