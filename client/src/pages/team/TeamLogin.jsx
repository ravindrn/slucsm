import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import api from "../../api/axios";
import { useTeam } from "../../context/TeamContext";

export default function TeamLogin() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { team, login } = useTeam();

  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* Load event info */
  useEffect(() => {
    api
      .get(`/events/${slug}`)
      .then((r) => setEvent(r.data))
      .catch(() => setEvent(null))
      .finally(() => setEventLoading(false));
  }, [slug]);

  /* Already logged in? */
  if (team) {
    return <Navigate to={`/events/live/${slug}/portal/dashboard`} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      await login(slug, username.trim(), password);
      nav(`/events/live/${slug}/portal/dashboard`, { replace: true });
    } catch (e) {
      setErr(e.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (eventLoading) {
    return (
      <div style={{ padding: 100, textAlign: "center", fontFamily: "Inter" }}>
        Loading…
      </div>
    );
  }

  if (!event) {
    return (
      <div className="portal-login">
        <style>{css}</style>
        <div className="pl-card">
          <h1>Event not found</h1>
          <p>This event doesn't exist or has been removed.</p>
          <Link to="/" className="pl-back">← Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-login">
      <style>{css}</style>

      <div className="pl-card">
        <Link to={`/events/live/${slug}`} className="pl-back-top">
          ← Back to event
        </Link>

        <div className="pl-logo">
          <img src="/slucsmLogo.png" alt="SLUCSM Logo" />
        </div>

        <p className="pl-eyebrow">Team Portal</p>
        <h1>{event.title}</h1>
        <p className="pl-sub">
          Sign in with the credentials your team leader received.
        </p>

        {err && <div className="pl-error">{err}</div>}

        <form onSubmit={submit}>
          <label>Team username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="alpha"
            autoComplete="username"
            autoCapitalize="none"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Enter portal"}
          </button>
        </form>

        <p className="pl-help">
          Lost your credentials? Ask your event coordinator.
        </p>
      </div>
    </div>
  );
}

const css = `
html, body, #root{ margin:0; padding:0; width:100%; overflow-x:hidden; }
*, *::before, *::after{ box-sizing:border-box; }

.portal-login{
  --ink:#1B2A4A; --ivory:#F8F4E9; --gold:#B8912F; --maroon:#6E2C2C;
  --paper:#FFFDF8; --line:rgba(27,42,74,0.14);
  min-height:100vh;
  display:flex; align-items:center; justify-content:center;
  padding:24px;
  background:
    radial-gradient(circle at 50% 20%, rgba(184,145,47,0.18), transparent 60%),
    linear-gradient(180deg, var(--ivory), #F2ECDB 70%);
  font-family:'Inter',sans-serif;
  color:var(--ink);
}
.pl-card{
  background:var(--paper);
  border:1px solid var(--line);
  border-radius:8px;
  padding:40px 36px;
  max-width:420px;
  width:100%;
  box-shadow:0 20px 60px rgba(27,42,74,0.10);
  text-align:center;
  position:relative;
}
.pl-back-top{
  position:absolute; top:16px; left:20px;
  font-size:0.82rem; color:#5a6380; text-decoration:none;
}
.pl-back-top:hover{ color:var(--maroon); }

.pl-logo img{
  width:72px; height:72px; border-radius:50%; object-fit:contain;
  border:2px solid var(--gold); background:var(--paper);
  margin:0 auto 16px; padding:5px;
}
.pl-eyebrow{
  font-size:0.78rem; font-weight:600;
  color:var(--maroon); letter-spacing:0.08em;
  text-transform:uppercase; margin:0 0 6px;
}
.pl-card h1{
  font-family:'Cormorant Garamond', serif;
  font-size:1.85rem; font-weight:600;
  margin:0 0 8px; line-height:1.15;
}
.pl-sub{ color:#5a6380; font-size:0.9rem; margin:0 0 24px; }

.pl-error{
  background:#fff2f0; color:#b23b3b; border:1px solid #f0c8c2;
  padding:10px 14px; border-radius:4px;
  font-size:0.9rem; margin-bottom:18px;
}

.pl-card form{ text-align:left; }
.pl-card label{
  display:block; font-size:0.82rem; font-weight:500;
  margin-bottom:6px; color:#3a4560;
}
.pl-card input{
  width:100%; padding:11px 14px;
  border:1px solid var(--line); border-radius:3px;
  font-size:0.95rem; font-family:inherit;
  margin-bottom:16px; background:#fff; color:var(--ink);
  transition:border-color .2s;
}
.pl-card input:focus{
  outline:none; border-color:var(--gold);
  box-shadow:0 0 0 3px rgba(184,145,47,0.12);
}
.pl-card button{
  width:100%; padding:12px;
  background:var(--ink); color:var(--ivory);
  border:none; border-radius:3px;
  font-size:0.95rem; font-weight:500;
  cursor:pointer; transition:.25s;
  font-family:inherit;
}
.pl-card button:hover:not(:disabled){ background:var(--maroon); }
.pl-card button:disabled{ opacity:0.6; cursor:wait; }

.pl-help{
  font-size:0.8rem; color:#7b8399;
  margin:20px 0 0;
}
.pl-back{
  display:inline-block; margin-top:20px;
  font-size:0.88rem; color:#5a6380; text-decoration:none;
}
.pl-back:hover{ color:var(--maroon); }
`;