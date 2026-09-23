import { useEffect, useState } from "react";
import api from "../../api/axios";

const TABS = [
  { key: "hero", label: "Hero" },
  { key: "about", label: "About" },
  { key: "quote", label: "Quote" },
  { key: "contact", label: "Contact" },
  { key: "banner", label: "Announcement" },
];

export default function ManageSettings() {
  const [tab, setTab] = useState("hero");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ---------- LOAD ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/settings");
        /* Ensure nested objects exist so we don't crash on null */
        setSettings({
          hero: {
            eyebrow: "",
            title: "",
            subtitle: "",
            images: [],
            ctaPrimary: { text: "", link: "" },
            ctaSecondary: { text: "", link: "" },
            ...data.hero,
          },
          about: {
            kicker: "",
            title: "",
            lead: "",
            ...data.about,
          },
          quote: {
            text: "",
            cite: "",
            ...data.quote,
          },
          contact: {
            email: "",
            phone: "",
            facebook: "",
            instagram: "",
            youtube: "",
            ...data.contact,
          },
          announcement: {
            text: "",
            active: false,
            ...data.announcement,
          },
        });
      } catch (e) {
        setError("Failed to load settings. Is the backend running?");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- SAVE ---------- */
  const save = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await api.put("/settings", settings);
      setSuccess("Settings saved successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- HELPERS ---------- */
  const update = (section, key, value) => {
    setSettings((s) => ({
      ...s,
      [section]: { ...s[section], [key]: value },
    }));
  };

  if (loading) return <p>Loading settings…</p>;
  if (!settings) return <p>{error || "No settings found."}</p>;

  return (
    <div className="manage-settings">
      <style>{css}</style>

      {/* ---------- HEAD ---------- */}
      <div className="ms-head">
        <div>
          <h1>Site Settings</h1>
          <p className="ms-sub">
            Edit the homepage content. Changes appear instantly on the public site.
          </p>
        </div>
        <div className="ms-head-actions">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="ms-btn ghost"
          >
            View site ↗
          </a>
          <button
            className="ms-btn primary"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {error && <div className="ms-banner error">{error}</div>}
      {success && <div className="ms-banner success">{success}</div>}

      {/* ---------- TABS ---------- */}
      <div className="ms-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`ms-tab${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------- PANELS ---------- */}
      <div className="ms-panel">
        {tab === "hero" && (
          <HeroPanel
            value={settings.hero}
            update={(k, v) => update("hero", k, v)}
          />
        )}
        {tab === "about" && (
          <AboutPanel
            value={settings.about}
            update={(k, v) => update("about", k, v)}
          />
        )}
        {tab === "quote" && (
          <QuotePanel
            value={settings.quote}
            update={(k, v) => update("quote", k, v)}
          />
        )}
        {tab === "contact" && (
          <ContactPanel
            value={settings.contact}
            update={(k, v) => update("contact", k, v)}
          />
        )}
        {tab === "banner" && (
          <BannerPanel
            value={settings.announcement}
            update={(k, v) => update("announcement", k, v)}
          />
        )}
      </div>

      {/* ---------- BOTTOM SAVE ---------- */}
      <div className="ms-foot">
        <button
          className="ms-btn primary"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   HERO PANEL
   ============================================================ */
function HeroPanel({ value, update }) {
  const images = value.images || [];

  const updateImage = (i, url) => {
    const next = [...images];
    next[i] = url;
    update("images", next);
  };

  const addImage = () => update("images", [...images, ""]);
  const removeImage = (i) =>
    update(
      "images",
      images.filter((_, idx) => idx !== i)
    );
  const moveImage = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    update("images", next);
  };

  return (
    <div className="panel">
      <h2>Hero section</h2>
      <p className="panel-sub">
        The top banner of the homepage — text, images, and buttons.
      </p>

      <div className="grid">
        <Field label="Eyebrow (small text above title)">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => update("eyebrow", e.target.value)}
            placeholder="Sri Lanka University Catholic Students' Movement"
          />
        </Field>

        <Field label="Title" full>
          <textarea
            rows={3}
            value={value.title || ""}
            onChange={(e) => update("title", e.target.value)}
            placeholder={"Faith that gathers us,\nfriendship that carries us."}
          />
          <p className="hint">
            Use line breaks to split the headline onto multiple lines.
          </p>
        </Field>

        <Field label="Subtitle" full>
          <textarea
            rows={3}
            value={value.subtitle || ""}
            onChange={(e) => update("subtitle", e.target.value)}
            placeholder="A community of Catholic undergraduates..."
          />
        </Field>

        <Field label="Primary CTA — button text">
          <input
            type="text"
            value={value.ctaPrimary?.text || ""}
            onChange={(e) =>
              update("ctaPrimary", { ...value.ctaPrimary, text: e.target.value })
            }
            placeholder="This Year's National Seminar"
          />
        </Field>

        <Field label="Primary CTA — link">
          <input
            type="text"
            value={value.ctaPrimary?.link || ""}
            onChange={(e) =>
              update("ctaPrimary", { ...value.ctaPrimary, link: e.target.value })
            }
            placeholder="#events"
          />
        </Field>

        <Field label="Secondary CTA — button text">
          <input
            type="text"
            value={value.ctaSecondary?.text || ""}
            onChange={(e) =>
              update("ctaSecondary", {
                ...value.ctaSecondary,
                text: e.target.value,
              })
            }
            placeholder="See All Events"
          />
        </Field>

        <Field label="Secondary CTA — link">
          <input
            type="text"
            value={value.ctaSecondary?.link || ""}
            onChange={(e) =>
              update("ctaSecondary", {
                ...value.ctaSecondary,
                link: e.target.value,
              })
            }
            placeholder="#events"
          />
        </Field>
      </div>

      <h3 className="sub-head">Hero images (slideshow)</h3>
      <p className="panel-sub">
        Add image URLs — they cycle automatically every 5 seconds.
      </p>

      <div className="image-list">
        {images.length === 0 && (
          <p className="empty-note">No images yet.</p>
        )}
        {images.map((url, i) => (
          <div key={i} className="image-row">
            <div className="image-preview">
              {url ? (
                <img src={url} alt={`Hero ${i + 1}`} />
              ) : (
                <div className="image-placeholder">No URL</div>
              )}
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => updateImage(i, e.target.value)}
              placeholder="/hero/hero1.jpg or https://..."
              className="image-url-input"
            />
            <div className="image-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={() => moveImage(i, -1)}
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => moveImage(i, 1)}
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => removeImage(i)}
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="add-btn" onClick={addImage}>
        + Add hero image
      </button>
    </div>
  );
}

/* ============================================================
   ABOUT PANEL
   ============================================================ */
function AboutPanel({ value, update }) {
  return (
    <div className="panel">
      <h2>About section</h2>
      <p className="panel-sub">
        The "Who we are" block on the homepage.
      </p>

      <div className="grid">
        <Field label="Kicker (small text above heading)">
          <input
            type="text"
            value={value.kicker || ""}
            onChange={(e) => update("kicker", e.target.value)}
            placeholder="Who we are"
          />
        </Field>

        <Field label="Heading">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => update("title", e.target.value)}
            placeholder="One movement, every campus"
          />
        </Field>

        <Field label="Lead paragraph" full>
          <textarea
            rows={5}
            value={value.lead || ""}
            onChange={(e) => update("lead", e.target.value)}
            placeholder="SLUCSM brings together..."
          />
        </Field>
      </div>
    </div>
  );
}

/* ============================================================
   QUOTE PANEL
   ============================================================ */
function QuotePanel({ value, update }) {
  return (
    <div className="panel">
      <h2>Quote section</h2>
      <p className="panel-sub">
        The dark banner with a scripture quote.
      </p>

      <div className="grid">
        <Field label="Quote text" full>
          <textarea
            rows={4}
            value={value.text || ""}
            onChange={(e) => update("text", e.target.value)}
            placeholder="Where two or three gather in my name, there am I with them."
          />
        </Field>

        <Field label="Citation">
          <input
            type="text"
            value={value.cite || ""}
            onChange={(e) => update("cite", e.target.value)}
            placeholder="Matthew 18:20"
          />
        </Field>
      </div>
    </div>
  );
}

/* ============================================================
   CONTACT PANEL
   ============================================================ */
function ContactPanel({ value, update }) {
  return (
    <div className="panel">
      <h2>Contact information</h2>
      <p className="panel-sub">
        Shown in the footer and used for communications.
      </p>

      <div className="grid">
        <Field label="Email">
          <input
            type="email"
            value={value.email || ""}
            onChange={(e) => update("email", e.target.value)}
            placeholder="info@slucsm.lk"
          />
        </Field>

        <Field label="Phone">
          <input
            type="text"
            value={value.phone || ""}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+94 XX XXX XXXX"
          />
        </Field>

        <Field label="Facebook URL" full>
          <input
            type="url"
            value={value.facebook || ""}
            onChange={(e) => update("facebook", e.target.value)}
            placeholder="https://facebook.com/slucsm"
          />
        </Field>

        <Field label="Instagram URL" full>
          <input
            type="url"
            value={value.instagram || ""}
            onChange={(e) => update("instagram", e.target.value)}
            placeholder="https://instagram.com/slucsm"
          />
        </Field>

        <Field label="YouTube URL" full>
          <input
            type="url"
            value={value.youtube || ""}
            onChange={(e) => update("youtube", e.target.value)}
            placeholder="https://youtube.com/@slucsm"
          />
        </Field>
      </div>
    </div>
  );
}

/* ============================================================
   BANNER PANEL
   ============================================================ */
function BannerPanel({ value, update }) {
  return (
    <div className="panel">
      <h2>Announcement banner</h2>
      <p className="panel-sub">
        A slim banner at the top of every public page. Great for time-sensitive
        announcements.
      </p>

      <div className="grid">
        <Field label="Status" full>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={!!value.active}
              onChange={(e) => update("active", e.target.checked)}
            />
            <span>Show banner on public site</span>
          </label>
        </Field>

        <Field label="Banner text" full>
          <textarea
            rows={2}
            value={value.text || ""}
            onChange={(e) => update("text", e.target.value)}
            placeholder="National Seminar 2026 registrations close on Feb 10!"
          />
        </Field>
      </div>

      {value.active && value.text && (
        <div className="banner-preview">
          <p className="preview-label">Live preview</p>
          <div className="preview-banner">{value.text}</div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SHARED FIELD WRAPPER
   ============================================================ */
function Field({ label, children, full }) {
  return (
    <div className={`field${full ? " full" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

/* ============================================================
   CSS
   ============================================================ */
const css = `
.manage-settings{ color:#1B2A4A; max-width:900px; }

.ms-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:16px; flex-wrap:wrap; margin-bottom:20px;
}
.ms-head h1{
  font-family:'Cormorant Garamond', serif;
  font-size:2rem; font-weight:600; margin:0 0 6px;
}
.ms-sub{ color:#5a6380; font-size:0.9rem; margin:0; }
.ms-head-actions{ display:flex; gap:10px; flex-wrap:wrap; }

.ms-btn{
  padding:10px 20px; border-radius:4px;
  border:1px solid rgba(27,42,74,0.18);
  background:transparent; color:#1B2A4A;
  font-family:inherit; font-size:0.9rem;
  cursor:pointer; transition:.15s;
  text-decoration:none;
  display:inline-block;
}
.ms-btn:hover:not(:disabled){ background:#F8F4E9; }
.ms-btn.primary{ background:#1B2A4A; color:#F8F4E9; border-color:#1B2A4A; }
.ms-btn.primary:hover:not(:disabled){ background:#6E2C2C; border-color:#6E2C2C; }
.ms-btn.ghost{ background:transparent; }
.ms-btn:disabled{ opacity:0.6; cursor:wait; }

.ms-banner{
  padding:12px 18px; border-radius:4px;
  font-size:0.9rem; margin-bottom:16px;
}
.ms-banner.error{
  background:#fff2f0; color:#b23b3b; border:1px solid #f0c8c2;
}
.ms-banner.success{
  background:#E3F3E5; color:#2e7d32; border:1px solid #bfe0c4;
}

.ms-tabs{
  display:flex; gap:4px; margin-bottom:20px;
  border-bottom:1px solid rgba(27,42,74,0.14);
  flex-wrap:wrap;
}
.ms-tab{
  padding:11px 18px;
  background:transparent;
  border:none;
  border-bottom:2px solid transparent;
  color:#5a6380;
  font-family:inherit; font-size:0.9rem;
  cursor:pointer; transition:.15s;
  margin-bottom:-1px;
}
.ms-tab:hover{ color:#1B2A4A; }
.ms-tab.active{
  color:#1B2A4A;
  border-bottom-color:#B8912F;
  font-weight:500;
}

.ms-panel{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:28px;
  margin-bottom:24px;
}
.panel h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.5rem; font-weight:600;
  margin:0 0 6px;
}
.panel-sub{
  color:#5a6380; font-size:0.9rem;
  margin:0 0 22px;
}
.sub-head{
  font-family:'Cormorant Garamond', serif;
  font-size:1.2rem; font-weight:600;
  margin:32px 0 6px;
}

.grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:18px;
}
@media (max-width:700px){
  .grid{ grid-template-columns:1fr; }
}
.field{ display:flex; flex-direction:column; gap:6px; }
.field.full{ grid-column:1 / -1; }
.field label{
  font-size:0.82rem; font-weight:500;
  color:#3a4560;
}
.field input, .field textarea{
  padding:10px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  font-family:inherit; font-size:0.92rem;
  background:#fff; color:#1B2A4A;
  transition:border-color .15s, box-shadow .15s;
}
.field textarea{ resize:vertical; }
.field input:focus, .field textarea:focus{
  outline:none; border-color:#B8912F;
  box-shadow:0 0 0 3px rgba(184,145,47,0.12);
}
.field .hint{
  font-size:0.78rem; color:#7b8399;
  margin:0;
}

/* Toggle row */
.toggle-row{
  display:flex; align-items:center; gap:10px;
  font-size:0.9rem; cursor:pointer;
  color:#3a4560;
}

/* Image list */
.image-list{
  display:flex; flex-direction:column; gap:12px;
  margin-bottom:16px;
}
.empty-note{ color:#7b8399; font-style:italic; font-size:0.9rem; margin:0; }
.image-row{
  display:grid;
  grid-template-columns:80px 1fr auto;
  gap:12px; align-items:center;
}
.image-preview{
  width:80px; height:60px;
  border-radius:4px;
  overflow:hidden;
  background:#F8F4E9;
  border:1px solid rgba(27,42,74,0.14);
  display:flex; align-items:center; justify-content:center;
}
.image-preview img{
  width:100%; height:100%; object-fit:cover;
}
.image-placeholder{
  font-size:0.7rem; color:#7b8399;
}
.image-url-input{
  padding:10px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  font-family:inherit; font-size:0.9rem;
  background:#fff;
}
.image-url-input:focus{
  outline:none; border-color:#B8912F;
  box-shadow:0 0 0 3px rgba(184,145,47,0.12);
}
.image-actions{
  display:flex; gap:4px;
}
.icon-btn{
  width:30px; height:30px;
  border:1px solid rgba(27,42,74,0.14);
  background:#fff; border-radius:3px;
  cursor:pointer; font-size:0.85rem;
  font-family:inherit;
}
.icon-btn:hover{ background:#F8F4E9; }
.icon-btn.danger{ color:#b23b3b; border-color:#f0c8c2; }
.icon-btn.danger:hover{ background:#fff2f0; }

.add-btn{
  padding:9px 18px;
  background:#F8F4E9;
  border:1px dashed rgba(27,42,74,0.22);
  border-radius:3px;
  font-family:inherit; font-size:0.88rem;
  color:#1B2A4A; cursor:pointer;
  transition:.15s;
}
.add-btn:hover{
  background:#B8912F; color:#fff;
  border-style:solid; border-color:#B8912F;
}

/* Banner preview */
.banner-preview{
  margin-top:24px;
  padding-top:20px;
  border-top:1px solid rgba(27,42,74,0.08);
}
.preview-label{
  font-size:0.78rem; color:#7b8399;
  text-transform:uppercase; letter-spacing:0.05em;
  margin:0 0 10px;
}
.preview-banner{
  background:#1B2A4A;
  color:#F8F4E9;
  padding:10px 20px;
  border-radius:3px;
  font-size:0.9rem;
  text-align:center;
}

/* Bottom foot */
.ms-foot{
  display:flex; justify-content:flex-end;
  padding-top:8px;
}
`;