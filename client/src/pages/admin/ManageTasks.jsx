import { useEffect, useState } from "react";
import api from "../../api/axios";

const EMPTY = {
  title: "",
  description: "",
  points: 10,
  type: "manual",
  qrCode: "",
  location: "",
  order: 0,
};

const TYPES = [
  { value: "manual", label: "Manual (admin awards)" },
  { value: "checkpoint", label: "Checkpoint (in-person)" },
  { value: "photo", label: "Photo upload" },
  { value: "quiz", label: "Quiz" },
  { value: "qrScan", label: "QR scan" },
];

export default function ManageTasks() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState("");

  /* ---------- QR MODAL STATE ---------- */
  const [qrTask, setQrTask] = useState(null);
  const [qrData, setQrData] = useState(null);

  /* ---------- LOAD EVENTS ---------- */
  useEffect(() => {
    (async () => {
      const { data } = await api.get("/events");
      setEvents(data);
      const firstOngoing =
        data.find((e) => e.status === "ongoing") ||
        data.find((e) => e.status === "upcoming") ||
        data[0];
      if (firstOngoing) setEventId(firstOngoing._id);
      setLoading(false);
    })();
  }, []);

  /* ---------- LOAD TASKS ---------- */
  useEffect(() => {
    if (!eventId) return;
    (async () => {
      const { data } = await api.get(`/tasks/event/${eventId}`);
      setTasks(data);
    })();
  }, [eventId]);

  const reload = async () => {
    const { data } = await api.get(`/tasks/event/${eventId}`);
    setTasks(data);
  };

  /* ---------- FORM ---------- */
  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setErr("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (editingId) {
        await api.put(`/tasks/${editingId}`, form);
      } else {
        await api.post("/tasks", { ...form, eventId });
      }
      reset();
      await reload();
    } catch (e) {
      setErr(e.response?.data?.message || "Save failed");
    }
  };

  const edit = (t) => {
    setEditingId(t._id);
    setForm({
      title: t.title,
      description: t.description || "",
      points: t.points,
      type: t.type || "manual",
      qrCode: t.qrCode || "",
      location: t.location || "",
      order: t.order || 0,
    });
  };

  const del = async (t) => {
    if (!window.confirm(`Delete task "${t.title}"?`)) return;
    await api.delete(`/tasks/${t._id}`);
    setTasks((list) => list.filter((x) => x._id !== t._id));
  };

  /* ---------- QR HELPERS ---------- */
  const openQr = async (task) => {
    try {
      const { data } = await api.get(`/qrcodes/preview/${task._id}`);
      setQrData(data);
      setQrTask(task);
    } catch (e) {
      alert(e.response?.data?.message || "Could not load QR");
    }
  };

  const closeQr = () => {
    setQrTask(null);
    setQrData(null);
  };

  const downloadQr = () => {
    if (!qrData) return;
    const link = document.createElement("a");
    link.href = qrData.dataUrl;
    link.download = `qr-${qrData.qrCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQr = () => {
    if (!qrData || !qrTask) return;
    const w = window.open("", "_blank", "width=500,height=700");
    if (!w) {
      alert("Popup blocked. Please allow popups for this site.");
      return;
    }
    w.document.write(`
      <html>
        <head>
          <title>QR - ${qrTask.title}</title>
          <style>
            body{
              font-family:'Inter', system-ui, sans-serif;
              text-align:center;
              padding:40px 20px;
              color:#1B2A4A;
              background:#FFFDF8;
            }
            h1{
              font-family:'Cormorant Garamond', Georgia, serif;
              font-size:1.7rem;
              margin:0 0 10px;
            }
            .code{
              font-family:monospace;
              background:#F8F4E9;
              padding:8px 18px;
              border-radius:4px;
              display:inline-block;
              font-weight:600;
              color:#B8912F;
              letter-spacing:0.08em;
              margin-bottom:22px;
            }
            img{ width:340px; height:340px; }
            .pts{
              margin-top:18px;
              font-size:1.15rem;
              color:#B8912F;
              font-weight:600;
            }
            .hint{
              margin-top:28px;
              font-size:0.85rem;
              color:#7b8399;
            }
            @media print {
              body { padding:20px; }
            }
          </style>
        </head>
        <body>
          <h1>${qrTask.title}</h1>
          <div class="code">${qrData.qrCode}</div>
          <img src="${qrData.dataUrl}" alt="QR" />
          <div class="pts">+${qrTask.points} points</div>
          <p class="hint">Scan with the SLUCSM Team Portal.</p>
          <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="manage-tasks">
      <style>{css}</style>

      <div className="mt-head">
        <div>
          <h1>Tasks</h1>
          <p className="mt-sub">
            Each task can be completed by teams. QR tasks get a unique code + printable QR image.
          </p>
        </div>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="mt-event-select"
        >
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>
              {ev.title} ({ev.status})
            </option>
          ))}
        </select>
      </div>

      <div className="mt-layout">
        {/* ---------- FORM ---------- */}
        <form className="mt-form" onSubmit={submit}>
          <h2>{editingId ? "Edit task" : "New task"}</h2>
          {err && <div className="mt-error">{err}</div>}

          <label>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Morning Prayer Check-in"
            required
          />

          <label>Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Scan the QR at the chapel entrance before 8 AM."
          />

          <label>Points</label>
          <input
            type="number"
            min={0}
            value={form.points}
            onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
          />

          <label>Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {(form.type === "qrScan" || form.type === "checkpoint") && (
            <>
              <label>
                QR code / checkpoint code
                <span className="hint-inline">(unique, uppercase)</span>
              </label>
              <input
                type="text"
                value={form.qrCode}
                onChange={(e) =>
                  setForm({ ...form, qrCode: e.target.value.toUpperCase() })
                }
                placeholder="CHAPEL-001"
              />
              {form.qrCode && (
                <p className="mt-field-hint">
                  QR encodes:{" "}
                  <code>
                    {(import.meta.env.VITE_CLIENT_URL || "http://localhost:5173") +
                      "/scan/" +
                      form.qrCode}
                  </code>
                </p>
              )}
            </>
          )}

          <label>Location (optional)</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Main chapel"
          />

          <label>Order</label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
          />

          <div className="mt-form-actions">
            <button type="submit" className="mt-btn primary">
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button type="button" className="mt-btn ghost" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* ---------- LIST ---------- */}
        <div className="mt-list">
          <h2>
            {tasks.length} task{tasks.length !== 1 && "s"}
          </h2>
          {tasks.length === 0 ? (
            <p className="mt-empty">No tasks yet.</p>
          ) : (
            <ul className="mt-task-list">
              {tasks.map((t) => (
                <li key={t._id} className="mt-task-item">
                  <div className="task-points">
                    {t.points}
                    <span>pts</span>
                  </div>
                  <div className="mt-task-info">
                    <strong>{t.title}</strong>
                    <span className="mt-task-meta">
                      type: {t.type}
                      {t.qrCode && ` · code: ${t.qrCode}`}
                      {t.location && ` · ${t.location}`}
                    </span>
                  </div>
                  <div className="mt-task-actions">
                    {(t.type === "qrScan" || t.type === "checkpoint") && t.qrCode && (
                      <button
                        className="mt-btn qr"
                        onClick={() => openQr(t)}
                        title="Generate QR"
                      >
                        🔳 QR
                      </button>
                    )}
                    <button className="mt-btn" onClick={() => edit(t)}>
                      Edit
                    </button>
                    <button className="mt-btn danger" onClick={() => del(t)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ---------- QR MODAL ---------- */}
      {qrTask && qrData && (
        <div className="mt-modal-overlay" onClick={closeQr}>
          <div className="mt-modal" onClick={(e) => e.stopPropagation()}>
            <button className="mt-modal-close" onClick={closeQr}>
              ×
            </button>
            <h2>{qrTask.title}</h2>
            <p className="mt-modal-code">{qrData.qrCode}</p>
            <img src={qrData.dataUrl} alt="QR code" className="mt-qr-img" />
            <p className="mt-modal-url">
              <small>{qrData.scanUrl}</small>
            </p>
            <div className="mt-modal-actions">
              <button className="mt-btn" onClick={closeQr}>
                Close
              </button>
              <button className="mt-btn primary" onClick={downloadQr}>
                ⬇ Download PNG
              </button>
              <button className="mt-btn primary" onClick={printQr}>
                🖨 Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const css = `
.manage-tasks{ color:#1B2A4A; }
.mt-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:16px; flex-wrap:wrap; margin-bottom:24px;
}
.mt-head h1{
  font-family:'Cormorant Garamond', serif;
  font-size:2rem; font-weight:600; margin:0 0 6px;
}
.mt-sub{ color:#5a6380; font-size:0.9rem; margin:0; }
.mt-event-select{
  padding:9px 14px; border-radius:4px;
  border:1px solid rgba(27,42,74,0.14);
  background:#FFFDF8; font-family:inherit;
  font-size:0.9rem; color:#1B2A4A; min-width:220px;
}
.mt-layout{ display:grid; grid-template-columns:380px 1fr; gap:24px; }
@media (max-width:900px){ .mt-layout{ grid-template-columns:1fr; } }

.mt-form{
  background:#FFFDF8; border:1px solid rgba(27,42,74,0.14);
  border-radius:6px; padding:22px;
  display:flex; flex-direction:column; gap:8px;
  height:fit-content;
  position:sticky; top:20px;
}
.mt-form h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.4rem; margin:0 0 12px;
}
.mt-form label{
  font-size:0.82rem; font-weight:500;
  color:#3a4560; margin-top:8px;
}
.hint-inline{
  color:#7b8399; font-weight:400;
  font-size:0.75rem; margin-left:6px;
}
.mt-form input, .mt-form textarea, .mt-form select{
  padding:9px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px; font-family:inherit;
  font-size:0.9rem; background:#fff;
}
.mt-form textarea{ resize:vertical; }
.mt-field-hint{
  font-size:0.78rem; color:#7b8399;
  margin:2px 0 4px; line-height:1.4;
}
.mt-field-hint code{
  background:#F8F4E9; padding:2px 6px;
  border-radius:3px; font-size:0.72rem;
  color:#B8912F; word-break:break-all;
}
.mt-form-actions{ display:flex; gap:8px; margin-top:16px; }
.mt-btn{
  padding:9px 16px; border-radius:3px;
  border:1px solid rgba(27,42,74,0.14);
  background:transparent; color:#1B2A4A;
  font-family:inherit; font-size:0.88rem;
  cursor:pointer; transition:.15s;
}
.mt-btn:hover{ background:#F8F4E9; }
.mt-btn.primary{ background:#1B2A4A; color:#F8F4E9; border-color:#1B2A4A; }
.mt-btn.primary:hover{ background:#6E2C2C; border-color:#6E2C2C; }
.mt-btn.danger{ color:#b23b3b; border-color:#f0c8c2; }
.mt-btn.danger:hover{ background:#fff2f0; }
.mt-btn.ghost{ background:transparent; }
.mt-btn.qr{
  background:#F8F4E9; color:#B8912F;
  border-color:rgba(184,145,47,0.3);
  font-weight:600;
}
.mt-btn.qr:hover{ background:#B8912F; color:#fff; border-color:#B8912F; }

.mt-error{
  background:#fff2f0; color:#b23b3b; border:1px solid #f0c8c2;
  padding:10px 12px; border-radius:3px; font-size:0.85rem;
}

.mt-list{
  background:#FFFDF8; border:1px solid rgba(27,42,74,0.14);
  border-radius:6px; padding:22px;
}
.mt-list h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.4rem; margin:0 0 16px;
}
.mt-empty{ color:#7b8399; font-style:italic; }

.mt-task-list{ list-style:none; margin:0; padding:0; }
.mt-task-item{
  display:grid; grid-template-columns:60px 1fr auto;
  gap:14px; align-items:center;
  padding:14px 0; border-bottom:1px solid rgba(27,42,74,0.08);
}
.mt-task-item:last-child{ border-bottom:none; }
.task-points{
  font-family:'Cormorant Garamond',serif;
  font-size:1.5rem; font-weight:600; color:#B8912F;
  text-align:center; line-height:1;
}
.task-points span{
  display:block; font-family:'Inter',sans-serif;
  font-size:0.65rem; font-weight:400; color:#7b8399;
  text-transform:uppercase; letter-spacing:0.05em;
  margin-top:2px;
}
.mt-task-info{ display:flex; flex-direction:column; gap:2px; min-width:0; }
.mt-task-info strong{ font-size:0.98rem; }
.mt-task-meta{ font-size:0.78rem; color:#7b8399; }
.mt-task-actions{ display:flex; gap:6px; flex-wrap:wrap; }

/* ---------- QR MODAL ---------- */
.mt-modal-overlay{
  position:fixed; inset:0; z-index:100;
  background:rgba(27,42,74,0.6);
  display:flex; align-items:center; justify-content:center;
  padding:20px;
  backdrop-filter:blur(3px);
  -webkit-backdrop-filter:blur(3px);
}
.mt-modal{
  background:#FFFDF8;
  border-radius:8px;
  max-width:420px; width:100%;
  padding:32px;
  position:relative;
  text-align:center;
  font-family:'Inter',sans-serif;
  color:#1B2A4A;
  box-shadow:0 30px 80px rgba(27,42,74,0.3);
  max-height:92vh; overflow-y:auto;
}
.mt-modal-close{
  position:absolute; top:10px; right:14px;
  width:32px; height:32px;
  border:none; background:transparent;
  font-size:1.5rem; cursor:pointer;
  color:#5a6380;
}
.mt-modal-close:hover{ color:#b23b3b; }
.mt-modal h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.5rem; font-weight:600;
  margin:0 0 8px;
}
.mt-modal-code{
  font-family:'Courier New', monospace;
  background:#F8F4E9;
  padding:6px 14px;
  border-radius:3px;
  display:inline-block;
  font-weight:600;
  color:#B8912F;
  letter-spacing:0.06em;
  margin:0 0 20px;
}
.mt-qr-img{
  width:100%; max-width:260px;
  margin:0 auto 16px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  display:block;
}
.mt-modal-url{
  font-size:0.72rem; color:#7b8399;
  word-break:break-all;
  margin:0 0 18px;
  line-height:1.4;
}
.mt-modal-actions{
  display:flex; gap:8px; justify-content:center;
  flex-wrap:wrap;
}
`;