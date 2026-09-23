import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    events: 0,
    ongoing: 0,
    teams: 0,
    submissions: 0,
    pending: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: events } = await api.get("/events");
        const ongoing = events.filter(
          (e) => e.status === "ongoing" || e.status === "upcoming"
        );

        /* Get teams + submissions only for the first ongoing event (demo) */
        let teamCount = 0;
        let submissionCount = 0;
        let pendingCount = 0;

        if (ongoing.length > 0) {
          const { data: teams } = await api.get(
            `/teams/event/${ongoing[0]._id}`
          );
          teamCount = teams.length;

          const { data: subs } = await api.get(
            `/submissions/event/${ongoing[0]._id}`
          );
          submissionCount = subs.length;
          pendingCount = subs.filter((s) => s.status === "pending").length;
        }

        setStats({
          events: events.length,
          ongoing: ongoing.length,
          teams: teamCount,
          submissions: submissionCount,
          pending: pendingCount,
        });
        setRecentEvents(events.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Loading dashboard…</p>;

  return (
    <div className="dash">
      <style>{css}</style>

      <div className="dash-head">
        <div>
          <h1>Welcome back, {user?.name}</h1>
          <p className="dash-sub">
            Here's a quick overview of your movement.
          </p>
        </div>
        <Link to="/admin/events" className="dash-primary-btn">
          + New event
        </Link>
      </div>

      <div className="dash-stats">
        <StatCard label="Total Events" value={stats.events} icon="🗓" />
        <StatCard label="Ongoing / Upcoming" value={stats.ongoing} icon="🔴" />
        <StatCard label="Active Teams" value={stats.teams} icon="👥" />
        <StatCard
          label="Submissions"
          value={stats.submissions}
          icon="📤"
          hint={stats.pending > 0 ? `${stats.pending} pending review` : ""}
          hintTone={stats.pending > 0 ? "warn" : ""}
        />
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card-head">
            <h2>Recent events</h2>
            <Link to="/admin/events" className="dash-link">
              View all →
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="dash-empty">No events yet.</p>
          ) : (
            <ul className="dash-list">
              {recentEvents.map((e) => (
                <li key={e._id}>
                  <span className={`dash-dot ${e.status}`} />
                  <span className="dash-list-title">{e.title}</span>
                  <span className="dash-list-meta">{e.when}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <h2>Quick actions</h2>
          </div>
          <div className="dash-actions">
            <Link to="/admin/events" className="dash-action">
              🗓 Manage events
            </Link>
            <Link to="/admin/teams" className="dash-action">
              👥 Manage teams
            </Link>
            <Link to="/admin/tasks" className="dash-action">
              ✓ Manage tasks
            </Link>
            <Link to="/admin/submissions" className="dash-action">
              📤 Review submissions
            </Link>
            <Link to="/admin/settings" className="dash-action">
              ⚙ Site settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, hint, hintTone }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint && <div className={`stat-hint ${hintTone || ""}`}>{hint}</div>}
    </div>
  );
}

const css = `
.dash{ color:#1B2A4A; }

.dash-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:16px; flex-wrap:wrap;
  margin-bottom:32px;
}
.dash-head h1{
  font-family:'Cormorant Garamond', serif;
  font-size:2.2rem; font-weight:600; margin:0 0 6px;
  color:#1B2A4A;
}
.dash-sub{ color:#5a6380; font-size:0.95rem; margin:0; }

.dash-primary-btn{
  background:#1B2A4A; color:#F8F4E9;
  padding:11px 22px; border-radius:4px;
  text-decoration:none; font-size:0.92rem; font-weight:500;
  transition:.2s;
}
.dash-primary-btn:hover{ background:#6E2C2C; }

.dash-stats{
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(180px,1fr));
  gap:16px;
  margin-bottom:32px;
}
.stat-card{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:20px;
  position:relative;
}
.stat-icon{ font-size:1.5rem; margin-bottom:8px; }
.stat-value{
  font-family:'Cormorant Garamond', serif;
  font-size:2.4rem; font-weight:600; line-height:1;
  color:#1B2A4A;
}
.stat-label{
  font-size:0.85rem; color:#5a6380;
  margin-top:6px;
}
.stat-hint{
  display:inline-block;
  margin-top:8px;
  font-size:0.75rem;
  padding:2px 8px;
  border-radius:10px;
}
.stat-hint.warn{
  background:#fff2f0; color:#b23b3b;
}

.dash-grid{
  display:grid;
  grid-template-columns:1.4fr 1fr;
  gap:20px;
}
@media (max-width:900px){
  .dash-grid{ grid-template-columns:1fr; }
}

.dash-card{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:22px;
}
.dash-card-head{
  display:flex; justify-content:space-between; align-items:center;
  margin-bottom:14px;
}
.dash-card-head h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.35rem; margin:0; font-weight:600;
}
.dash-link{
  font-size:0.85rem; color:#B8912F; text-decoration:none;
}
.dash-link:hover{ color:#6E2C2C; }

.dash-empty{ color:#7b8399; font-style:italic; margin:0; }

.dash-list{ list-style:none; margin:0; padding:0; }
.dash-list li{
  display:grid; grid-template-columns:12px 1fr auto; gap:12px;
  align-items:center;
  padding:12px 0;
  border-bottom:1px solid rgba(27,42,74,0.08);
}
.dash-list li:last-child{ border-bottom:none; }
.dash-dot{
  width:8px; height:8px; border-radius:50%;
  background:#ccc;
}
.dash-dot.ongoing{ background:#b23b3b; }
.dash-dot.upcoming{ background:#B8912F; }
.dash-dot.archive{ background:#77886A; }
.dash-list-title{
  font-size:0.92rem; font-weight:500;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.dash-list-meta{ font-size:0.8rem; color:#7b8399; }

.dash-actions{
  display:flex; flex-direction:column; gap:6px;
}
.dash-action{
  padding:11px 14px;
  border-radius:4px;
  text-decoration:none; color:#1B2A4A;
  font-size:0.9rem;
  background:#F8F4E9;
  transition:.2s;
}
.dash-action:hover{
  background:#B8912F; color:#fff;
}
`;