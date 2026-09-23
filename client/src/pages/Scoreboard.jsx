import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";

const REFRESH_MS = 3000;

export default function Scoreboard() {
  const { slug } = useParams();

  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  /* Track previous positions + scores for animation */
  const prevRef = useRef({});

  /* ---------- LOAD EVENT ONCE ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/events/${slug}`);
        setEvent(data);
      } catch (e) {
        setError("Event not found");
        setLoading(false);
      }
    })();
  }, [slug]);

  /* ---------- POLL LEADERBOARD ---------- */
  useEffect(() => {
    if (!event) return;

    let cancelled = false;

    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get(
          `/submissions/leaderboard/${event._id}`
        );
        if (cancelled) return;
        setTeams(data);
        setLastUpdated(new Date());
        setLoading(false);
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    };

    fetchLeaderboard();
    const id = setInterval(fetchLeaderboard, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [event]);

  /* ---------- FULLSCREEN ---------- */
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch (e) {
      console.warn("Fullscreen not supported", e);
    }
  };

  /* Sync state if user exits fullscreen via Esc */
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* ---------- ANIMATION SNAPSHOT ---------- */
  /* Compute per-team movement & score delta vs previous fetch */
  const enriched = teams.map((t, i) => {
    const prev = prevRef.current[t._id] || {};
    const prevRank = prev.rank ?? i + 1;
    const prevScore = prev.score ?? t.totalScore;
    return {
      ...t,
      rank: i + 1,
      rankDelta: prevRank - (i + 1), // +1 = moved up, -1 = moved down
      scoreDelta: t.totalScore - prevScore,
      isNew: prev.rank === undefined,
    };
  });

  /* Save for next comparison */
  useEffect(() => {
    const snap = {};
    teams.forEach((t, i) => {
      snap[t._id] = { rank: i + 1, score: t.totalScore };
    });
    prevRef.current = snap;
  }, [teams]);

  /* ---------- RENDER ---------- */
  if (loading) {
    return (
      <div className="sb-loading">
        <style>{css}</style>
        Loading scoreboard…
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="sb-loading">
        <style>{css}</style>
        <h1>{error || "Event not found"}</h1>
        <Link to="/" className="sb-back">← Back to home</Link>
      </div>
    );
  }

  const topScore = teams[0]?.totalScore || 0;

  return (
    <div className="scoreboard">
      <style>{css}</style>

      {/* ---------- HEADER ---------- */}
      <header className="sb-head">
        <div className="sb-head-left">
          <span className={`sb-status ${event.status}`}>
            {event.status === "ongoing" ? "● LIVE" : "UPCOMING"}
          </span>
          <div className="sb-title-wrap">
            <h1>{event.title}</h1>
            <p className="sb-meta">
              {event.when} · {event.place}
            </p>
          </div>
        </div>

        <div className="sb-head-right">
          <div className="sb-updated">
            <span className="sb-pulse" />
            Live · updated{" "}
            {lastUpdated
              ? lastUpdated.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "—"}
          </div>
          <button
            className="sb-fullscreen"
            onClick={toggleFullscreen}
            title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {fullscreen ? "⤡ Exit" : "⤢ Fullscreen"}
          </button>
        </div>
      </header>

      {/* ---------- LEADERBOARD ---------- */}
      <main className="sb-main">
        {teams.length === 0 ? (
          <div className="sb-empty">
            <p>No teams yet.</p>
            <p className="sb-empty-sub">
              Teams will appear here as soon as they score.
            </p>
          </div>
        ) : (
          <ol className="sb-list">
            {enriched.map((t) => (
              <li
                key={t._id}
                className={`sb-row${
                  t.rank === 1 ? " first" : ""
                }${t.rankDelta > 0 ? " moved-up" : ""}${
                  t.rankDelta < 0 ? " moved-down" : ""
                }`}
              >
                {/* Rank */}
                <div className="sb-rank">
                  <span className="sb-rank-num">{t.rank}</span>
                  {t.rankDelta !== 0 && !t.isNew && (
                    <span
                      className={`sb-rank-delta ${
                        t.rankDelta > 0 ? "up" : "down"
                      }`}
                    >
                      {t.rankDelta > 0 ? "▲" : "▼"}
                      {Math.abs(t.rankDelta)}
                    </span>
                  )}
                </div>

                {/* Team name + color */}
                <div className="sb-team">
                  <span
                    className="sb-team-dot"
                    style={{ background: t.color || "#B8912F" }}
                  />
                  <span className="sb-team-name">{t.name}</span>
                </div>

                {/* Score */}
                <div className="sb-score">
                  <span
                    className={`sb-score-num${
                      t.scoreDelta > 0 ? " flash" : ""
                    }`}
                  >
                    {t.totalScore}
                  </span>
                  {t.scoreDelta > 0 && !t.isNew && (
                    <span className="sb-score-delta">
                      +{t.scoreDelta}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="sb-bar">
                  <div
                    className="sb-bar-fill"
                    style={{
                      width: `${
                        topScore > 0 ? (t.totalScore / topScore) * 100 : 0
                      }%`,
                      background: t.color || "#B8912F",
                    }}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="sb-foot">
        <span>SLUCSM</span>
        <span className="sb-dot">·</span>
        <span>Auto-refreshing every {REFRESH_MS / 1000}s</span>
        <span className="sb-dot">·</span>
        <Link to={`/events/live/${slug}`} className="sb-link">
          Back to event →
        </Link>
      </footer>
    </div>
  );
}

/* ============================================================
   CSS
   ============================================================ */
const css = `
html, body, #root{
  margin:0; padding:0; width:100%; overflow-x:hidden;
}
*, *::before, *::after{ box-sizing:border-box; }

/* ---------- LOADING ---------- */
.sb-loading{
  min-height:100vh;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:#0d1424; color:#F8F4E9;
  font-family:'Inter',sans-serif;
  font-size:1.2rem;
  gap:16px;
}
.sb-back{
  color:#B8912F; text-decoration:none; font-size:0.95rem;
  border-bottom:1px solid transparent;
}
.sb-back:hover{ border-color:#B8912F; }

/* ---------- MAIN ---------- */
.scoreboard{
  --ink:#1B2A4A;
  --ivory:#F8F4E9;
  --gold:#B8912F;
  --maroon:#6E2C2C;
  --paper:#FFFDF8;
  --line:rgba(248,244,233,0.08);

  min-height:100vh;
  background:
    radial-gradient(circle at 50% 0%, rgba(184,145,47,0.08), transparent 50%),
    linear-gradient(180deg, #0d1424, #131c30 70%, #0d1424);
  color:var(--ivory);
  font-family:'Inter',sans-serif;
  display:flex; flex-direction:column;
  padding:28px 4vw 20px;
}

.scoreboard h1, .scoreboard h2{
  font-family:'Cormorant Garamond', serif;
}

/* ---------- HEADER ---------- */
.sb-head{
  display:flex; justify-content:space-between;
  align-items:flex-start;
  gap:20px;
  padding-bottom:20px;
  border-bottom:1px solid var(--line);
  margin-bottom:24px;
  flex-wrap:wrap;
}
.sb-head-left{ display:flex; align-items:center; gap:20px; }
.sb-head-right{
  display:flex; align-items:center; gap:16px;
  flex-wrap:wrap;
}

.sb-status{
  display:inline-block;
  font-size:0.78rem;
  font-weight:700;
  letter-spacing:0.1em;
  padding:6px 14px;
  border-radius:20px;
  white-space:nowrap;
}
.sb-status.ongoing{
  background:#b23b3b; color:#fff;
  animation:pulseLive 2s ease-in-out infinite;
}
.sb-status.upcoming{
  background:var(--gold); color:#fff;
}
@keyframes pulseLive{
  0%, 100% { box-shadow:0 0 0 0 rgba(178,59,59,0.5); }
  50%      { box-shadow:0 0 0 10px rgba(178,59,59,0); }
}

.sb-title-wrap h1{
  font-size:clamp(1.8rem, 3.6vw, 2.6rem);
  font-weight:600; margin:0 0 4px;
  line-height:1.1;
}
.sb-meta{
  font-size:0.9rem; color:rgba(248,244,233,0.65);
  margin:0;
}

.sb-updated{
  display:flex; align-items:center; gap:8px;
  font-size:0.85rem;
  color:rgba(248,244,233,0.65);
  background:rgba(248,244,233,0.05);
  padding:8px 14px;
  border-radius:20px;
}
.sb-pulse{
  width:8px; height:8px; border-radius:50%;
  background:#4ade80;
  animation:pulseDot 1.5s ease-in-out infinite;
}
@keyframes pulseDot{
  0%, 100% { opacity:1; transform:scale(1); }
  50%      { opacity:0.4; transform:scale(0.8); }
}

.sb-fullscreen{
  padding:9px 18px;
  background:transparent;
  color:var(--ivory);
  border:1px solid rgba(248,244,233,0.25);
  border-radius:4px;
  font-family:inherit; font-size:0.85rem;
  cursor:pointer;
  transition:.2s;
}
.sb-fullscreen:hover{
  background:var(--gold);
  border-color:var(--gold);
  color:#fff;
}

/* ---------- MAIN LIST ---------- */
.sb-main{ flex:1; display:flex; align-items:flex-start; }

.sb-list{
  list-style:none; padding:0; margin:0;
  display:flex; flex-direction:column;
  gap:14px;
  width:100%;
}

/* ---------- ROW ---------- */
.sb-row{
  display:grid;
  grid-template-columns:90px 1fr auto;
  grid-template-areas:
    "rank team score"
    "bar bar bar";
  gap:12px 20px;
  align-items:center;
  padding:20px 26px;
  background:rgba(248,244,233,0.035);
  border:1px solid var(--line);
  border-left:4px solid rgba(248,244,233,0.15);
  border-radius:8px;
  transition:
    transform .5s ease,
    background .3s ease,
    border-color .3s ease;
  position:relative;
}
.sb-row:hover{
  background:rgba(248,244,233,0.06);
}

/* Top rank — gold accent */
.sb-row.first{
  background:linear-gradient(90deg, rgba(184,145,47,0.14), rgba(184,145,47,0.04));
  border-left-color:var(--gold);
  box-shadow:0 0 30px rgba(184,145,47,0.08);
}

/* Movement flashes */
.sb-row.moved-up{
  animation:flashUp 2.4s ease-out;
}
.sb-row.moved-down{
  animation:flashDown 2.4s ease-out;
}
@keyframes flashUp{
  0%   { background:rgba(74,222,128,0.16); transform:translateX(4px); }
  40%  { background:rgba(74,222,128,0.08); transform:translateX(0); }
  100% { background:transparent; transform:translateX(0); }
}
@keyframes flashDown{
  0%   { background:rgba(239,68,68,0.14); transform:translateX(-4px); }
  40%  { background:rgba(239,68,68,0.06); transform:translateX(0); }
  100% { background:transparent; transform:translateX(0); }
}

/* ---------- RANK ---------- */
.sb-rank{
  grid-area:rank;
  display:flex; align-items:center; gap:10px;
}
.sb-rank-num{
  font-family:'Cormorant Garamond', serif;
  font-size:clamp(2rem, 4vw, 3.2rem);
  font-weight:600;
  line-height:1;
  color:rgba(248,244,233,0.55);
  min-width:60px;
}
.sb-row.first .sb-rank-num{
  color:var(--gold);
  text-shadow:0 0 20px rgba(184,145,47,0.5);
}
.sb-rank-delta{
  font-size:0.8rem;
  font-weight:700;
  padding:3px 7px;
  border-radius:6px;
  white-space:nowrap;
}
.sb-rank-delta.up{ background:rgba(74,222,128,0.16); color:#4ade80; }
.sb-rank-delta.down{ background:rgba(239,68,68,0.16); color:#f87171; }

/* ---------- TEAM ---------- */
.sb-team{
  grid-area:team;
  display:flex; align-items:center; gap:16px;
  min-width:0;
}
.sb-team-dot{
  width:16px; height:16px;
  border-radius:50%;
  flex-shrink:0;
  box-shadow:0 0 12px currentColor;
}
.sb-team-name{
  font-family:'Cormorant Garamond', serif;
  font-size:clamp(1.4rem, 2.6vw, 2.1rem);
  font-weight:600;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

/* ---------- SCORE ---------- */
.sb-score{
  grid-area:score;
  display:flex; align-items:baseline; gap:10px;
}
.sb-score-num{
  font-family:'Cormorant Garamond', serif;
  font-size:clamp(2.4rem, 5vw, 4rem);
  font-weight:600;
  line-height:1;
  color:var(--gold);
  min-width:110px;
  text-align:right;
  transition:color .3s;
}
.sb-score-num.flash{
  animation:scoreFlash 2s ease-out;
}
@keyframes scoreFlash{
  0%   { color:#fff; transform:scale(1.14); }
  30%  { color:#4ade80; transform:scale(1.06); }
  100% { color:var(--gold); transform:scale(1); }
}
.sb-score-delta{
  font-size:1rem;
  font-weight:600;
  color:#4ade80;
  animation:fadeUpOut 2.4s ease-out forwards;
}
@keyframes fadeUpOut{
  0%   { opacity:1; transform:translateY(0); }
  70%  { opacity:1; transform:translateY(-8px); }
  100% { opacity:0; transform:translateY(-14px); }
}

/* ---------- BAR ---------- */
.sb-bar{
  grid-area:bar;
  height:6px;
  background:rgba(248,244,233,0.06);
  border-radius:3px;
  overflow:hidden;
}
.sb-bar-fill{
  height:100%;
  border-radius:3px;
  transition:width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity:0.85;
}

/* ---------- EMPTY ---------- */
.sb-empty{
  text-align:center;
  padding:80px 20px;
  color:rgba(248,244,233,0.5);
  font-size:1.15rem;
  width:100%;
}
.sb-empty p{ margin:0 0 8px; }
.sb-empty-sub{ font-size:0.9rem !important; }

/* ---------- FOOTER ---------- */
.sb-foot{
  padding-top:20px;
  margin-top:24px;
  border-top:1px solid var(--line);
  display:flex; align-items:center; gap:10px;
  font-size:0.82rem;
  color:rgba(248,244,233,0.55);
  flex-wrap:wrap;
}
.sb-foot > span:first-child{
  font-family:'Cormorant Garamond', serif;
  font-size:1.05rem;
  font-weight:600;
  color:var(--gold);
  letter-spacing:0.05em;
}
.sb-dot{ opacity:0.4; }
.sb-link{
  margin-left:auto;
  color:var(--ivory);
  text-decoration:none;
  border-bottom:1px solid transparent;
  transition:.15s;
}
.sb-link:hover{
  color:var(--gold);
  border-color:var(--gold);
}

/* ---------- RESPONSIVE ---------- */
@media (max-width:640px){
  .sb-row{
    grid-template-columns:60px 1fr;
    grid-template-areas:
      "rank score"
      "team team"
      "bar bar";
    gap:10px;
    padding:16px 18px;
  }
  .sb-score{ justify-content:flex-end; }
  .sb-score-num{ min-width:0; }
  .sb-head-right{ width:100%; justify-content:space-between; }
  .sb-updated{ font-size:0.78rem; padding:6px 10px; }
}
`;