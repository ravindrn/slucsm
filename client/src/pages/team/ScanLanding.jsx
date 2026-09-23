import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useTeam } from "../../context/TeamContext";

export default function ScanLanding() {
  const { code } = useParams();
  const nav = useNavigate();
  const { team, refresh } = useTeam();

  const [status, setStatus] = useState("idle"); // idle | redeeming | success | error | needsLogin
  const [message, setMessage] = useState("");
  const [taskInfo, setTaskInfo] = useState(null);

  useEffect(() => {
    if (!team) {
      setStatus("needsLogin");
      setMessage(
        "You need to be signed in to your team portal before scanning checkpoints."
      );
      return;
    }

    (async () => {
      setStatus("redeeming");
      try {
        const { data } = await api.post("/qrcodes/redeem", { code });
        setTaskInfo(data.task);
        await refresh();
        setStatus("success");
        setMessage(`Task "${data.task.title}" submitted for review.`);
      } catch (e) {
        setStatus("error");
        setMessage(
          e.response?.data?.message || "Could not redeem this code."
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, team]);

  return (
    <div className="scan-landing">
      <style>{css}</style>

      <div className="sl-card">
        <div className="sl-logo">
          <img src="/slucsmLogo.png" alt="SLUCSM" />
        </div>

        {status === "redeeming" && (
          <>
            <h1>Redeeming code…</h1>
            <p className="sl-sub">Checking code <code>{code}</code></p>
            <div className="sl-spinner" />
          </>
        )}

        {status === "success" && (
          <>
            <div className="sl-icon success">✓</div>
            <h1>Checkpoint reached!</h1>
            <p className="sl-sub">{message}</p>
            {taskInfo && (
              <div className="sl-task">
                <span className="sl-task-pts">+{taskInfo.points} pts</span>
                <span>on approval</span>
              </div>
            )}
            <button
              className="sl-btn primary"
              onClick={() => nav(-1)}
            >
              ← Back to dashboard
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="sl-icon error">!</div>
            <h1>Could not redeem</h1>
            <p className="sl-sub">{message}</p>
            <button className="sl-btn" onClick={() => nav(-1)}>
              ← Back to dashboard
            </button>
          </>
        )}

        {status === "needsLogin" && (
          <>
            <div className="sl-icon info">🔒</div>
            <h1>Sign in required</h1>
            <p className="sl-sub">{message}</p>
            <p className="sl-code">
              Code: <code>{code}</code>
            </p>
            <p className="sl-hint">
              After signing in, return and scan again — or enter the code
              manually from your dashboard.
            </p>
            <Link to="/" className="sl-btn primary">
              Go to home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

const css = `
html, body, #root{ margin:0; padding:0; width:100%; overflow-x:hidden; }
*, *::before, *::after{ box-sizing:border-box; }

.scan-landing{
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
.sl-card{
  background:var(--paper);
  border:1px solid var(--line);
  border-radius:8px;
  padding:40px 36px;
  max-width:440px;
  width:100%;
  box-shadow:0 20px 60px rgba(27,42,74,0.10);
  text-align:center;
}
.sl-logo img{
  width:64px; height:64px; border-radius:50%;
  object-fit:contain; border:2px solid var(--gold);
  background:var(--paper); margin:0 auto 20px; padding:4px;
}
.sl-card h1{
  font-family:'Cormorant Garamond', serif;
  font-size:1.85rem; font-weight:600;
  margin:0 0 10px; line-height:1.15;
}
.sl-sub{ color:#5a6380; font-size:0.95rem; margin:0 0 20px; line-height:1.5; }
.sl-sub code{
  background:#F8F4E9; padding:2px 8px; border-radius:3px;
  color:#B8912F; font-weight:600;
}

.sl-icon{
  width:70px; height:70px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:2rem; margin:0 auto 20px;
  font-weight:600;
}
.sl-icon.success{ background:#E3F3E5; color:#2e7d32; }
.sl-icon.error{ background:#FBE4E4; color:#b23b3b; }
.sl-icon.info{ background:#FFF4D6; color:#8a6d10; font-size:1.8rem; }

.sl-spinner{
  width:40px; height:40px;
  border:3px solid #F8F4E9;
  border-top-color:#B8912F;
  border-radius:50%;
  margin:20px auto 0;
  animation:spin 0.8s linear infinite;
}
@keyframes spin{ to { transform:rotate(360deg); } }

.sl-task{
  background:#F8F4E9;
  border:1px solid var(--line);
  border-radius:4px;
  padding:14px 18px;
  margin:20px 0;
  display:flex; flex-direction:column; gap:4px;
}
.sl-task-pts{
  font-family:'Cormorant Garamond', serif;
  font-size:1.6rem; font-weight:600; color:#B8912F;
}

.sl-code{
  background:#F8F4E9;
  padding:14px;
  border-radius:4px;
  font-size:1.4rem;
  font-family:'Courier New', monospace;
  color:var(--ink);
  letter-spacing:0.08em;
  margin:16px 0;
}
.sl-code code{
  background:none; padding:0; color:var(--ink); font-weight:600;
}
.sl-hint{
  font-size:0.85rem; color:#7b8399;
  margin:0 0 20px; line-height:1.5;
}

.sl-btn{
  display:inline-block;
  padding:11px 24px;
  border-radius:3px;
  border:1px solid var(--line);
  background:transparent;
  color:var(--ink);
  font-family:inherit;
  font-size:0.92rem;
  cursor:pointer;
  text-decoration:none;
  transition:.15s;
}
.sl-btn:hover{ background:#F8F4E9; }
.sl-btn.primary{
  background:var(--ink); color:var(--ivory);
  border-color:var(--ink);
}
.sl-btn.primary:hover{ background:var(--maroon); border-color:var(--maroon); }
`;