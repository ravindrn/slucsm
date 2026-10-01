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

  /* QR modal state */
  const [qrTeam, setQrTeam] = useState(null);
  const [qrData, setQrData] = useState(null);

  /* Task 2 unlock stats */
  const [chaosStats, setChaosStats] = useState({ unlocked: 0, total: 0 });

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

  /* ---------- LOAD TEAMS ---------- */
  const reload = async () => {
    if (!eventId) return;
    try {
      const { data } = await api.get(`/teams/event/${eventId}`);
      setTeams(data);
    } catch (e) {
      setTeams([]);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  /* ---------- COMPUTE UNLOCK STATS ---------- */
  useEffect(() => {
    if (!teams.length) {
      setChaosStats({ unlocked: 0, total: 0 });
      return;
    }
    const unlocked = teams.filter((t) => t.chaosUnlocked).length;
    setChaosStats({ unlocked, total: teams.length });
  }, [teams]);

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
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/teams/${editingId}`, payload);
      } else {
        await api.post("/teams", { ...form, eventId });
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
      name: t.name,
      username: t.username,
      password: "",
      color: t.color || "#B8912F",
      members: t.members || [],
    });
    setErr("");
  };

  const del = async (t) => {
    if (!window.confirm(`Delete team "${t.name}"? This removes their submissions.`))
      return;
    await api.delete(`/teams/${t._id}`);
    setTeams((list) => list.filter((x) => x._id !== t._id));
  };

  /* ---------- TASK 2 UNLOCK ---------- */
  const unlockAll = async () => {
    if (
      !window.confirm(
        `Unlock Task 2 (Chaos Challenges) for ALL ${chaosStats.total} teams?\n\nTeams will be able to see and start Task 2 immediately.`
      )
    )
      return;
    try {
      const { data } = await api.put(`/teams/unlock-chaos/${eventId}`);
      alert(data.message || "Unlocked for all teams");
      await reload();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to unlock");
    }
  };

  const lockAll = async () => {
    if (
      !window.confirm(
        `Lock Task 2 for ALL ${chaosStats.total} teams?\n\nTeams will no longer see Task 2 until you unlock again.`
      )
    )
      return;
    try {
      const { data } = await api.put(`/teams/lock-chaos/${eventId}`);
      alert(data.message || "Locked for all teams");
      await reload();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to lock");
    }
  };

  const toggleTeam = async (t) => {
    try {
      const url = t.chaosUnlocked
        ? `/teams/${t._id}/lock-chaos`
        : `/teams/${t._id}/unlock-chaos`;
      await api.put(url);
      await reload();
    } catch (e) {
      alert(e.response?.data?.message || "Failed");
    }
  };

  /* ---------- QR ---------- */
  const openQr = async (team) => {
    try {
      const { data } = await api.get(`/qrcodes/team-preview/${team._id}`);
      setQrData(data);
      setQrTeam(team);
    } catch (e) {
      alert(e.response?.data?.message || "Could not load QR");
    }
  };

  const closeQr = () => {
    setQrTeam(null);
    setQrData(null);
  };

  const downloadQr = () => {
    if (!qrData) return;
    const link = document.createElement("a");
    link.href = qrData.dataUrl;
    link.download = `team-${qrData.teamCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQr = () => {
    if (!qrData || !qrTeam) return;
    const w = window.open("", "_blank", "width=500,height=750");
    if (!w) {
      alert("Popup blocked. Please allow popups for this site.");
      return;
    }
    const color = qrData.teamColor || "#B8912F";
    w.document.write(`
      <html>
        <head>
          <title>QR - ${qrData.teamName}</title>
          <style>
            body{font-family:'Inter', system-ui, sans-serif;text-align:center;padding:40px 20px;color:#1B2A4A;background:#FFFDF8;}
            .color-bar{position:fixed;top:0;left:0;right:0;height:14px;background:${color};}
            h1{font-family:'Cormorant Garamond', Georgia, serif;font-size:2.2rem;margin:0 0 6px;}
            .event{font-size:0.95rem;color:#5a6380;margin:0 0 20px;}
            .code{font-family:monospace;background:#F8F4E9;padding:10px 22px;border-radius:6px;display:inline-block;font-weight:700;color:#B8912F;letter-spacing:0.1em;margin-bottom:26px;font-size:1.1rem;}
            img{width:360px;height:360px;}
            .hint{margin-top:28px;font-size:0.85rem;color:#7b8399;}
            @media print { body { padding:20px; } }
          </style>
        </head>
        <body>
          <div class="color-bar"></div>
          <h1>${qrData.teamName}</h1>
          ${qrData.eventTitle ? `<p class="event">${qrData.eventTitle}</p>` : ""}
          <div class="code">${qrData.teamCode}</div>
          <img src="${qrData.dataUrl}" alt="QR" />
          <p class="hint">Scan to verify team</p>
          <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="manage-teams">
      <style>{css}</style>

      {/* ---------- HEAD ---------- */}
      <div className="mt-head">
        <div>
          <h1>Teams</h1>
          <p className="mt-sub">
            Create teams, assign credentials, unlock Task 2, and generate QR
            codes for check-in.
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

      {/* ---------- TASK 2 UNLOCK PANEL ---------- */}
      <div className="mt-unlock-panel">
        <div className="mt-unlock-info">
          <h3>🎮 Task 2 — Chaos Challenges</h3>
          <p>
            Unlocked for <strong>{chaosStats.unlocked}</strong> of{" "}
            <strong>{chaosStats.total}</strong> teams
          </p>
        </div>

        <div className="mt-unlock-actions">
          {chaosStats.unlocked < chaosStats.total && (
            <button className="mt-btn primary" onClick={unlockAll}>
              🔓 Unlock for ALL teams
            </button>
          )}
          {chaosStats.unlocked > 0 && (
            <button className="mt-btn danger" onClick={lockAll}>
              🔒 Lock for ALL teams
            </button>
          )}
        </div>
      </div>

      <div className="mt-layout">
        {/* ---------- FORM ---------- */}
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
              setForm({
                ...form,
                username: e.target.value.toLowerCase().replace(/\s+/g, ""),
              })
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

        {/* ---------- LIST ---------- */}
        <div className="mt-list">
          <h2>
            {teams.length} team{teams.length !== 1 && "s"}
          </h2>

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
                    <strong>
                      {t.name}
                      {t.chaosUnlocked && (
                        <span className="mt-team-badge unlocked">
                          Task 2 unlocked
                        </span>
                      )}
                    </strong>
                    <span className="mt-team-user">
                      username: <code>{t.username}</code>
                      {t.teamCode && (
                        <>
                          {" · "}code: <code>{t.teamCode}</code>
                        </>
                      )}
                    </span>
                    <span className="mt-team-score">{t.totalScore} pts</span>
                  </div>

                  <div className="mt-team-actions">
                    <button
                      className={
                        "mt-btn small " + (t.chaosUnlocked ? "success" : "ghost")
                      }
                      onClick={() => toggleTeam(t)}
                      title={
                        t.chaosUnlocked
                          ? "Task 2 unlocked — click to lock"
                          : "Click to unlock Task 2"
                      }
                    >
                      {t.chaosUnlocked ? "🔓" : "🔒"}
                    </button>

                    {t.teamCode && (
                      <button
                        className="mt-btn qr"
                        onClick={() => openQr(t)}
                        title="Generate team QR"
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
      {qrTeam && qrData && (
        <div className="mt-modal-overlay" onClick={closeQr}>
          <div className="mt-modal" onClick={(e) => e.stopPropagation()}>
            <button className="mt-modal-close" onClick={closeQr}>
              ×
            </button>

            <div
              className="mt-modal-bar"
              style={{ background: qrData.teamColor || "#B8912F" }}
            />

            <h2>{qrData.teamName}</h2>
            <p className="mt-modal-code">{qrData.teamCode}</p>

            {qrData.eventTitle && (
              <p className="mt-modal-event">{qrData.eventTitle}</p>
            )}

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
.manage-teams{ color:#1B2A4A; }

/* ---------- HEAD ---------- */
.mt-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:16px; flex-wrap:wrap; margin-bottom:20px;
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
  font-size:0.9rem; color:#1B2A4A;
  min-width:220px;
}

/* ---------- TASK 2 UNLOCK PANEL ---------- */
.mt-unlock-panel{
  display:flex; align-items:center; justify-content:space-between;
  gap:16px; flex-wrap:wrap;
  padding:18px 22px;
  background:linear-gradient(90deg, rgba(184,145,47,0.08), rgba(184,145,47,0.02));
  border:1px solid rgba(184,145,47,0.3);
  border-radius:8px;
  margin-bottom:24px;
}
.mt-unlock-info h3{
  font-family:'Cormorant Garamond', serif;
  font-size:1.3rem; font-weight:600;
  margin:0 0 4px; color:#1B2A4A;
}
.mt-unlock-info p{
  font-size:0.88rem; color:#5a6380; margin:0;
}
.mt-unlock-info strong{ color:#6E2C2C; font-weight:700; }
.mt-unlock-actions{ display:flex; gap:10px; flex-wrap:wrap; }

/* ---------- LAYOUT ---------- */
.mt-layout{
  display:grid;
  grid-template-columns:380px 1fr;
  gap:24px;
  align-items:flex-start;
}
@media (max-width:1000px){
  .mt-layout{ grid-template-columns:1fr; }
}

/* ---------- FORM ---------- */
.mt-form{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:22px;
  display:flex; flex-direction:column; gap:8px;
  min-width:0;
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
.mt-form input[type="text"]{
  width:100%; min-width:0;
  padding:9px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px; font-family:inherit;
  font-size:0.9rem;
  background:#fff;
}
.mt-form input:focus{
  outline:none; border-color:#B8912F;
  box-shadow:0 0 0 3px rgba(184,145,47,0.12);
}
.mt-color-row{
  display:grid;
  grid-template-columns:60px 1fr;
  gap:8px;
}
.mt-color-row input[type="color"]{
  width:60px; height:38px; padding:2px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  cursor:pointer; background:#fff;
}
.mt-form-actions{
  display:flex; gap:8px; margin-top:16px;
}

/* ---------- BUTTONS ---------- */
.mt-btn{
  padding:9px 16px;
  border-radius:3px;
  border:1px solid rgba(27,42,74,0.14);
  background:transparent;
  color:#1B2A4A;
  font-family:inherit;
  font-size:0.88rem;
  cursor:pointer;
  transition:.15s;
  white-space:nowrap;
}
.mt-btn:hover{ background:#F8F4E9; }
.mt-btn.primary{
  background:#1B2A4A; color:#F8F4E9;
  border-color:#1B2A4A;
}
.mt-btn.primary:hover{ background:#6E2C2C; border-color:#6E2C2C; }
.mt-btn.danger{
  color:#b23b3b; border-color:#f0c8c2;
}
.mt-btn.danger:hover{ background:#fff2f0; }
.mt-btn.ghost{ background:transparent; }
.mt-btn.small{ padding:6px 10px; font-size:0.8rem; }
.mt-btn.success{
  background:#E3F3E5; color:#2e7d32;
  border-color:#bfe0c4;
}
.mt-btn.success:hover{ background:#d5ecd8; }
.mt-btn.qr{
  background:#F8F4E9; color:#B8912F;
  border-color:rgba(184,145,47,0.3);
  font-weight:600;
}
.mt-btn.qr:hover{ background:#B8912F; color:#fff; border-color:#B8912F; }

.mt-error{
  background:#fff2f0; color:#b23b3b;
  border:1px solid #f0c8c2;
  padding:10px 12px;
  border-radius:3px;
  font-size:0.85rem;
}

/* ---------- LIST ---------- */
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
.mt-empty{
  color:#7b8399; font-style:italic;
}

.mt-team-list{ list-style:none; margin:0; padding:0; }
.mt-team-item{
  display:grid;
  grid-template-columns:14px 1fr auto;
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
.mt-team-info strong{
  font-size:1rem;
  display:flex; align-items:center; gap:8px;
  flex-wrap:wrap;
}
.mt-team-badge{
  font-size:0.65rem; font-weight:700;
  padding:2px 8px; border-radius:8px;
  text-transform:uppercase;
  letter-spacing:0.05em;
}
.mt-team-badge.unlocked{
  background:#E3F3E5;
  color:#2e7d32;
  border:1px solid #bfe0c4;
}
.mt-team-user{
  font-size:0.78rem;
  color:#7b8399;
}
.mt-team-user code{
  background:#F8F4E9;
  padding:1px 6px;
  border-radius:3px;
  font-size:0.75rem;
}
.mt-team-score{
  font-size:0.82rem;
  color:#B8912F;
  font-weight:600;
}
.mt-team-actions{
  display:flex; gap:6px; flex-wrap:wrap;
  justify-content:flex-end;
}
.hint{
  color:#7b8399; font-weight:400; font-size:0.75rem;
}

/* ---------- QR MODAL ---------- */
.mt-modal-overlay{
  position:fixed; inset:0; z-index:100;
  background:rgba(27,42,74,0.6);
  display:flex; align-items:center; justify-content:center;
  padding:20px; backdrop-filter:blur(3px);
}
.mt-modal{
  background:#FFFDF8;
  border-radius:10px;
  max-width:420px; width:100%;
  padding:32px 32px 28px;
  position:relative;
  text-align:center;
  font-family:'Inter',sans-serif;
  color:#1B2A4A;
  box-shadow:0 30px 80px rgba(27,42,74,0.35);
  max-height:92vh; overflow-y:auto;
  overflow:hidden;
}
.mt-modal-bar{
  position:absolute; top:0; left:0; right:0;
  height:6px;
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
  font-size:1.6rem; font-weight:600;
  margin:6px 0 6px;
}
.mt-modal-code{
  font-family:'Courier New', monospace;
  background:#F8F4E9;
  padding:6px 14px;
  border-radius:3px;
  display:inline-block;
  font-weight:700;
  color:#B8912F;
  letter-spacing:0.06em;
  margin:0 0 8px;
  font-size:1.05rem;
}
.mt-modal-event{
  font-size:0.85rem; color:#5a6380;
  margin:0 0 18px;
}
.mt-qr-img{
  width:100%; max-width:260px;
  margin:0 auto 14px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  display:block;
  padding:10px;
  background:#fff;
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

/* ---------- MOBILE ---------- */
@media (max-width:640px){
  .mt-head{ flex-direction:column; }
  .mt-event-select{ width:100%; }
  .mt-unlock-panel{ flex-direction:column; align-items:stretch; }
  .mt-unlock-actions{ width:100%; }
  .mt-unlock-actions button{ flex:1; justify-content:center; }
  .mt-team-item{
    grid-template-columns:14px 1fr;
    grid-template-areas:
      "color info"
      ". actions";
    gap:10px;
  }
  .mt-team-color{ grid-area:color; }
  .mt-team-info{ grid-area:info; }
  .mt-team-actions{
    grid-area:actions;
    justify-content:flex-start;
  }
}
`;