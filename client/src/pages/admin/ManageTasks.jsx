import { useEffect, useState } from "react";
import api from "../../api/axios";

const EMPTY = {
  title: "",
  description: "",
  points: 10,
  pointsPerItem: 0,
  type: "manual",
  submissionType: "single",
  submittable: true,
  requiresPrevious: true,
  group: "",
  isGroupIntro: false,
  hasStartGate: false,
  allowVideo: false,
  maxFiles: 1,
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

const SUBMISSION_TYPES = [
  { value: "single", label: "Single (1 file)" },
  { value: "multi", label: "Multi (many files, 1 submission)" },
  { value: "progress", label: "Progress (repeated submissions)" },
];

const GROUPS = [
  { value: "", label: "(No group)" },
  { value: "early-bird", label: "Task 1 — Early Bird" },
  { value: "chaos-challenges", label: "Task 2 — Chaos Challenges" },
];

export default function ManageTasks() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState("");

  /* QR modal state */
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
      /* Convert number/boolean fields correctly */
      const payload = {
        ...form,
        points: Number(form.points) || 0,
        pointsPerItem: Number(form.pointsPerItem) || 0,
        maxFiles: Number(form.maxFiles) || 1,
        order: Number(form.order) || 0,
        submittable: !!form.submittable,
        requiresPrevious: !!form.requiresPrevious,
        allowVideo: !!form.allowVideo,
        isGroupIntro: !!form.isGroupIntro,
        hasStartGate: !!form.hasStartGate,
      };

      if (editingId) {
        await api.put(`/tasks/${editingId}`, payload);
      } else {
        await api.post("/tasks", { ...payload, eventId });
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
      points: t.points || 0,
      pointsPerItem: t.pointsPerItem || 0,
      type: t.type || "manual",
      submissionType: t.submissionType || "single",
      submittable: t.submittable !== false,
      requiresPrevious: t.requiresPrevious !== false,
      group: t.group || "",
      isGroupIntro: !!t.isGroupIntro,
      hasStartGate: !!t.hasStartGate,
      allowVideo: !!t.allowVideo,
      maxFiles: t.maxFiles || 1,
      qrCode: t.qrCode || "",
      location: t.location || "",
      order: t.order || 0,
    });
  };

  const del = async (t) => {
    if (!window.confirm(`Delete "${t.title}"?`)) return;
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
    if (!w) return alert("Popup blocked");
    w.document.write(`
      <html>
        <head>
          <title>QR - ${qrTask.title}</title>
          <style>
            body{font-family:'Inter',sans-serif;text-align:center;padding:40px;color:#1B2A4A;background:#FFFDF8;}
            h1{font-family:'Cormorant Garamond',serif;font-size:1.7rem;margin:0 0 10px;}
            .code{font-family:monospace;background:#F8F4E9;padding:8px 18px;border-radius:4px;display:inline-block;font-weight:600;color:#B8912F;letter-spacing:0.08em;margin-bottom:22px;}
            img{width:340px;height:340px;}
            .pts{margin-top:18px;font-size:1.15rem;color:#B8912F;font-weight:600;}
            .hint{margin-top:28px;font-size:0.85rem;color:#7b8399;}
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

  /* ---------- GROUP TASKS FOR DISPLAY ---------- */
  const task1 = tasks.find((t) => t.group === "early-bird");
  const chaosIntro = tasks.find(
    (t) => t.group === "chaos-challenges" && t.isGroupIntro
  );
  const challenges = tasks
    .filter((t) => t.group === "chaos-challenges" && !t.isGroupIntro)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const ungrouped = tasks.filter(
    (t) => !t.group || t.group === "__default__"
  );

  const renderTaskRow = (t, index) => (
    <li key={t._id} className="mt-task-item">
      <div className="task-points">
        {t.pointsPerItem > 0 ? (
          <>
            {t.pointsPerItem}
            <span>per item</span>
          </>
        ) : (
          <>
            {t.points}
            <span>pts</span>
          </>
        )}
      </div>

      <div className="mt-task-info">
        <strong>
          {index != null && (
            <span className="mt-task-order">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
          {t.title}
        </strong>

        <div className="mt-task-badges">
          {t.isGroupIntro && (
            <span className="mt-badge intro">INTRO</span>
          )}
          {t.hasStartGate && (
            <span className="mt-badge gate">START GATE</span>
          )}
          {t.submittable === false && (
            <span className="mt-badge nosubmit">NO-SUBMIT</span>
          )}
          {t.requiresPrevious === false ? (
            <span className="mt-badge free">FREE</span>
          ) : (
            <span className="mt-badge seq">SEQUENTIAL</span>
          )}
          <span className="mt-badge type">{t.submissionType}</span>
          {t.allowVideo && <span className="mt-badge video">VIDEO</span>}
        </div>

        <span className="mt-task-meta">
          order: {t.order}
          {t.group ? ` · group: ${t.group}` : ""}
          {t.location ? ` · ${t.location}` : ""}
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
  );

  return (
    <div className="manage-tasks">
      <style>{css}</style>

      <div className="mt-head">
        <div>
          <h1>Tasks & Challenges</h1>
          <p className="mt-sub">
            Task 1 (Early Bird) and Task 2 (Chaos Challenges) with nested
            challenges. Sequential unlock applies within each group.
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
          <h2>{editingId ? "Edit item" : "New item"}</h2>
          {err && <div className="mt-error">{err}</div>}

          <label>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Challenge name"
            required
          />

          <label>Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Full instructions for the team..."
          />

          <div className="mt-grid-2">
            <div>
              <label>Points</label>
              <input
                type="number"
                min={0}
                value={form.points}
                onChange={(e) =>
                  setForm({ ...form, points: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label>Points per item</label>
              <input
                type="number"
                min={0}
                value={form.pointsPerItem}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pointsPerItem: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <label>Group</label>
          <select
            value={form.group}
            onChange={(e) => setForm({ ...form, group: e.target.value })}
          >
            {GROUPS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>

          <div className="mt-grid-2">
            <div>
              <label>Submission type</label>
              <select
                value={form.submissionType}
                onChange={(e) =>
                  setForm({ ...form, submissionType: e.target.value })
                }
              >
                {SUBMISSION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Legacy type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value })
                }
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-grid-2">
            <div>
              <label>Max files</label>
              <input
                type="number"
                min={1}
                value={form.maxFiles}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxFiles: Number(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <label>Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <label>Location (optional)</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
            placeholder="Main chapel"
          />

          {(form.type === "qrScan" || form.type === "checkpoint") && (
            <>
              <label>QR code</label>
              <input
                type="text"
                value={form.qrCode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    qrCode: e.target.value.toUpperCase(),
                  })
                }
                placeholder="CHAPEL-001"
              />
            </>
          )}

          <div className="mt-checkbox-grid">
            <label className="mt-check">
              <input
                type="checkbox"
                checked={form.submittable}
                onChange={(e) =>
                  setForm({ ...form, submittable: e.target.checked })
                }
              />
              <span>Submittable (teams can upload proof)</span>
            </label>

            <label className="mt-check">
              <input
                type="checkbox"
                checked={form.requiresPrevious}
                onChange={(e) =>
                  setForm({ ...form, requiresPrevious: e.target.checked })
                }
              />
              <span>Requires previous task in group</span>
            </label>

            <label className="mt-check">
              <input
                type="checkbox"
                checked={form.isGroupIntro}
                onChange={(e) =>
                  setForm({ ...form, isGroupIntro: e.target.checked })
                }
              />
              <span>Is group intro card</span>
            </label>

            <label className="mt-check">
              <input
                type="checkbox"
                checked={form.hasStartGate}
                onChange={(e) =>
                  setForm({ ...form, hasStartGate: e.target.checked })
                }
              />
              <span>Has Start gate (shows Start button)</span>
            </label>

            <label className="mt-check">
              <input
                type="checkbox"
                checked={form.allowVideo}
                onChange={(e) =>
                  setForm({ ...form, allowVideo: e.target.checked })
                }
              />
              <span>Allow video uploads</span>
            </label>
          </div>

          <div className="mt-form-actions">
            <button type="submit" className="mt-btn primary">
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                className="mt-btn ghost"
                onClick={reset}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* ---------- LIST ---------- */}
        <div className="mt-list">
          {/* TASK 1 */}
          {task1 && (
            <section className="mt-group">
              <div className="mt-group-head">
                <h2>
                  <span className="mt-group-badge task1">Task 1</span>
                  Early Bird
                </h2>
              </div>
              <ul className="mt-task-list">{renderTaskRow(task1)}</ul>
            </section>
          )}

          {/* TASK 2 */}
          {(chaosIntro || challenges.length > 0) && (
            <section className="mt-group">
              <div className="mt-group-head">
                <h2>
                  <span className="mt-group-badge task2">Task 2</span>
                  Chaos Challenges
                  <span className="mt-group-count">
                    {challenges.length} challenges
                  </span>
                </h2>
              </div>

              <ul className="mt-task-list">
                {chaosIntro && renderTaskRow(chaosIntro)}
                {challenges.map((t, i) => renderTaskRow(t, i))}
              </ul>
            </section>
          )}

          {/* Ungrouped */}
          {ungrouped.length > 0 && (
            <section className="mt-group">
              <div className="mt-group-head">
                <h2>
                  <span className="mt-group-badge other">Other</span>
                  Ungrouped items
                </h2>
              </div>
              <ul className="mt-task-list">
                {ungrouped.map((t) => renderTaskRow(t))}
              </ul>
            </section>
          )}

          {tasks.length === 0 && (
            <p className="mt-empty">No tasks yet for this event.</p>
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
.mt-sub{ color:#5a6380; font-size:0.9rem; margin:0; max-width:560px; }
.mt-event-select{
  padding:9px 14px; border-radius:4px;
  border:1px solid rgba(27,42,74,0.14);
  background:#FFFDF8; font-family:inherit;
  font-size:0.9rem; color:#1B2A4A; min-width:220px;
}
.mt-layout{ display:grid; grid-template-columns:400px 1fr; gap:24px; align-items:flex-start; }
@media (max-width:1000px){ .mt-layout{ grid-template-columns:1fr; } }

/* ---------- FORM ---------- */
.mt-form{
  background:#FFFDF8; border:1px solid rgba(27,42,74,0.14);
  border-radius:6px; padding:22px;
  display:flex; flex-direction:column; gap:8px;
  position:sticky; top:20px;
  min-width:0;
}
.mt-form h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.4rem; margin:0 0 12px;
}
.mt-form label{
  font-size:0.82rem; font-weight:500;
  color:#3a4560; margin-top:6px;
}
.mt-form input[type="text"],
.mt-form input[type="number"],
.mt-form textarea,
.mt-form select{
  width:100%; min-width:0;
  padding:9px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px; font-family:inherit;
  font-size:0.9rem; background:#fff;
}
.mt-form textarea{ resize:vertical; min-height:80px; }
.mt-form input:focus,
.mt-form select:focus,
.mt-form textarea:focus{
  outline:none; border-color:#B8912F;
  box-shadow:0 0 0 3px rgba(184,145,47,0.12);
}
.mt-grid-2{
  display:grid;
  grid-template-columns:minmax(0, 1fr) minmax(0, 1fr);
  gap:12px; min-width:0;
}
.mt-grid-2 > div{ min-width:0; }
.mt-checkbox-grid{
  display:flex; flex-direction:column; gap:6px;
  margin-top:14px; padding:14px;
  background:#F8F4E9; border-radius:4px;
}
.mt-check{
  display:flex; align-items:center; gap:8px;
  font-size:0.85rem; color:#3a4560;
  cursor:pointer;
}
.mt-form-actions{ display:flex; gap:8px; margin-top:16px; }

/* ---------- BUTTONS ---------- */
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
  border-color:rgba(184,145,47,0.3); font-weight:600;
}
.mt-btn.qr:hover{ background:#B8912F; color:#fff; border-color:#B8912F; }

.mt-error{
  background:#fff2f0; color:#b23b3b; border:1px solid #f0c8c2;
  padding:10px 12px; border-radius:3px; font-size:0.85rem;
}

/* ---------- LIST ---------- */
.mt-list{
  display:flex; flex-direction:column; gap:24px;
}

.mt-group{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:22px;
}
.mt-group-head{
  margin-bottom:16px;
  padding-bottom:12px;
  border-bottom:1px solid rgba(27,42,74,0.08);
}
.mt-group-head h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.3rem; font-weight:600;
  margin:0;
  display:flex; align-items:center; gap:10px;
  flex-wrap:wrap;
}
.mt-group-badge{
  font-size:0.7rem; font-weight:700;
  letter-spacing:0.08em; text-transform:uppercase;
  padding:4px 10px; border-radius:12px;
  color:#fff;
}
.mt-group-badge.task1{ background:#B8912F; }
.mt-group-badge.task2{ background:#6E2C2C; }
.mt-group-badge.other{ background:#77886A; }
.mt-group-count{
  font-size:0.75rem; color:#7b8399;
  font-family:'Inter', sans-serif;
  font-weight:400;
  margin-left:auto;
}

.mt-task-list{ list-style:none; margin:0; padding:0; }
.mt-task-item{
  display:grid; grid-template-columns:70px 1fr auto;
  gap:14px; align-items:center;
  padding:14px 0; border-bottom:1px solid rgba(27,42,74,0.08);
}
.mt-task-item:last-child{ border-bottom:none; }
.task-points{
  font-family:'Cormorant Garamond',serif;
  font-size:1.35rem; font-weight:600; color:#B8912F;
  text-align:center; line-height:1;
}
.task-points span{
  display:block; font-family:'Inter',sans-serif;
  font-size:0.6rem; font-weight:400; color:#7b8399;
  text-transform:uppercase; letter-spacing:0.05em;
  margin-top:2px;
}
.mt-task-info{
  display:flex; flex-direction:column; gap:4px;
  min-width:0;
}
.mt-task-info strong{
  font-size:0.95rem; display:flex; align-items:center; gap:8px;
  flex-wrap:wrap;
}
.mt-task-order{
  font-family:'Cormorant Garamond',serif;
  font-weight:700; color:#6E2C2C;
  font-size:1rem;
}
.mt-task-badges{
  display:flex; flex-wrap:wrap; gap:4px;
  margin-top:2px;
}
.mt-badge{
  font-size:0.65rem; font-weight:600;
  padding:2px 8px; border-radius:8px;
  text-transform:uppercase; letter-spacing:0.05em;
  border:1px solid transparent;
}
.mt-badge.intro{ background:#F0E5FF; color:#6b3fa0; }
.mt-badge.gate{ background:#FFE5E5; color:#a02c2c; }
.mt-badge.nosubmit{ background:#F8F4E9; color:#7b8399; border-color:rgba(27,42,74,0.1); }
.mt-badge.free{ background:#E3F3E5; color:#2e7d32; }
.mt-badge.seq{ background:#E5F0FF; color:#2c5da0; }
.mt-badge.type{ background:#F8F4E9; color:#5a6380; }
.mt-badge.video{ background:#FFE5E5; color:#a02c2c; }
.mt-task-meta{
  font-size:0.72rem; color:#7b8399;
  font-family:'Courier New', monospace;
}
.mt-task-actions{
  display:flex; gap:6px; flex-wrap:wrap;
}
.mt-empty{
  color:#7b8399; font-style:italic;
  text-align:center; padding:40px;
}

/* ---------- QR MODAL ---------- */
.mt-modal-overlay{
  position:fixed; inset:0; z-index:100;
  background:rgba(27,42,74,0.6);
  display:flex; align-items:center; justify-content:center;
  padding:20px; backdrop-filter:blur(3px);
}
.mt-modal{
  background:#FFFDF8; border-radius:8px;
  max-width:420px; width:100%;
  padding:32px; position:relative;
  text-align:center; color:#1B2A4A;
  box-shadow:0 30px 80px rgba(27,42,74,0.3);
  max-height:92vh; overflow-y:auto;
}
.mt-modal-close{
  position:absolute; top:10px; right:14px;
  width:32px; height:32px;
  border:none; background:transparent;
  font-size:1.5rem; cursor:pointer; color:#5a6380;
}
.mt-modal h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.5rem; font-weight:600; margin:0 0 8px;
}
.mt-modal-code{
  font-family:'Courier New', monospace;
  background:#F8F4E9; padding:6px 14px;
  border-radius:3px; display:inline-block;
  font-weight:600; color:#B8912F;
  letter-spacing:0.06em; margin:0 0 20px;
}
.mt-qr-img{
  width:100%; max-width:260px;
  margin:0 auto 16px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px; display:block;
}
.mt-modal-url{
  font-size:0.72rem; color:#7b8399;
  word-break:break-all; margin:0 0 18px;
}
.mt-modal-actions{
  display:flex; gap:8px; justify-content:center;
  flex-wrap:wrap;
}
`;