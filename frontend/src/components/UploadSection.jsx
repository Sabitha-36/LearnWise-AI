import { useRef } from "react";
import { Upload, FileText, Image } from "lucide-react";

function UploadSection({ onFileSelect, selectedFile }) {
  const fileInputRef = useRef(null);

  function handleFile(event) {
    const file = event.target.files[0];

    if (file) {
      onFileSelect(file);
    }
  }

  return (
    <div className="upload-section">
      <div className="section-title">
        <Upload size={22} />
        <h3>Upload Study Material</h3>
      </div>

      <p>Upload your textbook page, notes or PDF.</p>

      <div
        className="upload-box"
        onClick={() => fileInputRef.current.click()}
      >
        <Upload size={35} />

        <h4>Click to upload your file</h4>

        <p>PDF, JPG, JPEG and PNG supported</p>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          ref={fileInputRef}
          onChange={handleFile}
          hidden
        />
      </div>

      {selectedFile && (
        <div className="selected-file">
          <FileText size={20} />
          <span>{selectedFile.name}</span>
          <button onClick={() => onFileSelect(null)}>
            Remove
          </button>
        </div>
      )}

      <div className="upload-options">
        <span><FileText size={16} /> PDF</span>
        <span><Image size={16} /> Image</span>
      </div>
    </div>
  );
}

export default UploadSection;