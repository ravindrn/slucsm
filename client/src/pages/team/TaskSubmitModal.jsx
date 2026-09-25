import { useMemo, useRef, useState } from "react";
import api from "../../api/axios";

/* Labels for specific tasks that need to know WHAT each file is */
const LABELS_BY_TASK_TITLE = {
  "The Colour Hunt 🌈": [
    "🖤 Black",
    "💙 Blue",
    "❤️ Red",
    "💚 Green",
    "🤍 White",
    "🩷 Pink",
    "💜 Purple",
  ],
  "Welcome to Hogwarts ⚡": [],   // free-form
};

export default function TaskSubmitModal({ task, existing, onClose, onSuccess }) {
  const isMulti = task.submissionType === "multi";
  const isProgress = task.submissionType === "progress";
  const allowVideo = !!task.allowVideo;
  const maxFiles = task.maxFiles || 1;

  const [files, setFiles] = useState([]);          // [{ file, preview, label }]
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const fileInputRef = useRef(null);

  /* Which labels should this task have? */
  const labels = useMemo(
    () => LABELS_BY_TASK_TITLE[task.title] || [],
    [task.title]
  );

  const onPickFiles = (picked) => {
    const incoming = Array.from(picked || []);
    if (!incoming.length) return;

    const next = [...files];

    for (const file of incoming) {
      if (next.length >= maxFiles) {
        if (maxFiles > 1) {
          setErr(`You can attach up to ${maxFiles} files.`);
        }
        break;
      }

      /* Validate type */
      const isImg = file.type.startsWith("image/");
      const isVid = file.type.startsWith("video/");
      if (!isImg && !isVid) continue;
      if (isVid && !allowVideo) {
        setErr("This task does not accept videos.");
        continue;
      }

      next.push({
        file,
        preview: URL.createObjectURL(file),
        type: isVid ? "video" : "image",
        label: labels[next.length] || "",
      });
    }

    setFiles(next);
    setErr("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (i) => {
    setFiles((list) => list.filter((_, idx) => idx !== i));
  };

  const setLabel = (i, label) => {
    setFiles((list) =>
      list.map((f, idx) => (idx === i ? { ...f, label } : f))
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setErr("Add at least one file before submitting.");
      return;
    }

    setSubmitting(true);
    setErr("");

    try {
      const fd = new FormData();
      fd.append("taskId", task._id);
      fd.append("note", note);
      fd.append(
        "labels",
        JSON.stringify(files.map((f) => f.label || ""))
      );

      files.forEach((f) => fd.append("files", f.file));

      await api.post("/submissions", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess();
    } catch (e) {
      setErr(e.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const subtitle = isProgress
    ? "You can submit this task multiple times — each submission adds points."
    : isMulti
    ? `Upload up to ${maxFiles} file${maxFiles > 1 ? "s" : ""} in one submission.`
    : allowVideo
    ? "Upload a photo or a short video."
    : "Upload a photo.";

  return (
    <div className="tsm-overlay" onClick={onClose}>
      <style>{css}</style>
      <div className="tsm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tsm-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <p className="tsm-eyebrow">
          {isProgress ? "Progress submission" : isMulti ? "Multi-photo" : "Submit task"}
        </p>
        <h2>{task.title}</h2>
        <p className="tsm-desc">{task.description}</p>

        <div className="tsm-points">
          <span className="tsm-pts">
            {task.pointsPerItem > 0 ? `+${task.pointsPerItem}` : task.points}
          </span>
          <span className="tsm-pts-label">
            {task.pointsPerItem > 0 ? "pts per item" : "points"}
          </span>
        </div>

        <p className="tsm-sub">{subtitle}</p>

        {err && <div className="tsm-error">{err}</div>}

        <form onSubmit={submit}>
          {/* ---------- DROP ZONE ---------- */}
          <label className="tsm-drop">
            <input
              ref={fileInputRef}
              type="file"
              accept={
                allowVideo ? "image/*,video/*" : "image/*"
              }
              multiple={maxFiles > 1}
              onChange={(e) => onPickFiles(e.target.files)}
              hidden
            />
            <div className="tsm-drop-icon">⬆</div>
            <div className="tsm-drop-title">
              {files.length === 0
                ? "Tap to upload"
                : `${files.length} file${files.length > 1 ? "s" : ""} attached`}
            </div>
            <div className="tsm-drop-hint">
              {allowVideo
                ? "Images & videos · up to 60 MB each"
                : "Images only · up to 60 MB each"}
            </div>
          </label>

          {/* ---------- PREVIEWS ---------- */}
          {files.length > 0 && (
            <div className="tsm-previews">
              {files.map((f, i) => (
                <div key={i} className="tsm-preview">
                  <div className="tsm-preview-media">
                    {f.type === "video" ? (
                      <video src={f.preview} muted playsInline />
                    ) : (
                      <img src={f.preview} alt={`preview ${i + 1}`} />
                    )}
                  </div>

                  {labels.length > 0 && (
                    <select
                      value={f.label}
                      onChange={(e) => setLabel(i, e.target.value)}
                      className="tsm-label-select"
                    >
                      <option value="">— choose —</option>
                      {labels.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    className="tsm-preview-remove"
                    onClick={() => removeFile(i)}
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ---------- NOTE ---------- */}
          <label className="tsm-note-label">Note (optional)</label>
          <textarea
            rows={3}
            placeholder="Any details the admin should know…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {/* ---------- EXISTING SUBMISSION INFO ---------- */}
          {existing && existing.status === "pending" && !isProgress && (
            <div className="tsm-info">
              You already submitted this task. Re-submitting will replace your
              previous files.
            </div>
          )}
          {existing && existing.status === "approved" && (
            <div className="tsm-info success">
              This task is already approved. You can't re-submit.
            </div>
          )}

          <div className="tsm-actions">
            <button type="button" className="tsm-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="tsm-btn primary"
              disabled={submitting || files.length === 0}
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const css = `
.tsm-overlay{
  position:fixed; inset:0; z-index:100;
  background:rgba(27,42,74,0.55);
  display:flex; align-items:center; justify-content:center;
  padding:20px;
  backdrop-filter:blur(3px);
  -webkit-backdrop-filter:blur(3px);
}
.tsm-modal{
  background:#FFFDF8;
  border-radius:10px;
  max-width:540px; width:100%;
  max-height:92vh; overflow-y:auto;
  padding:32px;
  position:relative;
  font-family:'Inter',sans-serif;
  color:#1B2A4A;
  box-shadow:0 30px 80px rgba(27,42,74,0.35);
}
.tsm-close{
  position:absolute; top:12px; right:14px;
  width:34px; height:34px;
  border:none; background:transparent;
  font-size:1.5rem; cursor:pointer;
  color:#5a6380; line-height:1;
}
.tsm-close:hover{ color:#b23b3b; }

.tsm-eyebrow{
  font-size:0.75rem; font-weight:600;
  color:#B8912F; letter-spacing:0.08em;
  text-transform:uppercase; margin:0 0 6px;
}
.tsm-modal h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.6rem; font-weight:600;
  margin:0 0 12px; line-height:1.15;
}
.tsm-desc{
  color:#3a4560; font-size:0.92rem;
  margin:0 0 18px; line-height:1.55;
  white-space:pre-line;
  max-height:200px; overflow-y:auto;
  padding-right:6px;
}

.tsm-points{
  display:inline-flex; align-items:baseline; gap:6px;
  background:#F8F4E9; padding:6px 14px;
  border-radius:20px; margin-bottom:10px;
}
.tsm-pts{
  font-family:'Cormorant Garamond',serif;
  font-size:1.4rem; font-weight:600; color:#B8912F;
  line-height:1;
}
.tsm-pts-label{
  font-size:0.72rem; color:#7b8399;
  text-transform:uppercase; letter-spacing:0.05em;
}
.tsm-sub{
  font-size:0.85rem; color:#5a6380;
  margin:0 0 20px;
}

.tsm-error{
  background:#fff2f0; color:#b23b3b; border:1px solid #f0c8c2;
  padding:10px 14px; border-radius:4px;
  font-size:0.88rem; margin-bottom:16px;
}
.tsm-info{
  background:#F8F4E9; color:#8a6d10;
  border:1px solid rgba(184,145,47,0.3);
  padding:10px 14px; border-radius:4px;
  font-size:0.85rem; margin:10px 0 16px;
  line-height:1.5;
}
.tsm-info.success{
  background:#E3F3E5; color:#2e7d32;
  border-color:#bfe0c4;
}

/* ---------- DROP ZONE ---------- */
.tsm-drop{
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  gap:6px;
  padding:24px 20px;
  border:2px dashed rgba(27,42,74,0.22);
  border-radius:8px;
  background:#F8F4E9;
  cursor:pointer;
  transition:.2s;
  text-align:center;
  margin-bottom:16px;
}
.tsm-drop:hover{
  border-color:#B8912F;
  background:#fdf5e3;
}
.tsm-drop-icon{
  font-size:1.6rem; color:#B8912F;
  line-height:1;
}
.tsm-drop-title{
  font-family:'Cormorant Garamond', serif;
  font-size:1.1rem; font-weight:600;
  color:#1B2A4A;
}
.tsm-drop-hint{
  font-size:0.78rem; color:#7b8399;
}

/* ---------- PREVIEWS ---------- */
.tsm-previews{
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(120px, 1fr));
  gap:10px;
  margin-bottom:16px;
}
.tsm-preview{
  position:relative;
  border-radius:6px;
  overflow:hidden;
  background:#F8F4E9;
  border:1px solid rgba(27,42,74,0.14);
}
.tsm-preview-media{
  width:100%;
  aspect-ratio:1;
  overflow:hidden;
  display:flex; align-items:center; justify-content:center;
  background:#000;
}
.tsm-preview-media img,
.tsm-preview-media video{
  width:100%; height:100%;
  object-fit:cover;
}
.tsm-preview-remove{
  position:absolute; top:4px; right:4px;
  width:24px; height:24px;
  border:none; background:rgba(0,0,0,0.65);
  color:#fff; border-radius:50%;
  font-size:1rem; line-height:1;
  cursor:pointer;
  display:flex; align-items:center; justify-content:center;
}
.tsm-preview-remove:hover{ background:#b23b3b; }
.tsm-label-select{
  width:100%;
  padding:5px 6px;
  border:none;
  border-top:1px solid rgba(27,42,74,0.14);
  background:#fff;
  font-size:0.72rem;
  font-family:inherit;
  cursor:pointer;
  color:#1B2A4A;
}

/* ---------- NOTE ---------- */
.tsm-note-label{
  display:block; font-size:0.82rem;
  font-weight:500; color:#3a4560;
  margin-bottom:6px;
}
.tsm-modal textarea{
  width:100%; padding:10px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:4px; font-family:inherit;
  font-size:0.92rem; resize:vertical;
  margin-bottom:16px;
}
.tsm-modal textarea:focus{
  outline:none; border-color:#B8912F;
  box-shadow:0 0 0 3px rgba(184,145,47,0.1);
}

/* ---------- ACTIONS ---------- */
.tsm-actions{
  display:flex; gap:10px; justify-content:flex-end;
  margin-top:8px;
}
.tsm-btn{
  padding:10px 20px;
  border-radius:4px;
  border:1px solid rgba(27,42,74,0.18);
  background:transparent; color:#1B2A4A;
  font-family:inherit; font-size:0.9rem;
  cursor:pointer; transition:.15s;
}
.tsm-btn:hover{ background:#F8F4E9; }
.tsm-btn.primary{
  background:#1B2A4A; color:#F8F4E9;
  border-color:#1B2A4A;
}
.tsm-btn.primary:hover:not(:disabled){ background:#6E2C2C; border-color:#6E2C2C; }
.tsm-btn.primary:disabled{ opacity:0.55; cursor:not-allowed; }
.tsm-btn.ghost{ background:transparent; }
`;