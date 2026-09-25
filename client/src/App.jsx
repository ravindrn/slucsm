import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { TeamProvider } from "./context/TeamContext";
import ProtectedRoute from "./components/ProtectedRoute";
import TeamProtectedRoute from "./components/TeamProtectedRoute";
import SessionTimer from "./context/SessionTimer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import EventDetail from "./pages/EventDetail";
import LiveEvent from "./pages/LiveEvent";
import EventNotFound from "./pages/EventNotFound";
import Scoreboard from "./pages/Scoreboard";

import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ManageEvents from "./pages/admin/ManageEvents";
import EventEditor from "./pages/admin/EventEditor";
import ManageCommittee from "./pages/admin/ManageCommittee";
import MediaManager from "./pages/admin/MediaManager";
import ManageTeams from "./pages/admin/ManageTeams";
import ManageTasks from "./pages/admin/ManageTasks";
import ManageSubmissions from "./pages/admin/ManageSubmissions";
import ManageSettings from "./pages/admin/ManageSettings";
import ManageUsers from "./pages/admin/ManageUsers";

import TeamLogin from "./pages/team/TeamLogin";
import TeamDashboard from "./pages/team/TeamDashboard";
import TeamVerify from "./pages/team/TeamVerify";
import ScanLanding from "./pages/team/ScanLanding";

export default function App() {
  return (
    <AuthProvider>
      <TeamProvider>
        <SessionTimer />

        <Routes>
          {/* ---------- PUBLIC ---------- */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/scan/:code" element={<ScanLanding />} />
          <Route path="/team/:code" element={<TeamVerify />} />

          {/* ---------- EVENT PAGES ---------- */}
          <Route path="/events/live/:slug" element={<LiveEvent />} />
          <Route
            path="/events/live/:slug/scoreboard"
            element={<Scoreboard />}
          />
          <Route
            path="/events/live/:slug/portal"
            element={<TeamLogin />}
          />
          <Route
            path="/events/live/:slug/portal/dashboard"
            element={
              <TeamProtectedRoute>
                <TeamDashboard />
              </TeamProtectedRoute>
            }
          />
          <Route path="/events/:slug" element={<EventDetail />} />

          {/* ---------- ADMIN ---------- */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="events" element={<ManageEvents />} />
            <Route path="events/:id" element={<EventEditor />} />
            <Route path="committee" element={<ManageCommittee />} />
            <Route path="media" element={<MediaManager />} />
            <Route path="teams" element={<ManageTeams />} />
            <Route path="tasks" element={<ManageTasks />} />
            <Route path="submissions" element={<ManageSubmissions />} />
            <Route path="settings" element={<ManageSettings />} />
            <Route
              path="users"
              element={
                <ProtectedRoute adminOnly>
                  <ManageUsers />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* ---------- 404 ---------- */}
          <Route path="*" element={<EventNotFound />} />
        </Routes>
      </TeamProvider>
    </AuthProvider>
  );
}