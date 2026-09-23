import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin";

  const [email, setEmail] = useState("admin@slucsm.lk");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* Already logged in? Go to admin */
  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      await login(email, password);
      nav(from, { replace: true });
    } catch (e) {
      setErr(e.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <style>{css}</style>

      <div className="login-card">
        <div className="login-logo">
          <img src="/slucsmLogo.png" alt="SLUCSM Logo" />
        </div>
        <h1>Admin Panel</h1>
        <p className="login-sub">Sign in to manage events, teams and content.</p>

        {err && <div className="login-error">{err}</div>}

        <form onSubmit={submit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <a href="/" className="login-back">← Back to site</a>
      </div>
    </div>
  );
}

const css = `
html, body, #root{ margin:0; padding:0; width:100%; overflow-x:hidden; }
*, *::before, *::after{ box-sizing:border-box; }

.login-page{
  --ink:#1B2A4A; --ivory:#F8F4E9; --gold:#B8912F; --maroon:#6E2C2C;
  --paper:#FFFDF8; --line:rgba(27,42,74,0.14);
  min-height:100vh;
  display:flex; align-items:center; justify-content:center;
  padding:24px;
  background:
    radial-gradient(circle at 50% 20%, rgba(184,145,47,0.18), transparent 60%),
    linear-gradient(180deg, var(--ivory), #F2ECDB 70%);
  font-family:'Inter',sans-serif; color:var(--ink);
}
.login-card{
  background:var(--paper);
  border:1px solid var(--line);
  border-radius:8px;
  padding:40px 36px;
  max-width:400px;
  width:100%;
  box-shadow:0 20px 60px rgba(27,42,74,0.10);
  text-align:center;
}
.login-logo img{
  width:84px; height:84px; border-radius:50%; object-fit:contain;
  border:2px solid var(--gold); background:var(--paper);
  margin:0 auto 18px;
  padding:5px;
}
.login-card h1{
  font-family:'Cormorant Garamond', serif;
  font-size:2rem; font-weight:600; margin:0 0 6px;
}
.login-sub{ color:#5a6380; font-size:0.92rem; margin:0 0 26px; }

.login-error{
  background:#fff2f0; color:#b23b3b; border:1px solid #f0c8c2;
  padding:10px 14px; border-radius:4px;
  font-size:0.9rem; margin-bottom:18px;
}

.login-card form{ text-align:left; }
.login-card label{
  display:block; font-size:0.85rem; font-weight:500;
  margin-bottom:6px; color:#3a4560;
}
.login-card input{
  width:100%;
  padding:11px 14px;
  border:1px solid var(--line);
  border-radius:3px;
  font-size:0.95rem;
  font-family:inherit;
  margin-bottom:18px;
  background:#fff;
  color:var(--ink);
  transition:border-color .2s;
}
.login-card input:focus{
  outline:none;
  border-color:var(--gold);
  box-shadow:0 0 0 3px rgba(184,145,47,0.12);
}
.login-card button{
  width:100%;
  padding:12px;
  background:var(--ink);
  color:var(--ivory);
  border:none; border-radius:3px;
  font-size:0.95rem; font-weight:500;
  cursor:pointer;
  transition:.25s;
  font-family:inherit;
}
.login-card button:hover:not(:disabled){ background:var(--maroon); }
.login-card button:disabled{ opacity:0.6; cursor:wait; }

.login-back{
  display:inline-block; margin-top:24px;
  font-size:0.88rem; color:#5a6380; text-decoration:none;
}
.login-back:hover{ color:var(--maroon); }
`;