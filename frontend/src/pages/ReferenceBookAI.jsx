
import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  UploadCloud,
  LibraryBig,
  FileText,
  Trash2,
  BookOpen,
  Search,
  LoaderCircle
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import {
  saveReferenceBook,
  getReferenceBooks,
  deleteReferenceBook,
  updateReferenceBook
} from "../services/referenceBookStorage";

import "./ReferenceBookAI.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
function ReferenceBookAI({ user }) {
  const ownerId = String(
    user?.email || user?._id || user?.id || ""
  ).trim().toLowerCase();

  const [topic, setTopic] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [books, setBooks] = useState([]);
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [edition, setEdition] = useState("");
  const [selectedPages, setSelectedPages] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [processingBookId, setProcessingBookId] = useState(null);

  async function loadBooks() {
    if (!ownerId) {
      setError("Student account information is unavailable.");
      setLoading(false);
      return;
    }

    try {
      const result = await getReferenceBooks(ownerId);
      setBooks(result);
    } catch (err) {
      console.error(err);
      setError("Unable to load your reference library.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, [ownerId]);

  async function handleUpload(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!ownerId) {
      setError("Please log in again to upload books.");
      return;
    }

    if (files.length === 0) {
      setError("Please select at least one PDF.");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter the book subject.");
      return;
    }

    const invalidFile = files.find((file) => {
      return (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      );
    });

    if (invalidFile) {
      setError("Only PDF files are supported.");
      return;
    }

    const oversizedFile = files.find(
      (file) => file.size > 25 * 1024 * 1024
    );

    if (oversizedFile) {
      setError("Each PDF must be smaller than 25 MB.");
      return;
    }

    setSaving(true);

    try {
      for (const file of files) {
        const bookTitle = files.length === 1 && title.trim()
          ? title.trim()
          : file.name.replace(/\.pdf$/i, "");

        await saveReferenceBook({
          id: crypto.randomUUID(),
          ownerId,
          title: bookTitle,
          author: author.trim(),
          subject: subject.trim(),
          edition: edition.trim(),
          fileName: file.name,
          file,
          size: file.size,
          createdAt: Date.now()
        });
      }

      setFiles([]);
      setTitle("");
      setAuthor("");
      setSubject("");
      setEdition("");

      const fileInput = document.getElementById(
        "reference-book-files"
      );

      if (fileInput) fileInput.value = "";

      await loadBooks();

      setSuccess("Your reference books were saved successfully!");
    } catch (err) {
      console.error("Reference Book Upload Error:", err);
      setError(
        "Unable to save the PDFs. Your browser storage may be full."
      );
    } finally {
      setSaving(false);
    }
  }

async function handleProcessBook(book) {
  setError("");
  setSuccess("");
  setProcessingBookId(book.id);

  let pdf = null;

  try {
    // Read the original PDF from IndexedDB
    const pdfData = new Uint8Array(
      await book.file.arrayBuffer()
    );

    // Open the PDF using PDF.js
    pdf = await pdfjsLib.getDocument({
      data: pdfData
    }).promise;

    const extractedPages = [];
    let pagesWithText = 0;

    // Extract every original page
    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      const page = await pdf.getPage(pageNumber);

      const textContent = await page.getTextContent();

      // Preserve line breaks where PDF.js provides them
      const pageText = textContent.items
        .filter(item => typeof item.str === "string")
        .map(item => {
          return item.str + (item.hasEOL ? "\n" : " ");
        })
        .join("")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (pageText.length > 0) {
        pagesWithText++;
      }

      extractedPages.push({
        pageNumber: pageNumber,
        text: pageText
      });
    }

    // Save extracted content without replacing the original PDF
    await updateReferenceBook(book.id, ownerId, {
      totalPages: pdf.numPages,
      extractedPages,
      pagesWithText,
      extractionStatus: "completed",
      extractedAt: Date.now()
    });

    await loadBooks();

    if (pagesWithText === 0) {
      setSuccess(
        `${book.title}: ${pdf.numPages} pages processed, but no selectable text was found. This PDF may be scanned.`
      );
    } else {
      setSuccess(
        `${book.title}: ${pdf.numPages} pages processed. Text found on ${pagesWithText} pages.`
      );
    }

  } catch (err) {
    console.error("PDF Extraction Error:", err);

    setError(
      err.message || `Unable to process ${book.title}.`
    );

  } finally {
    if (pdf) {
      await pdf.destroy();
    }

    setProcessingBookId(null);
  }
}

function handleTopicSearch(event) {
  event.preventDefault();

  const searchTopic = topic.trim().toLowerCase();

  setSearchResults([]);
  setSearchMessage("");
  setSelectedPages([]);
  if (!searchTopic) {
    setSearchMessage("Please enter a topic to search.");
    return;
  }

  setSearching(true);

  try {
    const results = [];

    books.forEach(book => {
      if (!book.extractedPages || book.extractionStatus !== "completed") {
        return;
      }

      book.extractedPages.forEach(page => {
        const pageText = page.text || "";
        const lowerText = pageText.toLowerCase();

       const normalizedTopic = searchTopic
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]/gu, "");

const normalizedPage = lowerText
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]/gu, "");

if (normalizedPage.includes(normalizedTopic)) {
         results.push({
            bookId: book.id,
            bookTitle: book.title,
            fileName: book.fileName,
            pageNumber: page.pageNumber,
            text: pageText
          });
        }
      });
    });

    setSearchResults(results);

    if (results.length === 0) {
      setSearchMessage(
        "No matching pages found. Try another topic or process your reference books first."
      );
    }
  } catch (error) {
    console.error("Topic Search Error:", error);
    setSearchMessage("Unable to search your reference books.");
  } finally {
    setSearching(false);
  }
}

function togglePageSelection(result) {
  const pageId = `${result.bookId}-${result.pageNumber}`;

  setSelectedPages(previous => {
    const alreadySelected = previous.some(
      page => page.pageId === pageId
    );

    if (alreadySelected) {
      return previous.filter(page => page.pageId !== pageId);
    }

    return [...previous, { ...result, pageId }];
  });
}

async function handleGeneratePDF() {
  if (selectedPages.length === 0) {
    setError("Please select at least one page.");
    return;
  }

  setGeneratingPDF(true);
  setError("");
  setSuccess("");

  try {
    // Create a new PDF document
    const outputPDF = await PDFDocument.create();

    // Keep loaded books in memory to avoid loading
    // the same reference book multiple times
    const loadedBooks = new Map();

    // Process selected pages in selection order
    for (const selectedPage of selectedPages) {
      const book = books.find(
        item => item.id === selectedPage.bookId
      );

      if (!book || !book.file) {
        throw new Error(
          `Original PDF not found: ${selectedPage.bookTitle}`
        );
      }

      // Load each source PDF only once
      if (!loadedBooks.has(book.id)) {
        const sourcePDF = await PDFDocument.load(
          await book.file.arrayBuffer()
        );

        loadedBooks.set(book.id, sourcePDF);
      }

      const sourcePDF = loadedBooks.get(book.id);
      const pageIndex = selectedPage.pageNumber - 1;

      if (pageIndex < 0 || pageIndex >= sourcePDF.getPageCount()) {
        throw new Error(
          `Page ${selectedPage.pageNumber} is unavailable in ${book.title}.`
        );
      }

      // Copy the exact original page
      const [copiedPage] = await outputPDF.copyPages(
        sourcePDF,
        [pageIndex]
      );

      outputPDF.addPage(copiedPage);
    }

    // Generate PDF bytes
    const pdfBytes = await outputPDF.save();

    // Create downloadable PDF
    const blob = new Blob([pdfBytes], {
      type: "application/pdf"
    });

    const downloadURL = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadURL;

    const safeTopic = (topic.trim() || "Selected_Pages")
      .replace(/[^a-z0-9_-]+/gi, "_");

    link.download = `${safeTopic}_Reference_Pages.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
    URL.revokeObjectURL(downloadURL);
    }, 1000);
    setSuccess(
      `PDF generated successfully with ${selectedPages.length} selected pages!`
    );

  } catch (err) {
    console.error("PDF Generation Error:", err);
    setError(
      err.message || "Unable to generate the selected pages PDF."
    );
  } finally {
    setGeneratingPDF(false);
  }
}

function selectAllPages() {
  setSelectedPages(
    searchResults.map(result => ({
      ...result,
      pageId: `${result.bookId}-${result.pageNumber}`
    }))
  );
}

function clearSelectedPages() {
  setSelectedPages([]);
}

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reference book?"
    );

    if (!confirmed) return;

    try {
      await deleteReferenceBook(id, ownerId);
      await loadBooks();
      setSuccess("Reference book deleted successfully.");
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to delete this book.");
    }
  }

  const filteredBooks = books.filter((book) => {
    const query = search.toLowerCase();

    return (
      book.title.toLowerCase().includes(query) ||
      book.subject.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
  });

  function formatSize(bytes) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <div className="referencebook-page">

      <div className="referencebook-hero">
        <div>
          <span className="referencebook-label">
            YOUR PERSONAL AI LIBRARY
          </span>

          <h1>Book Shelf </h1>

          <p>
            Your intelligent library for collecting,
            organizing and learning from reference books.
          </p>
        </div>

        <div className="referencebook-hero-icon">
          <LibraryBig size={48} />
        </div>
      </div>

      <div className="referencebook-stats">
        <div className="referencebook-stat-card">
          <LibraryBig size={25} />
          <div>
            <h2>{books.length}</h2>
            <p>Uploaded Books</p>
          </div>
        </div>

        <div className="referencebook-stat-card">
          <FileText size={25} />
          <div>
            <h2>
              {books.reduce(
                (total, book) => total + book.size,
                0
              ) > 0
                ? formatSize(
                    books.reduce(
                      (total, book) => total + book.size,
                      0
                    )
                  )
                : "0 MB"}
            </h2>
            <p>Storage Used</p>
          </div>
        </div>
      </div>

      <section className="referencebook-section">
        <div className="referencebook-section-heading">
          <div>
            <h2>
              <UploadCloud size={23} />
              Add Reference Books
            </h2>

            <p>
              Upload your textbooks and reference materials.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpload}>

          <label htmlFor="reference-book-files">
            Select PDF files
          </label>

          <input
            id="reference-book-files"
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={(event) =>
              setFiles(Array.from(event.target.files || []))
            }
          />

          {files.length > 0 && (
            <p className="referencebook-file-info">
              {files.length} PDF file(s) selected
            </p>
          )}

          <div className="referencebook-form-grid">

            <div>
              <label>Book Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title (optional for multiple PDFs)"
                disabled={files.length > 1}
              />
            </div>

            <div>
              <label>Author</label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name"
              />
            </div>

            <div>
              <label>Subject *</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Example: Data Mining"
                required
              />
            </div>

            <div>
              <label>Edition</label>
              <input
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                placeholder="Example: 3rd Edition"
              />
            </div>

          </div>

          {error && (
            <p className="referencebook-error">{error}</p>
          )}

          {success && (
            <p className="referencebook-success">{success}</p>
          )}

          <button
            type="submit"
            className="referencebook-upload-btn"
            disabled={saving}
          >
            {saving ? (
              <>
                <LoaderCircle className="referencebook-spin" size={18} />
                Saving Books...
              </>
            ) : (
              <>
                <UploadCloud size={18} />
                Save to My Library
              </>
            )}
          </button>

        </form>
      </section>


<section className="referencebook-section">

  <div className="referencebook-section-heading">
    <div>
      <h2>
        <Search size={23} />
        Find Pages by Topic
      </h2>
      <p>
        Search for concepts across all your uploaded reference books.
      </p>
    </div>
  </div>

  <form onSubmit={handleTopicSearch}>
    <div className="referencebook-search">
      <Search size={19} />

      <input
        type="text"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Enter a topic, e.g. Apriori Algorithm..."
      />

      <button type="submit" disabled={searching}>
        {searching ? "Searching..." : "Find Pages"}
      </button>
    </div>
  </form>

  {searchMessage && (
    <p className="referencebook-empty">
      {searchMessage}
    </p>
  )}

  
{searchResults.length > 0 && (
  <div className="referencebook-results">

    <div className="referencebook-selection-header">
      <div>
        <h3>{searchResults.length} Matching Pages Found</h3>
        <p>{selectedPages.length} page(s) selected</p>
      </div>

      <div className="referencebook-selection-actions">
        <button type="button" onClick={selectAllPages}>
          Select All
        </button>

        <button type="button" onClick={clearSelectedPages}>
          Clear
        </button>
      </div>
    </div>

    {searchResults.map((result, index) => {
      const pageId = `${result.bookId}-${result.pageNumber}`;

      const isSelected = selectedPages.some(
        page => page.pageId === pageId
      );

      return (
        <div
          className={`referencebook-book-card ${
            isSelected ? "referencebook-page-selected" : ""
          }`}
          key={pageId}
        >

          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => togglePageSelection(result)}
          />

          <div className="referencebook-book-icon">
            <FileText size={25} />
          </div>

          <div className="referencebook-book-details">
            <h3>{result.bookTitle}</h3>

            <span>Original Page: {result.pageNumber}</span>

            <p>
              {result.text.slice(0, 220)}
              {result.text.length > 220 ? "..." : ""}
            </p>
          </div>

        </div>
      );
    })}

    {selectedPages.length > 0 && (
      <div className="referencebook-selection-summary">
        <h3>Selected Pages</h3>

        <p>
          {selectedPages.length} page(s) selected
          from your reference books.
        </p>

        {selectedPages.map(page => (
          <div key={page.pageId}>
            <FileText size={16} />
            <span>
              {page.bookTitle} – Page {page.pageNumber}
            </span>
          </div>
        ))}
        <button
        type="button"
        className="referencebook-generate-btn"
        onClick={handleGeneratePDF}
        disabled={generatingPDF || selectedPages.length === 0}
        >
        {generatingPDF
            ? "Generating PDF..."
            : "Generate Selected Pages PDF"}
        </button>
      </div>

    )}

  </div>
)}

</section>


      <section className="referencebook-section">

        <div className="referencebook-section-heading">
          <div>
            <h2>
              <BookOpen size={23} />
              My Reference Library
            </h2>

            <p>
              Your books are saved in this browser.
            </p>
          </div>
        </div>

        <div className="referencebook-search">
          <Search size={19} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your books..."
          />
        </div>

        {loading ? (
          <p className="referencebook-empty">
            Loading your library...
          </p>
        ) : filteredBooks.length === 0 ? (
          <div className="referencebook-empty">
            <LibraryBig size={40} />
            <h3>No reference books found</h3>
            <p>Upload your first PDF to build your library.</p>
          </div>
        ) : (
          <div className="referencebook-book-grid">
            {filteredBooks.map((book) => (
              <div className="referencebook-book-card" key={book.id}>

                <div className="referencebook-book-icon">
                  <FileText size={28} />
                </div>

                <div className="referencebook-book-details">
                  <h3>{book.title}</h3>

                  <p>{book.author || "Author not specified"}</p>

                  <span>{book.subject}</span>

                  {book.edition && (
                    <small>{book.edition}</small>

                  )}

                  <small>
                    {book.fileName} · {formatSize(book.size)}
                  </small>
                  
                 {book.extractionStatus === "completed" ? (
                    <>
                        <small className="referencebook-processed">
                        ✓ {book.totalPages} pages processed
                        </small>

                        <small>
                        {book.pagesWithText || 0} pages contain extractable text
                        </small>
                    </>
                    ) : (
  <button
    type="button"
    className="referencebook-process-btn"
    disabled={processingBookId === book.id}
    onClick={() => handleProcessBook(book)}
  >
    {processingBookId === book.id
      ? "Processing PDF..."
      : "Extract PDF Text"}
  </button>
)}
                
                </div>

                <button
                  type="button"
                  className="referencebook-delete-btn"
                  onClick={() => handleDelete(book.id)}
                  title="Delete book"
                  aria-label={`Delete ${book.title}`}
                >
                  <Trash2 size={18} />
                </button>

              </div>
            ))}
          </div>
        )}

      </section>

    </div>
  );
}

export default ReferenceBookAI;
