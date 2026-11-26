
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  ChartNoAxesColumn,
  FileText,
  GraduationCap,
  X,
  LibraryBig
} from "lucide-react";

function Sidebar({ collapsed, mobileOpen, onClose }) {
  return (
    <aside className="sidebar navigation-sidebar">

      {/* LOGO */}
      <div className="logo sidebar-logo">
        <div className="sidebar-logo-icon">
          <GraduationCap size={27} />
        </div>

        {!collapsed && (
          <h2>LearnWise AI</h2>
        )}

        {mobileOpen && (
          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {!collapsed && (
        <p className="menu-heading">
          LEARNING MENU
        </p>
      )}

      <nav className="sidebar-navigation">

        {/* DASHBOARD */}
        <NavLink
          to="/student"
          end
          onClick={onClose}
          title={collapsed ? "Dashboard" : ""}
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <LayoutDashboard size={20} />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {/* EXAM PREPARATION */}
        <NavLink
          to="/student/exam-preparation"
          onClick={onClose}
          title={collapsed ? "Exam Preparation" : ""}
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <FileText size={20} />
          {!collapsed && <span>Exam Preparation</span>}
        </NavLink>


        {/* WISESHELF AI */}
        <NavLink
          to="/student/referencebook"
          onClick={onClose}
          title={collapsed ? "Book Self" : ""}
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <LibraryBig size={20} />
          {!collapsed && <span>Book Shelf</span>}
        </NavLink>

        {/* PROGRESS */}
        <NavLink
          to="/student/progress"
          onClick={onClose}
          title={collapsed ? "Progress" : ""}
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <ChartNoAxesColumn size={20} />
          {!collapsed && <span>Progress</span>}
        </NavLink>

      </nav>

      {!collapsed && (
        <div className="sidebar-bottom">
          <div className="sidebar-bottom-icon">
            <GraduationCap size={22} />
          </div>

          <p>Learn smarter, not harder.</p>
          <small>Powered by LearnWise AI</small>
        </div>
      )}

    </aside>
  );
}

export default Sidebar;
