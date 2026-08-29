import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import VehicleSearch from "./pages/VehicleSearch";
import Traffic from "./pages/Traffic";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import CameraHealth from "./pages/CameraHealth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/vehicles"
          element={<VehicleSearch />}
        />

        <Route
          path="/traffic"
          element={<Traffic />}
        />

       <Route
  path="/alerts"
  element={<Alerts />}
/>

        <Route
  path="/analytics"
  element={<Analytics />}
/>

        <Route
  path="/cameras"
  element={<CameraHealth />}
/>

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

function PlaceholderPage({
  title,
}: {
  title: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#07111f",
        color: "white",
        fontFamily:
          "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "#64748b",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
          }}
        >
          City Intelligence
        </div>

        <h1
          style={{
            marginTop: "10px",
            marginBottom: "8px",
            fontSize: "32px",
          }}
        >
          {title}
        </h1>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          This screen will be built next.
        </p>
      </div>
    </div>
  );
}