import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { confirmDialog } from "../../lib/dialogs";

export default function ManageEvents() {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [galleryStats, setGalleryStats] = useState({});

  /* ---------- LOAD ---------- */
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/events");
      setEvents(data);
      await loadStats(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (eventList) => {
    const stats = {};
    await Promise.all(
      eventList.map(async (ev) => {
        try {
          const { data } = await api.get(
            `/submissions/gallery/${ev._id}/stats`
          );
          stats[ev._id] = data;
        } catch {
          stats[ev._id] = { total: 0, images: 0, videos: 0 };
        }
      })
    );
    setGalleryStats(stats);
  };

  useEffect(() => {
    load();
  }, []);

  /* ---------- DELETE ---------- */
  const del = async (ev) => {
    const ok = await confirmDialog({
      title: "Delete event?",
      text: `"${ev.title}" and all its data will be permanently removed. This cannot be undone.`,
      icon: "warning",
      danger: true,
      confirmText: "Delete event",
    });
    if (!ok) return;

    try {
      await api.delete(`/events/${ev._id}`);
      setEvents((list) => list.filter((x) => x._id !== ev._id));
      toast.success("Event deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  /* ---------- GALLERY PUBLISH TOGGLE ---------- */
  const toggleGallery = async (ev) => {
    const isPublished = ev.galleryPublished;
    const stats = galleryStats[ev._id] || { total: 0 };

    const ok = await confirmDialog({
      title: isPublished ? "Unpublish gallery?" : "Publish gallery?",
      text: isPublished
        ? `Hide the team gallery for "${ev.title}" from the public?`
        : `Make the team gallery for "${ev.title}" publicly visible?\n\nThis will show all ${stats.total} approved photos and videos to anyone with the link.`,
      icon: isPublished ? "warning" : "question",
      danger: isPublished,
      confirmText: isPublished ? "Unpublish" : "Publish",
    });
    if (!ok) return;

    try {
      const url = isPublished
        ? `/submissions/gallery/${ev._id}/unpublish`
        : `/submissions/gallery/${ev._id}/publish`;
      await api.put(url);
      toast.success(
        isPublished ? "Gallery unpublished" : "Gallery published"
      );
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="manage-events">
      <style>{css}</style>

      <div className="me-head">
        <div>
          <h1>Events</h1>
          <p className="me-sub">
            Create and manage events. Publish team galleries when ready.
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
                <th>Gallery</th>
                <th>Published</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const stats = galleryStats[ev._id] || { total: 0 };
                const published = ev.galleryPublished;

                return (
                  <tr key={ev._id}>
                    <td>
                      <strong>{ev.title}</strong>
                      {ev.tag && <span className="me-tag">{ev.tag}</span>}
                    </td>
                    <td>
                      <code>{ev.slug}</code>
                    </td>
                    <td>
                      <span className={`me-status ${ev.status}`}>
                        {ev.status}
                      </span>
                    </td>
                    <td>{ev.when}</td>
                    <td>
                      <button
                        className={`me-gallery-btn ${
                          published ? "published" : "unpublished"
                        }`}
                        onClick={() => toggleGallery(ev)}
                        title={
                          published
                            ? `Published — ${stats.total} items. Click to unpublish.`
                            : `Not published — ${stats.total} items ready. Click to publish.`
                        }
                      >
                        {published ? "🌐 Published" : "🔒 Not published"}
                        <span className="me-gallery-count">
                          {stats.total}
                        </span>
                      </button>
                    </td>
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
                      <Link
                        to={`/events/live/${ev.slug}/gallery`}
                        target="_blank"
                        className="me-btn ghost"
                      >
                        Gallery
                      </Link>
                      <button
                        onClick={() => del(ev)}
                        className="me-btn danger"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
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

/* ---------- GALLERY TOGGLE ---------- */
.me-gallery-btn{
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:6px 12px;
  border-radius:16px;
  font-size:0.8rem;
  font-weight:500;
  font-family:inherit;
  cursor:pointer;
  border:1px solid transparent;
  transition:.15s;
  white-space:nowrap;
}
.me-gallery-btn.published{
  background:#E3F3E5;
  color:#2e7d32;
  border-color:#bfe0c4;
}
.me-gallery-btn.published:hover{
  background:#d5ecd8;
  border-color:#a5d0a9;
}
.me-gallery-btn.unpublished{
  background:#F8F4E9;
  color:#7b8399;
  border-color:rgba(27,42,74,0.14);
}
.me-gallery-btn.unpublished:hover{
  background:#fdfaf1;
  border-color:rgba(184,145,47,0.4);
  color:#5a6380;
}
.me-gallery-count{
  background:rgba(0,0,0,0.08);
  padding:1px 8px;
  border-radius:10px;
  font-size:0.72rem;
  font-weight:600;
}
.me-gallery-btn.published .me-gallery-count{
  background:rgba(46,125,50,0.15);
}

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