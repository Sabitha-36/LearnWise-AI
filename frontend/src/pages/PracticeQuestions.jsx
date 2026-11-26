
import { useEffect, useState } from "react";
import {
  Brain,
  FileUp,
  BookOpen,
  Route,
  Sparkles,
  LoaderCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Save,
  Trophy
} from "lucide-react";

import {
  generatePracticeQuestions,
  savePracticeSession,
  getMyLearningPaths
} from "../services/api";

import "./PracticeQuestions.css";

function PracticeQuestions() {
  const [sourceType, setSourceType] = useState("manual");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [learningLevel, setLearningLevel] = useState("Beginner");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState("5");

  const [syllabusFile, setSyllabusFile] = useState(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [learningPaths, setLearningPaths] = useState([]);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sessionSaved, setSessionSaved] = useState(false);

  useEffect(() => {
    async function loadPaths() {
      try {
        const response = await getMyLearningPaths();
        setLearningPaths(response.learning_paths || []);
      } catch (err) {
        console.error("Unable to load learning paths:", err);
      }
    }

    loadPaths();
  }, []);

  const selectedLearningPath = learningPaths.find(
    (path) => path.id === selectedPath
  );

  // Generate MCQ questions.
  async function handleGenerate(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setSessionSaved(false);

    if (sourceType === "manual" && (!subject.trim() || !topic.trim())) {
      setError("Please enter your subject and topic.");
      return;
    }

    if (sourceType === "pdf" && !subject.trim()) {
      setError("Please enter your subject.");
      return;
    }

    if (sourceType === "pdf" && !syllabusFile) {
      setError("Please upload your syllabus PDF.");
      return;
    }

    if (sourceType === "learning_path" && !selectedPath) {
      setError("Please select a saved learning path.");
      return;
    }

    if (sourceType === "learning_path" && !topic.trim()) {
      setError("Please enter the topic you want to practise.");
      return;
    }

    const formData = new FormData();

    formData.append("source_type", sourceType);
    formData.append("subject", subject);
    formData.append("topic", topic);
    formData.append("learning_level", learningLevel);
    formData.append("question_type", "mcq");
    formData.append("difficulty", difficulty);
    formData.append("question_count", questionCount);

    if (sourceType === "pdf") {
      formData.append("file", syllabusFile);
    }

    if (sourceType === "learning_path") {
      formData.append("path_id", selectedPath);

      if (selectedLearningPath) {
        formData.set(
          "subject",
          selectedLearningPath.subject || subject
        );
      }
    }

    setLoading(true);

    try {
      const response = await generatePracticeQuestions(formData);

      const generatedQuestions = response.questions || [];

      if (!generatedQuestions.length) {
        setError("No questions were returned. Please try again.");
        return;
      }

      // Validate generated MCQs.
      const invalidQuestion = generatedQuestions.some(
        (question) =>
          !question.question ||
          !Array.isArray(question.options) ||
          question.options.length !== 4 ||
          !Number.isInteger(Number(question.correct_index)) ||
          Number(question.correct_index) < 0 ||
          Number(question.correct_index) > 3
      );

      if (invalidQuestion) {
        setError(
          "Some generated questions have an invalid format. Please generate again."
        );
        return;
      }

      setQuestions(generatedQuestions);
      setMessage(response.message || "MCQ questions generated successfully.");

    } catch (err) {
      setError(err.message || "Unable to generate practice questions.");
    } finally {
      setLoading(false);
    }
  }

  // Select an answer.
  function handleMCQAnswer(questionIndex, optionIndex) {
    if (submitted) return;

    setAnswers((previous) => ({
      ...previous,
      [questionIndex]: optionIndex
    }));

    setError("");
  }

  // Calculate score.
  function calculateScore() {
    const correct = questions.filter(
      (question, index) =>
        Number(answers[index]) === Number(question.correct_index)
    ).length;

    return {
      total: questions.length,
      correct,
      percentage: questions.length
        ? Math.round((correct / questions.length) * 100)
        : 0
    };
  }

  // Submit answers.
  async function handleSubmit() {
    if (submitted || submitting) return;

    if (questions.some((question, index) => answers[index] === undefined)) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setError("");
    setSubmitting(true);
    setSubmitted(true);

    try {
      const score = calculateScore();

      await savePracticeSession({
        subject,
        topic,
        question_type: "mcq",
        marks: null,
        difficulty,
        questions,
        answers,
        score
      });

      setSessionSaved(true);
      setMessage("Your MCQ practice session has been saved successfully.");

    } catch (err) {
      setMessage(
        "Your answers were submitted, but saving failed: " + err.message
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Save again if the initial save fails.
  async function handleSaveAgain() {
    if (saving || sessionSaved) return;

    setSaving(true);
    setError("");

    try {
      await savePracticeSession({
        subject,
        topic,
        question_type: "mcq",
        marks: null,
        difficulty,
        questions,
        answers,
        score: calculateScore()
      });

      setSessionSaved(true);
      setMessage("Practice session saved successfully!");

    } catch (err) {
      setError(err.message || "Unable to save practice session.");
    } finally {
      setSaving(false);
    }
  }

  // Start new practice.
  function resetPractice() {
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setSessionSaved(false);
    setError("");
    setMessage("");
  }

  const score = calculateScore();

  return (
    <div className="practice-page">

      {/* Heading */}
      <div className="practice-heading">
        <div className="practice-heading-icon">
          <Brain size={32} />
          </div>
         <div>
          <h1>Practice Questions</h1>

          <p>
            Test your knowledge with personalised MCQs
            and prepare confidently for your examinations.
          </p>
        </div>

             </div>

      {/* Features */}
      <div className="practice-feature-strip">
        <div>
          <BookOpen size={20} />
          <span>Topic-wise practice</span>
        </div>

        <div>
          <CheckCircle2 size={20} />
          <span>Instant MCQ scoring</span>
        </div>

        <div>
          <Trophy size={20} />
          <span>Track your performance</span>
        </div>
      </div>

      {/* Generation Form */}
      {!questions.length && (
        <form className="practice-form" onSubmit={handleGenerate}>

          <div className="practice-section-heading">
            <div>
              <h2>Create Your Practice Session</h2>
              <p>Choose your learning material and question pattern.</p>
            </div>

            <Sparkles size={23} />
          </div>

          <label className="practice-label">
            Choose Learning Source
          </label>

          <div className="source-options">

            <button
              type="button"
              className={
                sourceType === "manual"
                  ? "source-option selected"
                  : "source-option"
              }
              onClick={() => setSourceType("manual")}
            >
              <BookOpen size={22} />
              <strong>Manual Topic</strong>
              <small>Enter subject and topic</small>
            </button>

            <button
              type="button"
              className={
                sourceType === "pdf"
                  ? "source-option selected"
                  : "source-option"
              }
              onClick={() => setSourceType("pdf")}
            >
              <FileUp size={22} />
              <strong>Syllabus PDF</strong>
              <small>Upload your syllabus</small>
            </button>

            <button
              type="button"
              className={
                sourceType === "learning_path"
                  ? "source-option selected"
                  : "source-option"
              }
              onClick={() => setSourceType("learning_path")}
            >
              <Route size={22} />
              <strong>Learning Path</strong>
              <small>Use a saved study plan</small>
            </button>

          </div>

          {/* Manual Topic */}
          {sourceType === "manual" && (
            <div className="practice-field-grid">

              <div className="practice-field">
                <label>Subject</label>

                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Data Mining"
                  required
                />
              </div>

              <div className="practice-field">
                <label>Topic</label>

                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Association Rule Mining"
                  required
                />
              </div>

            </div>
          )}

          {/* PDF */}
          {sourceType === "pdf" && (
            <>
              <div className="practice-field">
                <label>Subject</label>

                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Data Mining"
                  required
                />
              </div>

              <div className="practice-field">
                <label>Topic (optional)</label>

                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Leave blank to use the full syllabus"
                />
              </div>

              <div className="practice-upload">
                <FileUp size={28} />
                <strong>Upload syllabus PDF</strong>

                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) =>
                    setSyllabusFile(e.target.files?.[0] || null)
                  }
                />

                {syllabusFile && (
                  <small>{syllabusFile.name}</small>
                )}
              </div>
            </>
          )}

          {/* Learning Path */}
          {sourceType === "learning_path" && (
            <>
              <div className="practice-field">
                <label>Saved Learning Path</label>

                <select
                  value={selectedPath}
                  onChange={(e) => {
                    const pathId = e.target.value;
                    setSelectedPath(pathId);

                    const path = learningPaths.find(
                      (item) => item.id === pathId
                    );

                    setSubject(path?.subject || "");
                  }}
                  required
                >
                  <option value="">
                    Select a saved learning path
                  </option>

                  {learningPaths.map((path) => (
                    <option key={path.id} value={path.id}>
                      {path.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="practice-field">
                <label>Topic to Practise</label>

                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter a topic from your learning path"
                  required
                />
              </div>
            </>
          )}

          {/* Settings */}
          <div className="practice-field-grid">

            <div className="practice-field">
              <label>Question Type</label>

              <input
                value="Multiple Choice Questions (MCQ)"
                readOnly
              />
            </div>

            <div className="practice-field">
              <label>Difficulty Level</label>

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            <div className="practice-field">
              <label>Number of Questions</label>

              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
              >
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
                <option value="15">15 Questions</option>
              </select>
            </div>

            <div className="practice-field">
              <label>Learning Level</label>

              <select
                value={learningLevel}
                onChange={(e) => setLearningLevel(e.target.value)}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

          </div>

          {error && (
            <div className="practice-alert error">
              {error}
            </div>
          )}

          <button
            className="practice-generate-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle className="spin" size={19} />
                Generating Questions...
              </>
            ) : (
              <>
                <Sparkles size={19} />
                Generate MCQ Questions
              </>
            )}
          </button>

        </form>
      )}

      {/* Quiz */}
      {questions.length > 0 && (
        <section className="practice-quiz">

          <div className="quiz-topbar">
            <div>
              <span className="practice-eyebrow">
                YOUR MCQ PRACTICE SESSION
              </span>

              <h2>{subject || "Practice Questions"}</h2>
              <p>{topic || "Syllabus-based questions"}</p>
            </div>

            <button
              type="button"
              className="practice-reset-btn"
              onClick={resetPractice}
            >
              <RotateCcw size={16} />
              New Practice
            </button>
          </div>

          {/* Score */}
          {submitted && (
            <div className="practice-score-card">
              <Trophy size={28} />

              <div>
                <h2>
                  {score.correct} / {score.total} Correct
                </h2>

                <p>Your score: {score.percentage}%</p>
              </div>
            </div>
          )}

          {/* Questions */}
          {questions.map((question, index) => {
            const selectedAnswer = answers[index];

            const isCorrect =
              Number(selectedAnswer) === Number(question.correct_index);

            return (
              <article
                className="practice-question-card"
                key={index}
              >

                <div className="question-meta">
                  <span>Question {index + 1}</span>
                  <span>MCQ</span>
                  <span>{difficulty}</span>
                </div>

                <h3>{question.question}</h3>

                <div className="mcq-options">

                  {question.options.map((option, optionIndex) => {
                    let className = "mcq-option";

                    if (selectedAnswer === optionIndex) {
                      className += " selected";
                    }

                    if (
                      submitted &&
                      optionIndex === Number(question.correct_index)
                    ) {
                      className += " correct";
                    } else if (
                      submitted &&
                      selectedAnswer === optionIndex &&
                      !isCorrect
                    ) {
                      className += " incorrect";
                    }

                    return (
                      <button
                        type="button"
                        key={optionIndex}
                        className={className}
                        disabled={submitted}
                        onClick={() =>
                          handleMCQAnswer(index, optionIndex)
                        }
                      >
                        <span className="option-letter">
                          {String.fromCharCode(65 + optionIndex)}
                        </span>

                        {option}

                        {submitted &&
                          optionIndex === Number(question.correct_index) && (
                            <CheckCircle2 size={18} />
                          )}

                        {submitted &&
                          selectedAnswer === optionIndex &&
                          !isCorrect && (
                            <XCircle size={18} />
                          )}
                      </button>
                    );
                  })}

                </div>

                {/* Feedback */}
                {submitted && (
                  <div
                    className={
                      isCorrect
                        ? "question-feedback correct"
                        : "question-feedback incorrect"
                    }
                  >
                    <strong>
                      {isCorrect
                        ? "Correct answer!"
                        : "Incorrect answer"}
                    </strong>

                    <p>
                      {question.explanation ||
                        "No explanation available."}
                    </p>
                  </div>
                )}

              </article>
            );
          })}

          {/* Submit */}
          {!submitted ? (
            <>
              {error && (
                <div className="practice-alert error">
                  {error}
                </div>
              )}

              <button
                type="button"
                className="practice-generate-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="spin" size={19} />
                    Submitting Answers...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={19} />
                    Submit Practice
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="practice-finish">
              <div>
                <CheckCircle2 size={20} />

                <strong>Practice completed</strong>

                <p>
                  {sessionSaved
                    ? "Your session is saved in your practice history."
                    : "Your answers have been submitted."}
                </p>
              </div>

              {!sessionSaved && (
                <button
                  type="button"
                  className="practice-save-btn"
                  onClick={handleSaveAgain}
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving ? "Saving..." : "Save Session"}
                </button>
              )}
            </div>
          )}

        </section>
      )}

      {message && (
        <div className="practice-alert success">
          {message}
        </div>
      )}

    </div>
  );
}

export default PracticeQuestions;
