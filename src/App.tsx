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
