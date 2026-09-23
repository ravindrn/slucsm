import { useEffect, useState } from "react";
import api, { imgUrl } from "../../api/axios";

const EMPTY = {
  name: "",
  role: "",
  university: "",
  initials: "",
  photo: "",
  year: "",
  category: "executive",
  email: "",
  phone: "",
  order: 0,
  active: true,
};

const CATEGORIES = [
  { value: "spiritual", label: "Spiritual" },
  { value: "executive", label: "Executive" },
  { value: "coordinator", label: "Coordinator" },
  { value: "other", label: "Other" },
];

export default function ManageCommittee() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [filter, setFilter] = useState("all");

  /* ---------- LOAD ---------- */
  const load = async () => {
    try {
      const { data } = await api.get("/committee/all");
      setMembers(data);
    } catch (e) {
      setError("Failed to load committee members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ---------- FILTER ---------- */
  const filtered =
    filter === "all"
      ? members
      : filter === "inactive"
      ? members.filter((m) => !m.active)
      : members.filter((m) => m.category === filter);

  /* ---------- FORM ---------- */
  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setPhotoFile(null);
    setPhotoPreview("");
    setError("");
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const fd = new FormData();
      Object.keys(form).forEach((k) => {
        if (k === "photo") return;
        if (k === "active") fd.append(k, String(form[k]));
        else fd.append(k, form[k] ?? "");
      });
      if (photoFile) fd.append("photo", photoFile);

      if (editingId) {
        await api.put(`/committee/${editingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess("Member updated.");
      } else {
        await api.post("/committee", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess("Member added.");
      }
      setTimeout(() => setSuccess(""), 2500);

      reset();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const edit = (m) => {
    setEditingId(m._id);
    setForm({
      name: m.name,
      role: m.role,
      university: m.university || "",
      initials: m.initials || "",
      photo: m.photo || "",
      year: m.year || "",
      category: m.category || "executive",
      email: m.email || "",
      phone: m.phone || "",
      order: m.order || 0,
      active: m.active !== false,
    });
    setPhotoFile(null);
    setPhotoPreview(m.photo ? imgUrl(m.photo) : "");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const del = async (m) => {
    if (!window.confirm(`Delete "${m.name}"?`)) return;
    try {
      await api.delete(`/committee/${m._id}`);
      setMembers((list) => list.filter((x) => x._id !== m._id));
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  const toggleActive = async (m) => {
    try {
      const fd = new FormData();
      fd.append("active", String(!m.active));
      const { data } = await api.put(`/committee/${m._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMembers((list) => list.map((x) => (x._id === m._id ? data : x)));
    } catch (e) {
      alert("Toggle failed");
    }
  };

  const move = async (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= filtered.length) return;
    const list = [...filtered];
    [list[idx], list[j]] = [list[j], list[idx]];
    const ids = list.map((m) => m._id);

    setMembers((all) => {
      const ordered = [...all].sort((a, b) => {
        const ai = ids.indexOf(a._id);
        const bi = ids.indexOf(b._id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
      return ordered.map((m, i) => ({ ...m, order: i }));
    });

    try {
      await api.post("/committee/reorder", { ids });
    } catch (e) {
      alert("Reorder failed");
      await load();
    }
  };

  if (loading) return <p>Loading committee…</p>;

  return (
    <div className="manage-committee">
      <style>{css}</style>

      {/* ---------- HEAD ---------- */}
      <div className="mc-head">
        <div>
          <h1>Committee</h1>
          <p className="mc-sub">
            Manage your team — names, roles, universities, photos. They appear on
            the homepage in the order below.
          </p>
        </div>
        <div className="mc-head-actions">
          <a href="/#committee" target="_blank" rel="noreferrer" className="mc-btn ghost">
            View on site ↗
          </a>
          <button
            className="mc-btn ghost"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            ↑ New member
          </button>
        </div>
      </div>

      {error && <div className="mc-banner error">{error}</div>}
      {success && <div className="mc-banner success">{success}</div>}

      <div className="mc-layout">
        {/* ---------- FORM ---------- */}
        <form className="mc-form" onSubmit={save}>
          <h2>{editingId ? "Edit member" : "New member"}</h2>

          <div className="mc-photo-block">
            <div className="mc-photo-preview">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" />
              ) : (
                <div className="mc-photo-placeholder">
                  {form.initials || form.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div className="mc-photo-actions">
              <label className="mc-photo-btn">
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPhotoChange}
                  hidden
                />
              </label>
              {photoPreview && (
                <button
                  type="button"
                  className="mc-photo-btn remove"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview("");
                    set("photo", "");
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <label>Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Fr. John Perera"
            required
          />

          <label>Role *</label>
          <input
            type="text"
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            placeholder="President"
            required
          />

          <label>University / Affiliation</label>
          <input
            type="text"
            value={form.university}
            onChange={(e) => set("university", e.target.value)}
            placeholder="University of Colombo"
          />

          <div className="mc-grid-2">
            <div>
              <label>Initials</label>
              <input
                type="text"
                value={form.initials}
                onChange={(e) =>
                  set("initials", e.target.value.toUpperCase().slice(0, 3))
                }
                placeholder="JP"
                maxLength={3}
              />
            </div>
            <div>
              <label>Category</label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label>Year (e.g. 2025/26)</label>
          <input
            type="text"
            value={form.year}
            onChange={(e) => set("year", e.target.value)}
            placeholder="2025/26"
          />

          <div className="mc-grid-2">
            <div>
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@university.lk"
              />
            </div>
            <div>
              <label>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+94 71 XXX XXXX"
              />
            </div>
          </div>

          <div className="mc-grid-2">
            <div>
              <label>Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => set("order", Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label>Active</label>
              <label className="mc-toggle">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set("active", e.target.checked)}
                />
                <span>{form.active ? "Visible on site" : "Hidden"}</span>
              </label>
            </div>
          </div>

          <div className="mc-form-actions">
            <button
              type="submit"
              className="mc-btn primary"
              disabled={saving}
            >
              {saving ? "Saving…" : editingId ? "Update" : "Add member"}
            </button>
            {editingId && (
              <button type="button" className="mc-btn ghost" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* ---------- LIST ---------- */}
        <div className="mc-list">
          <div className="mc-list-head">
            <h2>
              {filtered.length} member{filtered.length !== 1 && "s"}
            </h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mc-filter"
            >
              <option value="all">All categories</option>
              <option value="executive">Executive</option>
              <option value="spiritual">Spiritual</option>
              <option value="coordinator">Coordinator</option>
              <option value="other">Other</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="mc-empty">No members in this view.</p>
          ) : (
            <ul className="mc-member-list">
              {filtered.map((m, i) => (
                <li
                  key={m._id}
                  className={`mc-member${!m.active ? " inactive" : ""}`}
                >
                  <div className="mc-member-avatar">
                    {m.photo ? (
                      <img src={imgUrl(m.photo)} alt={m.name} />
                    ) : (
                      <span>{m.initials || "?"}</span>
                    )}
                  </div>

                  <div className="mc-member-info">
                    <strong>{m.name}</strong>
                    <span className="mc-member-role">{m.role}</span>
                    {m.university && (
                      <span className="mc-member-uni">{m.university}</span>
                    )}
                    {m.year && (
                      <span className="mc-member-year">{m.year}</span>
                    )}
                  </div>

                  <div className="mc-member-actions">
                    <button
                      type="button"
                      className="mc-icon-btn"
                      onClick={() => move(i, -1)}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="mc-icon-btn"
                      onClick={() => move(i, 1)}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="mc-icon-btn"
                      onClick={() => toggleActive(m)}
                      title={m.active ? "Hide" : "Show"}
                    >
                      {m.active ? "👁" : "🚫"}
                    </button>
                    <button
                      type="button"
                      className="mc-btn small"
                      onClick={() => edit(m)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="mc-btn small danger"
                      onClick={() => del(m)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CSS
   ============================================================ */
const css = `
.manage-committee{ color:#1B2A4A; }

.mc-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:16px; flex-wrap:wrap; margin-bottom:24px;
}
.mc-head h1{
  font-family:'Cormorant Garamond', serif;
  font-size:2rem; font-weight:600; margin:0 0 6px;
}
.mc-sub{ color:#5a6380; font-size:0.9rem; margin:0; max-width:560px; }
.mc-head-actions{ display:flex; gap:8px; flex-wrap:wrap; }

.mc-banner{
  padding:12px 18px; border-radius:4px;
  font-size:0.9rem; margin-bottom:16px;
}
.mc-banner.error{ background:#fff2f0; color:#b23b3b; border:1px solid #f0c8c2; }
.mc-banner.success{ background:#E3F3E5; color:#2e7d32; border:1px solid #bfe0c4; }

.mc-layout{
  display:grid;
  grid-template-columns:400px 1fr;
  gap:24px;
  align-items:flex-start;
}
@media (max-width:1000px){
  .mc-layout{ grid-template-columns:1fr; }
}

/* ---------- FORM ---------- */
.mc-form{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:22px;
  display:flex; flex-direction:column; gap:8px;
  position:sticky; top:20px;
  overflow:hidden;       /* prevents children from escaping */
  min-width:0;
}
.mc-form h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.4rem; margin:0 0 12px;
}
.mc-form label{
  font-size:0.82rem; font-weight:500;
  color:#3a4560; margin-top:6px;
}
.mc-form input[type="text"],
.mc-form input[type="email"],
.mc-form input[type="tel"],
.mc-form input[type="number"],
.mc-form select{
  width:100%;               /* fills its cell */
  min-width:0;              /* can shrink below intrinsic minimum */
  padding:9px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  font-family:inherit; font-size:0.9rem;
  background:#fff;
}
.mc-form input:focus,
.mc-form select:focus{
  outline:none; border-color:#B8912F;
  box-shadow:0 0 0 3px rgba(184,145,47,0.12);
}
.mc-grid-2{
  display:grid;
  grid-template-columns:minmax(0, 1fr) minmax(0, 1fr);   /* allow shrink */
  gap:12px;
  min-width:0;
}
.mc-grid-2 > div{
  min-width:0;              /* grid cell can shrink */
}

/* ---------- PHOTO ---------- */
.mc-photo-block{
  display:flex; align-items:center; gap:16px;
  margin-bottom:10px;
}
.mc-photo-preview{
  width:80px; height:80px;
  border-radius:50%;
  overflow:hidden;
  background:#F8F4E9;
  border:1.5px solid rgba(27,42,74,0.14);
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.mc-photo-preview img{
  width:100%; height:100%; object-fit:cover;
}
.mc-photo-placeholder{
  font-family:'Cormorant Garamond',serif;
  font-size:1.6rem;
  color:#B8912F;
}
.mc-photo-actions{
  display:flex; flex-direction:column; gap:6px;
}
.mc-photo-btn{
  padding:6px 12px;
  background:#F8F4E9;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  font-size:0.8rem;
  cursor:pointer;
  text-align:center;
  font-family:inherit;
}
.mc-photo-btn:hover{ background:#B8912F; color:#fff; border-color:#B8912F; }
.mc-photo-btn.remove{
  background:transparent;
  color:#b23b3b;
  border-color:#f0c8c2;
}
.mc-photo-btn.remove:hover{ background:#fff2f0; color:#b23b3b; border-color:#f0c8c2; }

/* ---------- TOGGLE ---------- */
.mc-toggle{
  display:flex; align-items:center; gap:8px;
  font-size:0.88rem; color:#3a4560; cursor:pointer;
  padding:9px 0;
}

/* ---------- FORM ACTIONS ---------- */
.mc-form-actions{
  display:flex; gap:8px; margin-top:16px;
}

/* ---------- BUTTONS ---------- */
.mc-btn{
  padding:9px 16px;
  border-radius:3px;
  border:1px solid rgba(27,42,74,0.14);
  background:transparent;
  color:#1B2A4A;
  font-family:inherit;
  font-size:0.88rem;
  cursor:pointer;
  transition:.15s;
  text-decoration:none;
  display:inline-block;
}
.mc-btn:hover{ background:#F8F4E9; }
.mc-btn.primary{
  background:#1B2A4A; color:#F8F4E9;
  border-color:#1B2A4A;
}
.mc-btn.primary:hover:not(:disabled){ background:#6E2C2C; border-color:#6E2C2C; }
.mc-btn:disabled{ opacity:0.6; cursor:wait; }
.mc-btn.danger{ color:#b23b3b; border-color:#f0c8c2; }
.mc-btn.danger:hover{ background:#fff2f0; }
.mc-btn.ghost{ background:transparent; }
.mc-btn.small{ padding:6px 12px; font-size:0.82rem; }

/* ---------- LIST ---------- */
.mc-list{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:22px;
}
.mc-list-head{
  display:flex; justify-content:space-between;
  align-items:center; gap:12px;
  margin-bottom:16px;
  flex-wrap:wrap;
}
.mc-list-head h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.4rem; margin:0;
}
.mc-filter{
  padding:8px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  font-family:inherit; font-size:0.85rem;
  background:#fff; cursor:pointer;
}
.mc-empty{ color:#7b8399; font-style:italic; }

.mc-member-list{ list-style:none; margin:0; padding:0; }
.mc-member{
  display:grid;
  grid-template-columns:56px 1fr auto;
  gap:14px;
  align-items:center;
  padding:14px 0;
  border-bottom:1px solid rgba(27,42,74,0.08);
}
.mc-member:last-child{ border-bottom:none; }
.mc-member.inactive{ opacity:0.55; }

.mc-member-avatar{
  width:56px; height:56px;
  border-radius:50%;
  background:#F8F4E9;
  border:1px solid rgba(27,42,74,0.14);
  display:flex; align-items:center; justify-content:center;
  overflow:hidden;
  flex-shrink:0;
  font-family:'Cormorant Garamond',serif;
  font-size:1.2rem;
  color:#B8912F;
}
.mc-member-avatar img{
  width:100%; height:100%; object-fit:cover;
}
.mc-member-info{
  display:flex; flex-direction:column; gap:2px;
  min-width:0;
}
.mc-member-info strong{
  font-size:1rem;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.mc-member-role{
  font-size:0.85rem; color:#6E2C2C;
}
.mc-member-uni{
  font-size:0.78rem; color:#7b8399;
}
.mc-member-year{
  font-size:0.72rem; color:#B8912F;
  font-weight:600;
}

.mc-member-actions{
  display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end;
}
.mc-icon-btn{
  width:30px; height:30px;
  border:1px solid rgba(27,42,74,0.14);
  background:#fff; border-radius:3px;
  cursor:pointer; font-size:0.85rem;
  font-family:inherit;
}
.mc-icon-btn:hover{ background:#F8F4E9; }
`;