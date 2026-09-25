import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { imgUrl } from "../../api/axios";
import { useTeam } from "../../context/TeamContext";
import TaskSubmitModal from "./TaskSubmitModal.jsx";
import ScanModal from "./ScanModal.jsx";

export default function TeamDashboard() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { team, tasks, submissions, logout, refresh } = useTeam();

  const [event, setEvent] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [scanOpen, setScanOpen] = useState(false);

  /* Load event + leaderboard */
  const loadAux = async () => {
    try {
      const { data: ev } = await api.get(`/events/${slug}`);
      setEvent(ev);
      const { data: lb } = await api.get(
        `/submissions/leaderboard/${ev._id}`
      );
      setLeaderboard(lb);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAux();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /* Map submissions by taskId (keeps the most recent for single/multi tasks) */
  const submissionByTask = useMemo(() => {
    const m = {};
    for (const s of submissions) {
      const key = s.taskId?._id || s.taskId;
      const existing = m[key];
      if (!existing) {
        m[key] = s;
      } else {
        // keep the most recently created one for display
        if (new Date(s.createdAt) > new Date(existing.createdAt)) {
          m[key] = s;
        }
      }
    }
    return m;
  }, [submissions]);

  /* Count distinct approved task IDs */
  const completedCount = useMemo(() => {
    const approved = new Set();
    for (const s of submissions) {
      if (s.status === "approved") {
        approved.add(s.taskId?._id || s.taskId);
      }
    }
    return approved.size;
  }, [submissions]);

  /* Count total approved submissions (for progress tasks — shows multiple) */
  const approvedSubmissionCount = useMemo(
    () => submissions.filter((s) => s.status === "approved").length,
    [submissions]
  );

  const handleLogout = async () => {
    await logout();
    nav(`/events/live/${slug}/portal`);
  };

  const handleTaskSuccess = async () => {
    setActiveTask(null);
    await refresh();
    await loadAux();
  };

  return (
    <div className="team-dash">
      <style>{css}</style>

      {/* ---------- HEADER ---------- */}
      <header className="td-header">
        <div className="td-header-inner">
          <Link to={`/events/live/${slug}`} className="td-brand">
            <img src="/slucsmLogo.png" alt="SLUCSM" />
            <span>SLUCSM</span>
          </Link>
          <div className="td-team-chip">
            <span
              className="td-team-dot"
              style={{ background: team?.color || "#B8912F" }}
            />
            <strong>{team?.name}</strong>
            <span className="td-team-score">{team?.totalScore} pts</span>
          </div>
          <div className="td-header-actions">
            <Link to={`/events/live/${slug}`} className="td-link">
              View event
            </Link>
            <button className="td-logout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ---------- MAIN ---------- */}
      <main className="td-main">
        <div className="td-hero">
          <div className="td-hero-text">
            <p className="td-eyebrow">{event?.title || "Team Portal"}</p>
            <h1>Hello, {team?.name}</h1>
            <p className="td-sub">
              {completedCount} of {tasks.length} tasks completed ·{" "}
              {approvedSubmissionCount} approved submission
              {approvedSubmissionCount !== 1 ? "s" : ""} · {team?.totalScore} points
              earned.
            </p>
          </div>
          <button
            className="td-scan-btn"
            onClick={() => setScanOpen(true)}
          >
            <svg
              className="td-scan-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
            Scan QR checkpoint
          </button>
        </div>

        <div className="td-grid">
          {/* ---------- TASKS ---------- */}
          <section className="td-tasks">
            <h2>Your tasks</h2>

            {tasks.length === 0 ? (
              <p className="td-empty">
                No tasks assigned yet. Check back soon.
              </p>
            ) : (
              <ul className="td-task-list">
                {tasks.map((t) => {
                  const sub = submissionByTask[t._id];
                  const status = sub?.status || "todo";
                  const isProgress = t.submissionType === "progress";

                  /* Count approved submissions for this specific task */
                  const approvedForTask = submissions.filter(
                    (s) =>
                      (s.taskId?._id || s.taskId) === t._id &&
                      s.status === "approved"
                  ).length;
                  const pendingForTask = submissions.filter(
                    (s) =>
                      (s.taskId?._id || s.taskId) === t._id &&
                      s.status === "pending"
                  ).length;

                  return (
                    <li key={t._id} className={`td-task td-task-${status}`}>
                      <div className="td-task-main">
                        <div className="td-task-head">
                          <span className={`td-task-badge ${status}`}>
                            {isProgress && approvedForTask > 0
                              ? `${approvedForTask} approved`
                              : status === "todo"
                              ? "To do"
                              : status === "pending"
                              ? "Pending review"
                              : status === "approved"
                              ? "Approved ✓"
                              : "Rejected"}
                          </span>
                          {isProgress && (
                            <span className="td-task-type progress">progress</span>
                          )}
                          {!isProgress && t.submissionType === "multi" && (
                            <span className="td-task-type multi">
                              multi ({t.maxFiles || "?"})
                            </span>
                          )}
                          {t.allowVideo && (
                            <span className="td-task-type video">video</span>
                          )}
                        </div>
                        <h3>{t.title}</h3>
                        {t.description && (
                          <p className="td-task-desc">{t.description}</p>
                        )}
                        {t.location && (
                          <p className="td-task-loc">📍 {t.location}</p>
                        )}

                        {/* Multi-file submission previews */}
                        {sub?.files && sub.files.length > 0 && (
                          <div className="td-task-files">
                            {sub.files.map((f, i) => (
                              <a
                                key={i}
                                href={imgUrl(f.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="td-task-file"
                              >
                                {f.type === "video" ? (
                                  <div className="td-task-video-badge">▶ video</div>
                                ) : (
                                  <img
                                    src={imgUrl(f.url)}
                                    alt={f.label || `file ${i + 1}`}
                                  />
                                )}
                                {f.label && (
                                  <span className="td-task-file-label">
                                    {f.label}
                                  </span>
                                )}
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Legacy single-file proof */}
                        {sub?.proof && !sub?.files?.length && (
                          <a
                            href={imgUrl(sub.proof)}
                            target="_blank"
                            rel="noreferrer"
                            className="td-task-proof"
                          >
                            <img src={imgUrl(sub.proof)} alt="proof" />
                          </a>
                        )}

                        {sub?.note && (
                          <p className="td-task-note">📝 {sub.note}</p>
                        )}

                        {/* Progress info for incremental tasks */}
                        {isProgress && (approvedForTask > 0 || pendingForTask > 0) && (
                          <p className="td-progress-info">
                            ✓ {approvedForTask} approved
                            {pendingForTask > 0 &&
                              ` · ⏳ ${pendingForTask} pending`}
                            {t.pointsPerItem > 0 &&
                              ` · each = ${t.pointsPerItem} pts`}
                          </p>
                        )}
                      </div>

                      <div className="td-task-side">
                        <div className="td-task-pts">
                          <span className="td-task-pts-num">
                            {isProgress && t.pointsPerItem > 0
                              ? `+${t.pointsPerItem}`
                              : t.points}
                          </span>
                          <span className="td-task-pts-lbl">
                            {isProgress && t.pointsPerItem > 0
                              ? "each"
                              : "pts"}
                          </span>
                        </div>

                        {isProgress ? (
                          /* Progress tasks: always allow another submission */
                          <button
                            className="td-task-btn"
                            onClick={() => setActiveTask(t)}
                          >
                            + Submit another
                          </button>
                        ) : status === "todo" || status === "rejected" ? (
                          <button
                            className="td-task-btn"
                            onClick={() => setActiveTask(t)}
                          >
                            {status === "rejected" ? "Resubmit" : "Submit"}
                          </button>
                        ) : status === "pending" ? (
                          <button className="td-task-btn ghost" disabled>
                            Awaiting review
                          </button>
                        ) : (
                          <div className="td-task-approved">
                            +{sub.score || t.points}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ---------- LEADERBOARD ---------- */}
          <aside className="td-lb">
            <h2>🏆 Leaderboard</h2>
            {leaderboard.length === 0 ? (
              <p className="td-empty small">No teams yet.</p>
            ) : (
              <ol className="td-lb-list">
                {leaderboard.map((t, i) => {
                  const isMe = t._id === team?.id || t._id === team?._id;
                  return (
                    <li
                      key={t._id}
                      className={`td-lb-item${isMe ? " me" : ""}`}
                    >
                      <span className="td-lb-rank">#{i + 1}</span>
                      <span
                        className="td-lb-dot"
                        style={{ background: t.color || "#B8912F" }}
                      />
                      <span className="td-lb-name">{t.name}</span>
                      <span className="td-lb-score">{t.totalScore}</span>
                    </li>
                  );
                })}
              </ol>
            )}

            <button
              className="td-refresh"
              onClick={async () => {
                await refresh();
                await loadAux();
              }}
            >
              ↻ Refresh
            </button>
          </aside>
        </div>
      </main>

      {activeTask && (
        <TaskSubmitModal
          task={activeTask}
          existing={submissionByTask[activeTask._id]}
          onClose={() => setActiveTask(null)}
          onSuccess={handleTaskSuccess}
        />
      )}

      {scanOpen && (
        <ScanModal
          onClose={() => setScanOpen(false)}
          onSuccess={() => {
            setScanOpen(false);
            refresh();
            loadAux();
          }}
        />
      )}
    </div>
  );
}

const css = `
html, body, #root{ margin:0; padding:0; width:100%; overflow-x:hidden; }
*, *::before, *::after{ box-sizing:border-box; }

.team-dash{
  --ink:#1B2A4A; --ivory:#F8F4E9; --gold:#B8912F; --maroon:#6E2C2C;
  --paper:#FFFDF8; --line:rgba(27,42,74,0.14);
  font-family:'Inter',sans-serif;
  color:var(--ink);
  background:var(--ivory);
  min-height:100vh;
}
.team-dash h1, .team-dash h2, .team-dash h3{
  font-family:'Cormorant Garamond', serif;
}

/* ---------- HEADER ---------- */
.td-header{
  position:sticky; top:0; z-index:20;
  background:rgba(248,244,233,0.94);
  backdrop-filter:blur(6px);
  border-bottom:1px solid var(--line);
}
.td-header-inner{
  max-width:1200px; margin:0 auto;
  padding:14px 6vw;
  display:flex; align-items:center;
  justify-content:space-between; gap:16px;
  flex-wrap:wrap;
}
.td-brand{
  display:flex; align-items:center; gap:10px;
  text-decoration:none; color:var(--ink);
  font-family:'Cormorant Garamond',serif;
  font-size:1.25rem; font-weight:600;
}
.td-brand img{
  width:36px; height:36px; border-radius:50%;
  border:1.4px solid var(--gold);
  background:var(--paper); object-fit:contain;
  padding:2px;
}
.td-team-chip{
  display:flex; align-items:center; gap:10px;
  background:var(--paper); border:1px solid var(--line);
  border-radius:20px; padding:6px 14px;
  font-size:0.9rem;
}
.td-team-dot{
  width:10px; height:10px; border-radius:50%;
}
.td-team-score{
  color:var(--gold); font-weight:600;
  font-size:0.85rem;
}
.td-header-actions{
  display:flex; align-items:center; gap:14px;
}
.td-link{
  text-decoration:none; font-size:0.88rem;
  color:#3a4560; opacity:0.85;
}
.td-link:hover{ opacity:1; color:var(--maroon); }
.td-logout{
  padding:7px 14px;
  background:transparent;
  border:1px solid var(--line);
  border-radius:3px; font-family:inherit;
  font-size:0.85rem; color:var(--ink);
  cursor:pointer; transition:.15s;
}
.td-logout:hover{ background:var(--maroon); color:var(--ivory); border-color:var(--maroon); }

/* ---------- MAIN ---------- */
.td-main{
  max-width:1200px; margin:0 auto;
  padding:40px 6vw 80px;
}

/* ---------- HERO ---------- */
.td-hero{
  margin-bottom:36px;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:24px;
  flex-wrap:wrap;
}
.td-hero-text{ flex:1 1 400px; min-width:0; }
.td-eyebrow{
  font-size:0.82rem; font-weight:600;
  color:var(--maroon); letter-spacing:0.06em;
  text-transform:uppercase; margin:0 0 6px;
}
.td-hero h1{
  font-size:clamp(1.9rem,4vw,2.6rem);
  font-weight:600; margin:0 0 8px;
  line-height:1.15;
}
.td-sub{ color:#5a6380; font-size:0.95rem; margin:0; max-width:520px; }

/* ---------- SCAN QR BUTTON ---------- */
.td-scan-btn{
  display:inline-flex;
  align-items:center;
  gap:10px;
  padding:13px 24px;
  background:transparent;
  color:var(--ink);
  border:1.5px solid var(--ink);
  border-radius:2px;
  font-family:inherit;
  font-size:0.92rem;
  font-weight:500;
  letter-spacing:0.01em;
  cursor:pointer;
  transition:all .25s ease;
  white-space:nowrap;
  align-self:flex-start;
  margin-top:6px;
}
.td-scan-btn:hover{
  background:var(--ink);
  color:var(--ivory);
  transform:translateY(-1px);
  box-shadow:0 8px 24px rgba(27,42,74,0.18);
}
.td-scan-btn:active{
  transform:translateY(0);
  box-shadow:0 4px 12px rgba(27,42,74,0.12);
}
.td-scan-icon{
  flex-shrink:0;
  transition:transform .25s ease;
}
.td-scan-btn:hover .td-scan-icon{
  transform:rotate(-4deg) scale(1.05);
}

@media (max-width:640px){
  .td-hero{
    flex-direction:column;
    align-items:stretch;
  }
  .td-scan-btn{
    width:100%;
    justify-content:center;
    align-self:stretch;
  }
}

/* ---------- GRID ---------- */
.td-grid{
  display:grid; grid-template-columns:1fr 320px; gap:24px;
}
@media (max-width:900px){
  .td-grid{ grid-template-columns:1fr; }
}

/* ---------- TASKS ---------- */
.td-tasks{
  background:var(--paper);
  border:1px solid var(--line);
  border-radius:6px;
  padding:24px;
}
.td-tasks h2{
  font-size:1.5rem; font-weight:600;
  margin:0 0 18px;
}
.td-empty{
  color:#7b8399; font-style:italic; margin:0;
}
.td-empty.small{ font-size:0.85rem; }
.td-task-list{ list-style:none; margin:0; padding:0; }

.td-task{
  display:grid; grid-template-columns:1fr auto;
  gap:20px;
  padding:20px 0;
  border-bottom:1px solid rgba(27,42,74,0.08);
  align-items:center;
}
.td-task:last-child{ border-bottom:none; }
.td-task-head{
  display:flex; align-items:center; gap:10px;
  margin-bottom:8px;
  flex-wrap:wrap;
}
.td-task-badge{
  font-size:0.72rem; font-weight:600;
  padding:3px 10px; border-radius:10px;
  text-transform:uppercase; letter-spacing:0.04em;
}
.td-task-badge.todo{ background:#F8F4E9; color:#7b8399; }
.td-task-badge.pending{ background:#FFF4D6; color:#8a6d10; }
.td-task-badge.approved{ background:#E3F3E5; color:#2e7d32; }
.td-task-badge.rejected{ background:#FBE4E4; color:#b23b3b; }
.td-task-type{
  font-size:0.7rem; color:#7b8399;
  text-transform:uppercase; letter-spacing:0.06em;
  padding:2px 8px; border-radius:8px;
  background:#F8F4E9;
  font-weight:600;
}
.td-task-type.progress{
  background:#F0E5FF; color:#6b3fa0;
}
.td-task-type.multi{
  background:#E5F0FF; color:#2c5da0;
}
.td-task-type.video{
  background:#FFE5E5; color:#a02c2c;
}
.td-task h3{
  font-size:1.15rem; font-weight:600;
  margin:0 0 6px;
}
.td-task-desc{
  font-size:0.9rem; color:#3a4560;
  margin:0 0 6px;
  white-space:pre-line;
  max-height:200px; overflow-y:auto;
  padding-right:6px;
  line-height:1.5;
}
.td-task-loc{
  font-size:0.85rem; color:#5a6380;
  margin:0 0 10px;
}
.td-task-note{
  background:#F8F4E9; padding:8px 12px;
  border-radius:3px; font-size:0.85rem;
  color:#3a4560; margin:10px 0 0;
}
.td-progress-info{
  font-size:0.82rem;
  color:#B8912F; font-weight:600;
  margin:10px 0 0;
}

/* Legacy single-file proof */
.td-task-proof img{
  max-width:180px; max-height:180px;
  border-radius:4px; border:1px solid var(--line);
  margin-top:10px;
}

/* Multi-file grid */
.td-task-files{
  display:flex; flex-wrap:wrap; gap:8px;
  margin-top:10px;
}
.td-task-file{
  display:block;
  width:70px; height:70px;
  border-radius:4px;
  overflow:hidden;
  border:1px solid var(--line);
  position:relative;
  background:#000;
}
.td-task-file img{
  width:100%; height:100%;
  object-fit:cover;
}
.td-task-video-badge{
  width:100%; height:100%;
  display:flex; align-items:center; justify-content:center;
  background:#1B2A4A;
  color:#F8F4E9;
  font-size:0.7rem;
  text-align:center;
  padding:4px;
}
.td-task-file-label{
  position:absolute; bottom:0; left:0; right:0;
  background:rgba(0,0,0,0.7);
  color:#fff; font-size:0.62rem;
  padding:2px 4px;
  text-align:center;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

.td-task-side{
  display:flex; flex-direction:column;
  align-items:flex-end; gap:10px;
}
.td-task-pts{
  text-align:right; line-height:1;
}
.td-task-pts-num{
  font-family:'Cormorant Garamond', serif;
  font-size:1.6rem; font-weight:600;
  color:var(--gold);
}
.td-task-pts-lbl{
  display:block; font-size:0.65rem;
  color:#7b8399; text-transform:uppercase;
  letter-spacing:0.05em; margin-top:2px;
}
.td-task-btn{
  padding:9px 18px;
  background:var(--ink); color:var(--ivory);
  border:none; border-radius:3px;
  font-family:inherit; font-size:0.88rem;
  cursor:pointer; transition:.15s;
  white-space:nowrap;
}
.td-task-btn:hover:not(:disabled){ background:var(--maroon); }
.td-task-btn.ghost{
  background:transparent; color:#7b8399;
  border:1px solid var(--line);
  cursor:not-allowed;
}
.td-task-approved{
  color:#2e7d32; font-weight:600;
  font-family:'Cormorant Garamond', serif;
  font-size:1.2rem;
}

/* ---------- LEADERBOARD ---------- */
.td-lb{
  background:var(--ink); color:var(--ivory);
  border-radius:6px; padding:22px;
  height:fit-content;
  position:sticky; top:90px;
}
.td-lb h2{
  font-size:1.4rem; font-weight:600;
  margin:0 0 16px;
}
.td-lb-list{
  list-style:none; padding:0; margin:0;
  display:flex; flex-direction:column; gap:4px;
}
.td-lb-item{
  display:grid; grid-template-columns:36px 12px 1fr auto;
  align-items:center; gap:10px;
  padding:10px 0;
  border-bottom:1px solid rgba(248,244,233,0.08);
}
.td-lb-item:last-child{ border-bottom:none; }
.td-lb-item.me{
  background:rgba(184,145,47,0.12);
  margin:0 -12px; padding:10px 12px;
  border-radius:4px;
  border-bottom-color:transparent;
}
.td-lb-rank{
  font-family:'Cormorant Garamond', serif;
  font-size:1rem; opacity:0.7;
}
.td-lb-dot{ width:10px; height:10px; border-radius:50%; }
.td-lb-name{ font-size:0.92rem; }
.td-lb-score{
  font-family:'Cormorant Garamond', serif;
  font-size:1.3rem; font-weight:600;
  color:var(--gold);
}
.td-refresh{
  width:100%; margin-top:16px;
  padding:9px;
  background:rgba(248,244,233,0.1);
  border:1px solid rgba(248,244,233,0.2);
  color:var(--ivory); border-radius:3px;
  font-family:inherit; font-size:0.85rem;
  cursor:pointer; transition:.15s;
}
.td-refresh:hover{ background:rgba(248,244,233,0.18); }
`;