
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FileText,
  BookOpen,
  Route,
  Brain,
  ChartNoAxesColumn,
  Sparkles,
  ArrowUpRight,
  CalendarDays,
  Target,
  Lightbulb,
  GraduationCap,
  ClipboardCheck,
  Clock3,
  Compass
} from "lucide-react";

import ConceptExplanation from "./ConceptExplanation";
import LearningPath from "./LearningPath";
import PracticeQuestions from "./PracticeQuestions";
import { getMyPerformanceStats } from "../services/api";
const pageDetails = {
  exam: {
    title: "Exam Preparation",
    description: "Prepare structured, exam-oriented answers with AI.",
    icon: FileText
  },
  concept: {
    title: "Concept Explanation",
    description: "Understand difficult concepts through simple explanations and examples.",
    icon: BookOpen
  },
  path: {
    title: "Personalised Learning Path",
    description: "Follow a structured learning journey based on your topics and performance.",
    icon: Route
  },
  practice: {
    title: "Practice Questions",
    description: "Improve your knowledge with topic-wise practice.",
    icon: Brain
  },
  progress: {
    title: "My Learning Progress",
    description: "Track your learning activities and answer evaluation results.",
    icon: ChartNoAxesColumn
  }
};

const learningModules = [
  {
    title: "Learning Path",
    description: "Build a step-by-step learning journey around the topics you want to master.",
    icon: Route,
    path: "/student/learning-path",
    label: "Plan your learning",
    number: "01",
    theme: "green"
  },
  {
    title: "Concept Explanation",
    description: "Break down difficult topics into simple explanations, examples and key points.",
    icon: BookOpen,
    path: "/student/concept-explanation",
    label: "Understand concepts",
    number: "02",
    theme: "violet"
  },
  {
    title: "Practice Questions",
    description: "Strengthen your understanding through topic-wise practice sessions.",
    icon: Brain,
    path: "/student/practice-questions",
    label: "Test your knowledge",
    number: "03",
    theme: "orange"
  },
  
  {
    title: "Evaluate Answers",
    description: "Create structured answers and prepare for different exam mark patterns.",
    icon: FileText,
    path: "/student/exam-preparation",
    label: "Prepare for exams",
    number: "04",
    theme: "blue"
  },
  
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function StudentHome({ user }) {
  
  const [performanceStats, setPerformanceStats] = useState({
  total_evaluations: 0,
  total_concepts: 0,
  total_learning_paths: 0,
  total_practice_sessions: 0
});

const [statsLoading, setStatsLoading] = useState(true);

useEffect(() => {
  const loadPerformanceStats = async () => {
    try {
      const response = await getMyPerformanceStats();

      setPerformanceStats(response.stats || {
        total_evaluations: 0,
        total_concepts: 0,
        total_learning_paths: 0,
        total_practice_sessions: 0
      });
    } catch (error) {
      console.error("Student dashboard statistics error:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  loadPerformanceStats();
}, []);
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const firstName = user?.name?.trim()?.split(" ")[0] || "Student";

  return (
    <div className="student-home dashboard-v2">

      {/* WELCOME BANNER */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="dashboard-eyebrow">
            <Sparkles size={15} />
            YOUR PERSONAL AI LEARNING SPACE
          </div>

          <h1>
            {getGreeting()}, {firstName}!
            <br />
            <span>Ready to learn something new?</span>
          </h1>

          <p>
            Every concept you understand and every question you practise
            brings you one step closer to your goals.
          </p>

          <div className="dashboard-hero-actions">
            <Link
              to="/student/exam-preparation"
              className="dashboard-primary-btn"
            >
              Start Learning
              <ArrowUpRight size={18} />
            </Link>

            <div className="dashboard-date">
              <CalendarDays size={17} />
              <span>{today}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-hero-art" aria-hidden="true">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />

          <div className="hero-glow">
            <GraduationCap size={76} strokeWidth={1.35} />
          </div>

          <div className="hero-floating-card hero-card-top">
            <Sparkles size={17} />
            <span>Learn with AI</span>
          </div>

          <div className="hero-floating-card hero-card-bottom">
            <Brain size={18} />
            <span>Think. Learn. Grow.</span>
          </div>
        </div>
      </section>
      <br></br>
        {/* STUDENT PERFORMANCE OVERVIEW */}
        <section className="student-performance-section">

          <div className="dashboard-section-heading">
            <div>
              <h2>My Performance Overview</h2>
              <p>Keep track of your learning activities and progress.</p>
            </div>
          </div>

          <div className="student-performance-grid">

            <div className="student-performance-card">
              <div className="student-performance-icon green">
                <GraduationCap size={22} />
              </div>
              <p>Learning Paths</p>
              <h2>
                {statsLoading
                  ? "..."
                  : Number(performanceStats.total_learning_paths).toLocaleString("en-IN")}
              </h2>
              <span>Personalised learning paths saved</span>
            </div>
            
            <div className="student-performance-card">
              <div className="student-performance-icon orange">
                <BookOpen size={22} />
              </div>
              <p>Concepts Learned</p>
              <h2>
                {statsLoading
                  ? "..."
                  : Number(performanceStats.total_concepts).toLocaleString("en-IN")}
              </h2>
              <span>Concept explanations generated</span>
            </div>

            <div className="student-performance-card">
              <div className="student-performance-icon pink">
                <ClipboardCheck size={22} />
              </div>
              <p>Practice Sessions</p>
              <h2>
                {statsLoading
                  ? "..."
                  : Number(performanceStats.total_practice_sessions).toLocaleString("en-IN")}
              </h2>
              <span>Practice sessions saved</span>
            </div>

            <div className="student-performance-card">
              <div className="student-performance-icon purple">
                <FileText size={22} />
              </div>
              <p>Total Evaluations</p>
              <h2>
                {statsLoading
                  ? "..."
                  : Number(performanceStats.total_evaluations).toLocaleString("en-IN")}
              </h2>
              <span>Answers evaluated by AI</span>
            </div>

          </div>
        </section>




      {/* OVERVIEW */}
      <section className="dashboard-overview">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-section-kicker">YOUR WORKSPACE</span>
            <h2>Your learning toolkit</h2>
            <p>Everything you need to study smarter, in one place.</p>
          </div>

          <div className="module-count">
            <span className="module-count-icon">
              <GraduationCap size={19} />
            </span>
            <div>
              <strong>04</strong>
              <small>Learning modules</small>
            </div>
          </div>
        </div>

        <div className="dashboard-module-grid">
          {learningModules.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                to={item.path}
                className={`dashboard-module-card ${item.theme}`}
                key={item.title}
              >
                <div className="module-card-top">
                  <div className="module-icon">
                    <Icon size={23} />
                  </div>

                  <span className="module-number">{item.number}</span>
                </div>

                <div className="module-card-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>

                <div className="module-card-footer">
                  <span>{item.label}</span>
                  <span className="module-arrow">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* STUDY FOCUS */}
      <section className="dashboard-bottom-grid">

        <div className="study-focus-card">
          <div className="study-focus-icon">
            <Target size={23} />
          </div>

          <div className="study-focus-content">
            <span className="dashboard-section-kicker">YOUR NEXT STEP</span>
            <h2>Make today a learning day.</h2>
            <p>
              Choose a topic, understand the concept, practise what you
              learned and evaluate your answers.
            </p>

            <div className="study-flow">
              <div>
                <span className="study-flow-number">01</span>
                <span>Understand</span>
              </div>
              <span className="study-flow-line" />
              <div>
                <span className="study-flow-number">02</span>
                <span>Practise</span>
              </div>
              <span className="study-flow-line" />
              <div>
                <span className="study-flow-number">03</span>
                <span>Improve</span>
              </div>
            </div>

            <Link
              to="/student/concept-explanation"
              className="study-focus-link"
            >
              Explore a concept
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>

        <div className="dashboard-tip-card">
          <div className="tip-card-decoration">
            <Lightbulb size={26} />
          </div>

          <span className="dashboard-section-kicker">LEARNWISE TIP</span>
          <h3>Small steps create big progress.</h3>
          <p>
            Don't just memorise an answer. Understand the idea, explain
            it in your own words and practise recalling it.
          </p>

          <div className="tip-card-footer">
            <Sparkles size={16} />
            <span>Learn smarter, not harder.</span>
          </div>
        </div>

      </section>

      {/* PROGRESS LINK */}
      <Link to="/student/progress" className="dashboard-progress-link">
        <div className="progress-link-icon">
          <ChartNoAxesColumn size={22} />
        </div>

        <div>
          <strong>Explore your learning progress</strong>
          <p>Review your learning activity and answer evaluation results.</p>
        </div>

        <ArrowUpRight size={20} />
      </Link>

    </div>
  );
}

export function FeaturePage({ type }) {
  if (type === "concept") return <ConceptExplanation />;
  if (type === "path") return <LearningPath />;
  if (type === "practice") return <PracticeQuestions />;

  const details = pageDetails[type];

  if (!details) {
    return <h2>Page not found</h2>;
  }

  const Icon = details.icon;

  return (
    <section className="feature-page">
      <div className="feature-heading-icon">
        <Icon size={30} />
      </div>

      <h1>{details.title}</h1>
      <p>{details.description}</p>

      <div className="feature-placeholder">
        <Sparkles size={35} />
        <h2>Your {details.title} workspace</h2>
        <p>
          This page is ready for its dedicated learning functionality.
          We will connect the required AI features and saved student data next.
        </p>
      </div>
    </section>
  );
}
