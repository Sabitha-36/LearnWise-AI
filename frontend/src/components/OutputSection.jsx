import { FileDown, RefreshCw } from "lucide-react";

function OutputSection({ result, onRegenerate }) {
  if (!result) {
    return (
      <div className="output-section empty-output">
        <FileDown size={40} />

        <h3>Your learning content will appear here</h3>

        <p>
          Enter your topic and click Generate
          to create personalised learning material.
        </p>
      </div>
    );
  }

  return (
    <div className="output-section">
      <div className="output-heading">
        <h3>Generated Content</h3>

        <button onClick={onRegenerate}>
          <RefreshCw size={16} />
          Regenerate
        </button>
      </div>

      <h4>{result.topic}</h4>

      <p><strong>Subject:</strong> {result.subject}</p>

      <p><strong>Content type:</strong> {result.contentType}</p>

      <div className="output-content">
        {result.content}
      </div>

      <button className="download-button" disabled>
        <FileDown size={18} />
        Download PDF (Coming Soon)
      </button>
    </div>
  );
}

export default OutputSection;