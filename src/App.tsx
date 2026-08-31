import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import VehicleSearch from "./pages/VehicleSearch";
import Traffic from "./pages/Traffic";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import CameraHealth from "./pages/CameraHealth";

// The landing screen sits ahead of the app at "/", so the operator
// surface starts at /dashboard.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vehicles" element={<VehicleSearch />} />
        <Route path="/traffic" element={<Traffic />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/cameras" element={<CameraHealth />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
