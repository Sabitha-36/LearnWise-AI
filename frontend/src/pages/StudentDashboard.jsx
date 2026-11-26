
import { useState } from "react";
import {  Routes,  Route,  Navigate,  Outlet,  useNavigate} from "react-router-dom";
import {  Bell,  Menu,  X,  UserRound,  ChevronDown,  Settings} from "lucide-react";
import { getStudentAvatarUrl } from "../services/api";
import Sidebar from "../components/Sidebar_temp";
import ExamPreparationHub from "./ExamPreparationHub";
import { StudentHome, FeaturePage } from "./StudentPages";
import Progress from "./Progress";
import ReferenceBookAI from "./ReferenceBookAI";
import "./navigation.css";
import Profile from "./Profile";
import SettingsPage from "./Settings";

function StudentLayout({ user, onLogout }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const avatarUrl =   user?.avatar_url ||  (user?.avatar ? getStudentAvatarUrl(user.avatar) : "");
  
  function toggleSidebar() {
    if (window.innerWidth <= 768) {
      setMobileOpen((previous) => !previous);
    } else {
      setCollapsed((previous) => !previous);
    }
  }

  function closeDropdowns() {
    setShowNotifications(false);
    setShowProfile(false);
  }

  return (
    <div
      className={`app-layout navigation-layout
        ${collapsed ? "nav-collapsed" : ""}
        ${mobileOpen ? "mobile-nav-open" : ""}
      `}
    >
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="main-content">

        {/* TOP NAVBAR */}
        <header className="student-topbar navigation-topbar">

          <div className="topbar-left">

            <button
              type="button"
              className="nav-toggle-btn"
              onClick={toggleSidebar}
              aria-label="Toggle navigation"
              title="Toggle navigation"
            >
              {mobileOpen
                ? <X size={21} />
                : <Menu size={21} />}
            </button>

            <div className="topbar-welcome">
              <h2>Student Dashboard</h2>
              <p>
                Welcome, {user?.name || "Student"}!
              </p>
            </div>

          </div>

          <div className="topbar-actions">

            {/* NOTIFICATIONS */}
            <div className="navbar-dropdown-wrapper">

              <button
                type="button"
                className={`navbar-icon-btn ${
                  showNotifications ? "dropdown-active" : ""
                }`}
                title="Notifications"
                aria-label="Notifications"
                aria-expanded={showNotifications}
                onClick={() => {
                  setShowNotifications((previous) => !previous);
                  setShowProfile(false);
                }}
              >
                <Bell size={21} />
              </button>

              {showNotifications && (
                <div className="navbar-dropdown notification-dropdown">

                  <div className="dropdown-heading">
                    <h3>Notifications</h3>
                    <Bell size={18} />
                  </div>

                  <div className="notification-empty">
                    <Bell size={28} />

                    <h4>You're all caught up!</h4>

                    <p>
                      New learning reminders and updates
                      will appear here.
                    </p>
                  </div>

                </div>
              )}

            </div>

            {/* STUDENT PROFILE */}
            <div className="navbar-dropdown-wrapper">

              <button
                type="button"
                className={`profile-trigger ${
                  showProfile ? "dropdown-active" : ""
                }`}
                onClick={() => {
                  setShowProfile((previous) => !previous);
                  setShowNotifications(false);
                }}
                aria-expanded={showProfile}
              >
                <span
                  className="profile-avatar"
                  style={{ position: "relative", overflow: "hidden" }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "S"}

                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt="Student avatar"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "50%"
                      }}
                    />
                  )}
                </span>

                <span className="profile-trigger-name">
                  {user?.name || "Student"}
                </span>

                <ChevronDown size={16} />
              </button>

              {showProfile && (
                <div className="navbar-dropdown profile-dropdown">

                  <div className="profile-dropdown-info">

                    <span
                      className="profile-avatar large"
                      style={{ position: "relative", overflow: "hidden" }}
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || "S"}

                      {avatarUrl && (
                        <img
                          src={avatarUrl}
                          alt="Student avatar"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "50%"
                          }}
                        />
                      )}
                    </span>

                    <div>
                      <strong>{user?.name || "Student"}</strong>
                      <p>{user?.email || "Student account"}</p>
                    </div>

                  </div>

                  <div className="dropdown-divider" />

                  <button
                    type="button"
                    className="profile-menu-item"
                    onClick={() => {
                      setShowProfile(false);
                      navigate("/student/profile");
                    }}
                  >
                    <UserRound size={17} />
                    My Profile
                  </button>
                  <button
                    type="button"
                    className="profile-menu-item"
                    onClick={() => {
                      setShowProfile(false);
                      navigate("/student/settings");
                    }}
                  >
                    <Settings size={17} />
                    Settings
                  </button>

                  <div className="dropdown-divider" />

                  <button
                    type="button"
                    className="profile-logout-item"
                    onClick={() => {
                      closeDropdowns();
                      onLogout();
                    }}
                  >
                    Logout
                  </button>

                </div>
              )}

            </div>

          </div>

        </header>

        <div
          className="student-page-content"
          onClick={() => {
            if (showNotifications || showProfile) {
              closeDropdowns();
            }
          }}
        >
          <Outlet />
        </div>

      </main>
    </div>
  );
}

function StudentDashboard({ user, onLogout, onUserUpdate }) {  return (
    <Routes>

      <Route
        path="/student"
        element={
          <StudentLayout
            user={user}
            onLogout={onLogout}
            onUserUpdate={onUserUpdate}
          />
        }
      >
        <Route
          index
          element={<StudentHome user={user} />}
        />
        <Route
          path="profile"
          element={
            <Profile
              user={user}
              onUserUpdate={onUserUpdate}
            />
          }
        />
        <Route
          path="settings"
          element={<SettingsPage user={user} />}
        />
        <Route
          path="exam-preparation"
          element={<ExamPreparationHub />}
        />

        <Route
          path="concept-explanation"
          element={
            <Navigate
              to="/student/exam-preparation"
              state={{ activeTab: "concept" }}
              replace
            />
          }
        />

        <Route
          path="learning-path"
          element={
            <Navigate
              to="/student/exam-preparation"
              state={{ activeTab: "path" }}
              replace
            />
          }
        />

        <Route
          path="practice-questions"
          element={
            <Navigate
              to="/student/exam-preparation"
              state={{ activeTab: "practice" }}
              replace
            />
          }
        />

          <Route
            path="referencebook"
            element={<ReferenceBookAI user={user} />}
          />


        <Route
          path="progress"
          element={<Progress />}
        />

      </Route>

      <Route
        path="*"
        element={<Navigate to="/student" replace />}
      />

    </Routes>
  );
}

export default StudentDashboard;
