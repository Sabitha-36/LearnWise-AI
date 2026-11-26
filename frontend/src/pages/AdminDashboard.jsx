
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  BookOpen,
  ClipboardCheck,
  Search,
  Bell,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Menu,
  X,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  UserRound,
  CalendarDays,
  ArrowUpRight,
  Eye,
  Clock3,
  Target,
  Sparkles,
  BookMarked,
  Activity,
  Mail,
  Building2,
  Award,
  CheckCircle2
} from "lucide-react";

import "./AdminDashboard.css";

const API_BASE = "http://localhost:5000/api/admin";

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "students", label: "Students", icon: Users }
];

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function AdminDashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageSize = 8;

  async function fetchAdminData() {
    setLoading(true);
    setError("");

    try {
      const [overviewResponse, studentsResponse] = await Promise.all([
        fetch(`${API_BASE}/overview`, {
          credentials: "include"
        }),
        fetch(`${API_BASE}/students?page=1&limit=100`, {
          credentials: "include"
        })
      ]);

      const overviewData = await overviewResponse.json();
      const studentsData = await studentsResponse.json();

      if (!overviewResponse.ok) {
        throw new Error(
          overviewData.error || "Unable to load dashboard statistics."
        );
      }

      if (!studentsResponse.ok) {
        throw new Error(
          studentsData.error || "Unable to load students."
        );
      }

      setOverview(overviewData.overview);
      setStudents(studentsData.students || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function openStudentDetails(student) {
    setStudentLoading(true);
    setSelectedStudent(null);

    try {
      const response = await fetch(
        `${API_BASE}/students/${student.id}`,
        { credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load student details.");
      }

      setSelectedStudent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setStudentLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return students;

    return students.filter((student) =>
      [
        student.name,
        student.email,
        student.course,
        student.department,
        student.college
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [students, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / pageSize)
  );

  const displayedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  function changePage(page) {
    setActivePage(page);
    setSelectedStudent(null);
    setSidebarOpen(false);
  }

  const statCards = [
    {
      title: "Total Students",
      value: overview?.total_students ?? 0,
      icon: Users,
      color: "blue",
      description: "Registered student accounts"
    },
    {
      title: "Answer Evaluations",
      value: overview?.total_evaluations ?? 0,
      icon: FileText,
      color: "purple",
      description: "Answers evaluated by AI"
    },
    {
      title: "Concept Explanations",
      value: overview?.total_concepts ?? 0,
      icon: BookOpen,
      color: "orange",
      description: "Learning explanations saved"
    },
    {
      title: "Saved Learning Paths",
      value: overview?.total_learning_paths ?? 0,
      icon: GraduationCap,
      color: "green",
      description: "Study plans saved by students"
    },
    {
      title: "Practice Sessions",
      value: overview?.total_practice_sessions ?? 0,
      icon: ClipboardCheck,
      color: "pink",
      description: "Saved practice sessions"
    }
  ];

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <LoaderCircle className="admin-loader" size={36} />
        <h3>Preparing your dashboard</h3>
        <p>Loading LearnWise AI platform data...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">

      {sidebarOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <GraduationCap size={25} />
          </div>
          <div>
            <h2>LearnWise <span>AI</span></h2>
            <p>ADMIN CONSOLE</p>
          </div>

          <button
            className="admin-close-sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="admin-nav-heading">WORKSPACE</div>

        <nav className="admin-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`admin-nav-item ${
                  activePage === item.id ? "active" : ""
                }`}
                onClick={() => changePage(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {activePage === item.id && (
                  <span className="admin-nav-indicator" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-help">
            <div className="admin-help-icon">
              <Sparkles size={19} />
            </div>
            <h4>LearnWise AI</h4>
            <p>Empowering students through personalised learning.</p>
          </div>

          <button className="admin-logout" onClick={onLogout}>
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">

        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-button"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <div className="admin-breadcrumb">
                Admin Console <ChevronRight size={14} />
                {selectedStudent ? "Student Details" :
                  activePage === "overview" ? "Overview" : "Students"}
              </div>
              <h2>
                {selectedStudent
                  ? selectedStudent.student.name
                  : activePage === "overview"
                  ? "Dashboard Overview"
                  : "Student Management"}
              </h2>
            </div>
          </div>

          <div className="admin-topbar-right">
            <button
              className="admin-refresh-button"
              onClick={fetchAdminData}
              title="Refresh dashboard"
            >
              <RefreshCw size={17} />
            </button>

            <div className="admin-topbar-divider" />

            <div className="admin-user-info">
              <div className="admin-user-avatar">
                {getInitials(user?.name || "Admin")}
              </div>
              <div>
                <strong>{user?.name || "Administrator"}</strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">

          {error && (
            <div className="admin-error">
              <AlertCircle size={19} />
              <span>{error}</span>
              <button onClick={() => setError("")}>
                <X size={17} />
              </button>
            </div>
          )}

          {/* OVERVIEW */}
          {activePage === "overview" && !selectedStudent && (
            <>
              <section className="admin-welcome-banner">
                <div>
                  <span className="admin-welcome-tag">
                    <Sparkles size={14} /> PLATFORM OVERVIEW
                  </span>
                  <h1>Welcome back, {user?.name?.split(" ")[0] || "Admin"}!</h1>
                  <p>
                    Here's what's happening across your LearnWise AI platform.
                  </p>
                </div>

                <div className="admin-welcome-art">
                  <div className="admin-art-circle">
                    <GraduationCap size={54} />
                  </div>
                </div>
              </section>

              <section className="admin-section-heading">
                <div>
                  <h3>Platform Statistics</h3>
                  <p>A real-time summary of recorded platform activities.</p>
                </div>
                <span className="admin-live-label">
                  <span /> Database connected
                </span>
              </section>

              <section className="admin-stats-grid">
                {statCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div className="admin-stat-card" key={card.title}>
                      <div className={`admin-stat-icon ${card.color}`}>
                        <Icon size={21} />
                      </div>
                      <p>{card.title}</p>
                      <h2>{Number(card.value).toLocaleString("en-IN")}</h2>
                      <span>{card.description}</span>
                    </div>
                  );
                })}
              </section>

              <section className="admin-section-heading admin-student-heading">
                <div>
                  <h3>Recently Registered Students</h3>
                  <p>Latest student accounts registered on the platform.</p>
                </div>
                <button
                  className="admin-text-button"
                  onClick={() => changePage("students")}
                >
                  View all students <ArrowUpRight size={16} />
                </button>
              </section>

              <StudentTable
                students={students.slice(0, 5)}
                onView={openStudentDetails}
              />

              <section className="admin-quick-info">
                <div className="admin-quick-icon">
                  <Activity size={21} />
                </div>
                <div>
                  <h4>Platform activity insights</h4>
                  <p>
                    These statistics are based on records saved in your
                    LearnWise AI database. Login duration and active-user
                    tracking will be added separately.
                  </p>
                </div>
              </section>
            </>
          )}

          {/* STUDENT MANAGEMENT */}
          {activePage === "students" && !selectedStudent && (
            <>
              <section className="admin-page-intro">
                <div>
                  <span className="admin-eyebrow">USER DIRECTORY</span>
                  <h1>Student Management</h1>
                  <p>
                    View registered students and explore their learning activity.
                  </p>
                </div>

                <div className="admin-total-students">
                  <Users size={20} />
                  <div>
                    <strong>{students.length}</strong>
                    <span>Students loaded</span>
                  </div>
                </div>
              </section>

              <section className="admin-student-panel">
                <div className="admin-table-toolbar">
                  <div>
                    <h3>All Students</h3>
                    <p>Search and view student profiles.</p>
                  </div>

                  <div className="admin-search">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Search name, email, course..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button onClick={() => setSearch("")}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <StudentTable
                  students={displayedStudents}
                  onView={openStudentDetails}
                  showActivity
                />

                <div className="admin-pagination">
                  <span>
                    Showing {filteredStudents.length === 0 ? 0 :
                      (currentPage - 1) * pageSize + 1}
                    {" - "}
                    {Math.min(currentPage * pageSize, filteredStudents.length)}
                    {" of "}{filteredStudents.length} students
                  </span>

                  <div>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft size={17} />
                    </button>
                    <span>{currentPage} / {totalPages}</span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* STUDENT DETAILS */}
          {selectedStudent && (
            <StudentDetails
              data={selectedStudent}
              onBack={() => setSelectedStudent(null)}
            />
          )}

          {studentLoading && (
            <div className="admin-detail-loading">
              <LoaderCircle className="admin-loader" size={30} />
              <p>Loading student profile...</p>
            </div>
          )}
        </div>

        <footer className="admin-footer">
          <span>© 2026 LearnWise AI</span>
          <span>Admin Console <span className="admin-footer-dot">•</span> Built for smarter learning</span>
        </footer>
      </main>
    </div>
  );
}


/* STUDENT TABLE */

function StudentTable({ students, onView, showActivity = false }) {
  if (!students.length) {
    return (
      <div className="admin-empty-state">
        <Users size={34} />
        <h3>No students found</h3>
        <p>Registered student accounts will appear here.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-scroll">
      <table className="admin-student-table">
        <thead>
          <tr>
            <th>STUDENT</th>
            <th>COURSE / DEPARTMENT</th>
            <th>REGISTERED ON</th>
            {showActivity && <th>ACTIVITY</th>}
            <th>PROFILE</th>
          </tr>
        </thead>

        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>
                <div className="admin-student-cell">
                  {student.avatar_url || student.avatar ? (
                    <img
                      src={student.avatar_url || student.avatar}
                      alt={student.name}
                    />
                  ) : (
                    <div className="admin-student-avatar">
                      {getInitials(student.name)}
                    </div>
                  )}
                  <div>
                    <strong>{student.name || "Unnamed Student"}</strong>
                    <span>{student.email}</span>
                  </div>
                </div>
              </td>

              <td>
                <strong className="admin-course-name">
                  {student.course || student.department || "Not specified"}
                </strong>
                <span className="admin-table-subtext">
                  {student.department || student.college || "—"}
                </span>
              </td>

              <td>
                <span className="admin-date-cell">
                  <CalendarDays size={15} />
                  {formatDate(student.created_at)}
                </span>
              </td>

              {showActivity && (
                <td>
                  <div className="admin-activity-counts">
                    <span title="Evaluations">
                      <FileText size={14} />
                      {student.activity?.evaluations ?? 0}
                    </span>
                    <span title="Concepts">
                      <BookOpen size={14} />
                      {student.activity?.concepts ?? 0}
                    </span>
                  </div>
                </td>
              )}

              <td>
                <button
                  className="admin-view-button"
                  onClick={() => onView(student)}
                >
                  <Eye size={15} /> View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


/* INDIVIDUAL STUDENT DETAILS */

function StudentDetails({ data, onBack }) {
  const student = data.student;
  const activity = data.activity || {};

  const evaluationHistory = data.evaluation_history || [];
  const conceptHistory = data.concept_history || [];
  const pathHistory = data.learning_path_history || [];
  const practiceHistory = data.practice_history || [];

  const averageScore = evaluationHistory.length
    ? (
        evaluationHistory.reduce(
          (sum, item) => sum + Number(item.percentage || 0), 0
        ) / evaluationHistory.length
      ).toFixed(1)
    : null;

  return (
    <section className="admin-detail-page">
      <button className="admin-back-button" onClick={onBack}>
        <ChevronLeft size={18} /> Back to students
      </button>

      <div className="admin-profile-card">
        <div className="admin-profile-avatar">
          {getInitials(student.name)}
        </div>

        <div className="admin-profile-main">
          <span className="admin-eyebrow">STUDENT PROFILE</span>
          <h1>{student.name}</h1>
          <p><Mail size={15} /> {student.email}</p>
          <p><Building2 size={15} /> {student.college || "College not specified"}</p>
        </div>

        <div className="admin-profile-date">
          <CalendarDays size={17} />
          <div>
            <span>Registered on</span>
            <strong>{formatDate(student.created_at)}</strong>
          </div>
        </div>
      </div>

      <div className="admin-section-heading">
        <div>
          <h3>Learning Activity Summary</h3>
          <p>Recorded learning activities for this student.</p>
        </div>
      </div>

      <div className="admin-detail-stats">
        <DetailStat icon={FileText} label="Evaluations" value={activity.evaluations || 0} />
        <DetailStat icon={BookOpen} label="Concepts Explained" value={activity.concepts || 0} />
        <DetailStat icon={GraduationCap} label="Saved Learning Paths" value={activity.learning_paths || 0} />
        <DetailStat icon={ClipboardCheck} label="Practice Sessions" value={activity.practice_sessions || 0} />
      </div>

      <div className="admin-section-heading">
        <div>
          <h3>Academic Performance</h3>
          <p>Based on the latest 20 answer evaluations.</p>
        </div>
      </div>

      <div className="admin-performance-card">
        <div className="admin-performance-summary">
          <div className="admin-performance-icon">
            <Award size={23} />
          </div>
          <div>
            <span>Average evaluation percentage</span>
            <h2>{averageScore === null ? "—" : `${averageScore}%`}</h2>
            <p>
              {evaluationHistory.length} evaluation records available
            </p>
          </div>
        </div>

        {evaluationHistory.length > 0 ? (
          <div className="admin-score-list">
            {evaluationHistory.slice(0, 8).map((item) => (
              <div className="admin-score-row" key={item.id}>
                <div className="admin-score-info">
                  <strong>{item.topic || item.subject || "Evaluation"}</strong>
                  <span>{formatDate(item.created_at)}</span>
                </div>
                <div className="admin-score-track">
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, Number(item.percentage || 0))
                      )}%`
                    }}
                  />
                </div>
                <strong className="admin-score-value">
                  {item.percentage ?? 0}%
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-history-empty">
            No answer evaluations recorded yet.
          </div>
        )}
      </div>

      <div className="admin-history-grid">
        <HistoryCard
          title="Concept Explanations"
          icon={BookOpen}
          items={conceptHistory}
          empty="No concept explanations recorded."
          renderItem={(item) => (
            <>
              <strong>{item.topic || "Untitled concept"}</strong>
              <span>{item.subject} · {item.learning_level || "—"}</span>
              <small>{formatDate(item.created_at)}</small>
            </>
          )}
        />

        <HistoryCard
          title="Learning Paths"
          icon={GraduationCap}
          items={pathHistory}
          empty="No saved learning paths found."
          renderItem={(item) => (
            <>
              <strong>{item.subject || "Untitled learning path"}</strong>
              <span>
                {item.completed_days} of {item.total_days} days completed
              </span>
              <small>{formatDate(item.created_at)}</small>
            </>
          )}
        />

        <HistoryCard
          title="Practice Sessions"
          icon={ClipboardCheck}
          items={practiceHistory}
          empty="No practice sessions recorded."
          renderItem={(item) => (
            <>
              <strong>{item.topic || item.subject || "Practice session"}</strong>
              <span>
                {item.score?.correct ?? 0} correct out of {item.score?.total ?? 0}
                {" · "}{item.score?.percentage ?? 0}%
              </span>
              <small>{formatDate(item.created_at)}</small>
            </>
          )}
        />
      </div>
    </section>
  );
}


function DetailStat({ icon: Icon, label, value }) {
  return (
    <div className="admin-detail-stat">
      <div><Icon size={19} /></div>
      <span>{label}</span>
      <strong>{Number(value).toLocaleString("en-IN")}</strong>
    </div>
  );
}


function HistoryCard({ title, icon: Icon, items, empty, renderItem }) {
  return (
    <div className="admin-history-card">
      <div className="admin-history-heading">
        <div><Icon size={19} /></div>
        <h3>{title}</h3>
        <span>{items.length}</span>
      </div>

      {items.length ? (
        <div className="admin-history-list">
          {items.slice(0, 6).map((item) => (
            <div className="admin-history-item" key={item.id}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-history-empty">{empty}</div>
      )}
    </div>
  );
}

export default AdminDashboard;
