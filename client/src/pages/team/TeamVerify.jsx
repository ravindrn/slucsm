import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axios";

export default function TeamVerify() {
  const { code } = useParams();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [inactive, setInactive] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/teams/by-code/${code}`);
        setTeam(data);
      } catch (e) {
        if (e.response?.status === 403) setInactive(true);
        else setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  if (loading) {
    return (
      <div className="tv-loading">
        <style>{css}</style>
        Checking team…
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="tv-page">
        <style>{css}</style>
        <div className="tv-card error">
          <div className="tv-icon error">?</div>
          <h1>Team not found</h1>
          <p className="tv-sub">
            No team matches this code: <code>{code}</code>
          </p>
          <Link to="/" className="tv-btn primary">
            Go to home
          </Link>
        </div>
      </div>
    );
  }

  if (inactive) {
    return (
      <div className="tv-page">
        <style>{css}</style>
        <div className="tv-card info">
          <div className="tv-icon info">⚠</div>
          <h1>Team inactive</h1>
          <p className="tv-sub">
            This team has been deactivated. Please contact the organisers.
          </p>
          <Link to="/" className="tv-btn primary">
            Go to home
          </Link>
        </div>
      </div>
    );
  }

  const teamColor = team.color || "#B8912F";

  return (
    <div className="tv-page">
      <style>{css}</style>

      <div className="tv-card">
        {/* Team color bar */}
        <div className="tv-color-bar" style={{ background: teamColor }} />

        <div
          className="tv-team-avatar"
          style={{
            borderColor: teamColor,
            boxShadow: `0 10px 30px ${teamColor}33`,
          }}
        >
          <span>{team.name?.[0]?.toUpperCase() || "T"}</span>
        </div>

        <p className="tv-eyebrow">Verified Team</p>
        <h1>{team.name}</h1>

        <div className="tv-code" style={{ borderColor: `${teamColor}55` }}>
          <span className="tv-code-label">Team Code</span>
          <span className="tv-code-value">{team.teamCode}</span>
        </div>

        {team.eventId && (
          <div className="tv-event">
            <span className="tv-event-label">Event</span>
            <span className="tv-event-title">{team.eventId.title}</span>
            {team.eventId.place && (
              <span className="tv-event-meta">📍 {team.eventId.place}</span>
            )}
          </div>
        )}

        <div className="tv-score" style={{ color: teamColor }}>
          {team.totalScore}
          <span className="tv-score-label">points</span>
        </div>

        <p className="tv-hint">
          This code uniquely identifies the team. Show it to the organisers when
          requested.
        </p>
      </div>
    </div>
  );
}

const css = `
html, body, #root{ margin:0; padding:0; width:100%; overflow-x:hidden; }
*, *::before, *::after{ box-sizing:border-box; }

.tv-loading{
  min-height:100vh;
  display:flex; align-items:center; justify-content:center;
  background:#F8F4E9;
  font-family:'Inter', sans-serif;
  color:#1B2A4A;
  font-size:1.1rem;
}

.tv-page{
  --ink:#1B2A4A; --ivory:#F8F4E9; --gold:#B8912F; --maroon:#6E2C2C;
  --paper:#FFFDF8; --line:rgba(27,42,74,0.14);
  min-height:100vh;
  display:flex; align-items:center; justify-content:center;
  padding:24px;
  background:
    radial-gradient(circle at 50% 20%, rgba(184,145,47,0.18), transparent 60%),
    linear-gradient(180deg, var(--ivory), #F2ECDB 70%);
  font-family:'Inter', sans-serif;
  color:var(--ink);
}

.tv-card{
  background:var(--paper);
  border:1px solid var(--line);
  border-radius:12px;
  padding:44px 36px 36px;
  max-width:440px;
  width:100%;
  box-shadow:0 20px 60px rgba(27,42,74,0.12);
  text-align:center;
  position:relative;
  overflow:hidden;
}

.tv-color-bar{
  position:absolute; top:0; left:0; right:0;
  height:8px;
}

.tv-team-avatar{
  width:100px; height:100px;
  border-radius:50%;
  margin:0 auto 20px;
  background:var(--ivory);
  border:3px solid var(--gold);
  display:flex; align-items:center; justify-content:center;
  font-family:'Cormorant Garamond', serif;
  font-size:2.6rem;
  font-weight:600;
  color:var(--ink);
  overflow:hidden;
}

.tv-eyebrow{
  font-size:0.75rem;
  font-weight:700;
  color:var(--gold);
  letter-spacing:0.12em;
  text-transform:uppercase;
  margin:0 0 6px;
}

.tv-card h1{
  font-family:'Cormorant Garamond', serif;
  font-size:2rem;
  font-weight:600;
  margin:0 0 20px;
  line-height:1.15;
}

.tv-code{
  display:inline-flex;
  flex-direction:column;
  gap:2px;
  padding:12px 22px;
  border:1.5px dashed var(--gold);
  border-radius:8px;
  margin-bottom:22px;
  background:var(--ivory);
}
.tv-code-label{
  font-size:0.68rem;
  color:#7b8399;
  text-transform:uppercase;
  letter-spacing:0.08em;
}
.tv-code-value{
  font-family:'Courier New', monospace;
  font-size:1.3rem;
  font-weight:700;
  color:var(--ink);
  letter-spacing:0.06em;
}

.tv-event{
  display:flex; flex-direction:column;
  gap:3px;
  margin-bottom:24px;
  padding:12px;
  border-radius:6px;
  background:rgba(184,145,47,0.06);
}
.tv-event-label{
  font-size:0.68rem;
  color:#7b8399;
  text-transform:uppercase;
  letter-spacing:0.08em;
}
.tv-event-title{
  font-size:0.98rem;
  font-weight:600;
  color:var(--ink);
}
.tv-event-meta{
  font-size:0.85rem;
  color:#5a6380;
}

.tv-score{
  font-family:'Cormorant Garamond', serif;
  font-size:3rem;
  font-weight:600;
  line-height:1;
  margin:0 0 22px;
}
.tv-score-label{
  display:block;
  font-family:'Inter', sans-serif;
  font-size:0.72rem;
  color:#7b8399;
  letter-spacing:0.08em;
  text-transform:uppercase;
  margin-top:2px;
}

.tv-hint{
  font-size:0.82rem;
  color:#7b8399;
  margin:0;
  line-height:1.5;
}

/* ---------- ERROR / INFO STATES ---------- */
.tv-card.error{
  border:2px solid #f0c8c2;
}
.tv-card.info{
  border:2px solid rgba(184,145,47,0.35);
}

.tv-icon{
  width:80px; height:80px;
  border-radius:50%;
  margin:0 auto 20px;
  display:flex; align-items:center; justify-content:center;
  font-size:2.2rem;
  font-weight:600;
}
.tv-icon.error{ background:#FBE4E4; color:#b23b3b; }
.tv-icon.info{ background:#FFF4D6; color:#8a6d10; }

.tv-sub{
  color:#5a6380;
  font-size:0.95rem;
  margin:0 0 24px;
  line-height:1.5;
}
.tv-sub code{
  background:var(--ivory);
  padding:2px 8px;
  border-radius:3px;
  font-family:'Courier New', monospace;
  color:var(--ink);
  font-weight:600;
}

.tv-btn{
  display:inline-block;
  padding:11px 24px;
  border-radius:4px;
  border:1px solid var(--line);
  background:transparent;
  color:var(--ink);
  font-family:inherit;
  font-size:0.92rem;
  cursor:pointer;
  text-decoration:none;
  transition:.15s;
}
.tv-btn:hover{ background:var(--ivory); }
.tv-btn.primary{
  background:var(--ink); color:var(--ivory);
  border-color:var(--ink);
}
.tv-btn.primary:hover{ background:var(--maroon); border-color:var(--maroon); }
`;