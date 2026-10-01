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

  const [progress, setProgress] = useState({
    chaosUnlocked: false,
    chaosStartedAt: null,
  });

  const [marking, setMarking] = useState(false);

  const loadAux = async () => {
    try {
      const { data: ev } = await api.get(`/events/${slug}`);
      setEvent(ev);
      const { data: lb } = await api.get(
        `/submissions/leaderboard/${ev._id}`
      );
      setLeaderboard(lb);

      const { data: me } = await api.get("/teams/me");
      if (me.progress) setProgress(me.progress);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAux();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const submissionByTask = useMemo(() => {
    const m = {};
    for (const s of submissions) {
      const key = s.taskId?._id || s.taskId;
      const existing = m[key];
      if (!existing || new Date(s.createdAt) > new Date(existing.createdAt)) {
        m[key] = s;
      }
    }
    return m;
  }, [submissions]);

  const completedCount = useMemo(() => {
    const approved = new Set();
    for (const s of submissions) {
      if (s.status === "approved") approved.add(s.taskId?._id || s.taskId);
    }
    return approved.size;
  }, [submissions]);

  const task1 = useMemo(
    () => tasks.find((t) => t.group === "early-bird"),
    [tasks]
  );
  const chaosIntro = useMemo(
    () => tasks.find((t) => t.group === "chaos-challenges" && t.isGroupIntro),
    [tasks]
  );
  const challenges = useMemo(
    () =>
      tasks
        .filter((t) => t.group === "chaos-challenges" && !t.isGroupIntro)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [tasks]
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

  const startChaos = async () => {
    if (marking) return;
    setMarking(true);
    try {
      await api.put("/teams/me/start-chaos");
      await refresh();
      await loadAux();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to start");
    } finally {
      setMarking(false);
    }
  };

  const approvedChallenges = challenges.filter(
    (t) => submissionByTask[t._id]?.status === "approved"
  ).length;

  return (
    <div className="team-dash">
      <style>{css}</style>

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

      <main className="td-main">
        <div className="td-hero">
          <div className="td-hero-text">
            <p className="td-eyebrow">{event?.title || "Team Portal"}</p>
            <h1>Hello, {team?.name}</h1>
            <p className="td-sub">
              {completedCount} completed · {approvedChallenges} of{" "}
              {challenges.length || 18} challenges approved ·{" "}
              {team?.totalScore || 0} points earned.
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
          <section className="td-tasks">
            {/* TASK 1 */}
            {task1 && (
              <div className="td-group td-group-task1 completed">
                <div className="td-group-head">
                  <span className="td-group-label">Task 1</span>
                  <span className="td-group-status done">Info</span>
                </div>

                <h2 className="td-group-title">{task1.title}</h2>
                <div className="td-task-desc">{task1.description}</div>

                <div className="td-info-note">
                  ℹ️ This task is informational. Points will be awarded by the
                  organisers based on attendance.
                </div>
              </div>
            )}

            {/* TASK 2 — only if unlocked by admin */}
            {chaosIntro && progress.chaosUnlocked && (
              <div
                className={`td-group td-group-task2${
                  progress.chaosStartedAt ? " started" : ""
                }`}
              >
                <div className="td-group-head">
                  <span className="td-group-label">Task 2</span>
                  <span
                    className={`td-group-status ${
                      progress.chaosStartedAt ? "started" : "ready"
                    }`}
                  >
                    {progress.chaosStartedAt
                      ? `In progress (${approvedChallenges}/${challenges.length})`
                      : "Ready to start"}
                  </span>
                </div>

                <h2 className="td-group-title">{chaosIntro.title}</h2>
                <div className="td-task-desc">{chaosIntro.description}</div>

                {!progress.chaosStartedAt && (
                  <button
                    className="td-primary-btn large"
                    onClick={startChaos}
                    disabled={marking}
                  >
                    {marking ? "Starting…" : "🚀 Start Challenges"}
                  </button>
                )}

                {progress.chaosStartedAt && (
                  <>
                    <p className="td-group-done-note">
                      ✓ Started — completing challenges below in order
                    </p>

                    <ul className="td-challenge-list">
                      {challenges.map((t, idx) => {
                        const sub = submissionByTask[t._id];
                        const status = sub?.status || "todo";
                        const isProgress = t.submissionType === "progress";
                        const isLocked = t.locked === true;
                        const isInfoOnly = t.submittable === false;

                        if (isLocked) {
                          return (
                            <li
                              key={t._id}
                              className="td-challenge locked"
                            >
                              <div className="td-challenge-num">
                                {String(idx + 1).padStart(2, "0")}
                              </div>
                              <div className="td-challenge-locked-body">
                                <strong>Challenge {idx + 1}</strong>
                                <span className="td-challenge-locked-hint">
                                  🔒 Complete the previous challenge to unlock
                                </span>
                              </div>
                            </li>
                          );
                        }

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
                          <li
                            key={t._id}
                            className={`td-challenge td-challenge-${status}`}
                          >
                            <div className="td-challenge-num">
                              {String(idx + 1).padStart(2, "0")}
                            </div>

                            <div className="td-challenge-body">
                              <div className="td-task-head">
                                <span
                                  className={`td-task-badge ${
                                    isInfoOnly ? "info" : status
                                  }`}
                                >
                                  {isInfoOnly
                                    ? "Info"
                                    : isProgress && approvedForTask > 0
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
                                  <span className="td-task-type progress">
                                    progress
                                  </span>
                                )}
                                {!isProgress &&
                                  t.submissionType === "multi" && (
                                    <span className="td-task-type multi">
                                      multi ({t.maxFiles || "?"})
                                    </span>
                                  )}
                                {t.allowVideo && (
                                  <span className="td-task-type video">
                                    video
                                  </span>
                                )}
                              </div>

                              <h3>{t.title}</h3>
                              {t.description && (
                                <p className="td-task-desc">
                                  {t.description}
                                </p>
                              )}
                              {t.location && (
                                <p className="td-task-loc">
                                  📍 {t.location}
                                </p>
                              )}

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
                                        <div className="td-task-video-badge">
                                          ▶ video
                                        </div>
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

                              {sub?.proof && !sub?.files?.length && (
                                <a
                                  href={imgUrl(sub.proof)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="td-task-proof"
                                >
                                  <img
                                    src={imgUrl(sub.proof)}
                                    alt="proof"
                                  />
                                </a>
                              )}

                              {sub?.note && (
                                <p className="td-task-note">
                                  📝 {sub.note}
                                </p>
                              )}

                              {isProgress &&
                                (approvedForTask > 0 ||
                                  pendingForTask > 0) && (
                                  <p className="td-progress-info">
                                    ✓ {approvedForTask} approved
                                    {pendingForTask > 0 &&
                                      ` · ⏳ ${pendingForTask} pending`}
                                    {t.pointsPerItem > 0 &&
                                      ` · each = ${t.pointsPerItem} pts`}
                                  </p>
                                )}
                            </div>

                            <div className="td-challenge-side">
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

                              {isInfoOnly ? (
                                <div className="td-task-info-badge">
                                  📢 Info
                                </div>
                              ) : isProgress ? (
                                <button
                                  className="td-task-btn"
                                  onClick={() => setActiveTask(t)}
                                >
                                  + Submit another
                                </button>
                              ) : status === "todo" ||
                                status === "rejected" ? (
                                <button
                                  className="td-task-btn"
                                  onClick={() => setActiveTask(t)}
                                >
                                  {status === "rejected"
                                    ? "Resubmit"
                                    : "Submit"}
                                </button>
                              ) : status === "pending" ? (
                                <button
                                  className="td-task-btn ghost"
                                  disabled
                                >
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
                  </>
                )}
              </div>
            )}

            {/* Nothing to show yet */}
            {!task1 && !progress.chaosUnlocked && (
              <div className="td-empty-state">
                <p>No tasks available yet. Check back soon.</p>
              </div>
            )}

            {task1 && !progress.chaosUnlocked && (
              <div className="td-coming-soon">
                <p>
                  🔒 <strong>Task 2 will be unlocked on Day 2</strong>
                </p>
                <p className="td-coming-soon-sub">
                  Check back later — organisers will announce when it's live.
                </p>
              </div>
            )}
          </section>

          {/* LEADERBOARD */}
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
.td-team-dot{ width:10px; height:10px; border-radius:50%; }
.td-team-score{ color:var(--gold); font-weight:600; font-size:0.85rem; }
.td-header-actions{ display:flex; align-items:center; gap:14px; }
.td-link{
  text-decoration:none; font-size:0.88rem;
  color:#3a4560; opacity:0.85;
}
.td-link:hover{ opacity:1; color:var(--maroon); }
.td-logout{
  padding:7px 14px; background:transparent;
  border:1px solid var(--line); border-radius:3px;
  font-family:inherit; font-size:0.85rem;
  color:var(--ink); cursor:pointer; transition:.15s;
}
.td-logout:hover{ background:var(--maroon); color:var(--ivory); border-color:var(--maroon); }

.td-main{ max-width:1200px; margin:0 auto; padding:40px 6vw 80px; }

.td-hero{
  margin-bottom:36px;
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:24px; flex-wrap:wrap;
}
.td-hero-text{ flex:1 1 400px; min-width:0; }
.td-eyebrow{
  font-size:0.82rem; font-weight:600;
  color:var(--maroon); letter-spacing:0.06em;
  text-transform:uppercase; margin:0 0 6px;
}
.td-hero h1{
  font-size:clamp(1.9rem,4vw,2.6rem);
  font-weight:600; margin:0 0 8px; line-height:1.15;
}
.td-sub{ color:#5a6380; font-size:0.95rem; margin:0; max-width:520px; }

.td-scan-btn{
  display:inline-flex; align-items:center; gap:10px;
  padding:13px 24px; background:transparent; color:var(--ink);
  border:1.5px solid var(--ink); border-radius:2px;
  font-family:inherit; font-size:0.92rem; font-weight:500;
  cursor:pointer; transition:all .25s ease;
  white-space:nowrap; align-self:flex-start; margin-top:6px;
}
.td-scan-btn:hover{
  background:var(--ink); color:var(--ivory);
  transform:translateY(-1px);
  box-shadow:0 8px 24px rgba(27,42,74,0.18);
}
.td-scan-icon{ flex-shrink:0; transition:transform .25s ease; }
.td-scan-btn:hover .td-scan-icon{ transform:rotate(-4deg) scale(1.05); }

@media (max-width:640px){
  .td-hero{ flex-direction:column; align-items:stretch; }
  .td-scan-btn{ width:100%; justify-content:center; align-self:stretch; }
}

.td-grid{
  display:grid; grid-template-columns:1fr 320px; gap:24px;
  align-items:start;
}
@media (max-width:900px){ .td-grid{ grid-template-columns:1fr; } }

.td-tasks{ display:flex; flex-direction:column; gap:24px; }

.td-group{
  background:var(--paper); border:1px solid var(--line);
  border-radius:8px; padding:26px;
}
.td-group-task1{
  border-left:5px solid var(--gold);
  background:linear-gradient(90deg, rgba(184,145,47,0.04), transparent 40%);
}
.td-group-task2{ border-left:5px solid var(--maroon); }
.td-group-task2.started{
  border-left-color:#6b3fa0;
  background:linear-gradient(90deg, rgba(107,63,160,0.04), transparent 40%);
}

.td-group-head{
  display:flex; align-items:center; justify-content:space-between;
  gap:10px; margin-bottom:14px; flex-wrap:wrap;
}
.td-group-label{
  font-size:0.75rem; font-weight:700;
  letter-spacing:0.12em; text-transform:uppercase;
  color:var(--gold);
}
.td-group-status{
  font-size:0.75rem; font-weight:600;
  padding:4px 12px; border-radius:20px;
  letter-spacing:0.03em;
}
.td-group-status.pending{ background:#FFF4D6; color:#8a6d10; }
.td-group-status.done{ background:#E3F3E5; color:#2e7d32; }
.td-group-status.ready{ background:#F0E5FF; color:#6b3fa0; }
.td-group-status.started{ background:#E5F0FF; color:#2c5da0; }

.td-group-title{
  font-size:1.5rem; font-weight:600;
  margin:0 0 12px; line-height:1.2;
}
.td-group .td-task-desc{
  font-size:0.94rem; color:#3a4560;
  line-height:1.65; white-space:pre-line;
  margin:0 0 20px;
  max-width:100%; max-height:none;
  overflow:visible; padding-right:0;
}

.td-primary-btn{
  display:inline-block; padding:12px 28px;
  background:var(--ink); color:var(--ivory);
  border:none; border-radius:4px;
  font-family:inherit; font-size:0.95rem; font-weight:600;
  cursor:pointer; transition:.2s;
}
.td-primary-btn:hover:not(:disabled){
  background:var(--maroon);
  transform:translateY(-1px);
  box-shadow:0 6px 20px rgba(27,42,74,0.2);
}
.td-primary-btn:disabled{ opacity:0.6; cursor:wait; }
.td-primary-btn.large{ padding:14px 36px; font-size:1.05rem; }

.td-info-note{
  background:#E5F0FF;
  color:#2c5da0;
  padding:12px 16px;
  border-radius:4px;
  font-size:0.88rem;
  line-height:1.5;
  border-left:3px solid #2c5da0;
  margin-top:8px;
}

.td-group-done-note{
  font-size:0.88rem; color:#2e7d32; font-weight:500;
  margin:0 0 16px; padding:10px 14px;
  background:rgba(46,125,50,0.08); border-radius:4px;
}

.td-coming-soon{
  background:#F8F4E9;
  border:1px dashed rgba(184,145,47,0.4);
  padding:26px;
  border-radius:6px;
  text-align:center;
}
.td-coming-soon p{
  margin:0 0 6px;
  color:#1B2A4A;
  font-size:1rem;
}
.td-coming-soon-sub{
  font-size:0.85rem !important;
  color:#7b8399 !important;
  font-style:italic;
}

.td-empty-state{
  background:#FFFDF8;
  border:1px dashed rgba(27,42,74,0.2);
  padding:40px;
  border-radius:6px;
  text-align:center;
  color:#7b8399;
}

.td-challenge-list{
  list-style:none; margin:12px 0 0; padding:0;
  display:flex; flex-direction:column; gap:14px;
}

.td-challenge{
  display:grid;
  grid-template-columns:56px 1fr auto;
  gap:16px; padding:20px;
  background:#fff;
  border:1px solid var(--line);
  border-radius:6px;
  align-items:flex-start;
}
.td-challenge-num{
  font-family:'Cormorant Garamond', serif;
  font-size:1.8rem; font-weight:600;
  color:var(--gold); line-height:1; padding-top:2px;
}
.td-challenge-body{ min-width:0; }
.td-challenge-side{
  display:flex; flex-direction:column;
  align-items:flex-end; gap:10px;
  min-width:90px;
}

.td-challenge.locked{
  opacity:0.55; background:#F8F4E9;
  border-style:dashed; align-items:center;
}
.td-challenge-locked-body{
  display:flex; flex-direction:column; gap:4px;
}
.td-challenge-locked-body strong{
  font-size:1rem; color:#3a4560;
}
.td-challenge-locked-hint{
  font-size:0.82rem; color:#7b8399; font-style:italic;
}

.td-challenge-approved{ border-left:4px solid #2e7d32; }
.td-challenge-pending{ border-left:4px solid var(--gold); }
.td-challenge-rejected{ border-left:4px solid #b23b3b; }

.td-challenge .td-task-head{
  display:flex; align-items:center; gap:10px;
  margin-bottom:8px; flex-wrap:wrap;
}
.td-challenge .td-task-badge{
  font-size:0.72rem; font-weight:600;
  padding:3px 10px; border-radius:10px;
  text-transform:uppercase; letter-spacing:0.04em;
}
.td-challenge .td-task-badge.todo{ background:#F8F4E9; color:#7b8399; }
.td-challenge .td-task-badge.pending{ background:#FFF4D6; color:#8a6d10; }
.td-challenge .td-task-badge.approved{ background:#E3F3E5; color:#2e7d32; }
.td-challenge .td-task-badge.rejected{ background:#FBE4E4; color:#b23b3b; }
.td-challenge .td-task-badge.info{ background:#E5F0FF; color:#2c5da0; }

.td-challenge .td-task-type{
  font-size:0.7rem; color:#7b8399;
  text-transform:uppercase; letter-spacing:0.06em;
  padding:2px 8px; border-radius:8px;
  background:#F8F4E9; font-weight:600;
}
.td-challenge .td-task-type.progress{ background:#F0E5FF; color:#6b3fa0; }
.td-challenge .td-task-type.multi{ background:#E5F0FF; color:#2c5da0; }
.td-challenge .td-task-type.video{ background:#FFE5E5; color:#a02c2c; }

.td-challenge h3{ font-size:1.15rem; font-weight:600; margin:0 0 8px; }
.td-challenge .td-task-desc{
  font-size:0.9rem; color:#3a4560;
  margin:0 0 8px; white-space:pre-line;
  line-height:1.55;
  max-height:180px; overflow-y:auto;
  padding-right:6px;
}
.td-challenge .td-task-loc{
  font-size:0.85rem; color:#5a6380; margin:0 0 10px;
}
.td-challenge .td-task-note{
  background:#F8F4E9; padding:8px 12px;
  border-radius:3px; font-size:0.85rem;
  color:#3a4560; margin:10px 0 0;
}
.td-challenge .td-progress-info{
  font-size:0.82rem; color:var(--gold);
  font-weight:600; margin:10px 0 0;
}
.td-challenge .td-task-proof img{
  max-width:180px; max-height:180px;
  border-radius:4px; border:1px solid var(--line);
  margin-top:10px;
}

.td-challenge .td-task-files{
  display:flex; flex-wrap:wrap; gap:8px;
  margin-top:10px;
}
.td-challenge .td-task-file{
  display:block; width:70px; height:70px;
  border-radius:4px; overflow:hidden;
  border:1px solid var(--line);
  position:relative; background:#000;
}
.td-challenge .td-task-file img{
  width:100%; height:100%; object-fit:cover;
}
.td-challenge .td-task-video-badge{
  width:100%; height:100%;
  display:flex; align-items:center; justify-content:center;
  background:var(--ink); color:var(--ivory);
  font-size:0.7rem; text-align:center; padding:4px;
}
.td-challenge .td-task-file-label{
  position:absolute; bottom:0; left:0; right:0;
  background:rgba(0,0,0,0.7);
  color:#fff; font-size:0.62rem;
  padding:2px 4px; text-align:center;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

.td-challenge .td-task-pts{ text-align:right; line-height:1; }
.td-challenge .td-task-pts-num{
  font-family:'Cormorant Garamond', serif;
  font-size:1.6rem; font-weight:600; color:var(--gold);
}
.td-challenge .td-task-pts-lbl{
  display:block; font-size:0.65rem;
  color:#7b8399; text-transform:uppercase;
  letter-spacing:0.05em; margin-top:2px;
}
.td-challenge .td-task-btn{
  padding:9px 18px; background:var(--ink); color:var(--ivory);
  border:none; border-radius:3px;
  font-family:inherit; font-size:0.88rem;
  cursor:pointer; transition:.15s;
  white-space:nowrap;
}
.td-challenge .td-task-btn:hover:not(:disabled){ background:var(--maroon); }
.td-challenge .td-task-btn.ghost{
  background:transparent; color:#7b8399;
  border:1px solid var(--line); cursor:not-allowed;
}
.td-challenge .td-task-approved{
  color:#2e7d32; font-weight:600;
  font-family:'Cormorant Garamond', serif;
  font-size:1.2rem;
}
.td-challenge .td-task-info-badge{
  display:inline-block; padding:9px 16px;
  background:#E5F0FF; color:#2c5da0;
  border-radius:3px;
  font-size:0.82rem; font-weight:600;
  white-space:nowrap;
}

@media (max-width:640px){
  .td-group{ padding:20px; }
  .td-challenge{
    grid-template-columns:40px 1fr;
    grid-template-areas:
      "num body"
      "side side";
    gap:12px; padding:16px;
  }
  .td-challenge-num{ grid-area:num; font-size:1.4rem; }
  .td-challenge-body{ grid-area:body; }
  .td-challenge-side{
    grid-area:side;
    flex-direction:row;
    justify-content:space-between;
    align-items:center;
    width:100%; padding-top:12px;
    border-top:1px solid rgba(27,42,74,0.08);
  }
  .td-primary-btn.large{ width:100%; padding:14px 20px; }
}

.td-lb{
  background:var(--ink); color:var(--ivory);
  border-radius:6px; padding:22px;
  height:fit-content; position:sticky; top:90px;
}
.td-lb h2{ font-size:1.4rem; font-weight:600; margin:0 0 16px; }
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
  border-radius:4px; border-bottom-color:transparent;
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
  width:100%; margin-top:16px; padding:9px;
  background:rgba(248,244,233,0.1);
  border:1px solid rgba(248,244,233,0.2);
  color:var(--ivory); border-radius:3px;
  font-family:inherit; font-size:0.85rem;
  cursor:pointer; transition:.15s;
}
.td-refresh:hover{ background:rgba(248,244,233,0.18); }
.td-empty{ color:#7b8399; font-style:italic; margin:0; }
.td-empty.small{ font-size:0.85rem; }
`;