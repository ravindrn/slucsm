import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import SectionEditor from "../../components/admin/SectionEditor.jsx";
import { SECTION_KINDS, defaultDataFor } from "../../components/admin/fieldEditors/index.jsx";

const EMPTY = {
  slug: "",
  title: "",
  when: "",
  place: "",
  tag: "",
  description: "",
  coverImage: "",
  status: "archive",
  startDate: "",
  endDate: "",
  order: 0,
  published: true,
  sections: [],
};

export default function EventEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = id === "new";

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  /* Load existing event */
  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const { data } = await api.get("/events");
        const found = data.find((e) => e._id === id);
        if (!found) throw new Error("Event not found");
        setForm({
          ...EMPTY,
          ...found,
          startDate: found.startDate ? found.startDate.slice(0, 10) : "",
          endDate: found.endDate ? found.endDate.slice(0, 10) : "",
        });
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  /* ---------- SECTIONS ---------- */
  const addSection = (kind) => {
    setForm((f) => ({
      ...f,
      sections: [
        ...f.sections,
        {
          kind,
          title: "",
          enabled: true,
          order: f.sections.length,
          data: defaultDataFor(kind),
        },
      ],
    }));
  };

  const updateSection = (i, newSection) => {
    setForm((f) => {
      const sections = [...f.sections];
      sections[i] = newSection;
      return { ...f, sections };
    });
  };

  const removeSection = (i) => {
    if (!window.confirm("Remove this section?")) return;
    setForm((f) => ({
      ...f,
      sections: f.sections.filter((_, idx) => idx !== i),
    }));
  };

  const moveSection = (i, dir) => {
    setForm((f) => {
      const j = i + dir;
      if (j < 0 || j >= f.sections.length) return f;
      const sections = [...f.sections];
      [sections[i], sections[j]] = [sections[j], sections[i]];
      sections.forEach((s, idx) => (s.order = idx));
      return { ...f, sections };
    });
  };

  /* ---------- SAVE ---------- */
  const save = async (e) => {
    e?.preventDefault();
    setErr("");
    setSaving(true);

    try {
      if (!form.slug || !form.title) {
        throw new Error("Slug and title are required.");
      }

      /* Convert date strings to null if empty */
      const payload = {
        ...form,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      if (isNew) {
        await api.post("/events", payload);
      } else {
        await api.put(`/events/${id}`, payload);
      }
      nav("/admin/events");
    } catch (e) {
      setErr(e.response?.data?.message || e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="event-editor">
      <style>{css}</style>

      <div className="ee-head">
        <div>
          <Link to="/admin/events" className="ee-back">← Back to events</Link>
          <h1>{isNew ? "New event" : `Edit: ${form.title}`}</h1>
        </div>
        <div className="ee-head-actions">
          <button
            type="button"
            className="ee-btn ghost"
            onClick={() => nav("/admin/events")}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ee-btn primary"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save event"}
          </button>
        </div>
      </div>

      {err && <div className="ee-error">{err}</div>}

      <form onSubmit={save}>
        {/* ---------- BASIC INFO ---------- */}
        <section className="ee-card">
          <h2>Basic information</h2>
          <div className="ee-grid">
            <Field label="Slug (URL)" required>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                placeholder="national-seminar"
                required
              />
            </Field>
            <Field label="Title" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="National Seminar"
                required
              />
            </Field>
            <Field label="When">
              <input
                type="text"
                value={form.when}
                onChange={(e) => set("when", e.target.value)}
                placeholder="Annually / Feb 14–16, 2026"
              />
            </Field>
            <Field label="Place">
              <input
                type="text"
                value={form.place}
                onChange={(e) => set("place", e.target.value)}
                placeholder="St. Anne's Church, Thalawila"
              />
            </Field>
            <Field label="Tag (badge)">
              <input
                type="text"
                value={form.tag}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="Main event of the year"
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="archive">Archive (past / recurring)</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </Field>
            <Field label="Start date">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </Field>
            <Field label="Cover image URL">
              <input
                type="text"
                value={form.coverImage}
                onChange={(e) => set("coverImage", e.target.value)}
                placeholder="/uploads/... or https://..."
              />
            </Field>
            <Field label="Order">
              <input
                type="number"
                value={form.order}
                onChange={(e) => set("order", Number(e.target.value))}
              />
            </Field>
            <Field label="Published" full>
              <label className="ee-check">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => set("published", e.target.checked)}
                />
                <span>Visible on the public site</span>
              </label>
            </Field>
            <Field label="Description" full>
              <textarea
                rows={6}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Full description. Separate paragraphs with a blank line."
              />
            </Field>
          </div>
        </section>

        {/* ---------- SECTIONS ---------- */}
        <section className="ee-card">
          <div className="ee-card-head">
            <div>
              <h2>Sections</h2>
              <p className="ee-sub">
                Add sections in any order. Each one appears on the public event page.
              </p>
            </div>
          </div>

          {form.sections.length === 0 ? (
            <div className="ee-empty-sections">
              <p>No sections yet — add your first below.</p>
            </div>
          ) : (
            <div className="ee-sections">
              {form.sections.map((s, i) => (
                <SectionEditor
                  key={i}
                  section={s}
                  onChange={(newSec) => updateSection(i, newSec)}
                  onRemove={() => removeSection(i)}
                  onMove={(dir) => moveSection(i, dir)}
                />
              ))}
            </div>
          )}

          <div className="ee-add-section">
            <label>Add a section:</label>
            <div className="ee-add-grid">
              {SECTION_KINDS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className="ee-add-btn"
                  onClick={() => addSection(s.value)}
                >
                  + {s.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}

function Field({ label, children, required, full }) {
  return (
    <div className={`ee-field${full ? " full" : ""}`}>
      <label>
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
    </div>
  );
}

const css = `
.event-editor{ color:#1B2A4A; }

.ee-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:16px; flex-wrap:wrap; margin-bottom:24px;
}
.ee-back{
  display:inline-block; font-size:0.85rem; color:#5a6380;
  text-decoration:none; margin-bottom:6px;
}
.ee-back:hover{ color:#6E2C2C; }
.ee-head h1{
  font-family:'Cormorant Garamond', serif;
  font-size:2rem; font-weight:600; margin:0;
}
.ee-head-actions{ display:flex; gap:10px; align-items:center; }

.ee-btn{
  padding:10px 20px;
  border-radius:4px;
  border:1px solid rgba(27,42,74,0.18);
  background:transparent;
  color:#1B2A4A;
  font-size:0.9rem;
  font-family:inherit;
  cursor:pointer;
  transition:.15s;
}
.ee-btn:hover:not(:disabled){ background:#F8F4E9; }
.ee-btn.primary{
  background:#1B2A4A; color:#F8F4E9;
  border-color:#1B2A4A;
}
.ee-btn.primary:hover:not(:disabled){ background:#6E2C2C; border-color:#6E2C2C; }
.ee-btn:disabled{ opacity:0.6; cursor:not-allowed; }

.ee-error{
  background:#fff2f0; color:#b23b3b;
  border:1px solid #f0c8c2;
  padding:12px 16px; border-radius:4px;
  margin-bottom:20px; font-size:0.9rem;
}

.ee-card{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:24px;
  margin-bottom:24px;
}
.ee-card h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.5rem; font-weight:600;
  margin:0 0 6px;
}
.ee-card-head{
  display:flex; justify-content:space-between;
  align-items:flex-start; margin-bottom:20px;
}
.ee-sub{ color:#7b8399; font-size:0.88rem; margin:0; }

.ee-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));
  gap:18px;
  margin-top:18px;
}
.ee-field{ display:flex; flex-direction:column; gap:6px; }
.ee-field.full{ grid-column:1 / -1; }
.ee-field label{
  font-size:0.82rem; font-weight:500;
  color:#3a4560;
}
.ee-field .req{ color:#b23b3b; }
.ee-field input[type="text"],
.ee-field input[type="date"],
.ee-field input[type="number"],
.ee-field select,
.ee-field textarea{
  padding:9px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  font-family:inherit;
  font-size:0.92rem;
  background:#fff;
  color:#1B2A4A;
  transition:border-color .15s;
}
.ee-field input:focus,
.ee-field select:focus,
.ee-field textarea:focus{
  outline:none;
  border-color:#B8912F;
  box-shadow:0 0 0 3px rgba(184,145,47,0.1);
}
.ee-field textarea{ resize:vertical; min-height:80px; }

.ee-check{
  display:flex; align-items:center; gap:8px;
  font-size:0.9rem;
}

.ee-empty-sections{
  padding:30px; text-align:center;
  color:#7b8399; font-style:italic;
  border:1px dashed rgba(27,42,74,0.18);
  border-radius:4px;
}

.ee-sections{ display:flex; flex-direction:column; gap:14px; }

.ee-add-section{ margin-top:24px; }
.ee-add-section label{
  display:block; font-size:0.85rem; font-weight:500;
  margin-bottom:10px; color:#3a4560;
}
.ee-add-grid{
  display:flex; flex-wrap:wrap; gap:8px;
}
.ee-add-btn{
  padding:8px 14px;
  background:#F8F4E9;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  font-size:0.85rem;
  color:#1B2A4A;
  cursor:pointer;
  font-family:inherit;
  transition:.15s;
}
.ee-add-btn:hover{
  background:#B8912F; color:#fff;
  border-color:#B8912F;
}

/* ---------- SECTION EDITOR INNER ---------- */
.section-editor{
  background:#fff;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:5px;
  overflow:hidden;
}
.se-head{
  background:#F8F4E9;
  padding:10px 14px;
  display:flex; align-items:center; justify-content:space-between;
  border-bottom:1px solid rgba(27,42,74,0.14);
  gap:10px; flex-wrap:wrap;
}
.se-head-left{ display:flex; align-items:center; gap:10px; }
.se-head-right{ display:flex; align-items:center; gap:6px; }
.se-kind-badge{
  font-size:0.72rem; font-weight:600;
  padding:3px 8px; border-radius:10px;
  background:#B8912F; color:#fff;
  text-transform:uppercase; letter-spacing:0.04em;
}
.se-kind-select{
  padding:5px 8px; border-radius:3px;
  border:1px solid rgba(27,42,74,0.14);
  background:#fff; font-size:0.85rem; font-family:inherit;
}
.se-toggle{
  display:flex; align-items:center; gap:6px;
  font-size:0.82rem; cursor:pointer;
}
.se-icon-btn{
  width:28px; height:28px;
  border:1px solid rgba(27,42,74,0.14);
  background:#fff; border-radius:3px;
  cursor:pointer; font-size:0.85rem;
  font-family:inherit;
}
.se-icon-btn:hover{ background:#F8F4E9; }
.se-icon-btn.danger{ color:#b23b3b; border-color:#f0c8c2; }
.se-icon-btn.danger:hover{ background:#fff2f0; }

.se-body{ padding:16px; }
.se-title-input{
  width:100%; padding:8px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px; font-family:inherit;
  font-size:0.9rem; margin-bottom:14px;
}

/* ---------- FIELD EDITORS ---------- */
.field-editor{ display:flex; flex-direction:column; gap:10px; }
.fe-empty{ color:#7b8399; font-style:italic; font-size:0.88rem; margin:0; }
.fe-hint{
  font-size:0.8rem; color:#7b8399;
  margin:6px 0 0;
}
.fe-label{
  font-size:0.82rem; font-weight:500; color:#3a4560;
  margin-top:8px;
}
.fe-row{
  display:grid;
  grid-template-columns:1fr auto auto;
  gap:8px; align-items:center;
}
.fe-row input[type="text"]{
  padding:8px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px; font-size:0.9rem;
  font-family:inherit;
}
.fe-photo-row{
  display:grid;
  grid-template-columns:1fr 1fr auto;
  gap:8px; align-items:center;
}
.fe-photo-row input{
  padding:8px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px; font-size:0.88rem;
  font-family:inherit;
}
.fe-row-actions{ display:flex; gap:4px; }
.fe-row-actions button{
  width:26px; height:26px;
  border:1px solid rgba(27,42,74,0.14);
  background:#fff; border-radius:3px;
  cursor:pointer; font-size:0.85rem;
}
.fe-row-actions button:hover{ background:#F8F4E9; }
.fe-row-actions button.danger{ color:#b23b3b; border-color:#f0c8c2; }
.fe-check{
  display:flex; align-items:center; gap:6px;
  font-size:0.82rem; color:#3a4560; white-space:nowrap;
}
.fe-add{
  align-self:flex-start;
  padding:7px 14px;
  background:#F8F4E9;
  border:1px dashed rgba(27,42,74,0.22);
  border-radius:3px;
  font-size:0.85rem;
  color:#1B2A4A;
  cursor:pointer;
  font-family:inherit;
}
.fe-add:hover{ background:#B8912F; color:#fff; border-style:solid; border-color:#B8912F; }

.fe-select, .fe-code{
  padding:9px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  font-family:inherit; font-size:0.9rem;
  background:#fff;
}
.fe-code{ font-family:'Courier New', monospace; font-size:0.85rem; resize:vertical; }

.field-editor textarea{
  padding:9px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  font-family:inherit; font-size:0.9rem; resize:vertical;
}
`;