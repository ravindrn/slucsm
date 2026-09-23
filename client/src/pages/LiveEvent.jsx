import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { imgUrl } from "../api/axios";
import EventNav from "../components/EventNav";
import SectionRenderer from "../components/sections";
import EventNotFound from "./EventNotFound";

export default function LiveEvent() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/events/${slug}`)
      .then((r) => setEvent(r.data))
      .catch((e) => {
        if (e.response?.status === 404) setNotFound(true);
        else console.error(e);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading)
    return (
      <div style={{ padding: 100, textAlign: "center", fontFamily: "Inter" }}>
        Loading…
      </div>
    );
  if (notFound || !event) return <EventNotFound />;

  const sections = [...(event.sections || [])]
    .filter((s) => s.enabled)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="slucsm live-event-page">
      <style>{css}</style>
      <EventNav backTo="/#live-events" backLabel="← Back to Live Events" />

      <header className="lv-hero">
        {event.coverImage && (
          <div
            className="lv-hero-bg"
            style={{ backgroundImage: `url(${imgUrl(event.coverImage)})` }}
          />
        )}
        <div className="lv-hero-overlay" />
        <div className="lv-hero-content">
          <span className={`lv-badge ${event.status}`}>
            {event.status === "ongoing" ? "● Happening now" : "Upcoming"}
          </span>
          <h1>{event.title}</h1>
          <p className="lv-meta">
            {event.when} {event.place && `· ${event.place}`}
          </p>
          <Link
            to={`/events/live/${slug}/scoreboard`}
            className="lv-scoreboard-btn"
          >
            🏆 View Live Scoreboard
          </Link>
        </div>
      </header>

      <main className="lv-main">
        {event.description && (
          <p className="lv-lead">{event.description.split("\n\n")[0]}</p>
        )}

        {sections.map((s) => (
          <SectionRenderer key={s._id} section={s} eventSlug={event.slug} />
        ))}
      </main>
    </div>
  );
}

const css = `
html, body, #root{ margin:0; padding:0; width:100%; overflow-x:hidden; }
*, *::before, *::after{ box-sizing:border-box; }
.slucsm.live-event-page{
  --ink:#1B2A4A; --ivory:#F8F4E9; --gold:#B8912F; --maroon:#6E2C2C;
  --sage:#77886A; --paper:#FFFDF8; --line:rgba(27,42,74,0.14);
  font-family:'Inter',sans-serif; color:var(--ink); background:var(--ivory); line-height:1.65;
  min-height:100vh;
}
.slucsm.live-event-page h1,.slucsm.live-event-page h2,.slucsm.live-event-page h3{
  font-family:'Cormorant Garamond', serif;
}

.lv-hero{
  position:relative;
  min-height:360px; padding:80px 6vw 60px;
  display:flex; flex-direction:column; justify-content:flex-end;
  text-align:center; overflow:hidden;
  background:linear-gradient(180deg, #F2ECDB, var(--ivory));
}
.lv-hero-bg{
  position:absolute; inset:0;
  background-size:cover; background-position:center;
}
.lv-hero-overlay{
  position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(248,244,233,0.55), rgba(248,244,233,0.94));
}
.lv-hero-content{ position:relative; z-index:1; max-width:820px; margin:0 auto; }
.lv-badge{
  display:inline-block; font-size:0.8rem; font-weight:600;
  padding:5px 14px; border-radius:20px; letter-spacing:0.04em;
  margin-bottom:14px;
}
.lv-badge.ongoing{ background:#b23b3b; color:#fff; }
.lv-badge.upcoming{ background:var(--gold); color:#fff; }
.lv-hero h1{ font-size:clamp(2rem,4.6vw,3.2rem); font-weight:600; margin:0 0 12px; }
.lv-meta{ font-size:1rem; color:var(--maroon); margin:0 0 20px; }

.lv-scoreboard-btn{
  display:inline-block;
  margin-top:6px;
  padding:13px 28px;
  background:var(--ink);
  color:var(--ivory);
  border-radius:2px;
  text-decoration:none;
  font-size:0.95rem;
  font-weight:500;
  border:1px solid var(--ink);
  transition:.25s;
}
.lv-scoreboard-btn:hover{
  background:var(--maroon);
  border-color:var(--maroon);
}

.lv-main{
  max-width:900px; margin:0 auto;
  padding:50px 6vw 100px;
}
.lv-lead{
  font-size:1.1rem; color:#3a4560; text-align:center;
  max-width:680px; margin:0 auto 60px;
  font-family:'Cormorant Garamond',serif; font-style:italic;
}

.ev-section{ margin-bottom:56px; }
.ev-section h2{
  font-size:clamp(1.5rem,3vw,2rem); font-weight:600;
  margin:0 0 20px; padding-bottom:12px;
  border-bottom:1px solid var(--line);
}
.ev-empty{ color:#7b8399; font-style:italic; }

.notice-list{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; }
.notice{
  background:var(--paper); border:1px solid var(--line); border-left:3px solid var(--gold);
  padding:14px 18px; border-radius:4px;
  display:flex; gap:10px; align-items:flex-start;
}
.notice.pinned{ border-left-color:#b23b3b; background:#fff8f5; }
.notice-pin{ font-size:1rem; }

.schedule-list{ list-style:none; padding:0; margin:0; }
.schedule-item{
  display:grid; grid-template-columns:120px 1fr; gap:20px;
  padding:14px 0; border-bottom:1px solid var(--line);
}
.schedule-item:last-child{ border-bottom:none; }
.schedule-time{ font-family:'Cormorant Garamond',serif; color:var(--maroon); font-weight:600; font-size:1.05rem; }
.schedule-title{ color:#3a4560; }

.history-list{ list-style:none; padding:0; margin:0; }
.history-item{
  display:grid; grid-template-columns:90px 1fr; gap:20px;
  padding:16px 0; border-bottom:1px solid var(--line);
}
.history-year{ font-family:'Cormorant Garamond',serif; font-size:1.3rem; color:var(--gold); font-weight:600; }
.history-note{ color:#3a4560; }

.reg-block{ background:var(--paper); border:1px solid var(--line); padding:24px; border-radius:4px; }
.reg-desc{ margin:0 0 16px; color:#3a4560; }
.btn{ display:inline-block; padding:12px 26px; border-radius:2px; text-decoration:none; font-size:0.95rem; border:1px solid var(--ink); transition:.25s; }
.btn.solid{ background:var(--ink); color:var(--ivory); }
.btn.solid:hover{ background:var(--maroon); border-color:var(--maroon); }
.btn.outline{ background:transparent; color:var(--ink); }
.btn.outline:hover{ background:var(--ink); color:var(--ivory); }

.gallery-grid{
  display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
  gap:14px;
}
.gallery-item{
  margin:0; border-radius:4px; overflow:hidden;
  background:var(--paper); border:1px solid var(--line);
}
.gallery-item img{ width:100%; height:180px; object-fit:cover; display:block; }
.gallery-item figcaption{ font-size:0.8rem; padding:8px 10px; color:#6c7590; }

.contact-list{ list-style:none; padding:0; margin:0; }
.contact-list li{ padding:8px 0; }
.custom-html{ color:#3a4560; }
`;