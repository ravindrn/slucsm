import React from "react";

/* Convert legacy plain text to HTML paragraphs */
const toHtml = (text) => {
  if (!text) return "";
  const str = String(text);
  if (str.trim().startsWith("<")) return str;
  const escaped = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
  return `<p>${escaped}</p>`;
};

export default function NoticeSection({ title, data }) {
  const notices = data?.notices || [];

  if (notices.length === 0) {
    return (
      <section className="ev-section">
        <h2>{title || "Announcements"}</h2>
        <p className="ev-empty">No announcements yet.</p>
      </section>
    );
  }

  return (
    <section className="ev-section">
      <h2>{title || "Announcements"}</h2>
      <ul className="notice-list">
        {notices.map((n, i) => (
          <li key={i} className={n.pinned ? "notice pinned" : "notice"}>
            {n.pinned && <span className="notice-pin">📌</span>}
            <div
              className="notice-body"
              dangerouslySetInnerHTML={{ __html: toHtml(n.text) }}
            />
          </li>
        ))}
      </ul>

      <style>{`
        /* ============================================================
           NOTICE BODY — responsive rich text
           ============================================================ */
        .notice-body {
          flex: 1;
          min-width: 0;                    /* allows text to shrink/wrap */
          color: #3a4560;
          font-size: 0.98rem;
          line-height: 1.65;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          overflow-x: hidden;
        }

        /* ---------- Paragraphs ---------- */
        .notice-body p {
          margin: 0 0 12px;
        }
        .notice-body p:last-child {
          margin-bottom: 0;
        }

        /* ---------- Headings ---------- */
        .notice-body h1,
        .notice-body h2,
        .notice-body h3,
        .notice-body h4 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          color: #1B2A4A;
          line-height: 1.25;
          margin: 20px 0 10px;
          word-wrap: break-word;
        }
        .notice-body h1 { font-size: 1.35rem; }
        .notice-body h2 { font-size: 1.2rem; }
        .notice-body h3 { font-size: 1.08rem; }
        .notice-body h4 { font-size: 1rem; }

        .notice-body > h1:first-child,
        .notice-body > h2:first-child,
        .notice-body > h3:first-child,
        .notice-body > h4:first-child {
          margin-top: 0;
        }

        /* ---------- Lists ---------- */
        .notice-body ul,
        .notice-body ol {
          margin: 8px 0 14px;
          padding-left: 22px;
        }
        .notice-body ul li {
          list-style: disc;
          margin-bottom: 6px;
          padding-left: 2px;
        }
        .notice-body ol li {
          list-style: decimal;
          margin-bottom: 6px;
          padding-left: 2px;
        }
        .notice-body li > p {
          margin: 0 0 4px;
        }
        .notice-body li:last-child {
          margin-bottom: 0;
        }

        /* Nested lists */
        .notice-body ul ul,
        .notice-body ol ol,
        .notice-body ul ol,
        .notice-body ol ul {
          margin: 6px 0 6px;
          padding-left: 20px;
        }

        /* ---------- Inline formatting ---------- */
        .notice-body strong,
        .notice-body b {
          color: #1B2A4A;
          font-weight: 600;
        }
        .notice-body em,
        .notice-body i {
          font-style: italic;
        }
        .notice-body u {
          text-decoration: underline;
        }
        .notice-body s,
        .notice-body strike {
          text-decoration: line-through;
          opacity: 0.7;
        }

        /* ---------- Blockquote ---------- */
        .notice-body blockquote {
          border-left: 3px solid #B8912F;
          padding-left: 14px;
          margin: 12px 0;
          color: #6c7590;
          font-style: italic;
          background: #fdfaf1;
          padding: 10px 14px;
          border-radius: 0 4px 4px 0;
        }

        /* ---------- Links ---------- */
        .notice-body a {
          color: #B8912F;
          text-decoration: underline;
          word-break: break-word;
        }
        .notice-body a:hover {
          color: #6E2C2C;
        }

        /* ---------- Images (if any) ---------- */
        .notice-body img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 8px 0;
          display: block;
        }

        /* ---------- Quill-specific classes ---------- */
        .notice-body .ql-align-center { text-align: center; }
        .notice-body .ql-align-right { text-align: right; }
        .notice-body .ql-align-justify { text-align: justify; }

        /* ---------- Tables (if any) ---------- */
        .notice-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          font-size: 0.9rem;
          display: block;
          overflow-x: auto;
        }
        .notice-body th,
        .notice-body td {
          border: 1px solid rgba(27,42,74,0.14);
          padding: 6px 10px;
          text-align: left;
        }

        /* ============================================================
           MOBILE — tighter spacing, smaller fonts, no overflow
           ============================================================ */
        @media (max-width: 640px) {
          .notice-body {
            font-size: 0.92rem;
            line-height: 1.6;
          }

          .notice-body p {
            margin: 0 0 10px;
          }

          .notice-body h1 { font-size: 1.2rem; margin: 16px 0 8px; }
          .notice-body h2 { font-size: 1.1rem; margin: 14px 0 8px; }
          .notice-body h3 { font-size: 1.02rem; margin: 12px 0 6px; }
          .notice-body h4 { font-size: 0.96rem; margin: 10px 0 6px; }

          .notice-body ul,
          .notice-body ol {
            margin: 6px 0 12px;
            padding-left: 20px;
          }
          .notice-body ul li,
          .notice-body ol li {
            margin-bottom: 5px;
          }

          .notice-body blockquote {
            margin: 10px 0;
            padding: 8px 12px;
            font-size: 0.9rem;
          }
        }

        @media (max-width: 420px) {
          .notice-body {
            font-size: 0.88rem;
          }
          .notice-body ul,
          .notice-body ol {
            padding-left: 18px;
          }
        }
      `}</style>
    </section>
  );
}