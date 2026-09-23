import { useEffect, useState } from "react";
import api from "../../api/axios";

const EMPTY = {
  name: "",
  username: "",
  password: "",
  color: "#B8912F",
  members: [],
};

export default function ManageTeams() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState("");

  /* Load events */
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

  /* Load teams for the selected event */
  useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        const { data } = await api.get(`/teams/event/${eventId}`);
        setTeams(data);
      } catch (e) {
        setTeams([]);
      }
    })();
  }, [eventId]);

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
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/teams/${editingId}`, payload);
      } else {
        await api.post("/teams", { ...form, eventId });
      }
      reset();
      const { data } = await api.get(`/teams/event/${eventId}`);
      setTeams(data);
    } catch (e) {
      setErr(e.response?.data?.message || "Save failed");
    }
  };

  const edit = (t) => {
    setEditingId(t._id);
    setForm({
      name: t.name,
      username: t.username,
      password: "",
      color: t.color || "#B8912F",
      members: t.members || [],
    });
    setErr("");
  };

  const del = async (t) => {
    if (!window.confirm(`Delete team "${t.name}"? This removes their submissions.`)) return;
    await api.delete(`/teams/${t._id}`);
    setTeams((list) => list.filter((x) => x._id !== t._id));
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="manage-teams">
      <style>{css}</style>

      <div className="mt-head">
        <div>
          <h1>Teams</h1>
          <p className="mt-sub">
            Create teams and give each one a username + password for the team portal.
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
        {/* Form */}
        <form className="mt-form" onSubmit={submit}>
          <h2>{editingId ? "Edit team" : "New team"}</h2>
          {err && <div className="mt-error">{err}</div>}

          <label>Team name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Team Alpha"
            required
          />

          <label>Username (login)</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s+/g, "") })
            }
            placeholder="alpha"
            required
            disabled={!!editingId}
          />

          <label>
            Password {editingId && <span className="hint">(leave blank to keep)</span>}
          </label>
          <input
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="team123"
            required={!editingId}
          />

          <label>Color (for UI + leaderboard)</label>
          <div className="mt-color-row">
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
            <input
              type="text"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>

          <div className="mt-form-actions">
            <button type="submit" className="mt-btn primary">
              {editingId ? "Update team" : "Create team"}
            </button>
            {editingId && (
              <button type="button" className="mt-btn ghost" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* List */}
        <div className="mt-list">
          <h2>{teams.length} team{teams.length !== 1 && "s"}</h2>
          {teams.length === 0 ? (
            <p className="mt-empty">No teams yet for this event.</p>
          ) : (
            <ul className="mt-team-list">
              {teams.map((t) => (
                <li key={t._id} className="mt-team-item">
                  <div
                    className="mt-team-color"
                    style={{ background: t.color || "#B8912F" }}
                  />
                  <div className="mt-team-info">
                    <strong>{t.name}</strong>
                    <span className="mt-team-user">
                      username: <code>{t.username}</code>
                    </span>
                    <span className="mt-team-score">{t.totalScore} pts</span>
                  </div>
                  <div className="mt-team-actions">
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
    </div>
  );
}

const css = `
.manage-teams{ color:#1B2A4A; }
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
  font-size:0.9rem; color:#1B2A4A;
  min-width:220px;
}

.mt-layout{
  display:grid;
  grid-template-columns:380px 1fr;
  gap:24px;
}
@media (max-width:900px){
  .mt-layout{ grid-template-columns:1fr; }
}

.mt-form{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:22px;
  display:flex; flex-direction:column; gap:8px;
  height:fit-content;
}
.mt-form h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.4rem; margin:0 0 12px;
}
.mt-form label{
  font-size:0.82rem; font-weight:500;
  color:#3a4560; margin-top:8px;
}
.mt-form input[type="text"]{
  padding:9px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px; font-family:inherit;
  font-size:0.9rem;
}
.mt-color-row{
  display:grid; grid-template-columns:60px 1fr; gap:8px;
}
.mt-color-row input[type="color"]{
  width:60px; height:38px; padding:2px;
  border:1px solid rgba(27,42,74,0.14); border-radius:3px;
  cursor:pointer; background:#fff;
}
.mt-form-actions{
  display:flex; gap:8px; margin-top:16px;
}
.mt-btn{
  padding:9px 16px;
  border-radius:3px; border:1px solid rgba(27,42,74,0.14);
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

.mt-error{
  background:#fff2f0; color:#b23b3b; border:1px solid #f0c8c2;
  padding:10px 12px; border-radius:3px; font-size:0.85rem;
}

.mt-list{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:22px;
}
.mt-list h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.4rem; margin:0 0 16px;
}
.mt-empty{ color:#7b8399; font-style:italic; }

.mt-team-list{ list-style:none; margin:0; padding:0; }
.mt-team-item{
  display:grid; grid-template-columns:14px 1fr auto;
  gap:14px; align-items:center;
  padding:14px 0;
  border-bottom:1px solid rgba(27,42,74,0.08);
}
.mt-team-item:last-child{ border-bottom:none; }
.mt-team-color{
  width:14px; height:14px; border-radius:50%;
}
.mt-team-info{
  display:flex; flex-direction:column; gap:2px;
  min-width:0;
}
.mt-team-info strong{ font-size:1rem; }
.mt-team-user{ font-size:0.8rem; color:#7b8399; }
.mt-team-user code{
  background:#F8F4E9; padding:1px 6px; border-radius:3px;
}
.mt-team-score{
  font-size:0.82rem; color:#B8912F; font-weight:600;
}
.mt-team-actions{ display:flex; gap:6px; }
.hint{ color:#7b8399; font-weight:400; font-size:0.75rem; }
`;