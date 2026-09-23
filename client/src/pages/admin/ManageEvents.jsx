import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function ManageEvents() {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/events");
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const del = async (ev) => {
    if (!window.confirm(`Delete "${ev.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/events/${ev._id}`);
      setEvents((list) => list.filter((x) => x._id !== ev._id));
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="manage-events">
      <style>{css}</style>

      <div className="me-head">
        <div>
          <h1>Events</h1>
          <p className="me-sub">
            Create and manage events — archive, upcoming and ongoing.
          </p>
        </div>
        <Link to="/admin/events/new" className="me-primary-btn">
          + New event
        </Link>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : events.length === 0 ? (
        <div className="me-empty">
          <p>No events yet.</p>
          <Link to="/admin/events/new" className="me-primary-btn">
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="me-table-wrap">
          <table className="me-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Status</th>
                <th>When</th>
                <th>Sections</th>
                <th>Published</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev._id}>
                  <td>
                    <strong>{ev.title}</strong>
                    {ev.tag && <span className="me-tag">{ev.tag}</span>}
                  </td>
                  <td>
                    <code>{ev.slug}</code>
                  </td>
                  <td>
                    <span className={`me-status ${ev.status}`}>{ev.status}</span>
                  </td>
                  <td>{ev.when}</td>
                  <td>{ev.sections?.length || 0}</td>
                  <td>
                    {ev.published ? (
                      <span className="me-pub yes">Yes</span>
                    ) : (
                      <span className="me-pub no">No</span>
                    )}
                  </td>
                  <td className="me-actions">
                    <button
                      onClick={() => nav(`/admin/events/${ev._id}`)}
                      className="me-btn"
                    >
                      Edit
                    </button>
                    <Link
                      to={
                        ev.status === "ongoing" || ev.status === "upcoming"
                          ? `/events/live/${ev.slug}`
                          : `/events/${ev.slug}`
                      }
                      target="_blank"
                      className="me-btn ghost"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => del(ev)}
                      className="me-btn danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const css = `
.manage-events{ color:#1B2A4A; }
.me-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:16px; flex-wrap:wrap; margin-bottom:28px;
}
.me-head h1{
  font-family:'Cormorant Garamond', serif;
  font-size:2.2rem; font-weight:600; margin:0 0 6px;
}
.me-sub{ color:#5a6380; font-size:0.95rem; margin:0; }

.me-primary-btn{
  background:#1B2A4A; color:#F8F4E9;
  padding:11px 22px; border-radius:4px;
  text-decoration:none; font-size:0.92rem; font-weight:500;
  transition:.2s; display:inline-block;
}
.me-primary-btn:hover{ background:#6E2C2C; }

.me-empty{
  background:#FFFDF8; border:1px dashed rgba(27,42,74,0.18);
  border-radius:6px; padding:60px 20px; text-align:center;
}
.me-empty p{ color:#7b8399; margin:0 0 20px; }

.me-table-wrap{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  overflow:hidden;
  overflow-x:auto;
}
.me-table{
  width:100%; border-collapse:collapse; font-size:0.9rem;
}
.me-table thead th{
  background:#F8F4E9;
  padding:12px 14px;
  text-align:left;
  font-weight:600;
  font-size:0.8rem;
  text-transform:uppercase;
  letter-spacing:0.04em;
  color:#5a6380;
  border-bottom:1px solid rgba(27,42,74,0.14);
  white-space:nowrap;
}
.me-table tbody td{
  padding:14px;
  border-bottom:1px solid rgba(27,42,74,0.06);
  vertical-align:middle;
}
.me-table tbody tr:last-child td{ border-bottom:none; }
.me-table tbody tr:hover{ background:#fbf8ef; }
.me-table code{
  background:#F8F4E9; padding:2px 6px; border-radius:3px;
  font-size:0.82rem;
}
.me-tag{
  display:inline-block; margin-left:8px;
  font-size:0.7rem; color:#77886A;
  border:1px solid #77886A;
  padding:2px 8px; border-radius:10px;
}
.me-status{
  display:inline-block; padding:3px 10px; border-radius:10px;
  font-size:0.75rem; font-weight:600;
  text-transform:capitalize;
}
.me-status.ongoing{ background:#b23b3b; color:#fff; }
.me-status.upcoming{ background:#B8912F; color:#fff; }
.me-status.archive{ background:#F8F4E9; color:#5a6380; }
.me-status.completed{ background:#77886A; color:#fff; }
.me-pub{ font-size:0.8rem; font-weight:600; }
.me-pub.yes{ color:#2e7d32; }
.me-pub.no{ color:#b23b3b; }

.me-actions{ display:flex; gap:6px; flex-wrap:wrap; }
.me-btn{
  padding:6px 12px;
  border:1px solid rgba(27,42,74,0.18);
  background:transparent;
  color:#1B2A4A;
  border-radius:3px;
  font-size:0.82rem;
  cursor:pointer;
  text-decoration:none;
  font-family:inherit;
  transition:.15s;
}
.me-btn:hover{ background:#F8F4E9; }
.me-btn.danger{ color:#b23b3b; border-color:#f0c8c2; }
.me-btn.danger:hover{ background:#fff2f0; }
.me-btn.ghost{ opacity:0.8; }
`;