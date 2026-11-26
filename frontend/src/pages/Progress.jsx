import { useEffect, useState } from "react";

import {
  ChartNoAxesColumnIncreasing,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  RefreshCw,
  Target,
  Trophy,
  LoaderCircle,
  AlertCircle,
  Route,
  ChevronDown,
  Play,
  BarChart3,
  FileText,
GraduationCap,
ClipboardCheck
} from "lucide-react";

import {
  getMyLearningPaths,
  updateLearningDay,
  getMyPerformanceStats
} from "../services/api";
import "./Progress.css";


function getDayNumber(day, index) {
  const number = Number(day?.day);

  return Number.isInteger(number) && number > 0
    ? number
    : index + 1;
}


function getDayTitle(day, dayNumber) {
  return (
    day?.topic ||
    day?.title ||
    day?.topics ||
    day?.focus ||
    `Study Day ${dayNumber}`
  );
}


function getDayDetails(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return [value];
  }

  return [];
}

function getWeeklyActivity(learningPaths) {
  const today = new Date();
  const monday = new Date(today);

  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const week = [];

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + i);

    const dateKey = [
      currentDate.getFullYear(),
      String(currentDate.getMonth() + 1).padStart(2, "0"),
      String(currentDate.getDate()).padStart(2, "0")
    ].join("-");

    let completedCount = 0;

    learningPaths.forEach(path => {
      const dates = path.completion_dates || [];

      completedCount += dates.filter(
        item => item.completed_on === dateKey
      ).length;
    });

    week.push({
      label: currentDate.toLocaleDateString("en-IN", {
        weekday: "short"
      }),
      date: dateKey,
      completed: completedCount
    });
  }

  return week;
}

function Progress() {
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingDay, setUpdatingDay] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [expandedPaths, setExpandedPaths] = useState({});
  const [performanceStats, setPerformanceStats] = useState({
  total_evaluations: 0,
  total_concepts: 0,
  total_learning_paths: 0,
  total_practice_sessions: 0
});

const [statsLoading, setStatsLoading] = useState(true);
  // Load saved learning paths from MongoDB
 async function loadLearningPaths() {
  try {
    setError("");
    setLoading(true);

    const response = await getMyLearningPaths();

    setLearningPaths(response.learning_paths || []);

  } catch (err) {
    console.error("Progress Loading Error:", err);

    setError(
      err.message || "Unable to load your learning progress."
    );

  } finally {
    setLoading(false);
  }
}
  useEffect(() => {
    loadLearningPaths();
    loadPerformanceStats();

  }, []);

  function togglePath(pathId) {
  setExpandedPaths(previous => ({
    ...previous,
    [pathId]: !previous[pathId]
  }));
}
const loadPerformanceStats = async () => {
  try {
    setStatsLoading(true);

    const response = await getMyPerformanceStats();

    setPerformanceStats(response.stats || {
      total_evaluations: 0,
      total_concepts: 0,
      total_learning_paths: 0,
      total_practice_sessions: 0
    });

  } catch (error) {
    console.error("Performance statistics error:", error);
  } finally {
    setStatsLoading(false);
  }
};
  // Calculate progress for one learning path
  function getPathStats(path) {
    const dailyPlan =
      path.learning_path?.daily_plan || [];

    const completedDays =
      path.completed_days || [];

    const totalDays = dailyPlan.length;

    const completedCount = dailyPlan.filter(
      (day, index) => {
        const dayNumber = getDayNumber(day, index);

        return completedDays.some(
          completed => Number(completed) === dayNumber
        );
      }
    ).length;

    const percentage = totalDays > 0
      ? Math.round((completedCount / totalDays) * 100)
      : 0;

    return {
      totalDays,
      completedCount,
      percentage
    };
  }

  // Calculate overall student progress
  const overallStats = learningPaths.reduce(
    (total, path) => {
      const stats = getPathStats(path);

      return {
        totalDays: total.totalDays + stats.totalDays,
        completedDays:
          total.completedDays + stats.completedCount
      };
    },
    {
      totalDays: 0,
      completedDays: 0
    }
  );

  const overallPercentage =
    overallStats.totalDays > 0
      ? Math.round(
          (overallStats.completedDays /
            overallStats.totalDays) * 100
        )
      : 0;
    
    // Find the next incomplete study day
const nextStudy = learningPaths.flatMap(path => {
  const dailyPlan = path.learning_path?.daily_plan || [];
  const completedDays = path.completed_days || [];

  return dailyPlan.map((day, index) => ({
    pathId: path.id,
    subject: path.subject,
    day,
    dayNumber: getDayNumber(day, index)
  })).filter(item =>
    !completedDays.some(
      completed => Number(completed) === item.dayNumber
    )
  );
})[0] || null;

// Weekly study activity
const weeklyActivity = getWeeklyActivity(learningPaths);

const maxWeeklyActivity = Math.max(
  1,
  ...weeklyActivity.map(day => day.completed)
);
  // Mark a study day complete or incomplete
  async function handleDayToggle(
    pathId,
    dayNumber,
    currentlyCompleted
  ) {
    const updateKey = `${pathId}-${dayNumber}`;

    try {
      setUpdatingDay(updateKey);
      setError("");
      setActionMessage("");

      const response = await updateLearningDay(
        pathId,
        dayNumber,
        !currentlyCompleted
      );

      // Update the page using the latest MongoDB response
      setLearningPaths(previousPaths =>
        previousPaths.map(path =>
          path.id === pathId
            ? {
                ...path,
                completed_days: response.completed_days || [],
                completion_dates: response.completion_dates || []
            }
            : path
        )
      );

      setActionMessage(
        currentlyCompleted
          ? "Study day marked as incomplete."
          : "Great work! Study day completed."
      );

    } catch (err) {
      console.error("Progress Update Error:", err);

      setError(
        err.message || "Unable to update study progress."
      );

    } finally {
      setUpdatingDay(null);
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  // Loading screen
  if (loading) {
    return (
      <div className="progress-loading">
        <LoaderCircle size={35} className="progress-spinner" />
        <h2>Loading your progress...</h2>
        <p>Getting your saved learning journeys.</p>
      </div>
    );
  }

  return (
    <div className="progress-page">

      {/* Page heading */}
      <section className="progress-header">
        <div>
          <span className="progress-eyebrow">
            <ChartNoAxesColumnIncreasing size={16} />
            YOUR LEARNING ANALYTICS
          </span>

          <h1>My Learning Progress</h1>

          <p>
            Track your study journey, complete daily goals
            and stay consistent with your preparation.
          </p>
        </div>

        <button
          type="button"
          className="progress-refresh-btn"
          onClick={loadLearningPaths}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </section>


      {/* Error message */}
      {error && (
        <div className="progress-error">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {/* Success message */}
      {actionMessage && !error && (
        <div className="progress-success">
          <CheckCircle2 size={19} />
          <span>{actionMessage}</span>
        </div>
      )}

    
      {/* Overall statistics */}
      <section className="progress-stats-grid">

        <div className="progress-stat-card">
          <div className="progress-stat-icon purple">
            <Route size={23} />
          </div>

          <div>
            <span>Saved Learning Paths</span>
            <h2>{learningPaths.length}</h2>
            <p>Your personalised roadmaps</p>
          </div>
        </div>


        <div className="progress-stat-card">
          <div className="progress-stat-icon blue">
            <CalendarDays size={23} />
          </div>

          <div>
            <span>Total Study Days</span>
            <h2>{overallStats.totalDays}</h2>
            <p>Across all learning paths</p>
          </div>
        </div>


        <div className="progress-stat-card">
          <div className="progress-stat-icon green">
            <CheckCircle2 size={23} />
          </div>

          <div>
            <span>Completed Days</span>
            <h2>{overallStats.completedDays}</h2>
            <p>Your completed study goals</p>
          </div>
        </div>


        <div className="progress-stat-card">
          <div className="progress-stat-icon orange">
            <Trophy size={23} />
          </div>

          <div>
            <span>Overall Progress</span>
            <h2>{overallPercentage}%</h2>
            <p>Your learning completion rate</p>
          </div>
        </div>

      </section>


      {/* Overall progress bar */}
      <section className="overall-progress-card">

        <div className="overall-progress-heading">
          <div>
            <h2>
              <Target size={21} />
              Overall Learning Progress
            </h2>

            <p>
              Keep completing your daily study goals.
            </p>
          </div>

          <strong>{overallPercentage}%</strong>
        </div>

        <div className="progress-track">
          <div
            className="progress-track-fill"
            style={{
              width: `${overallPercentage}%`
            }}
          />
        </div>

        <div className="overall-progress-footer">
          <span>
            {overallStats.completedDays} of{" "}
            {overallStats.totalDays} days completed
          </span>

          <span>
            {overallStats.totalDays -
              overallStats.completedDays} days remaining
          </span>
        </div>

      </section>

       {/* Continue Learning */}
<section className="continue-learning-card">
  <div className="continue-learning-icon">
    <Play size={25} />
  </div>

  <div className="continue-learning-content">
    <span className="feature-label">PICK UP WHERE YOU LEFT OFF</span>

    {nextStudy ? (
      <>
        <h2>{nextStudy.subject}</h2>

        <p>
          Next: Day {nextStudy.dayNumber} –{" "}
          {getDayTitle(nextStudy.day, nextStudy.dayNumber)}
        </p>

        <button
          type="button"
          className="continue-learning-btn"
          onClick={() => {
            setExpandedPaths(previous => ({
              ...previous,
              [nextStudy.pathId]: true
            }));
          }}
        >
          Continue Learning
          <Play size={15} />
        </button>
      </>
    ) : (
      <>
        <h2>Ready for your next learning journey?</h2>
        <p>
          {learningPaths.length === 0
            ? "Generate and save a learning path to begin."
            : "Congratulations! You have completed all your saved study plans."}
        </p>
      </>
    )}
  </div>
</section>

{/* Weekly Study Activity */}
<section className="weekly-activity-card">
  <div className="weekly-activity-heading">
    <div>
      <h2>
        <BarChart3 size={21} />
        Weekly Study Activity
      </h2>
      <p>Your completed study goals from Monday to Sunday.</p>
    </div>

    <span className="weekly-activity-total">
      {weeklyActivity.reduce(
        (total, day) => total + day.completed,
        0
      )} completed
    </span>
  </div>

  <div className="weekly-chart">
    {weeklyActivity.map(day => (
      <div className="weekly-chart-day" key={day.date}>
        <span className="weekly-chart-count">
          {day.completed}
        </span>

        <div className="weekly-chart-bar-area">
          <div
            className={`weekly-chart-bar ${
              day.completed > 0 ? "has-activity" : ""
            }`}
            style={{
              height: `${Math.max(
                5,
                (day.completed / maxWeeklyActivity) * 100
              )}%`
            }}
            title={`${day.completed} study goals completed`}
          />
        </div>

        <span className="weekly-chart-label">
          {day.label}
        </span>
      </div>
    ))}
  </div>

  <p className="weekly-chart-note">
    Complete a study day to see your activity here.
  </p>
</section>

      {/* Saved learning paths */}
      <section className="saved-paths-section">

        <div className="saved-paths-heading">
          <div>
            <h2>Your Learning Journeys</h2>
            <p>
              Select each study day as you complete it.
            </p>
          </div>

          <span className="saved-path-count">
            {learningPaths.length}{" "}
            {learningPaths.length === 1 ? "Path" : "Paths"}
          </span>
        </div>


        {learningPaths.length === 0 ? (

          <div className="progress-empty-state">
            <div className="progress-empty-icon">
              <BookOpen size={35} />
            </div>

            <h2>No Learning Paths Yet</h2>

            <p>
              You haven't saved any learning paths.
              Generate a personalised study plan and
              click "Add to My Progress" to start tracking.
            </p>

          </div>

        ) : (

          <div className="saved-paths-list">

            {learningPaths.map(path => {
              const dailyPlan =
                path.learning_path?.daily_plan || [];
              const isExpanded = !!expandedPaths[path.id];
              const completedDays =
                path.completed_days || [];

              const stats = getPathStats(path);

              return (

                <article
                  className="saved-path-card"
                  key={path.id}
                >

                  {/* Learning path heading */}
                  {/* Compact learning path header */}
<button
  type="button"
  className="saved-path-toggle"
  onClick={() => togglePath(path.id)}
  aria-expanded={isExpanded}
>
  <div className="saved-path-top">
    <div className="saved-path-title">
      <div className="saved-path-icon">
        <BookOpen size={23} />
      </div>

      <div>
        <h3>{path.subject}</h3>

        <p>
          <Clock3 size={14} />
          Saved on {formatDate(path.created_at)}
        </p>
      </div>
    </div>

    <div className="saved-path-actions">
      <span
        className={`path-status ${
          stats.percentage === 100
            ? "completed"
            : "in-progress"
        }`}
      >
        {stats.percentage === 100
          ? "Completed"
          : "In Progress"}
      </span>

      <span className="path-expand-icon">
        <ChevronDown
          size={21}
          className={isExpanded ? "rotated" : ""}
        />
      </span>
    </div>
  </div>

  {/* Progress is always visible */}
  <div className="path-progress-summary">
    <div>
      <span>Study Completion</span>
      <strong>{stats.percentage}%</strong>
    </div>

    <div className="progress-track">
      <div
        className="progress-track-fill"
        style={{
          width: `${stats.percentage}%`
        }}
      />
    </div>

    <p>
      {stats.completedCount} of {stats.totalDays} study days completed
    </p>
  </div>
</button>


{/* Expandable daily study plan */}
{isExpanded && (
  <div className="daily-study-section">

    <h4>
      <CalendarDays size={18} />
      Daily Study Checklist
    </h4>

    {dailyPlan.length === 0 ? (
      <p className="no-study-days">
        No daily study activities found.
      </p>
    ) : (
      <div className="daily-study-list">

        {dailyPlan.map((day, index) => {
          const dayNumber = getDayNumber(day, index);

          const isCompleted = completedDays.some(
            completed =>
              Number(completed) === dayNumber
          );

          const updateKey = `${path.id}-${dayNumber}`;
          const isUpdating = updatingDay === updateKey;

          const objectives = getDayDetails(
            day.learning_objectives || day.objectives
          );

          const activities = getDayDetails(day.activities);

          return (
            <div
              className={`daily-study-item ${
                isCompleted ? "day-completed" : ""
              }`}
              key={dayNumber}
            >
              <button
                type="button"
                className="day-toggle-btn"
                onClick={() =>
                  handleDayToggle(
                    path.id,
                    dayNumber,
                    isCompleted
                  )
                }
                disabled={updatingDay !== null}
                title={
                  isCompleted
                    ? "Mark as incomplete"
                    : "Mark as completed"
                }
              >
                {isUpdating ? (
                  <LoaderCircle
                    size={22}
                    className="progress-spinner"
                  />
                ) : isCompleted ? (
                  <CheckCircle2 size={23} />
                ) : (
                  <Circle size={23} />
                )}
              </button>

              <div className="day-content">
                <div className="day-heading">
                  <span>DAY {dayNumber}</span>

                  {isCompleted && (
                    <small>Completed</small>
                  )}
                </div>

                <h5>
                  {getDayTitle(day, dayNumber)}
                </h5>

                {objectives.length > 0 && (
                  <div className="day-details">
                    <strong>Learning Objectives</strong>

                    <ul>
                      {objectives.map((objective, i) => (
                        <li key={i}>
                          {String(objective)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activities.length > 0 && (
                  <div className="day-details">
                    <strong>Activities</strong>

                    <ul>
                      {activities.map((activity, i) => (
                        <li key={i}>
                          {String(activity)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}

      </div>
    )}
  </div>
)}
                </article>
              );
            })}

          </div>
        )}

      </section>

    </div>
  );
}

export default Progress;