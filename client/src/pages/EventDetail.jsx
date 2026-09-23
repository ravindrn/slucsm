import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { imgUrl } from "../api/axios";
import EventNav from "../components/EventNav";
import SectionRenderer from "../components/sections";
import EventNotFound from "./EventNotFound";

export default function EventDetail() {
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

  if (loading) return <LoadingScreen />;
  if (notFound || !event) return <EventNotFound />;

  const sections = [...(event.sections || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  return (
    <div className="slucsm event-page">
      <style>{css}</style>
      <EventNav backTo="/#events" backLabel="← Back to Events" />

      <header className="ev-hero">
        {event.coverImage && (
          <div
            className="ev-hero-bg"
            style={{ backgroundImage: `url(${imgUrl(event.coverImage)})` }}
          />
        )}
        <div className="ev-hero-overlay" />
        <div className="ev-hero-content">
          {event.tag && <span className="ev-tag">{event.tag}</span>}
          <h1>{event.title}</h1>
          <p className="ev-meta">
            {event.when} {event.place && `· ${event.place}`}
          </p>
        </div>
      </header>

      <main className="ev-main">
        {event.description && (
          <section className="ev-section">
            <h2>About this event</h2>
            {event.description.split("\n\n").map((p, i) => (
              <p key={i} className="ev-paragraph">{p}</p>
            ))}
          </section>
        )}

        {sections.map((s) => (
          <SectionRenderer key={s._id} section={s} eventSlug={event.slug} />
        ))}

        <section className="ev-section ev-back-bottom">
          <Link to="/#events" className="btn outline">
            ← Back to all events
          </Link>
        </section>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ padding: 100, textAlign: "center", fontFamily: "Inter" }}>
      Loading event…
    </div>
  );
}

const css = `
html, body, #root{ margin:0; padding:0; width:100%; overflow-x:hidden; }
*, *::before, *::after{ box-sizing:border-box; }
.slucsm.event-page{
  --ink:#1B2A4A; --ivory:#F8F4E9; --gold:#B8912F; --maroon:#6E2C2C;
  --sage:#77886A; --paper:#FFFDF8; --line:rgba(27,42,74,0.14);
  font-family:'Inter',sans-serif; color:var(--ink); background:var(--ivory); line-height:1.65;
  min-height:100vh;
}
.slucsm.event-page h1,.slucsm.event-page h2,.slucsm.event-page h3{
  font-family:'Cormorant Garamond', serif;
}


.ev-hero{
  position:relative;
  min-height:420px; padding:90px 6vw 70px;
  display:flex; flex-direction:column; justify-content:flex-end;
  text-align:center; overflow:hidden;
  background:linear-gradient(180deg, #F2ECDB, var(--ivory));
}
.ev-hero-bg{
  position:absolute; inset:0;
  background-size:cover; background-position:center;
}
.ev-hero-overlay{
  position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(248,244,233,0.55), rgba(248,244,233,0.92));
}
.ev-hero-content{ position:relative; z-index:1; max-width:820px; margin:0 auto; }
.ev-tag{
  display:inline-block; font-size:0.8rem; color:var(--sage);
  border:1px solid var(--sage); padding:4px 12px; border-radius:20px;
  margin-bottom:14px;
}
.ev-hero h1{ font-size:clamp(2.2rem,5vw,3.4rem); font-weight:600; margin:0 0 12px; line-height:1.1; }
.ev-meta{ font-size:1rem; color:var(--maroon); margin:0; }

.ev-main{
  max-width:900px; margin:0 auto;
  padding:60px 6vw 100px;
}
.ev-section{ margin-bottom:56px; }
.ev-section h2{
  font-size:clamp(1.6rem,3vw,2.2rem); font-weight:600;
  margin:0 0 20px; padding-bottom:12px;
  border-bottom:1px solid var(--line);
}
.ev-paragraph{ color:#3a4560; font-size:1.02rem; margin:0 0 14px; }
.ev-empty{ color:#7b8399; font-style:italic; }

.notice-list{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; }
.notice{
  background:var(--paper); border:1px solid var(--line); border-left:3px solid var(--gold);
  padding:14px 18px; border-radius:4px;
  display:flex; gap:10px; align-items:flex-start; font-size:0.98rem;
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
.history-item:last-child{ border-bottom:none; }
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
.custom-html img{ max-width:100%; border-radius:4px; }

.ev-back-bottom{ text-align:center; margin-top:80px; }
`;