
import { useState } from "react";

import {
  BookOpen,
  Sparkles,
  Upload,
  FileText,
  X,
  CalendarDays,
  Clock3,
  Target,
  Route,
  CheckCircle2,
  LoaderCircle,
  Lightbulb,
  ClipboardList
} from "lucide-react";

import {
  generateLearningPath,
  saveLearningPath
} from "../services/api";


function LearningPath() {

  const [formData, setFormData] = useState({
    subject: "",
    topics: "",
    examDate: "",
    dailyHours: "2",
    learningLevel: "Beginner"
  });

  const [syllabusFile, setSyllabusFile] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [learningPath, setLearningPath] = useState(null);

  // Save learning path states
  const [saving, setSaving] = useState(false);
  const [savedPathId, setSavedPathId] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);


  // Handle form inputs
  function handleChange(event) {

    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    setMessage("");
  }


  // Handle syllabus PDF upload
  function handleFileChange(event) {

    const file = event.target.files[0];

    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage("Please upload a PDF syllabus file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("The PDF file must be smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    setSyllabusFile(file);
    setMessage("");
  }


  // Remove uploaded PDF
  function removeFile() {

    setSyllabusFile(null);

    const fileInput = document.getElementById("learning-syllabus");

    if (fileInput) {
      fileInput.value = "";
    }
  }


  // Generate personalised learning path
  async function handleSubmit(event) {

    event.preventDefault();

    setMessage("");
    setLearningPath(null);

    // Reset previous save status
    setSavedPathId(null);
    setSaveMessage("");
    setSaveError(false);

    if (!formData.subject.trim()) {
      setMessage("Please enter your subject name.");
      return;
    }

    if (!formData.topics.trim() && !syllabusFile) {
      setMessage("Please enter your syllabus topics or upload a PDF.");
      return;
    }

    if (!formData.examDate) {
      setMessage("Please select your exam date.");
      return;
    }

    const selectedDate = new Date(
      `${formData.examDate}T00:00:00`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setMessage("Please select a future examination date.");
      return;
    }

    const dailyHours = Number(formData.dailyHours);

    if (
      !Number.isFinite(dailyHours) ||
      dailyHours < 0.5 ||
      dailyHours > 12
    ) {
      setMessage("Daily study hours must be between 0.5 and 12.");
      return;
    }

    // Prepare data expected by Flask
    const data = new FormData();

    data.append("subject", formData.subject.trim());
    data.append("topics", formData.topics.trim());
    data.append("exam_date", formData.examDate);
    data.append("daily_hours", formData.dailyHours);
    data.append("learning_level", formData.learningLevel);

    if (syllabusFile) {
      data.append("file", syllabusFile);
    }

    try {

      setLoading(true);

      const response = await generateLearningPath(data);

      if (response.success && response.learning_path) {

        setLearningPath(response.learning_path);

        setMessage(
          response.message || "Your learning path is ready!"
        );

      } else {

        setMessage(
          response.error || "Unable to generate your learning path."
        );

      }

    } catch (error) {

      console.error("Learning Path Error:", error);

      setMessage(
        error.message ||
        "Something went wrong while generating your learning path."
      );

    } finally {

      setLoading(false);

    }
  }


  // Save generated learning path to MongoDB
  async function handleSaveLearningPath() {

    if (!learningPath || saving || savedPathId) {
      return;
    }

    try {

      setSaving(true);
      setSaveMessage("");
      setSaveError(false);

      const response = await saveLearningPath(learningPath);

      if (response.success && response.learning_path_id) {

        setSavedPathId(response.learning_path_id);

        setSaveMessage(
          "Your learning path has been added to My Progress!"
        );

      } else {

        setSaveError(true);

        setSaveMessage(
          response.error || "Unable to save your learning path."
        );

      }

    } catch (error) {

      console.error("Save Learning Path Error:", error);

      setSaveError(true);

      setSaveMessage(
        error.message || "Unable to save learning path. Please try again."
      );

    } finally {

      setSaving(false);

    }
  }


  // Format roadmap dates
  function formatDate(dateString) {

    if (!dateString) return "";

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }


  return (

    <section className="lp-page">

      {/* Page Heading */}
      <div className="lp-header">

        <div className="lp-heading-icon">
          <Route size={28} />
        </div>

        <div>

          <h1>Personalised Learning Path</h1>

          <p>
            Turn your syllabus into a structured learning journey.
            Plan smarter, learn step by step and prepare confidently.
          </p>

        </div>

      </div>


      {/* Main Workspace */}
      <div className="lp-workspace">


        {/* Input Form */}
        <form
          className="lp-form-card"
          onSubmit={handleSubmit}
        >

          <div className="lp-section-heading">

            <span className="lp-section-icon">
              <FileText size={19} />
            </span>

            <div>
              <h2>Your Syllabus</h2>
              <p>
                Provide the subject and topics you need to study.
              </p>
            </div>

          </div>


          {/* Subject Name */}
          <div className="lp-field">

            <label htmlFor="lp-subject">
              Subject Name
            </label>

            <input
              id="lp-subject"
              type="text"
              name="subject"
              placeholder="Example: Data Mining"
              value={formData.subject}
              onChange={handleChange}
              required
            />

          </div>


          {/* Syllabus Topics */}
          <div className="lp-field">

            <label htmlFor="lp-topics">
              Enter Syllabus Topics
            </label>

            <textarea
              id="lp-topics"
              name="topics"
              rows="7"
              placeholder={
                "Enter your unit-wise topics...\n\nUnit 1 - Introduction to Data Mining\nUnit 2 - Data Preprocessing\nUnit 3 - Association Rule Mining\nUnit 4 - Classification\nUnit 5 - Clustering"
              }
              value={formData.topics}
              onChange={handleChange}
            />

            <small>
              Enter each unit or topic on a separate line.
            </small>

          </div>


          {/* PDF Upload */}
          <div className="lp-divider">
            <span>OR UPLOAD YOUR SYLLABUS</span>
          </div>


          <div className="lp-upload-box">

            <input
              id="learning-syllabus"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
            />

            <label htmlFor="learning-syllabus">

              <Upload size={25} />

              <strong>Upload syllabus PDF</strong>

              <span>
                Click to browse · PDF up to 10 MB
              </span>

            </label>

          </div>


          {/* Selected PDF */}
          {syllabusFile && (

            <div className="lp-selected-file">

              <FileText size={20} />

              <div>

                <strong>{syllabusFile.name}</strong>

                <span>
                  {(syllabusFile.size / 1024 / 1024).toFixed(2)} MB
                </span>

              </div>

              <button
                type="button"
                onClick={removeFile}
                aria-label="Remove uploaded file"
              >
                <X size={18} />
              </button>

            </div>

          )}


          {/* Study Preferences */}
          <div className="lp-divider">
            <span>YOUR STUDY PREFERENCES</span>
          </div>


          {/* Learning Level */}
          <div className="lp-field">

            <label htmlFor="lp-level">
              Current Learning Level
            </label>

            <select
              id="lp-level"
              name="learningLevel"
              value={formData.learningLevel}
              onChange={handleChange}
            >
              <option value="Beginner">
                Beginner - Start from basics
              </option>

              <option value="Intermediate">
                Intermediate - Know the basics
              </option>

              <option value="Advanced">
                Advanced - Need focused revision
              </option>

            </select>

          </div>


          {/* Exam Date and Daily Hours */}
          <div className="lp-preference-grid">

            <div className="lp-field">

              <label htmlFor="lp-date">
                <CalendarDays size={15} />
                Exam Date
              </label>

              <input
                id="lp-date"
                type="date"
                name="examDate"
                min={new Date().toLocaleDateString("en-CA")}
                value={formData.examDate}
                onChange={handleChange}
                required
              />

            </div>


            <div className="lp-field">

              <label htmlFor="lp-hours">
                <Clock3 size={15} />
                Daily Study Hours
              </label>

              <select
                id="lp-hours"
                name="dailyHours"
                value={formData.dailyHours}
                onChange={handleChange}
              >
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
                <option value="4">4 hours</option>
                <option value="5">5 hours</option>
                <option value="6">6 hours</option>
              </select>

            </div>

          </div>


          {/* Generation Message */}
          {message && (

            <div
              className="lp-message"
              role="status"
            >
              {message}
            </div>

          )}


          {/* Generate Button */}
          <button
            type="submit"
            className="lp-generate-button"
            disabled={loading}
          >

            {loading ? (

              <>
                <LoaderCircle
                  size={18}
                  className="lp-spinner"
                />

                Generating Your Learning Path...
              </>

            ) : (

              <>
                <Sparkles size={18} />
                Prepare My Learning Path
              </>

            )}

          </button>

        </form>



        {/* Roadmap Result */}
        <div className="lp-preview-card">


          {/* Preview Heading */}
          <div className="lp-preview-heading">

            <div>

              <span className="lp-eyebrow">
                YOUR STUDY ROADMAP
              </span>

              <h2>Learning Path Preview</h2>

            </div>

            <Route size={23} />

          </div>


          {/* Loading State */}
          {loading ? (

            <div className="lp-empty-state">

              <LoaderCircle
                size={42}
                className="lp-spinner"
              />

              <h3>
                Creating your personalised study plan...
              </h3>

              <p>
                LearnWise AI is analysing your syllabus and organising
                your topics into a study schedule. This may take a little
                time.
              </p>

            </div>


          ) : learningPath ? (

            <div className="lp-roadmap-result">


              {/* Roadmap Summary */}
              <div className="lp-result-summary">

                <span className="lp-result-label">
                  <CheckCircle2 size={17} />
                  YOUR ROADMAP IS READY
                </span>

                <h3>
                  {learningPath.subject || formData.subject}
                </h3>

                <p>
                  {learningPath.overview}
                </p>


                {/* Summary Statistics */}
                <div className="lp-result-stats">

                  <div>
                    <strong>
                      {learningPath.total_days}
                    </strong>

                    <span>Study Days</span>
                  </div>

                  <div>
                    <strong>
                      {learningPath.daily_hours}
                    </strong>

                    <span>Hours / Day</span>
                  </div>

                  <div>
                    <strong>
                      {learningPath.daily_plan?.length || 0}
                    </strong>

                    <span>Scheduled Days</span>
                  </div>

                </div>

              </div>



              {/* Daily Study Schedule */}
              <div className="lp-result-section">

                <h3>
                  <CalendarDays size={19} />
                  Your Daily Study Schedule
                </h3>


                <div className="lp-day-list">

                  {learningPath.daily_plan?.map((day, index) => (

                    <article
                      className="lp-day-card"
                      key={`${day.day}-${day.date}-${index}`}
                    >


                      {/* Day Heading */}
                      <div className="lp-day-heading">

                        <span className="lp-day-number">
                          Day {day.day}
                        </span>

                        <span className="lp-day-date">
                          {formatDate(day.date)}
                        </span>

                      </div>


                      <h4>{day.topic}</h4>


                      {/* Duration */}
                      <p className="lp-duration">

                        <Clock3 size={15} />

                        {day.duration_hours} study hours

                      </p>


                      {/* Learning Objectives */}
                      {Array.isArray(day.learning_objectives) &&
                        day.learning_objectives.length > 0 && (

                          <div className="lp-day-detail">

                            <strong>
                              Learning Objectives
                            </strong>

                            <ul>

                              {day.learning_objectives.map(
                                (objective, objectiveIndex) => (

                                  <li key={objectiveIndex}>
                                    {objective}
                                  </li>

                                )
                              )}

                            </ul>

                          </div>

                        )}


                      {/* Study Activities */}
                      {Array.isArray(day.activities) &&
                        day.activities.length > 0 && (

                          <div className="lp-day-detail">

                            <strong>
                              Study Activities
                            </strong>

                            <ul>

                              {day.activities.map(
                                (activity, activityIndex) => (

                                  <li key={activityIndex}>
                                    {activity}
                                  </li>

                                )
                              )}

                            </ul>

                          </div>

                        )}


                      {/* Practice Task */}
                      {day.practice_task && (

                        <div className="lp-task-box">

                          <strong>
                            Practice Task
                          </strong>

                          <p>
                            {day.practice_task}
                          </p>

                        </div>

                      )}


                      {/* Revision Task */}
                      {day.revision_task && (

                        <div className="lp-task-box">

                          <strong>
                            Revision Task
                          </strong>

                          <p>
                            {day.revision_task}
                          </p>

                        </div>

                      )}

                    </article>

                  ))}

                </div>

              </div>



              {/* Revision Strategy */}
              {Array.isArray(learningPath.revision_strategy) &&
                learningPath.revision_strategy.length > 0 && (

                  <div className="lp-result-section">

                    <h3>
                      <ClipboardList size={19} />
                      Revision Strategy
                    </h3>

                    <ul className="lp-tip-list">

                      {learningPath.revision_strategy.map(
                        (item, index) => (

                          <li key={index}>

                            <CheckCircle2 size={16} />

                            {item}

                          </li>

                        )
                      )}

                    </ul>

                  </div>

                )}



              {/* Study Tips */}
              {Array.isArray(learningPath.study_tips) &&
                learningPath.study_tips.length > 0 && (

                  <div className="lp-result-section">

                    <h3>
                      <Lightbulb size={19} />
                      Smart Study Tips
                    </h3>

                    <ul className="lp-tip-list">

                      {learningPath.study_tips.map(
                        (item, index) => (

                          <li key={index}>

                            <CheckCircle2 size={16} />

                            {item}

                          </li>

                        )
                      )}

                    </ul>

                  </div>

                )}



              {/* Add to My Progress */}
              <div className="lp-save-progress">

                <div>

                  <h3>
                    Track Your Learning Journey
                  </h3>

                  <p>
                    Save this roadmap to My Progress and track your
                    daily study completion.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={handleSaveLearningPath}
                  disabled={saving || !!savedPathId}
                  className="lp-save-button"
                >

                  {saving ? (

                    <>
                      <LoaderCircle
                        size={18}
                        className="lp-spinner"
                      />

                      Saving...

                    </>

                  ) : savedPathId ? (

                    <>
                      <CheckCircle2 size={18} />
                      Added to My Progress
                    </>

                  ) : (

                    <>
                      <Target size={18} />
                      Add to My Progress
                    </>

                  )}

                </button>


                {/* Save Success / Error Message */}
                {saveMessage && (

                  <p
                    className="lp-save-message"
                    role="status"
                    aria-live="polite"
                    style={{
                      color: saveError ? "#dc2626" : "#16834a"
                    }}
                  >
                    {saveMessage}
                  </p>

                )}

              </div>

            </div>


          ) : (


            /* Empty Preview State */
            <div className="lp-empty-state">

              <div className="lp-empty-icon">
                <Target size={34} />
              </div>

              <h3>
                Your personalised roadmap awaits!
              </h3>

              <p>
                Complete your syllabus details and study preferences.
                Your AI-generated learning roadmap will appear here.
              </p>


              <div className="lp-preview-benefits">

                <span>
                  <CheckCircle2 size={16} />
                  Recommended learning sequence
                </span>

                <span>
                  <CheckCircle2 size={16} />
                  Daily study timetable
                </span>

                <span>
                  <CheckCircle2 size={16} />
                  Topic-wise learning objectives
                </span>

                <span>
                  <CheckCircle2 size={16} />
                  Revision and practice sessions
                </span>

              </div>

            </div>

          )}

        </div>

      </div>

    </section>

  );

}


export default LearningPath;
