import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api, { imgUrl } from "../api/axios";
import EventNav from "../components/EventNav";
import EventNotFound from "./EventNotFound";

export default function PublicGallery() {
  const { slug } = useParams();

  const [event, setEvent] = useState(null);
  const [data, setData] = useState({ items: [], counts: {}, teams: [] });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notPublished, setNotPublished] = useState(false);

  /* Filters */
  const [typeFilter, setTypeFilter] = useState("all"); // all | image | video
  const [teamFilter, setTeamFilter] = useState("all"); // all | teamId
  const [lightbox, setLightbox] = useState(null);       // item being previewed

  /* ---------- LOAD EVENT ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { data: ev } = await api.get(`/events/${slug}`);
        setEvent(ev);
      } catch (e) {
        if (e.response?.status === 404) setNotFound(true);
        else console.error(e);
      }
    })();
  }, [slug]);

  /* ---------- LOAD GALLERY ---------- */
  const load = async () => {
    if (!event) return;
    try {
      setLoading(true);
      const { data: res } = await api.get(`/submissions/gallery/${event._id}`);
      setData(res);
      setNotPublished(false);
    } catch (e) {
      if (e.response?.status === 403) {
        setNotPublished(true);
      } else {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (event) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  /* ---------- FILTERED ---------- */
  const filtered = useMemo(() => {
    return data.items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (teamFilter !== "all" && item.team._id !== teamFilter) return false;
      return true;
    });
  }, [data.items, typeFilter, teamFilter]);

  /* ---------- LIGHTBOX NAVIGATION ---------- */
  const openLightbox = (item) => setLightbox(item);
  const closeLightbox = () => setLightbox(null);

  const currentIndex = lightbox
    ? filtered.findIndex((i) => i._id === lightbox._id)
    : -1;

  const goPrev = () => {
    if (currentIndex > 0) setLightbox(filtered[currentIndex - 1]);
  };
  const goNext = () => {
    if (currentIndex < filtered.length - 1)
      setLightbox(filtered[currentIndex + 1]);
  };

  /* Keyboard navigation */
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, currentIndex]);

  if (notFound) return <EventNotFound />;

  return (
    <div className="slucsm public-gallery-page">
      <style>{css}</style>

      <EventNav
        backTo={`/events/live/${slug}`}
        backLabel="← Back to event"
      />

      <header className="pg-hero">
        <p className="pg-eyebrow">Event Gallery</p>
        <h1>{event?.title || "Loading…"}</h1>
        <p className="pg-sub">
          Every photo and video shared by the teams —{" "}
          {data.counts.all || 0} submissions
        </p>
      </header>

      <main className="pg-main">
        {loading ? (
          <p className="pg-empty">Loading gallery…</p>
        ) : notPublished ? (
          <div className="pg-empty-state">
            <div className="pg-empty-icon">🔒</div>
            <h2>Gallery not yet published</h2>
            <p>
              The organisers haven't shared the team uploads for this event
              yet. Check back soon — the photos and videos will appear here
              once approved.
            </p>
          </div>
        ) : data.items.length === 0 ? (
          <div className="pg-empty-state">
            <div className="pg-empty-icon">📸</div>
            <h2>No photos or videos yet</h2>
            <p>
              Once the teams start submitting and the organisers approve
              their uploads, they'll appear here.
            </p>
          </div>
        ) : (
          <>
            {/* ---------- FILTERS ---------- */}
            <div className="pg-filters">
              <div className="pg-filter-group">
                <button
                  className={`pg-filter${
                    typeFilter === "all" ? " active" : ""
                  }`}
                  onClick={() => setTypeFilter("all")}
                >
                  All{" "}
                  <span className="pg-filter-count">{data.counts.all}</span>
                </button>
                <button
                  className={`pg-filter${
                    typeFilter === "image" ? " active" : ""
                  }`}
                  onClick={() => setTypeFilter("image")}
                >
                  📸 Photos{" "}
                  <span className="pg-filter-count">
                    {data.counts.image}
                  </span>
                </button>
                <button
                  className={`pg-filter${
                    typeFilter === "video" ? " active" : ""
                  }`}
                  onClick={() => setTypeFilter("video")}
                >
                  🎥 Videos{" "}
                  <span className="pg-filter-count">
                    {data.counts.video}
                  </span>
                </button>
              </div>

              <select
                className="pg-team-filter"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="all">All teams ({data.teams.length})</option>
                {data.teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.count})
                  </option>
                ))}
              </select>
            </div>

            {/* ---------- GRID ---------- */}
            {filtered.length === 0 ? (
              <p className="pg-empty">No items match this filter.</p>
            ) : (
              <div className="pg-grid">
                {filtered.map((item) => (
                  <button
                    key={item._id}
                    className="pg-item"
                    onClick={() => openLightbox(item)}
                  >
                    <div className="pg-item-media">
                      {item.type === "video" ? (
                        <>
                          <video
                            src={imgUrl(item.url)}
                            muted
                            playsInline
                            preload="metadata"
                          />
                          <div className="pg-video-badge">▶</div>
                        </>
                      ) : (
                        <img
                          src={imgUrl(item.url)}
                          alt={item.label || "upload"}
                          loading="lazy"
                        />
                      )}
                    </div>

                    <div className="pg-item-meta">
                      <span
                        className="pg-team-dot"
                        style={{ background: item.team.color }}
                      />
                      <span className="pg-team-name">{item.team.name}</span>
                      <span className="pg-item-task">
                        {item.task.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ---------- LIGHTBOX ---------- */}
      {lightbox && (
        <div className="pg-lightbox" onClick={closeLightbox}>
          <button
            className="pg-lb-close"
            onClick={closeLightbox}
            aria-label="Close"
          >
            ×
          </button>

          {currentIndex > 0 && (
            <button
              className="pg-lb-nav prev"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Previous"
            >
              ‹
            </button>
          )}

          {currentIndex < filtered.length - 1 && (
            <button
              className="pg-lb-nav next"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Next"
            >
              ›
            </button>
          )}

          <div
            className="pg-lb-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pg-lb-media">
              {lightbox.type === "video" ? (
                <video
                  src={imgUrl(lightbox.url)}
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  src={imgUrl(lightbox.url)}
                  alt={lightbox.label || "upload"}
                />
              )}
            </div>

            <div className="pg-lb-info">
              <div className="pg-lb-team">
                <span
                  className="pg-team-dot"
                  style={{ background: lightbox.team.color }}
                />
                <strong>{lightbox.team.name}</strong>
                {lightbox.team.teamCode && (
                  <code className="pg-lb-code">
                    {lightbox.team.teamCode}
                  </code>
                )}
              </div>

              <p className="pg-lb-task">{lightbox.task.title}</p>

              {lightbox.note && (
                <p className="pg-lb-note">📝 {lightbox.note}</p>
              )}

              <p className="pg-lb-date">
                {new Date(lightbox.submittedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>

              <div className="pg-lb-actions">
                <a
                  href={imgUrl(lightbox.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="pg-lb-btn"
                  download
                >
                  ⬇ Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const css = `
html, body, #root{ margin:0; padding:0; width:100%; overflow-x:hidden; }
*, *::before, *::after{ box-sizing:border-box; }

.slucsm.public-gallery-page{
  --ink:#1B2A4A;
  --ivory:#F8F4E9;
  --gold:#B8912F;
  --maroon:#6E2C2C;
  --paper:#FFFDF8;
  --line:rgba(27,42,74,0.14);
  font-family:'Inter', sans-serif;
  background:var(--ivory);
  color:var(--ink);
  min-height:100vh;
}
.slucsm.public-gallery-page h1,
.slucsm.public-gallery-page h2{
  font-family:'Cormorant Garamond', serif;
}

/* ---------- HERO ---------- */
.pg-hero{
  text-align:center;
  padding:60px 6vw 30px;
  max-width:820px;
  margin:0 auto;
}
.pg-eyebrow{
  font-size:0.8rem; font-weight:600;
  letter-spacing:0.12em; text-transform:uppercase;
  color:var(--maroon); margin:0 0 8px;
}
.pg-hero h1{
  font-size:clamp(2rem,5vw,3rem);
  font-weight:600; margin:0 0 10px;
  line-height:1.1;
}
.pg-sub{ color:#5a6380; font-size:1rem; margin:0; }

/* ---------- MAIN ---------- */
.pg-main{
  max-width:1400px;
  margin:0 auto;
  padding:30px 4vw 100px;
}

/* ---------- FILTERS ---------- */
.pg-filters{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
  flex-wrap:wrap;
  padding:14px 18px;
  background:var(--paper);
  border:1px solid var(--line);
  border-radius:8px;
  margin-bottom:24px;
  position:sticky;
  top:70px;
  z-index:10;
  box-shadow:0 4px 20px rgba(27,42,74,0.06);
}
.pg-filter-group{ display:flex; gap:6px; flex-wrap:wrap; }
.pg-filter{
  padding:8px 14px;
  background:transparent;
  border:1px solid var(--line);
  border-radius:20px;
  font-family:inherit;
  font-size:0.85rem;
  color:#3a4560;
  cursor:pointer;
  transition:.15s;
  display:inline-flex;
  align-items:center;
  gap:6px;
}
.pg-filter:hover{ background:var(--ivory); }
.pg-filter.active{
  background:var(--ink);
  color:var(--ivory);
  border-color:var(--ink);
}
.pg-filter-count{
  font-size:0.72rem;
  background:rgba(0,0,0,0.08);
  padding:1px 8px;
  border-radius:10px;
}
.pg-filter.active .pg-filter-count{
  background:rgba(255,255,255,0.2);
}

.pg-team-filter{
  padding:8px 12px;
  border:1px solid var(--line);
  border-radius:6px;
  background:#fff;
  font-family:inherit;
  font-size:0.88rem;
  color:var(--ink);
  cursor:pointer;
  min-width:180px;
}

/* ---------- GRID ---------- */
.pg-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));
  gap:14px;
}

.pg-item{
  border:none;
  padding:0;
  background:var(--paper);
  border-radius:8px;
  overflow:hidden;
  cursor:pointer;
  text-align:left;
  font-family:inherit;
  transition:.25s;
  border:1px solid var(--line);
  display:flex;
  flex-direction:column;
}
.pg-item:hover{
  transform:translateY(-3px);
  box-shadow:0 12px 32px rgba(27,42,74,0.15);
  border-color:var(--gold);
}

.pg-item-media{
  position:relative;
  width:100%;
  aspect-ratio:1;
  background:#0d1424;
  overflow:hidden;
  display:flex; align-items:center; justify-content:center;
}
.pg-item-media img,
.pg-item-media video{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}
.pg-video-badge{
  position:absolute;
  top:8px; right:8px;
  background:rgba(27,42,74,0.85);
  color:#fff;
  width:32px; height:32px;
  border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:0.9rem;
  pointer-events:none;
}

.pg-item-meta{
  padding:10px 12px;
  display:flex;
  align-items:center;
  gap:8px;
  background:var(--paper);
  border-top:1px solid var(--line);
  min-width:0;
  flex-wrap:wrap;
}
.pg-team-dot{
  width:9px; height:9px;
  border-radius:50%;
  flex-shrink:0;
}
.pg-team-name{
  font-size:0.82rem;
  font-weight:600;
  color:var(--ink);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  max-width:100px;
}
.pg-item-task{
  font-size:0.72rem;
  color:#7b8399;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  flex:1;
  min-width:0;
}

/* ---------- EMPTY ---------- */
.pg-empty,
.pg-empty-state{
  text-align:center;
  padding:60px 20px;
  color:#7b8399;
}
.pg-empty-state .pg-empty-icon{
  font-size:3rem;
  margin-bottom:14px;
}
.pg-empty-state h2{
  font-size:1.5rem;
  color:var(--ink);
  margin:0 0 8px;
}
.pg-empty-state p{
  font-size:0.95rem;
  max-width:480px;
  margin:0 auto;
  line-height:1.6;
}

/* ---------- LIGHTBOX ---------- */
.pg-lightbox{
  position:fixed;
  inset:0;
  z-index:100;
  background:rgba(13,20,36,0.95);
  backdrop-filter:blur(6px);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:20px;
  animation:pgFadeIn .2s ease;
}
@keyframes pgFadeIn{
  from{ opacity:0; }
  to{ opacity:1; }
}

.pg-lb-close{
  position:absolute;
  top:16px; right:20px;
  width:44px; height:44px;
  background:rgba(255,255,255,0.1);
  color:#fff;
  border:none;
  border-radius:50%;
  font-size:1.6rem;
  cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:.15s;
  z-index:2;
}
.pg-lb-close:hover{ background:#b23b3b; }

.pg-lb-nav{
  position:absolute;
  top:50%;
  transform:translateY(-50%);
  width:56px; height:56px;
  background:rgba(255,255,255,0.1);
  color:#fff;
  border:none;
  border-radius:50%;
  font-size:2.4rem;
  line-height:1;
  cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:.15s;
  z-index:2;
  font-family:'Cormorant Garamond', serif;
  padding-bottom:6px;
}
.pg-lb-nav:hover{ background:var(--gold); }
.pg-lb-nav.prev{ left:20px; }
.pg-lb-nav.next{ right:20px; }

.pg-lb-inner{
  background:var(--paper);
  border-radius:12px;
  max-width:90vw;
  max-height:92vh;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  box-shadow:0 30px 80px rgba(0,0,0,0.5);
}

.pg-lb-media{
  flex:1;
  min-height:0;
  background:#0d1424;
  display:flex; align-items:center; justify-content:center;
  overflow:hidden;
}
.pg-lb-media img,
.pg-lb-media video{
  max-width:88vw;
  max-height:66vh;
  width:auto;
  height:auto;
  display:block;
  object-fit:contain;
}

.pg-lb-info{
  padding:16px 24px 20px;
  background:var(--paper);
  color:var(--ink);
  display:flex;
  flex-direction:column;
  gap:6px;
  border-top:1px solid var(--line);
  min-width:0;
}
.pg-lb-team{
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
}
.pg-lb-team strong{ font-size:1rem; }
.pg-lb-code{
  background:var(--ivory);
  padding:2px 8px;
  border-radius:4px;
  font-size:0.72rem;
  font-family:'Courier New', monospace;
  color:var(--gold);
}
.pg-lb-task{
  font-size:0.88rem;
  color:var(--maroon);
  margin:0;
}
.pg-lb-note{
  font-size:0.85rem;
  color:#3a4560;
  margin:6px 0 0;
  padding:8px 12px;
  background:var(--ivory);
  border-radius:4px;
  line-height:1.5;
}
.pg-lb-date{
  font-size:0.75rem;
  color:#7b8399;
  margin:4px 0 0;
}
.pg-lb-actions{
  margin-top:8px;
  display:flex;
  gap:8px;
  flex-wrap:wrap;
}
.pg-lb-btn{
  display:inline-block;
  padding:8px 16px;
  background:var(--ink);
  color:var(--ivory);
  border-radius:4px;
  text-decoration:none;
  font-size:0.85rem;
  transition:.15s;
}
.pg-lb-btn:hover{ background:var(--maroon); }

/* ---------- MOBILE ---------- */
@media (max-width:640px){
  .pg-grid{
    grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));
    gap:10px;
  }
  .pg-filters{
    top:56px;
    padding:10px 12px;
  }
  .pg-filter{
    padding:6px 12px;
    font-size:0.78rem;
  }
  .pg-team-filter{
    min-width:100%;
    font-size:0.82rem;
  }
  .pg-lb-nav{
    width:44px; height:44px;
    font-size:1.8rem;
  }
  .pg-lb-nav.prev{ left:8px; }
  .pg-lb-nav.next{ right:8px; }
  .pg-lb-info{ padding:12px 16px 16px; }
  .pg-lb-media img,
  .pg-lb-media video{
    max-height:50vh;
  }
}
`;