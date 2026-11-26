
import { useState } from "react";
import {
  BookOpen,
  Image as ImageIcon,
  Keyboard,
  Upload,
  Sparkles,
  FileText,
  LoaderCircle,
  X,
  Lightbulb
} from "lucide-react";
import { Copy, Check } from "lucide-react";
import { explainConcept } from "../services/api";

function ConceptExplanation() {
  const [sourceType, setSourceType] = useState("manual");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [learningLevel, setLearningLevel] = useState("Beginner");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const sourceOptions = [
    { id: "manual", label: "Manual Topic", icon: Keyboard },
    { id: "book", label: "Reference Book", icon: BookOpen },
    { id: "image", label: "Screenshot / Image", icon: ImageIcon }
  ];

  function handleSourceChange(type) {
    setSourceType(type);
    setFile(null);
    setResult(null);
    setError("");
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const isPDF = selectedFile.type === "application/pdf";
    const isImage = selectedFile.type.startsWith("image/");

    if (sourceType === "book" && !isPDF) {
      setError("Please upload a PDF reference book.");
      event.target.value = "";
      return;
    }

    if (sourceType === "image" && !isImage) {
      setError("Please upload an image file.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Please select a file smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setError("");
    setResult(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!subject.trim() || !topic.trim()) {
      setError("Please enter both subject and topic.");
      return;
    }

    if (sourceType !== "manual" && !file) {
      setError(
        sourceType === "book"
          ? "Please upload a reference book PDF."
          : "Please upload a screenshot or image."
      );
      return;
    }

    const formData = new FormData();
    formData.append("source_type", sourceType);
    formData.append("subject", subject.trim());
    formData.append("topic", topic.trim());
    formData.append("learning_level", learningLevel);

    if (file) {
      formData.append("file", file);
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await explainConcept(formData);
      setResult(response.explanation);
    } catch (err) {
      setError(err.message || "Unable to generate the explanation.");
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = async () => {
  if (!result) return;

  try {
    await navigator.clipboard.writeText(result);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  } catch (error) {
    console.error("Copy failed:", error);
    setError("Unable to copy. Please try again.");
  }
};

  function clearFile() {
    setFile(null);
  }

  return (
    <div className="ce-page">
      <section className="ce-header">
        <div className="ce-heading-icon">
          <BookOpen size={28} />
        </div>

        <div>
          <h1>Concept Explanation</h1>
          <p>
            Learn difficult concepts using reference books,
            textbook screenshots, or your own topics.
          </p>
        </div>
      </section>

      <div className="ce-layout">
        <form className="ce-form-card" onSubmit={handleSubmit}>
          <h2>Choose Your Learning Source</h2>
          <p className="ce-muted">
            Select where you want LearnWise AI to get the content from.
          </p>

          <div className="ce-source-options">
            {sourceOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  type="button"
                  key={option.id}
                  className={`ce-source-option ${
                    sourceType === option.id ? "selected" : ""
                  }`}
                  onClick={() => handleSourceChange(option.id)}
                >
                  <Icon size={21} />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

          <div className="ce-field">
            <label htmlFor="ce-subject">Subject</label>
            <input
              id="ce-subject"
              type="text"
              placeholder="e.g. Data Mining"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="ce-field">
            <label htmlFor="ce-topic">Topic / Concept</label>
            <input
              id="ce-topic"
              type="text"
              placeholder="e.g. Association Rule Mining"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {sourceType === "book" && (
            <div className="ce-upload-section">
              <label>Upload Reference Book</label>
              <p className="ce-muted">
                Select a PDF textbook or reference material.
              </p>

              <label className="ce-upload-box">
                <Upload size={25} />
                <strong>Choose PDF file</strong>
                <span>PDF only · Maximum 10 MB</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}

          {sourceType === "image" && (
            <div className="ce-upload-section">
              <label>Upload Screenshot or Image</label>
              <p className="ce-muted">
                Upload a textbook page, notes, flowchart, or diagram.
              </p>

              <label className="ce-upload-box">
                <ImageIcon size={25} />
                <strong>Choose Image</strong>
                <span>PNG, JPG, JPEG, or WEBP · Maximum 10 MB</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}

          {file && (
            <div className="ce-selected-file">
              <FileText size={19} />
              <div>
                <strong>{file.name}</strong>
                <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <button
                type="button"
                onClick={clearFile}
                aria-label="Remove selected file"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="ce-field">
            <label htmlFor="ce-level">Learning Level</label>
            <select
              id="ce-level"
              value={learningLevel}
              onChange={(e) => setLearningLevel(e.target.value)}
            >
              <option value="Beginner">Beginner – Simple explanation</option>
              <option value="Intermediate">Intermediate – Detailed explanation</option>
              <option value="Advanced">Advanced – In-depth explanation</option>
            </select>
          </div>

          {error && <div className="ce-error">{error}</div>}

          <button
            type="submit"
            className="ce-generate-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle size={19} className="ce-spinner" />
                Analysing your content...
              </>
            ) : (
              <>
                <Sparkles size={19} />
                Generate Explanation
              </>
            )}
          </button>
        </form>

        <section className="ce-output-card">
          <div className="ce-output-heading">
            <div>
              <span className="ce-eyebrow">YOUR LEARNING SPACE</span>
              <h2>AI Explanation</h2>
            </div>
            <Lightbulb size={25} />
          </div>

          {result ? (
            <div className="ce-result">
              <h3>{topic}</h3>
              <div className="ce-result-content">{result}</div>
              <div className="concept-result-actions">
  <button
    type="button"
    className="copy-explanation-btn"
    onClick={handleCopy}
  >
    {copied ? <Check size={16} /> : <Copy size={16} />}
    {copied ? "Copied!" : "Copy Explanation"}
  </button>
</div>
            </div>
          ) : (
            <div className="ce-empty-state">
              <div className="ce-empty-icon">
                <Sparkles size={32} />
              </div>
              <h3>Your explanation will appear here</h3>
              <p>
                Choose a learning source, enter your topic,
                and generate a personalised explanation.
              </p>
              <div className="ce-benefits">
                <span><BookOpen size={16} /> Simple explanations</span>
                <span><Lightbulb size={16} /> Examples and key points</span>
                <span><FileText size={16} /> Revision-friendly notes</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ConceptExplanation;
