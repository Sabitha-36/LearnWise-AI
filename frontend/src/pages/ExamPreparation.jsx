
import { useState } from "react";
import {
  Sparkles,
  FileText,
  Award,
  Lightbulb,
  UploadCloud,
  LoaderCircle
} from "lucide-react";

import {
  evaluateAnswer,
  recommendQuestions,
  evaluateHandwrittenAnswer
} from "../services/api";

// Recommended word limits for each answer pattern
const wordLimits = {
  "2": { min: 20, max: 40 },
  "3": { min: 40, max: 60 },
  "5": { min: 80, max: 120 },
  "8": { min: 120, max: 180 },
  "10": { min: 180, max: 250 },
  "15": { min: 250, max: 350 },
  "custom": null
};

// Available answer patterns
const answerPatterns = [
  {
    value: "2",
    label: "Short Answer",
    description: "Definition and key points"
  },
  {
    value: "3",
    label: "Brief Answer",
    description: "Short explanation with details"
  },
  {
    value: "5",
    label: "Paragraph Answer",
    description: "Explanation with an example"
  },
  {
    value: "8",
    label: "Structured Answer",
    description: "Headings and detailed points"
  },
  {
    value: "10",
    label: "Detailed Answer",
    description: "In-depth explanation and applications"
  },
  {
    value: "15",
    label: "Comprehensive Answer",
    description: "Complete, well-structured answer"
  },
  {
    value: "custom",
    label: "Custom Answer Pattern",
    description: "Create your own answer structure"
  }
];

function ExamPreparation() {

  // Form data
  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    question: "",
    student_answer: "",
    answer_pattern: "5",
    custom_pattern: ""
  });

  // Common evaluation result
  const [result, setResult] = useState(null);
  const [resultSource, setResultSource] = useState("");
  const [extractedAnswer, setExtractedAnswer] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Answer submission mode
  const [answerMode, setAnswerMode] = useState("typed");

  // Handwritten answer states
  const [answerImage, setAnswerImage] = useState(null);
  const [handwrittenLoading, setHandwrittenLoading] = useState(false);
  const [handwrittenError, setHandwrittenError] = useState("");

  // Recommended questions states
  const [recommendedQuestions, setRecommendedQuestions] = useState([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState("");

  // Handle input changes
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    setError("");
  }

  // Calculate word count based on the student's answer
  const wordCount = formData.student_answer.trim()
    ? formData.student_answer.trim().split(/\s+/).length
    : 0;

  // Get the recommended word limit for the selected pattern
  const selectedLimit = wordLimits[formData.answer_pattern];

  // Handle answer pattern selection
  function handlePatternChange(patternValue) {
    setFormData((previous) => ({
      ...previous,
      answer_pattern: patternValue
    }));

    setError("");
  }

  // Handle answer mode selection
  function handleAnswerModeChange(mode) {
    setAnswerMode(mode);
    setResult(null);
    setResultSource("");
    setExtractedAnswer("");
    setError("");
    setHandwrittenError("");
  }

  // Recommend examination questions
  async function handleRecommendQuestions() {

    if (!formData.subject.trim() || !formData.topic.trim()) {
      setQuestionError("Please enter your subject and topic first.");
      return;
    }

    if (
      formData.answer_pattern === "custom" &&
      !formData.custom_pattern.trim()
    ) {
      setQuestionError("Please describe your custom answer pattern first.");
      return;
    }

    setQuestionLoading(true);
    setQuestionError("");
    setRecommendedQuestions([]);

    try {

      const response = await recommendQuestions({
        subject: formData.subject.trim(),
        topic: formData.topic.trim(),
        answer_pattern: formData.answer_pattern,
        custom_pattern: formData.custom_pattern
      });

      if (!response.success || !response.questions) {
        throw new Error(
          response.error || "Unable to recommend questions."
        );
      }

      setRecommendedQuestions(response.questions);

    } catch (err) {

      setQuestionError(
        err.message || "Something went wrong. Please try again."
      );

    } finally {
      setQuestionLoading(false);
    }
  }

  // Submit typed answer for AI evaluation
  async function handleSubmit(event) {

    event.preventDefault();

    if (!formData.student_answer.trim()) {
      setError("Please write your answer before submitting.");
      return;
    }

    if (
      formData.answer_pattern === "custom" &&
      !formData.custom_pattern.trim()
    ) {
      setError("Please describe your custom answer pattern.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setExtractedAnswer("");
    setResultSource("");

    try {

      // Do not send max_marks.
      // Backend determines marks from the selected pattern.
      const requestData = {
        subject: formData.subject,
        topic: formData.topic,
        question: formData.question,
        student_answer: formData.student_answer,
        answer_pattern: formData.answer_pattern,
        custom_pattern: formData.custom_pattern
      };

      const response = await evaluateAnswer(requestData);

      if (!response.success || !response.evaluation) {
        throw new Error(
          response.error || "Evaluation could not be completed."
        );
      }

      setResult(response.evaluation);
      setResultSource("typed");

    } catch (err) {

      setError(
        err.message || "Something went wrong. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }

  // Handle handwritten image selection
  const handleImageChange = (event) => {

    const file = event.target.files[0];

    setHandwrittenError("");
    setResult(null);
    setExtractedAnswer("");
    setResultSource("");

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      setHandwrittenError(
        "Please upload a JPG, JPEG or PNG image."
      );
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setHandwrittenError(
        "Image size must be less than 5 MB."
      );
      event.target.value = "";
      return;
    }

    setAnswerImage(file);
  };

  // Remove selected handwritten image
  const handleRemoveImage = () => {

    setAnswerImage(null);
    setResult(null);
    setExtractedAnswer("");
    setResultSource("");
    setHandwrittenError("");

    const fileInput = document.getElementById(
      "handwritten-answer-image"
    );

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Submit handwritten answer for AI evaluation
  const handleHandwrittenSubmit = async () => {

    if (
      !formData.subject.trim() ||
      !formData.topic.trim() ||
      !formData.question.trim()
    ) {
      setHandwrittenError(
        "Please enter your subject, topic and examination question first."
      );
      return;
    }

    if (!answerImage) {
      setHandwrittenError(
        "Please upload your handwritten answer image."
      );
      return;
    }

    if (
      formData.answer_pattern === "custom" &&
      !formData.custom_pattern.trim()
    ) {
      setHandwrittenError(
        "Please describe your custom answer pattern."
      );
      return;
    }

    try {

      setHandwrittenLoading(true);
      setHandwrittenError("");
      setError("");
      setResult(null);
      setExtractedAnswer("");
      setResultSource("");

      const uploadData = new FormData();

      uploadData.append("answer_image", answerImage);
      uploadData.append("subject", formData.subject);
      uploadData.append("topic", formData.topic);
      uploadData.append("question", formData.question);
      uploadData.append("answer_pattern", formData.answer_pattern);
      uploadData.append("custom_pattern", formData.custom_pattern);

      const response = await evaluateHandwrittenAnswer(uploadData);

      if (!response.success || !response.evaluation) {
        throw new Error(
          response.error ||
          "Handwritten evaluation could not be completed."
        );
      }

      // Use the same result state as typed answer evaluation
      setResult(response.evaluation);

      // Store extracted handwritten answer
      setExtractedAnswer(
        response.extracted_answer || ""
      );

      setResultSource("handwritten");

    } catch (err) {

      setHandwrittenError(
        err.message ||
        "Unable to evaluate handwritten answer."
      );

    } finally {
      setHandwrittenLoading(false);
    }
  };

  // Reset the form
  function handleReset() {

    setFormData({
      subject: "",
      topic: "",
      question: "",
      student_answer: "",
      answer_pattern: "5",
      custom_pattern: ""
    });

    setAnswerMode("typed");
    setAnswerImage(null);
    setHandwrittenError("");
    setHandwrittenLoading(false);

    setResult(null);
    setResultSource("");
    setExtractedAnswer("");

    setRecommendedQuestions([]);
    setQuestionError("");
    setQuestionLoading(false);

    setError("");
    setLoading(false);

    const fileInput = document.getElementById(
      "handwritten-answer-image"
    );

    if (fileInput) {
      fileInput.value = "";
    }
  }

  return (
    <div className="exam-page">

      {/* Hero Section */}
      <section className="exam-hero">

        <div className="exam-hero-icon">
          <FileText size={28} />
        </div>

        <div>
          <h1>Evaluate Answer</h1>

          <p>
            Write your answers according to your examination pattern
            and receive personalised feedback from LearnWise AI.
          </p>
        </div>

      </section>

      <div className="exam-workspace">

        <form className="exam-form" onSubmit={handleSubmit}>

          {/* Section 01: Question Details */}
          <div className="exam-section-heading">
            <span>01</span>

            <div>
              <h2>Question Details</h2>
              <p>Enter your examination information.</p>
            </div>
          </div>

          <label>Subject</label>

          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Example: Computer Science"
            required
          />

          <label>Topic</label>

          <input
            type="text"
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

          {/* Question Recommendations */}
          <div className="question-recommendation">

            <button
              type="button"
              onClick={handleRecommendQuestions}
              disabled={questionLoading}
              className="exam-submit-btn"
            >
              {questionLoading ? (
                <>
                  <LoaderCircle className="spin" size={18} />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Recommend 5 Questions
                </>
              )}
            </button>

            {questionError && (
              <p className="exam-error">{questionError}</p>
            )}

            {recommendedQuestions.length > 0 && (
              <div className="recommended-question-list">

                <h3>AI Recommended Questions</h3>

                <p>
                  Select a question to use it for your evaluation.
                </p>

                {recommendedQuestions.map((question, index) => (
                  <button
                    type="button"
                    key={index}
                    className={`recommended-question ${
                      formData.question === question ? "selected" : ""
                    }`}
                    onClick={() => {
                      setFormData((previous) => ({
                        ...previous,
                        question: question
                      }));
                      setError("");
                    }}
                  >
                    <span>{index + 1}.</span>
                    {question}
                  </button>
                ))}

              </div>
            )}

          </div>

          {/* Section 02: Answer Pattern */}
          <div className="exam-section-heading">
            <span>02</span>

            <div>
              <h2>Choose Answer Pattern</h2>

              <p>
                Select how you want your answer to be structured.
              </p>
            </div>
          </div>

          <div className="answer-pattern-grid">

            {answerPatterns.map((pattern) => (

              <button
                type="button"
                key={pattern.value}
                className={`pattern-option ${
                  formData.answer_pattern === pattern.value
                    ? "selected"
                    : ""
                }`}
                onClick={() => handlePatternChange(pattern.value)}
              >

                <span className="pattern-option-title">
                  {pattern.label}
                </span>

                <small>{pattern.description}</small>

                {formData.answer_pattern === pattern.value && (
                  <span className="pattern-check">✓</span>
                )}

              </button>

            ))}

          </div>

          {/* Custom Answer Pattern */}
          {formData.answer_pattern === "custom" ? (

            <div className="custom-pattern-box">

              <label>
                Describe Your Custom Answer Pattern
              </label>

              <textarea
                name="custom_pattern"
                value={formData.custom_pattern}
                onChange={handleChange}
                placeholder="Example: Include a definition, five important points, one example and a conclusion..."
                rows={4}
                required
              />

              <div className="pattern-info">

                <Lightbulb size={19} />

                <p>
                  LearnWise AI will analyse your question and
                  determine suitable maximum marks based on
                  your requested answer structure.
                </p>

              </div>

            </div>

          ) : (

            <div className="pattern-info">

              <Lightbulb size={19} />

              <p>
                Selected pattern:{" "}

                <strong>
                  {answerPatterns.find(
                    (item) =>
                      item.value === formData.answer_pattern
                  )?.label}
                </strong>.

                Recommended answer length:{" "}

                <strong>
                  {selectedLimit.min}–{selectedLimit.max} words
                </strong>.

                Maximum marks will be assigned automatically.
              </p>

            </div>

          )}

          {/* Section 03: Choose Answer Method */}
          <div className="exam-section-heading">

            <span>03</span>

            <div>
              <h2>Choose Answer Method</h2>
              <p>Select how you want to submit your answer.</p>
            </div>

          </div>

          {/* Answer Method Options */}
          <div className="answer-mode-grid">

            <button
              type="button"
              className={`answer-mode-option ${
                answerMode === "typed" ? "selected" : ""
              }`}
              onClick={() => handleAnswerModeChange("typed")}
            >
              <FileText size={24} />

              <span>Type Answer</span>

              <small>
                Write your answer in the text area.
              </small>
            </button>

            <button
              type="button"
              className={`answer-mode-option ${
                answerMode === "handwritten" ? "selected" : ""
              }`}
              onClick={() => handleAnswerModeChange("handwritten")}
            >
              <UploadCloud size={24} />

              <span>Handwritten Answer</span>

              <small>
                Upload a photo of your written answer.
              </small>
            </button>

          </div>

          {/* Typed Answer Section */}
          {answerMode === "typed" && (

            <div className="typed-answer-section">

              <label>Your Answer</label>

              <textarea
                name="student_answer"
                value={formData.student_answer}
                onChange={handleChange}
                placeholder="Write your answer here..."
                rows={8}
                required
              />

              {/* Dynamic Word Counter */}
              <div className="word-count-info">

                <span>
                  {wordCount} words
                </span>

                {selectedLimit ? (

                  <span>
                    &nbsp; Recommended: {selectedLimit.min}–{selectedLimit.max} words
                  </span>

                ) : (

                  <span>
                    &nbsp; Follow your custom answer structure.
                  </span>

                )}

              </div>

              <button
                type="submit"
                className="exam-submit-btn"
                disabled={loading}
              >

                {loading ? (

                  <>
                    <LoaderCircle className="spin" size={19} />
                    Evaluating...
                  </>

                ) : (

                  <>
                    <Sparkles size={19} />
                    Evaluate My Answer
                  </>

                )}

              </button>

            </div>

          )}

          {/* Handwritten Answer Section */}
          {answerMode === "handwritten" && (

            <div className="handwritten-analysis">

              <div className="handwritten-heading">

                <div>
                  <h2>Upload Your Handwritten Answer</h2>

                  <p>
                    Upload a photo of your handwritten answer
                    and let LearnWise AI evaluate it.
                  </p>
                </div>

              </div>

              <div className="handwritten-upload">

                <input
                  type="file"
                  id="handwritten-answer-image"
                  accept="image/jpeg,image/png"
                  onChange={handleImageChange}
                  hidden
                />

                {!answerImage ? (

                  <label
                    htmlFor="handwritten-answer-image"
                    className="handwritten-upload-label"
                  >
                    <UploadCloud size={32} />

                    <strong>
                      Upload your handwritten answer
                    </strong>

                    <span>
                      Click to select JPG or PNG image
                    </span>

                    <small>
                      Maximum file size: 5 MB
                    </small>

                  </label>

                ) : (

                  <div className="handwritten-preview">

                    <img
                      src={URL.createObjectURL(answerImage)}
                      alt="Handwritten answer preview"
                    />

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="remove-handwritten-image"
                    >
                      Remove Image
                    </button>

                  </div>

                )}

              </div>

              {handwrittenError && (
                <p className="exam-error">
                  {handwrittenError}
                </p>
              )}

              <button
                type="button"
                onClick={handleHandwrittenSubmit}
                disabled={handwrittenLoading || !answerImage}
                className="exam-submit-btn"
              >

                {handwrittenLoading ? (

                  <>
                    <LoaderCircle className="spin" size={18} />
                    Analysing Handwriting...
                  </>

                ) : (

                  <>
                    <Sparkles size={18} />
                    Evaluate Handwritten Answer
                  </>

                )}

              </button>

            </div>

          )}

          {/* Error Message */}
          {error && (
            <div className="exam-error">
              {error}
            </div>
          )}

          {handwrittenError && answerMode === "handwritten" && (
            <div className="exam-error">
              {handwrittenError}
            </div>
          )}

          {/* Reset Button */}
          <div className="exam-buttons">

            <button
              type="button"
              className="exam-reset-btn"
              onClick={handleReset}
            >
              Reset
            </button>

          </div>

        </form>

        {/* Common Evaluation Result Section */}
        <section className="exam-result">

          {!result && (

            <div className="exam-empty">

              <div className="empty-result-icon">
                <Award size={42} />
              </div>

              <h2>Your Evaluation Appears Here</h2>

              <p>
                Submit your answer to receive marks, strengths,
                mistakes, missing points and improvement suggestions.
              </p>

              <div className="result-checklist">
                <span>✓ Marks and performance</span>
                <span>✓ Strengths and mistakes</span>
                <span>✓ Correct exam answer</span>
                <span>✓ Personalised improvement tips</span>
              </div>

            </div>

          )}

          {result && (

            <div className="result-content">

              {/* Extracted Handwritten Answer */}
              {resultSource === "handwritten" && extractedAnswer && (

                <div className="extracted-answer">

                  <h3>Extracted Handwritten Answer</h3>

                  <p>{extractedAnswer}</p>

                </div>

              )}

              {/* Result Header */}
              <div className="result-header">

                <div>
                  <span className="exam-tag">
                    AI EVALUATION REPORT
                  </span>

                  <h2>Your Performance</h2>
                </div>

                <Award size={30} color="#7056dc" />

              </div>

              {/* Marks and Percentage */}
              <div className="marks-result">

                <div>
                  <span>Marks Obtained</span>

                  <h1>
                    {result.marks_obtained}

                    <small>
                      {" "} / {result.maximum_marks}
                    </small>
                  </h1>
                </div>

                <div className="percentage-circle">
                  <strong>{result.percentage}%</strong>
                </div>

              </div>

              <div className="performance-label">
                Performance:{" "}
                <strong>{result.performance}</strong>
              </div>

              {/* Strengths */}
              <div className="feedback-block strengths">

                <h3>✓ Strengths</h3>

                <ul>
                  {result.strengths?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

              </div>

              {/* Mistakes */}
              <div className="feedback-block mistakes">

                <h3>✗ Mistakes</h3>

                <ul>
                  {result.mistakes?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

              </div>

              {/* Missing Points */}
              <div className="feedback-block missing">

                <h3>! Missing Points</h3>

                <ul>
                  {result.missing_points?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

              </div>

              {/* Correct Answer */}
              <div className="correct-answer">

                <h3>Correct Exam-Oriented Answer</h3>

                <p>{result.correct_answer}</p>

              </div>

              {/* Improvement Tips */}
              <div className="feedback-block tips">

                <h3>Improvement Tips</h3>

                <ul>
                  {result.improvement_tips?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

              </div>

              {/* Recommended Next Topic */}
              <div className="next-topic">

                <Lightbulb size={20} />

                <div>
                  <strong>Recommended Next Topic</strong>
                  <p>{result.next_topic}</p>
                </div>

              </div>

            </div>

          )}

        </section>

      </div>

    </div>
  );
}

export default ExamPreparation;
