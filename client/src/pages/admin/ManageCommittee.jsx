import { useEffect, useState } from "react";
import api, { imgUrl } from "../../api/axios";

const EMPTY_SPIRITUAL = {
  name: "",
  role: "Spiritual Director",
  university: "",
  initials: "",
  photo: "",
  year: "",
  category: "spiritual",
  email: "",
  phone: "",
  order: 1,
  active: true,
};

const EMPTY_MEMBER = {
  name: "",
  role: "",
  university: "",
  initials: "",
  photo: "",
  year: "",
  category: "executive",
  email: "",
  phone: "",
  order: 10,
  active: true,
};

const CATEGORIES = [
  { value: "executive", label: "Executive" },
  { value: "coordinator", label: "Coordinator" },
  { value: "other", label: "Other" },
];

export default function ManageCommittee() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Two independent form states */
  const [spiritualForm, setSpiritualForm] = useState(EMPTY_SPIRITUAL);
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER);

  /* Track which section we're editing */
  const [editingSpiritualId, setEditingSpiritualId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);

  /* Separate photo state per form */
  const [spiritualPhoto, setSpiritualPhoto] = useState(null);
  const [spiritualPreview, setSpiritualPreview] = useState("");
  const [memberPhoto, setMemberPhoto] = useState(null);
  const [memberPreview, setMemberPreview] = useState("");

  const [savingSpiritual, setSavingSpiritual] = useState(false);
  const [savingMember, setSavingMember] = useState(false);

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

  /* ---------- SPLIT ---------- */
  const spiritualMembers = members.filter(
    (m) => m.category === "spiritual"
  );
  const regularMembers = members.filter(
    (m) => m.category !== "spiritual"
  );

  /* ============================================================
     SPIRITUAL DIRECTORS
     ============================================================ */
  const setSpiritual = (key, val) =>
    setSpiritualForm((f) => ({ ...f, [key]: val }));

  const onSpiritualPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSpiritualPhoto(file);
    setSpiritualPreview(URL.createObjectURL(file));
  };

  const saveSpiritual = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSavingSpiritual(true);

    try {
      const fd = new FormData();
      Object.keys(spiritualForm).forEach((k) => {
        if (k === "photo") return;
        if (k === "active") fd.append(k, String(spiritualForm[k]));
        else fd.append(k, spiritualForm[k] ?? "");
      });
      if (spiritualPhoto) fd.append("photo", spiritualPhoto);

      if (editingSpiritualId) {
        await api.put(`/committee/${editingSpiritualId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess("Spiritual director updated.");
      } else {
        await api.post("/committee", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess("Spiritual director added.");
      }
      setTimeout(() => setSuccess(""), 2500);
      resetSpiritual();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Save failed");
    } finally {
      setSavingSpiritual(false);
    }
  };

  const resetSpiritual = () => {
    setSpiritualForm(EMPTY_SPIRITUAL);
    setEditingSpiritualId(null);
    setSpiritualPhoto(null);
    setSpiritualPreview("");
  };

  const editSpiritual = (m) => {
    setEditingSpiritualId(m._id);
    setSpiritualForm({
      name: m.name,
      role: m.role || "Spiritual Director",
      university: m.university || "",
      initials: m.initials || "",
      photo: m.photo || "",
      year: m.year || "",
      category: "spiritual",
      email: m.email || "",
      phone: m.phone || "",
      order: m.order || 1,
      active: m.active !== false,
    });
    setSpiritualPhoto(null);
    setSpiritualPreview(m.photo ? imgUrl(m.photo) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const delSpiritual = async (m) => {
    if (!window.confirm(`Delete "${m.name}"?`)) return;
    await api.delete(`/committee/${m._id}`);
    setMembers((list) => list.filter((x) => x._id !== m._id));
  };

  const toggleSpiritualActive = async (m) => {
    try {
      const fd = new FormData();
      fd.append("active", String(!m.active));
      const { data } = await api.put(`/committee/${m._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMembers((list) => list.map((x) => (x._id === m._id ? data : x)));
    } catch {
      alert("Toggle failed");
    }
  };

  const moveSpiritual = async (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= spiritualMembers.length) return;
    const list = [...spiritualMembers];
    [list[idx], list[j]] = [list[j], list[idx]];
    const ids = list.map((m) => m._id);

    setMembers((all) =>
      all.map((m) => {
        const i = ids.indexOf(m._id);
        return i === -1 ? m : { ...m, order: i + 1 };
      })
    );

    try {
      await api.post("/committee/reorder", { ids });
    } catch {
      await load();
    }
  };

  /* ============================================================
     COMMITTEE MEMBERS
     ============================================================ */
  const setMember = (key, val) =>
    setMemberForm((f) => ({ ...f, [key]: val }));

  const onMemberPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMemberPhoto(file);
    setMemberPreview(URL.createObjectURL(file));
  };

  const saveMember = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSavingMember(true);

    try {
      const fd = new FormData();
      Object.keys(memberForm).forEach((k) => {
        if (k === "photo") return;
        if (k === "active") fd.append(k, String(memberForm[k]));
        else fd.append(k, memberForm[k] ?? "");
      });
      if (memberPhoto) fd.append("photo", memberPhoto);

      if (editingMemberId) {
        await api.put(`/committee/${editingMemberId}`, fd, {
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
      resetMember();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Save failed");
    } finally {
      setSavingMember(false);
    }
  };

  const resetMember = () => {
    setMemberForm(EMPTY_MEMBER);
    setEditingMemberId(null);
    setMemberPhoto(null);
    setMemberPreview("");
  };

  const editMember = (m) => {
    setEditingMemberId(m._id);
    setMemberForm({
      name: m.name,
      role: m.role,
      university: m.university || "",
      initials: m.initials || "",
      photo: m.photo || "",
      year: m.year || "",
      category: m.category || "executive",
      email: m.email || "",
      phone: m.phone || "",
      order: m.order || 10,
      active: m.active !== false,
    });
    setMemberPhoto(null);
    setMemberPreview(m.photo ? imgUrl(m.photo) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const delMember = async (m) => {
    if (!window.confirm(`Delete "${m.name}"?`)) return;
    await api.delete(`/committee/${m._id}`);
    setMembers((list) => list.filter((x) => x._id !== m._id));
  };

  const toggleMemberActive = async (m) => {
    try {
      const fd = new FormData();
      fd.append("active", String(!m.active));
      const { data } = await api.put(`/committee/${m._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMembers((list) => list.map((x) => (x._id === m._id ? data : x)));
    } catch {
      alert("Toggle failed");
    }
  };

  const moveMember = async (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= regularMembers.length) return;
    const list = [...regularMembers];
    [list[idx], list[j]] = [list[j], list[idx]];
    const ids = list.map((m) => m._id);

    setMembers((all) =>
      all.map((m) => {
        const i = ids.indexOf(m._id);
        return i === -1 ? m : { ...m, order: i + 10 };
      })
    );

    try {
      await api.post("/committee/reorder", { ids });
    } catch {
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
            Manage spiritual directors and committee members. Both appear on the
            homepage in the order shown.
          </p>
        </div>
        <a
          href="/#committee"
          target="_blank"
          rel="noreferrer"
          className="mc-btn ghost"
        >
          View on site ↗
        </a>
      </div>

      {error && <div className="mc-banner error">{error}</div>}
      {success && <div className="mc-banner success">{success}</div>}

      {/* ============================================================
          SPIRITUAL DIRECTORS SECTION
         ============================================================ */}
      <section className="mc-section spiritual-section">
        <div className="mc-section-head">
          <div>
            <h2>✦ Spiritual Directors</h2>
            <p className="mc-section-sub">
              Priests and religious who guide the Movement. These appear above
              the committee on the homepage.
            </p>
          </div>
        </div>

        <div className="mc-layout">
          {/* SPIRITUAL FORM */}
          <form className="mc-form" onSubmit={saveSpiritual}>
            <h3>
              {editingSpiritualId
                ? "Edit spiritual director"
                : "Add spiritual director"}
            </h3>

            <div className="mc-photo-block">
              <div className="mc-photo-preview spiritual">
                {spiritualPreview ? (
                  <img src={spiritualPreview} alt="Preview" />
                ) : (
                  <div className="mc-photo-placeholder">
                    {spiritualForm.initials ||
                      spiritualForm.name?.[0]?.toUpperCase() ||
                      "?"}
                  </div>
                )}
              </div>
              <div className="mc-photo-actions">
                <label className="mc-photo-btn">
                  Upload photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSpiritualPhoto}
                    hidden
                  />
                </label>
                {spiritualPreview && (
                  <button
                    type="button"
                    className="mc-photo-btn remove"
                    onClick={() => {
                      setSpiritualPhoto(null);
                      setSpiritualPreview("");
                      setSpiritual("photo", "");
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
              value={spiritualForm.name}
              onChange={(e) => setSpiritual("name", e.target.value)}
              placeholder="Fr. John Perera"
              required
            />

            <label>Role / Title</label>
            <input
              type="text"
              value={spiritualForm.role}
              onChange={(e) => setSpiritual("role", e.target.value)}
              placeholder="Spiritual Director"
            />

            <div className="mc-grid-2">
              <div>
                <label>Initials</label>
                <input
                  type="text"
                  value={spiritualForm.initials}
                  onChange={(e) =>
                    setSpiritual(
                      "initials",
                      e.target.value.toUpperCase().slice(0, 3)
                    )
                  }
                  placeholder="JP"
                  maxLength={3}
                />
              </div>
              <div>
                <label>Order</label>
                <input
                  type="number"
                  value={spiritualForm.order}
                  onChange={(e) =>
                    setSpiritual("order", Number(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <label className="mc-toggle">
              <input
                type="checkbox"
                checked={spiritualForm.active}
                onChange={(e) => setSpiritual("active", e.target.checked)}
              />
              <span>
                {spiritualForm.active ? "Visible on site" : "Hidden"}
              </span>
            </label>

            <div className="mc-form-actions">
              <button
                type="submit"
                className="mc-btn primary"
                disabled={savingSpiritual}
              >
                {savingSpiritual
                  ? "Saving…"
                  : editingSpiritualId
                  ? "Update"
                  : "Add director"}
              </button>
              {editingSpiritualId && (
                <button
                  type="button"
                  className="mc-btn ghost"
                  onClick={resetSpiritual}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* SPIRITUAL LIST */}
          <div className="mc-list spiritual-list">
            <h3>
              {spiritualMembers.length} spiritual director
              {spiritualMembers.length !== 1 && "s"}
            </h3>

            {spiritualMembers.length === 0 ? (
              <p className="mc-empty">
                No spiritual directors yet. Add one using the form.
              </p>
            ) : (
              <ul className="mc-member-list spiritual">
                {spiritualMembers.map((m, i) => (
                  <li
                    key={m._id}
                    className={`mc-member spiritual${
                      !m.active ? " inactive" : ""
                    }`}
                  >
                    <div className="mc-member-avatar spiritual">
                      {m.photo ? (
                        <img src={imgUrl(m.photo)} alt={m.name} />
                      ) : (
                        <span>{m.initials || "?"}</span>
                      )}
                    </div>

                    <div className="mc-member-info">
                      <strong>{m.name}</strong>
                      <span className="mc-member-role">{m.role}</span>
                    </div>

                    <div className="mc-member-actions">
                      <button
                        type="button"
                        className="mc-icon-btn"
                        onClick={() => moveSpiritual(i, -1)}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="mc-icon-btn"
                        onClick={() => moveSpiritual(i, 1)}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="mc-icon-btn"
                        onClick={() => toggleSpiritualActive(m)}
                        title={m.active ? "Hide" : "Show"}
                      >
                        {m.active ? "👁" : "🚫"}
                      </button>
                      <button
                        type="button"
                        className="mc-btn small"
                        onClick={() => editSpiritual(m)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="mc-btn small danger"
                        onClick={() => delSpiritual(m)}
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
      </section>

      {/* ============================================================
          COMMITTEE MEMBERS SECTION
         ============================================================ */}
      <section className="mc-section committee-section">
        <div className="mc-section-head">
          <div>
            <h2>✦ Committee Members</h2>
            <p className="mc-section-sub">
              Executive committee, coordinators and other student leaders.
            </p>
          </div>
        </div>

        <div className="mc-layout">
          {/* MEMBER FORM */}
          <form className="mc-form" onSubmit={saveMember}>
            <h3>
              {editingMemberId ? "Edit member" : "Add committee member"}
            </h3>

            <div className="mc-photo-block">
              <div className="mc-photo-preview">
                {memberPreview ? (
                  <img src={memberPreview} alt="Preview" />
                ) : (
                  <div className="mc-photo-placeholder">
                    {memberForm.initials ||
                      memberForm.name?.[0]?.toUpperCase() ||
                      "?"}
                  </div>
                )}
              </div>
              <div className="mc-photo-actions">
                <label className="mc-photo-btn">
                  Upload photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onMemberPhoto}
                    hidden
                  />
                </label>
                {memberPreview && (
                  <button
                    type="button"
                    className="mc-photo-btn remove"
                    onClick={() => {
                      setMemberPhoto(null);
                      setMemberPreview("");
                      setMember("photo", "");
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
              value={memberForm.name}
              onChange={(e) => setMember("name", e.target.value)}
              placeholder="Jane Silva"
              required
            />

            <label>Role *</label>
            <input
              type="text"
              value={memberForm.role}
              onChange={(e) => setMember("role", e.target.value)}
              placeholder="President"
              required
            />

            <label>University</label>
            <input
              type="text"
              value={memberForm.university}
              onChange={(e) => setMember("university", e.target.value)}
              placeholder="University of Colombo"
            />

            <div className="mc-grid-2">
              <div>
                <label>Initials</label>
                <input
                  type="text"
                  value={memberForm.initials}
                  onChange={(e) =>
                    setMember(
                      "initials",
                      e.target.value.toUpperCase().slice(0, 3)
                    )
                  }
                  placeholder="JS"
                  maxLength={3}
                />
              </div>
              <div>
                <label>Category</label>
                <select
                  value={memberForm.category}
                  onChange={(e) => setMember("category", e.target.value)}
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
              value={memberForm.year}
              onChange={(e) => setMember("year", e.target.value)}
              placeholder="2025/26"
            />

            <div className="mc-grid-2">
              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={memberForm.email}
                  onChange={(e) => setMember("email", e.target.value)}
                  placeholder="name@university.lk"
                />
              </div>
              <div>
                <label>Phone</label>
                <input
                  type="tel"
                  value={memberForm.phone}
                  onChange={(e) => setMember("phone", e.target.value)}
                  placeholder="+94 71 XXX XXXX"
                />
              </div>
            </div>

            <div className="mc-grid-2">
              <div>
                <label>Order</label>
                <input
                  type="number"
                  value={memberForm.order}
                  onChange={(e) =>
                    setMember("order", Number(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <label>Active</label>
                <label className="mc-toggle">
                  <input
                    type="checkbox"
                    checked={memberForm.active}
                    onChange={(e) => setMember("active", e.target.checked)}
                  />
                  <span>
                    {memberForm.active ? "Visible on site" : "Hidden"}
                  </span>
                </label>
              </div>
            </div>

            <div className="mc-form-actions">
              <button
                type="submit"
                className="mc-btn primary"
                disabled={savingMember}
              >
                {savingMember
                  ? "Saving…"
                  : editingMemberId
                  ? "Update"
                  : "Add member"}
              </button>
              {editingMemberId && (
                <button
                  type="button"
                  className="mc-btn ghost"
                  onClick={resetMember}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* MEMBER LIST */}
          <div className="mc-list">
            <h3>
              {regularMembers.length} committee member
              {regularMembers.length !== 1 && "s"}
            </h3>

            {regularMembers.length === 0 ? (
              <p className="mc-empty">
                No committee members yet. Add one using the form.
              </p>
            ) : (
              <ul className="mc-member-list">
                {regularMembers.map((m, i) => (
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
                        onClick={() => moveMember(i, -1)}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="mc-icon-btn"
                        onClick={() => moveMember(i, 1)}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="mc-icon-btn"
                        onClick={() => toggleMemberActive(m)}
                        title={m.active ? "Hide" : "Show"}
                      >
                        {m.active ? "👁" : "🚫"}
                      </button>
                      <button
                        type="button"
                        className="mc-btn small"
                        onClick={() => editMember(m)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="mc-btn small danger"
                        onClick={() => delMember(m)}
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
      </section>
    </div>
  );
}

const css = `
.manage-committee{ color:#1B2A4A; }

.mc-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:16px; flex-wrap:wrap; margin-bottom:28px;
}
.mc-head h1{
  font-family:'Cormorant Garamond', serif;
  font-size:2rem; font-weight:600; margin:0 0 6px;
}
.mc-sub{ color:#5a6380; font-size:0.9rem; margin:0; max-width:560px; }

.mc-banner{
  padding:12px 18px; border-radius:4px;
  font-size:0.9rem; margin-bottom:16px;
}
.mc-banner.error{ background:#fff2f0; color:#b23b3b; border:1px solid #f0c8c2; }
.mc-banner.success{ background:#E3F3E5; color:#2e7d32; border:1px solid #bfe0c4; }

/* ---------- SECTION WRAPPER ---------- */
.mc-section{
  margin-bottom:44px;
  padding-bottom:32px;
}
.mc-section.spiritual-section{
  background:linear-gradient(180deg, rgba(184,145,47,0.05), rgba(184,145,47,0.01));
  border-radius:8px;
  padding:26px 22px 32px;
  border:1px solid rgba(184,145,47,0.15);
}
.mc-section.committee-section{
  background:#FFFDF8;
  border-radius:8px;
  padding:26px 22px 32px;
  border:1px solid rgba(27,42,74,0.14);
}

.mc-section-head{
  margin-bottom:22px;
  padding-bottom:14px;
  border-bottom:1px solid rgba(27,42,74,0.08);
}
.mc-section-head h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.5rem; font-weight:600; margin:0 0 4px;
  color:#1B2A4A;
}
.mc-section.spiritual-section .mc-section-head h2{
  color:#8a6d10;
}
.mc-section-sub{
  color:#5a6380; font-size:0.85rem; margin:0;
}

/* ---------- LAYOUT ---------- */
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
  background:#fff;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:22px;
  display:flex; flex-direction:column; gap:8px;
  min-width:0;
}
.mc-form h3{
  font-family:'Cormorant Garamond', serif;
  font-size:1.25rem; margin:0 0 12px;
  color:#1B2A4A;
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
  width:100%;
  min-width:0;
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
  grid-template-columns:minmax(0, 1fr) minmax(0, 1fr);
  gap:12px;
  min-width:0;
}
.mc-grid-2 > div{ min-width:0; }

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
.mc-photo-preview.spiritual{
  border:2px solid #B8912F;
  box-shadow:0 4px 16px rgba(184,145,47,0.2);
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
  background:#fff;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:22px;
}
.mc-list h3{
  font-family:'Cormorant Garamond', serif;
  font-size:1.25rem; margin:0 0 16px;
  color:#1B2A4A;
}
.mc-empty{ color:#7b8399; font-style:italic; font-size:0.88rem; }

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
.mc-member-avatar.spiritual{
  border:2px solid #B8912F;
  box-shadow:0 2px 12px rgba(184,145,47,0.18);
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