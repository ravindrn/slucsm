import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

/* Quill toolbar configuration */
const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ align: [] }],
  ["blockquote", "link"],
  ["clean"],
];

/* Formatting options */
const FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "align",
  "blockquote",
  "link",
];

export default function NoticeEditor({ data, onChange }) {
  const notices = data?.notices || [];

  /* Quill needs a non-empty HTML string as the value */
  const getValue = (n) => {
    if (!n.text) return "";
    /* Legacy plain text — wrap as HTML paragraph */
    if (typeof n.text === "string" && !n.text.trim().startsWith("<")) {
      return `<p>${n.text.replace(/\n/g, "<br/>")}</p>`;
    }
    return n.text;
  };

  const update = (i, key, val) => {
    const next = [...notices];
    next[i] = { ...next[i], [key]: val };
    onChange({ ...data, notices: next });
  };

  const add = () =>
    onChange({
      ...data,
      notices: [...notices, { text: "", pinned: false }],
    });

  const remove = (i) =>
    onChange({
      ...data,
      notices: notices.filter((_, idx) => idx !== i),
    });

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= notices.length) return;
    const next = [...notices];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...data, notices: next });
  };

  return (
    <div className="field-editor notice-editor">
      {notices.length === 0 && (
        <p className="fe-empty">No notices yet.</p>
      )}

      {notices.map((n, i) => (
        <div key={i} className="notice-edit-item">
          <div className="notice-edit-head">
            <span className="notice-edit-label">Notice {i + 1}</span>

            <label className="notice-pin-toggle">
              <input
                type="checkbox"
                checked={!!n.pinned}
                onChange={(e) => update(i, "pinned", e.target.checked)}
              />
              <span>📌 Pinned</span>
            </label>

            <div className="notice-edit-actions">
              <button
                type="button"
                onClick={() => move(i, -1)}
                title="Move up"
                disabled={i === 0}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                title="Move down"
                disabled={i === notices.length - 1}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="danger"
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>

          <ReactQuill
            theme="snow"
            value={getValue(n)}
            onChange={(html) => update(i, "text", html)}
            modules={{ toolbar: TOOLBAR }}
            formats={FORMATS}
            placeholder="Write the announcement. Use the toolbar to format text, add lists, or bold key phrases."
          />
        </div>
      ))}

      <button type="button" className="fe-add" onClick={add}>
        + Add notice
      </button>

      <style>{`
        .notice-editor .notice-edit-item {
          background: #fff;
          border: 1px solid rgba(27,42,74,0.14);
          border-radius: 6px;
          padding: 14px;
          margin-bottom: 14px;
        }
        .notice-editor .notice-edit-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .notice-editor .notice-edit-label {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #7b8399;
        }
        .notice-editor .notice-pin-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: #3a4560;
          cursor: pointer;
          margin-left: auto;
        }
        .notice-editor .notice-edit-actions {
          display: flex;
          gap: 4px;
        }
        .notice-editor .notice-edit-actions button {
          width: 28px; height: 28px;
          border: 1px solid rgba(27,42,74,0.14);
          background: #fff;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.85rem;
          font-family: inherit;
        }
        .notice-editor .notice-edit-actions button:hover:not(:disabled) {
          background: #F8F4E9;
        }
        .notice-editor .notice-edit-actions button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .notice-editor .notice-edit-actions button.danger {
          color: #b23b3b;
          border-color: #f0c8c2;
        }
        .notice-editor .notice-edit-actions button.danger:hover {
          background: #fff2f0;
        }

        /* Quill overrides to match site style */
        .notice-editor .ql-toolbar {
          border: 1px solid rgba(27,42,74,0.14) !important;
          border-bottom: none !important;
          border-radius: 4px 4px 0 0 !important;
          background: #F8F4E9 !important;
          font-family: inherit !important;
        }
        .notice-editor .ql-container {
          border: 1px solid rgba(27,42,74,0.14) !important;
          border-radius: 0 0 4px 4px !important;
          font-family: inherit !important;
          font-size: 0.92rem !important;
          background: #fff !important;
          min-height: 160px;
        }
        .notice-editor .ql-editor {
          min-height: 160px;
          font-family: inherit;
          color: #1B2A4A;
          line-height: 1.6;
        }
        .notice-editor .ql-editor.ql-blank::before {
          color: #a4acbf;
          font-style: normal;
        }
        .notice-editor .ql-editor h1 {
          font-size: 1.5rem;
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
        }
        .notice-editor .ql-editor h2 {
          font-size: 1.25rem;
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
        }
        .notice-editor .ql-editor h3 {
          font-size: 1.05rem;
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
        }
        .notice-editor .ql-editor ul,
        .notice-editor .ql-editor ol {
          padding-left: 22px;
        }
        .notice-editor .ql-editor li {
          margin-bottom: 4px;
        }
        .notice-editor .ql-editor a {
          color: #B8912F;
        }
      `}</style>
    </div>
  );
}