import { useState } from "react";
import api from "../../api/axios";

export default function TaskSubmitModal({ task, existing, onClose, onSuccess }) {
  const [note, setNote] = useState(existing?.note || "");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const needsFile = task.type === "photo";
  const isQrTask = task.type === "qrScan";

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("taskId", task._id);
      fd.append("note", note);
      if (file) fd.append("proof", file);

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

  return (
    <div className="tsm-overlay" onClick={onClose}>
      <style>{css}</style>
      <div className="tsm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tsm-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <p className="tsm-eyebrow">Submit task</p>
        <h2>{task.title}</h2>
        <p className="tsm-desc">{task.description}</p>

        <div className="tsm-points">
          <span className="tsm-pts">{task.points}</span>
          <span className="tsm-pts-label">points</span>
        </div>

        {isQrTask && (
          <div className="tsm-info">
            <strong>📷 QR checkpoint</strong>
            <p>
              Use <em>Scan QR checkpoint</em> on your dashboard to redeem this task.
              If the scanner isn't available, enter the code below or ask the event
              coordinator to mark you in.
            </p>
            {task.qrCode && (
              <div className="tsm-qr-code">
                Code: <code>{task.qrCode}</code>
              </div>
            )}
          </div>
        )}

        {err && <div className="tsm-error">{err}</div>}

        <form onSubmit={submit}>
          {needsFile && (
            <>
              <label>Photo proof</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="tsm-file"
              />
            </>
          )}

          <label>Note (optional)</label>
          <textarea
            rows={3}
            placeholder="Any details the admin should know…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="tsm-actions">
            <button type="button" className="tsm-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="tsm-btn primary" disabled={submitting}>
              {submitting ? "Submitting…" : isQrTask ? "Submit manually" : "Submit"}
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
  background:rgba(27,42,74,0.5);
  display:flex; align-items:center; justify-content:center;
  padding:20px;
  backdrop-filter:blur(3px);
  -webkit-backdrop-filter:blur(3px);
}
.tsm-modal{
  background:#FFFDF8;
  border-radius:8px;
  max-width:480px; width:100%;
  max-height:90vh; overflow-y:auto;
  padding:32px;
  position:relative;
  font-family:'Inter',sans-serif;
  color:#1B2A4A;
  box-shadow:0 30px 80px rgba(27,42,74,0.3);
}
.tsm-close{
  position:absolute; top:12px; right:14px;
  width:32px; height:32px;
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
  font-size:1.65rem; font-weight:600;
  margin:0 0 10px; line-height:1.15;
}
.tsm-desc{
  color:#5a6380; font-size:0.92rem;
  margin:0 0 16px; line-height:1.5;
}

.tsm-points{
  display:inline-flex; align-items:baseline; gap:6px;
  background:#F8F4E9; padding:6px 14px;
  border-radius:20px; margin-bottom:20px;
}
.tsm-pts{
  font-family:'Cormorant Garamond',serif;
  font-size:1.4rem; font-weight:600; color:#B8912F;
  line-height:1;
}
.tsm-pts-label{
  font-size:0.75rem; color:#7b8399;
  text-transform:uppercase; letter-spacing:0.05em;
}

.tsm-info{
  background:#F8F4E9;
  border-left:3px solid #B8912F;
  padding:14px 16px;
  border-radius:4px;
  margin-bottom:18px;
  font-size:0.9rem;
  color:#3a4560;
}
.tsm-info strong{
  display:block; margin-bottom:6px;
  color:#1B2A4A; font-size:0.95rem;
}
.tsm-info p{ margin:0; line-height:1.5; }
.tsm-qr-code{
  margin-top:10px;
  font-size:0.9rem;
}
.tsm-qr-code code{
  font-family:'Courier New', monospace;
  background:#fff;
  padding:4px 10px;
  border-radius:3px;
  font-weight:600;
  color:#B8912F;
  letter-spacing:0.06em;
}

.tsm-error{
  background:#fff2f0; color:#b23b3b; border:1px solid #f0c8c2;
  padding:10px 14px; border-radius:3px;
  font-size:0.88rem; margin-bottom:16px;
}

.tsm-modal label{
  display:block; font-size:0.82rem;
  font-weight:500; margin-bottom:6px;
  color:#3a4560;
}
.tsm-modal textarea{
  width:100%; padding:10px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px; font-family:inherit;
  font-size:0.92rem; resize:vertical;
  margin-bottom:16px;
}
.tsm-modal textarea:focus{
  outline:none; border-color:#B8912F;
  box-shadow:0 0 0 3px rgba(184,145,47,0.1);
}
.tsm-file{
  width:100%; padding:8px;
  border:1px dashed rgba(27,42,74,0.22);
  border-radius:3px; font-size:0.85rem;
  margin-bottom:16px; cursor:pointer;
  background:#F8F4E9;
}

.tsm-actions{
  display:flex; gap:10px; justify-content:flex-end;
  margin-top:8px;
}
.tsm-btn{
  padding:10px 20px;
  border-radius:3px;
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
.tsm-btn.primary:disabled{ opacity:0.6; cursor:wait; }
`;