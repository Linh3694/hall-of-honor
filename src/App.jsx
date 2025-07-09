import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import HallofFame from "./features/HallOfHonor/HallOfFame-homepage";
import HallOfFamePublicPage from "./features/HallOfHonor/HallOfFame-detail";

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<HallofFame />} />
          <Route path="/detail/:category" element={<HallOfFamePublicPage />} />
          <Route
            path="/detail/:category/student/:recordId/:studentId"
            element={<HallOfFamePublicPage />}
          />
          <Route
            path="/detail/:category/class/:recordId/:classId"
            element={<HallOfFamePublicPage />}
          />
          {/* Route detail subAward cũng render HallOfFamePublicPage */}
          <Route
            path="/detail/:category/:ten-sub-award"
            element={<HallOfFamePublicPage />}
          />
          <Route
            path="/detail"
            element={<Navigate to="/detail/scholarship-talent" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
