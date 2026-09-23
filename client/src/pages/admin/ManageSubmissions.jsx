import { useEffect, useState } from "react";
import api, { imgUrl } from "../../api/axios";

export default function ManageSubmissions() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [subs, setSubs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | pending | approved | rejected

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

  const load = async () => {
    if (!eventId) return;
    const [s, l] = await Promise.all([
      api.get(`/submissions/event/${eventId}`),
      api.get(`/submissions/leaderboard/${eventId}`),
    ]);
    setSubs(s.data);
    setLeaderboard(l.data);
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const update = async (sub, status, score) => {
    try {
      await api.put(`/submissions/${sub._id}`, { status, score });
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Update failed");
    }
  };

  const approve = (s) => update(s, "approved", s.taskId?.points ?? s.score);
  const reject = (s) => update(s, "rejected", 0);

  const filtered =
    filter === "all" ? subs : subs.filter((s) => s.status === filter);

  if (loading) return <p>Loading…</p>;

  return (
    <div className="manage-subs">
      <style>{css}</style>

      <div className="ms-head">
        <div>
          <h1>Submissions</h1>
          <p className="ms-sub">
            Review team task submissions and award scores.
          </p>
        </div>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="ms-event-select"
        >
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>
              {ev.title} ({ev.status})
            </option>
          ))}
        </select>
      </div>

      <div className="ms-layout">
        <div className="ms-main">
          <div className="ms-tabs">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button
                key={f}
                className={`ms-tab${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
                <span className="ms-tab-count">
                  {f === "all"
                    ? subs.length
                    : subs.filter((s) => s.status === f).length}
                </span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="ms-empty">No submissions in this filter.</p>
          ) : (
            <ul className="ms-list">
              {filtered.map((s) => (
                <li key={s._id} className={`ms-item ${s.status}`}>
                  <div className="ms-item-head">
                    <div className="ms-team">
                      <span
                        className="ms-dot"
                        style={{ background: s.teamId?.color || "#B8912F" }}
                      />
                      <strong>{s.teamId?.name || "Unknown team"}</strong>
                    </div>
                    <span className={`ms-status ${s.status}`}>{s.status}</span>
                  </div>

                  <div className="ms-task">
                    <span className="ms-task-title">
                      {s.taskId?.title || "Task"}
                    </span>
                    <span className="ms-task-pts">
                      {s.taskId?.points ?? 0} pts
                    </span>
                  </div>

                  {s.note && <p className="ms-note">📝 {s.note}</p>}
                  {s.proof && (
                    <a
                      href={imgUrl(s.proof)}
                      target="_blank"
                      rel="noreferrer"
                      className="ms-proof"
                    >
                      <img src={imgUrl(s.proof)} alt="proof" />
                    </a>
                  )}

                  <div className="ms-item-actions">
                    {s.status !== "approved" && (
                      <button
                        className="ms-btn approve"
                        onClick={() => approve(s)}
                      >
                        ✓ Approve ({s.taskId?.points ?? 0} pts)
                      </button>
                    )}
                    {s.status !== "rejected" && (
                      <button
                        className="ms-btn reject"
                        onClick={() => reject(s)}
                      >
                        ✕ Reject
                      </button>
                    )}
                    {s.status === "approved" && (
                      <button
                        className="ms-btn ghost"
                        onClick={() => {
                          const v = window.prompt(
                            "Enter new score:",
                            String(s.score)
                          );
                          if (v != null) update(s, "approved", Number(v));
                        }}
                      >
                        Adjust score ({s.score})
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="ms-lb">
          <h2>🏆 Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="ms-empty">No teams yet.</p>
          ) : (
            <ol className="ms-lb-list">
              {leaderboard.map((t, i) => (
                <li key={t._id} className="ms-lb-item">
                  <span className="ms-lb-rank">#{i + 1}</span>
                  <span
                    className="ms-dot"
                    style={{ background: t.color || "#B8912F" }}
                  />
                  <span className="ms-lb-name">{t.name}</span>
                  <span className="ms-lb-score">{t.totalScore}</span>
                </li>
              ))}
            </ol>
          )}
          <button className="ms-refresh" onClick={load}>
            ↻ Refresh
          </button>
        </aside>
      </div>
    </div>
  );
}

const css = `
.manage-subs{ color:#1B2A4A; }
.ms-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:16px; flex-wrap:wrap; margin-bottom:24px;
}
.ms-head h1{
  font-family:'Cormorant Garamond', serif;
  font-size:2rem; font-weight:600; margin:0 0 6px;
}
.ms-sub{ color:#5a6380; font-size:0.9rem; margin:0; }
.ms-event-select{
  padding:9px 14px; border-radius:4px;
  border:1px solid rgba(27,42,74,0.14);
  background:#FFFDF8; font-family:inherit;
  font-size:0.9rem; color:#1B2A4A; min-width:220px;
}

.ms-layout{
  display:grid; grid-template-columns:1fr 300px; gap:24px;
}
@media (max-width:1000px){ .ms-layout{ grid-template-columns:1fr; } }

.ms-main{
  background:#FFFDF8; border:1px solid rgba(27,42,74,0.14);
  border-radius:6px; padding:22px;
}

.ms-tabs{
  display:flex; gap:6px; margin-bottom:18px; flex-wrap:wrap;
}
.ms-tab{
  padding:7px 14px; border-radius:20px;
  background:transparent; border:1px solid rgba(27,42,74,0.14);
  font-family:inherit; font-size:0.85rem;
  color:#3a4560; cursor:pointer; transition:.15s;
  text-transform:capitalize;
}
.ms-tab:hover{ background:#F8F4E9; }
.ms-tab.active{ background:#1B2A4A; color:#F8F4E9; border-color:#1B2A4A; }
.ms-tab-count{
  display:inline-block; margin-left:6px;
  background:rgba(255,255,255,0.2);
  padding:1px 7px; border-radius:10px;
  font-size:0.72rem;
}
.ms-tab.active .ms-tab-count{ background:rgba(255,255,255,0.25); }

.ms-empty{ color:#7b8399; font-style:italic; text-align:center; padding:30px; }

.ms-list{ list-style:none; margin:0; padding:0; }
.ms-item{
  border:1px solid rgba(27,42,74,0.14);
  border-radius:5px;
  padding:16px; margin-bottom:12px;
  background:#fff;
}
.ms-item.pending{ border-left:3px solid #B8912F; }
.ms-item.approved{ border-left:3px solid #2e7d32; }
.ms-item.rejected{ border-left:3px solid #b23b3b; opacity:0.85; }

.ms-item-head{
  display:flex; justify-content:space-between;
  align-items:center; gap:8px; margin-bottom:10px;
}
.ms-team{
  display:flex; align-items:center; gap:8px;
}
.ms-dot{
  display:inline-block; width:10px; height:10px;
  border-radius:50%;
}
.ms-status{
  font-size:0.72rem; font-weight:600;
  padding:3px 10px; border-radius:10px;
  text-transform:uppercase; letter-spacing:0.04em;
}
.ms-status.pending{ background:#FFF4D6; color:#8a6d10; }
.ms-status.approved{ background:#E3F3E5; color:#2e7d32; }
.ms-status.rejected{ background:#FBE4E4; color:#b23b3b; }

.ms-task{
  display:flex; justify-content:space-between;
  align-items:baseline; padding:8px 0;
  border-top:1px solid rgba(27,42,74,0.06);
  border-bottom:1px solid rgba(27,42,74,0.06);
  margin:8px 0;
}
.ms-task-title{ font-weight:500; font-size:0.95rem; }
.ms-task-pts{ font-size:0.85rem; color:#B8912F; font-weight:600; }

.ms-note{
  margin:10px 0; padding:10px 12px;
  background:#F8F4E9; border-radius:3px;
  font-size:0.88rem; color:#3a4560;
}
.ms-proof img{
  max-width:200px; max-height:200px;
  border-radius:4px; border:1px solid rgba(27,42,74,0.14);
  display:block;
}

.ms-item-actions{
  display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;
}
.ms-btn{
  padding:7px 14px; border-radius:3px;
  border:1px solid rgba(27,42,74,0.14);
  background:transparent; color:#1B2A4A;
  font-family:inherit; font-size:0.85rem;
  cursor:pointer; transition:.15s;
}
.ms-btn:hover{ background:#F8F4E9; }
.ms-btn.approve{ background:#2e7d32; color:#fff; border-color:#2e7d32; }
.ms-btn.approve:hover{ background:#245c28; }
.ms-btn.reject{ color:#b23b3b; border-color:#f0c8c2; }
.ms-btn.reject:hover{ background:#fff2f0; }
.ms-btn.ghost{ opacity:0.8; }

/* ---------- LEADERBOARD ---------- */
.ms-lb{
  background:#1B2A4A; color:#F8F4E9;
  border-radius:6px; padding:22px;
  height:fit-content;
  position:sticky; top:20px;
}
.ms-lb h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.4rem; margin:0 0 16px;
}
.ms-lb-list{
  list-style:none; padding:0; margin:0;
  display:flex; flex-direction:column; gap:4px;
}
.ms-lb-item{
  display:grid; grid-template-columns:36px 12px 1fr auto;
  align-items:center; gap:10px;
  padding:10px 0;
  border-bottom:1px solid rgba(248,244,233,0.08);
}
.ms-lb-item:last-child{ border-bottom:none; }
.ms-lb-rank{
  font-family:'Cormorant Garamond', serif;
  font-size:1rem; opacity:0.7;
}
.ms-lb-name{ font-size:0.92rem; }
.ms-lb-score{
  font-family:'Cormorant Garamond', serif;
  font-size:1.3rem; font-weight:600;
  color:#B8912F;
}
.ms-refresh{
  width:100%; margin-top:16px;
  padding:9px;
  background:rgba(248,244,233,0.1);
  border:1px solid rgba(248,244,233,0.2);
  color:#F8F4E9; border-radius:3px;
  font-family:inherit; font-size:0.85rem;
  cursor:pointer; transition:.15s;
}
.ms-refresh:hover{ background:rgba(248,244,233,0.18); }
`;