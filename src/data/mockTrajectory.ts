export const mockTrajectory = {
  type: "FeatureCollection" as const,

  features: [
    {
      type: "Feature" as const,

      properties: {
        segmentType: "confirmed",
      },

      geometry: {
        type: "LineString" as const,

        coordinates: [
          [77.1909, 28.6519],
          [77.2167, 28.6315],
        ],
      },
    },

    {
      type: "Feature" as const,

      properties: {
        segmentType: "inferred",
      },

      geometry: {
        type: "LineString" as const,

        coordinates: [
          [77.2167, 28.6315],
          [77.2295, 28.6129],
        ],
      },
    },

    {
      type: "Feature" as const,

      properties: {
        segmentType: "gap",
      },

      geometry: {
        type: "LineString" as const,

        coordinates: [
          [77.2295, 28.6129],
          [77.241, 28.628],
        ],
      },
    },
  ],
};