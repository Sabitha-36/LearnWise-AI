
import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

function AnswerEvaluation({ user }) {

  const [form, setForm] = useState({
    subject: "",
    question: "",
    marks: "5",
    answer: ""
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function handleEvaluate(e) {
    e.preventDefault();

    setError("");
    setResult(null);

    if (
      !form.subject.trim() ||
      !form.question.trim() ||
      !form.answer.trim()
    ) {
      setError("Please complete all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/evaluate-answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...form,
            marks: Number(form.marks),
            student_id:
              user?.id ||
              user?.email ||
              user?.name
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Evaluation failed."
        );
      }

      setResult(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="evaluation-section">

      <div className="evaluation-heading">
        <span className="ai-badge">
          AI POWERED
        </span>

        <h2>Smart Answer Evaluation</h2>

        <p>
          Write your answer and receive
          personalised feedback.
        </p>
      </div>

      <form
        className="evaluation-form"
        onSubmit={handleEvaluate}
      >

        <div className="form-group">
          <label>Subject</label>

          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Example: Data Mining"
          />
        </div>

        <div className="form-group">
          <label>Question</label>

          <textarea
            name="question"
            value={form.question}
            onChange={handleChange}
            placeholder="Enter your exam question"
          />
        </div>

        <div className="form-group">
          <label>Required Marks</label>

          <select
            name="marks"
            value={form.marks}
            onChange={handleChange}
          >
            {[2, 5, 8, 10, 15].map(mark => (
              <option key={mark} value={mark}>
                {mark} Marks
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Your Answer</label>

          <textarea
            name="answer"
            value={form.answer}
            onChange={handleChange}
            placeholder="Write your own answer here..."
            rows={7}
          />
        </div>

        {error && (
          <p className="error-message">{error}</p>
        )}

        <button
          className="primary-btn"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Evaluating your answer..."
            : "Evaluate My Answer"}
        </button>

      </form>

      {result && (
        <div className="evaluation-result">

          <h3>Evaluation Results</h3>

          <div className="score-display">
            <strong>
              {result.evaluation.score}/
              {result.evaluation.maximum_marks}
            </strong>

            <span>
              {result.evaluation.percentage}%
            </span>
          </div>

          <p>
            Level: {result.evaluation.level}
          </p>

          <h4>Correct Points</h4>
          <ul>
            {result.evaluation.correct_points?.map(
              (point, index) => (
                <li key={index}>{point}</li>
              )
            )}
          </ul>

          <h4>Missing Concepts</h4>
          <ul>
            {result.evaluation.missing_points?.map(
              (point, index) => (
                <li key={index}>{point}</li>
              )
            )}
          </ul>

          <h4>Mistakes</h4>
          <ul>
            {result.evaluation.mistakes?.map(
              (mistake, index) => (
                <li key={index}>{mistake}</li>
              )
            )}
          </ul>

          <h4>How to Improve</h4>
          <ul>
            {result.evaluation.improvements?.map(
              (item, index) => (
                <li key={index}>{item}</li>
              )
            )}
          </ul>

          <div className="recommendation-card">
            <h3>AI Feedback</h3>
            <p>{result.evaluation.feedback}</p>
          </div>

          <h4>Improved Answer</h4>
          <div className="output-content">
            {result.evaluation.improved_answer}
          </div>

          <h4>Recommended Topics</h4>
          {result.recommended_topics?.map(
            (topic, index) => (
              <span
                className="recommended-topic"
                key={index}
              >
                {topic}
              </span>
            )
          )}

        </div>
      )}

    </section>
  );
}

export default AnswerEvaluation;
