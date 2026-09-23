import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { imgUrl } from "../api/axios";

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [slide, setSlide] = useState(0);

  const [settings, setSettings] = useState(null);
  const [archiveEvents, setArchiveEvents] = useState([]);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [committee, setCommittee] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const closeNav = () => setNavOpen(false);

  /* ---------- FETCH DATA ---------- */
  useEffect(() => {
    (async () => {
      try {
        const [s, a, o, c] = await Promise.all([
          api.get("/settings"),
          api.get("/events?status=archive"),
          api.get("/events").then((r) =>
            r.data.filter((e) => e.status === "ongoing" || e.status === "upcoming")
          ),
          api.get("/committee"),
        ]);
        setSettings(s.data);
        setArchiveEvents(a.data);
        setOngoingEvents(o);
        setCommittee(c.data);
      } catch (e) {
        console.error(e);
        setError("Failed to load. Is the backend running on port 5000?");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- SLIDESHOW ---------- */
  const heroImages = settings?.hero?.images || [];

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const id = setInterval(
      () => setSlide((s) => (s + 1) % heroImages.length),
      5000
    );
    return () => clearInterval(id);
  }, [heroImages.length]);

  /* ---------- LOADING / ERROR ---------- */
  if (loading)
    return (
      <div style={{ padding: 80, textAlign: "center", fontFamily: "Inter" }}>
        Loading…
      </div>
    );

  if (error)
    return (
      <div style={{ padding: 80, textAlign: "center", fontFamily: "Inter", color: "#6E2C2C" }}>
        {error}
      </div>
    );

  const hero = settings.hero;
  const about = settings.about;
  const quote = settings.quote;
  const banner = settings.announcement;

  return (
    <div className="slucsm">
      <style>{css}</style>

      {/* ---------- ANNOUNCEMENT BANNER ---------- */}
      {banner?.active && banner?.text && (
        <div className="announcement-banner">{banner.text}</div>
      )}

      <header>
        <Link to="/" className="brand" onClick={closeNav}>
          <img src="/slucsmLogo.png" alt="SLUCSM Logo" className="brand-logo" />
          <span>SLUCSM</span>
        </Link>
        <button
          className="navToggle"
          aria-label="Menu"
          onClick={() => setNavOpen((v) => !v)}
        >
          ☰
        </button>
        <nav className={navOpen ? "open" : ""}>
          <a href="#about" onClick={closeNav}>About</a>
          <a href="#events" onClick={closeNav}>Events</a>
          <a href="#committee" onClick={closeNav}>Committee</a>
          <a href="#contact" onClick={closeNav}>Contact</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          {heroImages.map((src, i) => (
            <div
              key={src + i}
              className={`hero-slide${i === slide ? " active" : ""}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
          <div className="hero-overlay" />
        </div>

        <div className="hero-content">
          <img src="/slucsmLogo.png" alt="SLUCSM Logo" className="hero-logo" />
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1>
            {hero.title.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i < hero.title.split("\n").length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p>{hero.subtitle}</p>
          <div className="btnrow">
            {hero.ctaPrimary?.text && (
              <a href={hero.ctaPrimary.link || "#events"} className="btn solid">
                {hero.ctaPrimary.text}
              </a>
            )}
            {hero.ctaSecondary?.text && (
              <a href={hero.ctaSecondary.link || "#events"} className="btn outline">
                {hero.ctaSecondary.text}
              </a>
            )}
          </div>

          <div className="hero-dots" role="tablist" aria-label="Hero slideshow">
            {heroImages.map((_, i) => (
              <button
                key={i}
                className={`dot${i === slide ? " active" : ""}`}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ABOUT ---------- */}
      <section id="about">
        <div className="motif" />
        <div className="center">
          <p className="kicker">{about.kicker}</p>
          <h2>{about.title}</h2>
          <p className="lead">{about.lead}</p>
        </div>
        <div className="pillars">
          <div className="pillar">
            <h3>Prayer</h3>
            <p>Regular Mass, adoration and shared devotion that anchor student life in Christ.</p>
          </div>
          <div className="pillar">
            <h3>Fellowship</h3>
            <p>Students from different universities meeting as one family, in joy and in service.</p>
          </div>
          <div className="pillar">
            <h3>Formation</h3>
            <p>Seminars and gatherings that deepen faith, leadership and love for the Church.</p>
          </div>
        </div>
      </section>

      {/* ---------- ONGOING EVENTS ---------- */}
      {ongoingEvents.length > 0 && (
        <section id="live-events" className="live-section">
          <div className="motif" />
          <div className="center">
            <p className="kicker live-kicker">● Happening now</p>
            <h2>Live & Upcoming</h2>
            <p className="lead">
              Events taking place right now or about to begin — click to enter.
            </p>
          </div>
          <div className="live-grid">
            {ongoingEvents.map((ev) => (
              <Link
                key={ev._id}
                to={`/events/live/${ev.slug}`}
                className="live-card"
              >
                {ev.coverImage && (
                  <div
                    className="live-card-img"
                    style={{ backgroundImage: `url(${imgUrl(ev.coverImage)})` }}
                  />
                )}
                <div className="live-card-body">
                  <span className={`live-badge ${ev.status}`}>
                    {ev.status === "ongoing" ? "● Happening now" : "Upcoming"}
                  </span>
                  <h3>{ev.title}</h3>
                  <p className="live-when">{ev.when} · {ev.place}</p>
                  <p className="live-desc">{ev.description?.slice(0, 120)}…</p>
                  <span className="live-cta">Enter event →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- ARCHIVE EVENTS ---------- */}
      <section id="events">
        <div className="motif" />
        <div className="center">
          <p className="kicker">Our year together</p>
          <h2>Events of the Movement</h2>
          <p className="lead">
            Four gatherings shape the SLUCSM calendar each year — each one a chance to pray,
            celebrate and reconnect as one family.
          </p>
        </div>

        <div className="event-list">
          {archiveEvents.map((ev) => (
            <div className="event" id={ev.slug} key={ev._id}>
              <div className="when">
                {ev.when}
                <span>{ev.place}</span>
              </div>
              <div>
                {ev.tag && <span className="tag">{ev.tag}</span>}
                <h3>
                  <Link to={`/events/${ev.slug}`} className="event-title-link">
                    {ev.title}
                  </Link>
                </h3>
                {ev.description
                  .split("\n\n")
                  .slice(0, 1)
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                <Link to={`/events/${ev.slug}`} className="read-more">
                  View full event →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- COMMITTEE ---------- */}
      <section id="committee">
        <div className="motif" />
        <div className="center">
          <p className="kicker">This year's team</p>
          <h2>Committee Members</h2>
          <p className="lead">
            The students entrusted with this year's responsibilities — organising, guiding and
            caring for the Movement across every campus.
          </p>
        </div>
        <div className="committee">
          {committee.length === 0 ? (
            <p className="committee-empty">
              Committee members will appear here soon.
            </p>
          ) : (
            committee.map((m) => (
              <div className="member" key={m._id}>
                <div className="avatar">
                  {m.photo ? (
                    <img src={imgUrl(m.photo)} alt={m.name} />
                  ) : (
                    m.initials || "?"
                  )}
                </div>
                <h3>{m.name}</h3>
                <p className="role">{m.role}</p>
                <p className="uni">{m.university}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="quote">
        <blockquote>"{quote.text}"</blockquote>
        <cite>{quote.cite}</cite>
      </div>

      <footer id="contact">
        <div className="brand center">
          <img src="/slucsmLogo.png" alt="SLUCSM Logo" className="brand-logo lg" />
          <span>SLUCSM</span>
        </div>
        <p>Sri Lanka University Catholic Students' Movement</p>
        <div className="links">
          <a href="#about">About</a>
          <a href="#events">Events</a>
          <a href="#committee">Committee</a>
        </div>
        <p>Reach us through your campus chaplaincy or local SLUCSM unit.</p>
      </footer>
    </div>
  );
}

const css = `
/* ==================== GLOBAL RESET ==================== */
html, body, #root{
  margin:0;
  padding:0;
  width:100%;
  max-width:100%;
  overflow-x:hidden;
}
*, *::before, *::after{ box-sizing:border-box; }

/* ==================== SITE ROOT ==================== */
.slucsm{
  --ink:#1B2A4A;
  --ivory:#F8F4E9;
  --gold:#B8912F;
  --maroon:#6E2C2C;
  --sage:#77886A;
  --paper:#FFFDF8;
  --line:rgba(27,42,74,0.14);
  font-family:'Inter',sans-serif; color:var(--ink); background:var(--ivory); line-height:1.65;
  width:100%; max-width:none; margin:0; padding:0; overflow-x:hidden;
}
.slucsm h1,.slucsm h2,.slucsm h3,.slucsm .serif{ font-family:'Cormorant Garamond', serif; }
.slucsm a{ color:inherit; }
.slucsm img{ max-width:100%; display:block; }
.slucsm .motif{ width:1px; height:34px; background:var(--gold); margin:0 auto 18px; position:relative; }
.slucsm .motif::before{ content:""; position:absolute; top:12px; left:-7px; width:15px; height:1px; background:var(--gold); }

/* ==================== ANNOUNCEMENT BANNER ==================== */
.slucsm .announcement-banner{
  background:var(--ink);
  color:var(--ivory);
  text-align:center;
  padding:11px 20px;
  font-size:0.88rem;
  letter-spacing:0.01em;
  line-height:1.5;
}

/* ==================== HEADER ==================== */
.slucsm header{
  position:sticky; top:0; z-index:20;
  background:rgba(248,244,233,0.92); backdrop-filter:blur(6px);
  border-bottom:1px solid var(--line);
  padding:14px 6vw;
  display:flex; align-items:center; justify-content:space-between;
  width:100%;
}
.slucsm .brand{ display:flex; align-items:center; gap:10px; font-family:'Cormorant Garamond',serif; font-size:1.3rem; font-weight:600; text-decoration:none; }
.slucsm .brand.center{ justify-content:center; margin-bottom:14px; }
.slucsm .brand-logo{
  width:40px; height:40px; border-radius:50%; object-fit:contain;
  border:1.4px solid var(--gold); flex:none;
  background:var(--paper);
  image-rendering: -webkit-optimize-contrast;
}
.slucsm .brand-logo.lg{ width:64px; height:64px; }
.slucsm nav{ display:flex; gap:26px; font-size:0.95rem; }
.slucsm nav a{ text-decoration:none; opacity:0.82; border-bottom:1px solid transparent; padding-bottom:2px; }
.slucsm nav a:hover{ opacity:1; border-color:var(--gold); }
.slucsm .navToggle{ display:none; background:none; border:none; font-size:1.6rem; color:var(--ink); cursor:pointer; }
@media (max-width:760px){
  .slucsm nav{ position:fixed; inset:64px 0 0 0; background:var(--ivory); flex-direction:column; align-items:center;
      justify-content:center; gap:28px; font-size:1.15rem; transform:translateX(100%); transition:transform .3s ease; z-index:15; }
  .slucsm nav.open{ transform:translateX(0); }
  .slucsm .navToggle{ display:block; }
}

/* ==================== HERO ==================== */
.slucsm .hero{
  position:relative; overflow:hidden; text-align:center;
  padding:90px 0 100px; min-height:640px;
  width:100vw; max-width:100vw;
  margin-left:calc(50% - 50vw); margin-right:calc(50% - 50vw);
  display:flex; align-items:center; justify-content:center;
  background:var(--ivory);
}
.slucsm .hero-bg{ position:absolute; inset:0; z-index:0; }
.slucsm .hero-slide{
  position:absolute; inset:0;
  background-size:cover; background-position:center;
  opacity:0;
  transition:opacity 1.6s ease-in-out, transform 8s ease-out;
  transform:scale(1.05);
}
.slucsm .hero-slide.active{ opacity:1; transform:scale(1); }
.slucsm .hero-overlay{
  position:absolute; inset:0;
  background:
    linear-gradient(180deg, rgba(248,244,233,0.94) 0%, rgba(248,244,233,0.82) 40%, rgba(248,244,233,0.94) 100%),
    radial-gradient(circle at 50% 30%, rgba(184,145,47,0.14), transparent 70%);
  pointer-events:none;
}
.slucsm .hero-content{
  position:relative; z-index:1;
  max-width:680px; margin:0 auto;
  width:100%;
  padding:20px 6vw 10px;
}
.slucsm .hero-logo{
  width:120px; height:120px; margin:0 auto 26px; border-radius:50%;
  object-fit:contain; border:2px solid var(--gold); background:var(--paper); padding:6px;
  box-shadow:0 8px 28px rgba(184,145,47,0.22), 0 2px 8px rgba(27,42,74,0.08);
}
@media (max-width:640px){
  .slucsm .hero-logo{ width:92px; height:92px; padding:5px; }
  .slucsm .hero-content{ padding:16px 6vw 8px; }
}
.slucsm .hero .eyebrow{ color:var(--maroon); font-size:0.95rem; margin-bottom:10px; letter-spacing:0.02em; }
.slucsm .hero h1{ font-size:clamp(2.2rem,5.6vw,3.8rem); font-weight:600; margin:0 0 20px; line-height:1.08; }
.slucsm .hero p{ max-width:520px; margin:0 auto 34px; font-size:1.05rem; color:#2f3a58; }
.slucsm .btnrow{ display:flex; gap:16px; justify-content:center; flex-wrap:wrap; }
.slucsm .btn{ padding:13px 30px; border-radius:2px; text-decoration:none; font-size:0.95rem; font-weight:500; display:inline-block; border:1px solid var(--ink); transition:.25s; }
.slucsm .btn.solid{ background:var(--ink); color:var(--ivory); }
.slucsm .btn.solid:hover{ background:var(--maroon); border-color:var(--maroon); }
.slucsm .btn.outline{ background:transparent; color:var(--ink); }
.slucsm .btn.outline:hover{ background:var(--ink); color:var(--ivory); }
.slucsm .hero-dots{ display:flex; gap:10px; justify-content:center; margin-top:28px; }
.slucsm .hero-dots .dot{
  width:9px; height:9px; border-radius:50%;
  border:1px solid var(--gold); background:transparent; cursor:pointer; padding:0; transition:.25s;
}
.slucsm .hero-dots .dot:hover{ background:rgba(184,145,47,0.4); }
.slucsm .hero-dots .dot.active{ background:var(--gold); width:26px; border-radius:6px; }

/* ==================== SECTIONS ==================== */
.slucsm section{ padding:90px 6vw; max-width:1080px; margin:0 auto; }
.slucsm .center{ text-align:center; max-width:620px; margin:0 auto 56px; }
.slucsm .kicker{ color:var(--maroon); font-size:0.95rem; margin-bottom:8px; }
.slucsm section h2{ font-size:clamp(1.9rem,4vw,2.6rem); font-weight:600; margin:0 0 14px; }
.slucsm .lead{ color:#3a4560; font-size:1.05rem; }

.slucsm .pillars{ display:grid; grid-template-columns:repeat(3,1fr); gap:34px; margin-top:10px; }
.slucsm .pillar{ border-top:1px solid var(--line); padding-top:20px; }
.slucsm .pillar h3{ font-size:1.35rem; margin:0 0 8px; font-weight:600; }
.slucsm .pillar p{ font-size:0.96rem; color:#4a5470; margin:0; }
@media (max-width:760px){ .slucsm .pillars{ grid-template-columns:1fr; } }

/* ==================== ONGOING / LIVE EVENTS ==================== */
.slucsm .live-section{ background:linear-gradient(180deg, rgba(184,145,47,0.06), rgba(184,145,47,0.02)); }
.slucsm .live-kicker{ color:#b23b3b; font-weight:600; }
.slucsm .live-grid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(280px,1fr)); gap:28px; }
.slucsm .live-card{
  display:block; text-decoration:none; background:var(--paper);
  border:1px solid var(--line); border-radius:6px; overflow:hidden;
  transition:.3s; box-shadow:0 4px 20px rgba(27,42,74,0.05);
}
.slucsm .live-card:hover{ transform:translateY(-3px); box-shadow:0 12px 36px rgba(27,42,74,0.12); }
.slucsm .live-card-img{
  height:180px; background-size:cover; background-position:center;
  background-color:var(--ivory);
}
.slucsm .live-card-body{ padding:22px; }
.slucsm .live-badge{
  display:inline-block; font-size:0.75rem; font-weight:600;
  padding:3px 10px; border-radius:20px; letter-spacing:0.04em;
}
.slucsm .live-badge.ongoing{ background:#b23b3b; color:#fff; }
.slucsm .live-badge.upcoming{ background:var(--gold); color:#fff; }
.slucsm .live-card h3{ font-size:1.4rem; margin:12px 0 6px; font-weight:600; }
.slucsm .live-when{ font-size:0.85rem; color:var(--maroon); margin:0 0 10px; }
.slucsm .live-desc{ font-size:0.9rem; color:#4a5470; margin:0 0 14px; }
.slucsm .live-cta{ font-size:0.9rem; color:var(--gold); font-weight:500; }

/* ==================== EVENT LIST ==================== */
.slucsm .event-list{ display:flex; flex-direction:column; gap:0; }
.slucsm .event{ display:grid; grid-template-columns:150px 1fr; gap:36px; padding:38px 0; border-top:1px solid var(--line); }
.slucsm .event:last-child{ border-bottom:1px solid var(--line); }
.slucsm .event .when{ font-family:'Cormorant Garamond',serif; font-size:1.15rem; color:var(--maroon); padding-top:2px; }
.slucsm .event .when span{ display:block; font-family:'Inter',sans-serif; font-size:0.78rem; color:#6c7590; margin-top:4px; }
.slucsm .event h3{ font-size:1.65rem; margin:0 0 10px; font-weight:600; }
.slucsm .event-title-link{ text-decoration:none; border-bottom:2px solid transparent; transition:.2s; }
.slucsm .event-title-link:hover{ border-color:var(--gold); }
.slucsm .event p{ margin:0 0 10px; color:#3a4560; font-size:0.98rem; max-width:640px; }
.slucsm .tag{ display:inline-block; font-size:0.78rem; color:var(--sage); border:1px solid var(--sage); padding:3px 10px; border-radius:20px; margin-top:6px; margin-bottom:6px; }
.slucsm .read-more{ display:inline-block; font-size:0.9rem; color:var(--gold); text-decoration:none; font-weight:500; margin-top:6px; }
.slucsm .read-more:hover{ color:var(--maroon); }
@media (max-width:640px){ .slucsm .event{ grid-template-columns:1fr; gap:8px; } }

/* ==================== COMMITTEE ==================== */
.slucsm .committee{ display:grid; grid-template-columns:repeat(3,1fr); gap:38px 30px; margin-top:10px; }
.slucsm .member{ text-align:center; }
.slucsm .avatar{
  width:96px; height:96px; border-radius:50%;
  margin:0 auto 16px; background:var(--paper); border:1px solid var(--line);
  display:flex; align-items:center; justify-content:center;
  font-family:'Cormorant Garamond',serif; font-size:1.6rem; color:var(--gold);
  overflow:hidden;
}
.slucsm .avatar img{
  width:100%; height:100%; object-fit:cover;
}
.slucsm .committee-empty{
  grid-column:1 / -1;
  text-align:center; color:#7b8399;
  font-style:italic; margin:0;
}
.slucsm .member h3{ font-size:1.2rem; margin:0 0 4px; font-weight:600; }
.slucsm .member .role{ font-size:0.85rem; color:var(--maroon); margin:0 0 4px; }
.slucsm .member .uni{ font-size:0.82rem; color:#6c7590; margin:0; }
@media (max-width:760px){ .slucsm .committee{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:480px){ .slucsm .committee{ grid-template-columns:1fr; } }

/* ==================== QUOTE + FOOTER ==================== */
.slucsm .quote{ background:var(--ink); color:var(--ivory); text-align:center; padding:90px 6vw; }
.slucsm .quote blockquote{ font-family:'Cormorant Garamond',serif; font-style:italic; font-size:clamp(1.5rem,3vw,2.1rem); max-width:680px; margin:0 auto 16px; font-weight:500; }
.slucsm .quote cite{ font-size:0.9rem; opacity:0.75; font-style:normal; }

.slucsm footer{ padding:60px 6vw 40px; text-align:center; border-top:1px solid var(--line); }
.slucsm footer p{ font-size:0.9rem; color:#5a6380; margin:4px 0; }
.slucsm footer .links{ display:flex; gap:22px; justify-content:center; margin:18px 0; flex-wrap:wrap; font-size:0.9rem; }
.slucsm footer .links a{ text-decoration:none; opacity:0.8; }
.slucsm footer .links a:hover{ opacity:1; color:var(--maroon); }
`;