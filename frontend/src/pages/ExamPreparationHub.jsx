
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  BookOpen,
  Brain,
  Route,
  ClipboardCheck,
  Sparkles,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Clock3
} from "lucide-react";

import ConceptExplanation from "./ConceptExplanation";
import PracticeQuestions from "./PracticeQuestions";
import LearningPath from "./LearningPath";
import ExamPreparation from "./ExamPreparation";
import { getMyConcepts } from "../services/api";
import "./ExamPreparationHub.css";

const tabs = [
  {
    id: "path",
    label: "Learning Path",
    icon: Route,
    description: "Build a personalised study plan for your subjects."
  },
  {
    id: "concept",
    label: "Concept Explanation",
    icon: BookOpen,
    description: "Understand difficult topics through simple AI explanations."
  },
  {
    id: "practice",
    label: "Practice Questions",
    icon: Brain,
    description: "Generate topic-wise MCQs and test your knowledge."
  },
  {
    id: "evaluate",
    label: "Evaluate Answers",
    icon: ClipboardCheck,
    description: "Submit your answers and receive AI-powered feedback."
  }
];


function ExamPreparationHub() {
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "concept"
  );
  const [concepts, setConcepts] = useState([]);
const [searchTerm, setSearchTerm] = useState("");
const [selectedConcept, setSelectedConcept] = useState(null);
const [historyLoading, setHistoryLoading] = useState(true);
const [historyError, setHistoryError] = useState("");

useEffect(() => {
  async function loadConcepts() {
    try {
      setHistoryLoading(true);

      const response = await getMyConcepts();

      setConcepts(response.concepts || []);
    } catch (error) {
      setHistoryError(
        error.message || "Unable to load concept history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  loadConcepts();
}, []);

const filteredConcepts = concepts.filter((concept) => {
  const search = searchTerm.toLowerCase();

  return (
    concept.subject.toLowerCase().includes(search) ||
    concept.topic.toLowerCase().includes(search)
  );
});

  function toggleConcept(concept) {
  setSelectedConcept((previous) =>
    previous?.id === concept.id ? null : concept
  );
}

function downloadConcept(concept) {
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert("Please allow pop-ups to download your concept.");
    return;
  }

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHTML(concept.topic)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 35px;
            line-height: 1.7;
            color: #25253a;
          }

          h1 {
            color: #5945a8;
          }

          .details {
            color: #666;
            margin-bottom: 25px;
          }

          .explanation {
            white-space: pre-wrap;
            font-size: 14px;
          }

          @media print {
            body {
              padding: 15px;
            }
          }
        </style>
      </head>

      <body>
        <h1>${escapeHTML(concept.topic)}</h1>

        <div class="details">
          <strong>Subject:</strong>
          ${escapeHTML(concept.subject)}
          <br />

          <strong>Learning Level:</strong>
          ${escapeHTML(concept.learning_level)}
        </div>

        <hr />

        <div class="explanation">
          ${escapeHTML(concept.explanation)}
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        <\/script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

  function renderActiveTab() {
    switch (activeTab) {
      case "path":
        return <LearningPath />;

      case "concept":
        return <ConceptExplanation />;

      case "practice":
        return <PracticeQuestions />;

      case "evaluate":
        return <ExamPreparation />;

      default:
        return <ConceptExplanation />;
    }
  }

  return (
    <div className="exam-hub-page">

      <section className="exam-hub-header">
        <div className="exam-hub-icon">
          <Sparkles size={28} />
        </div>

        <div>
          <span className="exam-hub-eyebrow">
            YOUR AI-POWERED LEARNING CENTRE
          </span>

          <h1>Exam Preparation</h1>

          <p>
            Learn concepts, practise questions, create
            study plans and improve your exam answers
            in one place.
          </p>
        </div>
      </section>

      <section className="exam-hub-tabs-section">

        <div
          className="exam-hub-tabs"
          role="tablist"
          aria-label="Exam preparation features"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`exam-hub-tab ${
                  isActive ? "active" : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={19} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="exam-hub-description">
          <p>
            {tabs.find(
              (tab) => tab.id === activeTab
            )?.description}
          </p>
        </div>

      </section>

      <section className="exam-hub-content">
        {renderActiveTab()}
      </section>
      <section className="concept-history">

  <div className="concept-history-heading">
    <div>
      <span className="history-eyebrow">
        <BookOpen size={15} />
        YOUR LEARNING LIBRARY
      </span>

      <h2>Previously Explained Concepts</h2>

      <p>
        Revisit your previously generated AI explanations
        whenever you need them.
      </p>
    </div>

    <div className="history-count">
      {concepts.length} Saved
    </div>
  </div>

  <div className="concept-search">
    <Search size={19} />

    <input
      type="text"
      placeholder="Search by subject or topic..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  {historyLoading ? (
    <p className="history-status">
      Loading your saved concepts...
    </p>
  ) : historyError ? (
    <p className="history-status error">
      {historyError}
    </p>
  ) : filteredConcepts.length === 0 ? (
    <div className="empty-concept-history">
      <BookOpen size={35} />

      <h3>
        {searchTerm
          ? "No matching concepts found"
          : "No saved concepts yet"}
      </h3>

      <p>
        {searchTerm
          ? "Try searching with another subject or topic."
          : "Generate your first concept explanation to see it here."}
      </p>
    </div>
  ) : (
    <div className="concept-history-list">

      {filteredConcepts.map((concept) => {
        const isSelected =
          selectedConcept?.id === concept.id;

        return (
          <article
            className="saved-concept-card"
            key={concept.id}
          >

            <div
              className="saved-concept-main"
              onClick={() => toggleConcept(concept)}
            >

              <div className="saved-concept-icon">
                <BookOpen size={22} />
              </div>

              <div className="saved-concept-info">
                <h3>{concept.topic}</h3>

                <p>{concept.subject}</p>

                <div className="saved-concept-meta">
                  <span>{concept.learning_level}</span>

                  {concept.created_at && (
                    <span>
                      <Clock3 size={13} />

                      {new Date(
                        concept.created_at
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="concept-expand-btn"
                aria-label={
                  isSelected
                    ? "Close explanation"
                    : "Open explanation"
                }
                onClick={(event) => {
                  event.stopPropagation();
                  toggleConcept(concept);
                }}
              >
                {isSelected
                  ? <ChevronUp size={20} />
                  : <ChevronDown size={20} />}
              </button>

            </div>

            {isSelected && (
              <div className="saved-concept-details">

                <div className="saved-explanation">
                  {concept.explanation}
                </div>

                <button
                  type="button"
                  className="concept-download-btn"
                  onClick={() => downloadConcept(concept)}
                >
                  <Download size={17} />
                  Download as PDF
                </button>

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

export default ExamPreparationHub;
