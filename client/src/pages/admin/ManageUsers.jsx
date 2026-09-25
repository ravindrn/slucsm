import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const EMPTY = {
  name: "",
  email: "",
  password: "",
  role: "editor",
  active: true,
};

export default function ManageUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  /* ---------- LOAD ---------- */
  const load = async () => {
    try {
      const { data } = await api.get("/auth/users");
      setUsers(data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ---------- FORM ---------- */
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (editingId) {
        /* Update: only send password if user typed one */
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          active: form.active,
        };
        if (form.password && form.password.length > 0) {
          payload.password = form.password;
        }
        await api.put(`/auth/users/${editingId}`, payload);
        setSuccess("User updated.");
      } else {
        if (!form.password || form.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        await api.post("/auth/register", {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        setSuccess("User created.");
      }
      setTimeout(() => setSuccess(""), 2500);
      reset();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const edit = (u) => {
    setEditingId(u._id);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role || "editor",
      active: u.active !== false,
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const del = async (u) => {
    if (!window.confirm(`Delete user "${u.name}"? This cannot be undone.`))
      return;
    try {
      await api.delete(`/auth/users/${u._id}`);
      setUsers((list) => list.filter((x) => x._id !== u._id));
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  const toggleActive = async (u) => {
    try {
      const { data } = await api.put(`/auth/users/${u._id}`, {
        active: !u.active,
      });
      setUsers((list) => list.map((x) => (x._id === u._id ? data : x)));
    } catch (e) {
      alert(e.response?.data?.message || "Toggle failed");
    }
  };

  if (loading) return <p>Loading users…</p>;

  return (
    <div className="manage-users">
      <style>{css}</style>

      <div className="mu-head">
        <div>
          <h1>Users</h1>
          <p className="mu-sub">
            Manage admin and editor accounts. Admins have full access; editors
            can manage content but not users.
          </p>
        </div>
      </div>

      {error && <div className="mu-banner error">{error}</div>}
      {success && <div className="mu-banner success">{success}</div>}

      <div className="mu-layout">
        {/* ---------- FORM ---------- */}
        <form className="mu-form" onSubmit={submit}>
          <h2>{editingId ? "Edit user" : "Add user"}</h2>

          <label>Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Jane Silva"
            required
          />

          <label>Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="jane@slucsm.lk"
            required
          />

          <label>
            Password {editingId ? "(leave blank to keep)" : "*"}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder={editingId ? "••••••••" : "At least 6 characters"}
            autoComplete="new-password"
            required={!editingId}
          />

          <label>Role *</label>
          <select value={form.role} onChange={(e) => set("role", e.target.value)}>
            <option value="editor">Editor — manage content</option>
            <option value="admin">Admin — full access</option>
          </select>

          {editingId && (
            <>
              <label>Active</label>
              <label className="mu-toggle">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set("active", e.target.checked)}
                />
                <span>{form.active ? "Can sign in" : "Deactivated"}</span>
              </label>
            </>
          )}

          <div className="mu-form-actions">
            <button type="submit" className="mu-btn primary" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update" : "Add user"}
            </button>
            {editingId && (
              <button type="button" className="mu-btn ghost" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* ---------- LIST ---------- */}
        <div className="mu-list">
          <h2>
            {users.length} user{users.length !== 1 && "s"}
          </h2>

          {users.length === 0 ? (
            <p className="mu-empty">No users yet.</p>
          ) : (
            <ul className="mu-user-list">
              {users.map((u) => {
                const isMe = u._id === me?.id || u._id === me?._id;
                return (
                  <li
                    key={u._id}
                    className={`mu-user${!u.active ? " inactive" : ""}`}
                  >
                    <div className="mu-avatar">
                      {u.name?.[0]?.toUpperCase() || "?"}
                    </div>

                    <div className="mu-user-info">
                      <strong>
                        {u.name}
                        {isMe && <span className="mu-you">you</span>}
                      </strong>
                      <span className="mu-user-email">{u.email}</span>
                      <span className={`mu-role ${u.role}`}>{u.role}</span>
                    </div>

                    <div className="mu-user-actions">
                      <button
                        type="button"
                        className="mu-icon-btn"
                        onClick={() => toggleActive(u)}
                        title={u.active ? "Deactivate" : "Activate"}
                      >
                        {u.active ? "👁" : "🚫"}
                      </button>
                      <button
                        type="button"
                        className="mu-btn small"
                        onClick={() => edit(u)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="mu-btn small danger"
                        onClick={() => del(u)}
                        disabled={isMe}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const css = `
.manage-users{ color:#1B2A4A; }

.mu-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:16px; flex-wrap:wrap; margin-bottom:24px;
}
.mu-head h1{
  font-family:'Cormorant Garamond', serif;
  font-size:2rem; font-weight:600; margin:0 0 6px;
}
.mu-sub{ color:#5a6380; font-size:0.9rem; margin:0; max-width:560px; }

.mu-banner{
  padding:12px 18px; border-radius:4px;
  font-size:0.9rem; margin-bottom:16px;
}
.mu-banner.error{ background:#fff2f0; color:#b23b3b; border:1px solid #f0c8c2; }
.mu-banner.success{ background:#E3F3E5; color:#2e7d32; border:1px solid #bfe0c4; }

.mu-layout{
  display:grid; grid-template-columns:380px 1fr; gap:24px;
  align-items:flex-start;
}
@media (max-width:1000px){ .mu-layout{ grid-template-columns:1fr; } }

.mu-form{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:22px;
  display:flex; flex-direction:column; gap:8px;
}
.mu-form h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.4rem; margin:0 0 12px;
}
.mu-form label{
  font-size:0.82rem; font-weight:500;
  color:#3a4560; margin-top:6px;
}
.mu-form input[type="text"],
.mu-form input[type="email"],
.mu-form input[type="password"],
.mu-form select{
  width:100%; min-width:0;
  padding:9px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  font-family:inherit; font-size:0.9rem;
  background:#fff;
}
.mu-form input:focus, .mu-form select:focus{
  outline:none; border-color:#B8912F;
  box-shadow:0 0 0 3px rgba(184,145,47,0.12);
}
.mu-toggle{
  display:flex; align-items:center; gap:8px;
  font-size:0.88rem; color:#3a4560;
  cursor:pointer; padding:9px 0;
}
.mu-form-actions{ display:flex; gap:8px; margin-top:16px; }

.mu-btn{
  padding:9px 16px; border-radius:3px;
  border:1px solid rgba(27,42,74,0.14);
  background:transparent; color:#1B2A4A;
  font-family:inherit; font-size:0.88rem;
  cursor:pointer; transition:.15s;
}
.mu-btn:hover{ background:#F8F4E9; }
.mu-btn.primary{ background:#1B2A4A; color:#F8F4E9; border-color:#1B2A4A; }
.mu-btn.primary:hover:not(:disabled){ background:#6E2C2C; border-color:#6E2C2C; }
.mu-btn:disabled{ opacity:0.5; cursor:not-allowed; }
.mu-btn.danger{ color:#b23b3b; border-color:#f0c8c2; }
.mu-btn.danger:hover:not(:disabled){ background:#fff2f0; }
.mu-btn.ghost{ background:transparent; }
.mu-btn.small{ padding:6px 12px; font-size:0.82rem; }

.mu-list{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:22px;
}
.mu-list h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.4rem; margin:0 0 16px;
}
.mu-empty{ color:#7b8399; font-style:italic; }

.mu-user-list{ list-style:none; margin:0; padding:0; }
.mu-user{
  display:grid; grid-template-columns:56px 1fr auto;
  gap:14px; align-items:center;
  padding:14px 0;
  border-bottom:1px solid rgba(27,42,74,0.08);
}
.mu-user:last-child{ border-bottom:none; }
.mu-user.inactive{ opacity:0.55; }

.mu-avatar{
  width:56px; height:56px; border-radius:50%;
  background:#1B2A4A; color:#F8F4E9;
  display:flex; align-items:center; justify-content:center;
  font-family:'Cormorant Garamond',serif;
  font-size:1.4rem; font-weight:600;
  flex-shrink:0;
}
.mu-user-info{
  display:flex; flex-direction:column; gap:2px;
  min-width:0;
}
.mu-user-info strong{
  font-size:1rem;
  display:flex; align-items:center; gap:8px;
}
.mu-you{
  font-size:0.65rem; font-weight:600;
  background:#B8912F; color:#fff;
  padding:2px 8px; border-radius:10px;
  text-transform:uppercase; letter-spacing:0.05em;
}
.mu-user-email{ font-size:0.8rem; color:#7b8399; }
.mu-role{
  display:inline-block;
  font-size:0.72rem; font-weight:600;
  padding:2px 10px; border-radius:10px;
  text-transform:uppercase; letter-spacing:0.05em;
  align-self:flex-start; margin-top:2px;
}
.mu-role.admin{ background:#6E2C2C; color:#fff; }
.mu-role.editor{ background:#F8F4E9; color:#5a6380; }

.mu-user-actions{
  display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end;
}
.mu-icon-btn{
  width:32px; height:32px;
  border:1px solid rgba(27,42,74,0.14);
  background:#fff; border-radius:3px;
  cursor:pointer; font-size:0.9rem;
  font-family:inherit;
}
.mu-icon-btn:hover{ background:#F8F4E9; }
`;