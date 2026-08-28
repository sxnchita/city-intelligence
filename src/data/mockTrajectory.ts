export const mockTrajectory = {
  type: "Feature" as const,
  geometry: {
    type: "LineString" as const,
    coordinates: [
      [77.2167, 28.6315], // C01 Connaught Place
      [77.2295, 28.6129], // C02 India Gate
      [77.2410, 28.6280], // C04 ITO
    ],
  },
  properties: {
    vehicle_id: "V123",
    plate: "UP15AB1234",
    type: "confirmed",
  },
};