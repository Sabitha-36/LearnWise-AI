
import { useState } from "react";
import { Sparkles, FileText } from "lucide-react";

const answerPatterns = [
  { value: "2", label: "Short Answer", marks: 2, description: "Definition and key points" },
  { value: "3", label: "Brief Answer", marks: 3, description: "Definition and brief explanation" },
  { value: "5", label: "Paragraph Answer", marks: 5, description: "Introduction, explanation and example" },
  { value: "8", label: "Structured Answer", marks: 8, description: "Headings, explanation and examples" },
  { value: "10", label: "Detailed Answer", marks: 10, description: "Detailed explanation and applications" },
  { value: "15", label: "Comprehensive Answer", marks: 15, description: "In-depth, structured answer" },
  { value: "custom", label: "Custom Answer Pattern", marks: null, description: "Create your own answer structure" }
];

function StudentForm({ onGenerate, loading = false }) {
  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    question: "",
    student_answer: "",
    answerPattern: "5",
    customPattern: "",
    difficulty: "Beginner"
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const selectedPattern = answerPatterns.find(
      (pattern) => pattern.value === formData.answerPattern
    );

    const requestData = {
      subject: formData.subject,
      topic: formData.topic,
      question: formData.question,
      student_answer: formData.student_answer,
      answer_pattern: selectedPattern.label,
      difficulty: formData.difficulty,
      custom_pattern:
        formData.answerPattern === "custom"
          ? formData.customPattern
          : ""
    };

    // Predefined patterns automatically determine marks.
    if (selectedPattern.marks !== null) {
      requestData.max_marks = selectedPattern.marks;
    }

    onGenerate(requestData);
  }

  return (
    <form className="student-form" onSubmit={handleSubmit}>
      <h3>
        <FileText size={20} />
        Exam Preparation
      </h3>

      <p>Prepare and evaluate your answers using AI.</p>

      <label>Subject</label>
      <input
        name="subject"
        value={formData.subject}
        onChange={handleChange}
        placeholder="Example: Computer Science"
        required
      />

      <label>Topic</label>
      <input
        name="topic"
        value={formData.topic}
        onChange={handleChange}
        placeholder="Example: Data Mining"
        required
      />

      <label>Exam Question</label>
      <textarea
        name="question"
        value={formData.question}
        onChange={handleChange}
        placeholder="Enter your examination question..."
        rows={3}
        required
      />

      <label>Choose Answer Pattern</label>
      <div className="answer-pattern-grid">
        {answerPatterns.map((pattern) => (
          <button
            key={pattern.value}
            type="button"
            className={`pattern-option ${
              formData.answerPattern === pattern.value
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setFormData((previous) => ({
                ...previous,
                answerPattern: pattern.value
              }))
            }
          >
            <strong>{pattern.label}</strong>

            <span>
              {pattern.marks
                ? `${pattern.marks} Marks`
                : "Flexible format"}
            </span>

            <small>{pattern.description}</small>
          </button>
        ))}
      </div>

      {formData.answerPattern === "custom" && (
        <>
          <label>Describe Your Custom Answer Pattern</label>
          <textarea
            name="customPattern"
            value={formData.customPattern}
            onChange={handleChange}
            placeholder="Example: Give an introduction, definition, diagram explanation, advantages and conclusion."
            rows={4}
            required
          />
        </>
      )}

      <label>Your Answer</label>
      <textarea
        name="student_answer"
        value={formData.student_answer}
        onChange={handleChange}
        placeholder="Write your answer here for AI evaluation..."
        rows={7}
        required
      />

      <label>Difficulty Level</label>
      <select
        name="difficulty"
        value={formData.difficulty}
        onChange={handleChange}
      >
        <option>Beginner</option>
        <option>Intermediate</option>
        <option>Advanced</option>
      </select>

      <button
        type="submit"
        className="generate-button"
        disabled={loading}
      >
        <Sparkles size={19} />
        {loading ? "Evaluating Answer..." : "Evaluate My Answer"}
      </button>
    </form>
  );
}

export default StudentForm;
