import React from "react";

/* Convert legacy plain text to HTML paragraphs */
const toHtml = (text) => {
  if (!text) return "";
  const str = String(text);
  /* If it already looks like HTML, use as-is */
  if (str.trim().startsWith("<")) return str;
  /* Otherwise escape and wrap in a paragraph */
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
        .notice-body {
          flex: 1;
          color: #3a4560;
          font-size: 0.98rem;
          line-height: 1.65;
        }
        .notice-body p {
          margin: 0 0 10px;
        }
        .notice-body p:last-child {
          margin-bottom: 0;
        }
        .notice-body h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1B2A4A;
          margin: 16px 0 8px;
        }
        .notice-body h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1B2A4A;
          margin: 14px 0 6px;
        }
        .notice-body h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: #1B2A4A;
          margin: 12px 0 6px;
        }
        .notice-body ul,
        .notice-body ol {
          margin: 8px 0 12px;
          padding-left: 24px;
        }
        .notice-body ul li {
          list-style: disc;
          margin-bottom: 4px;
        }
        .notice-body ol li {
          list-style: decimal;
          margin-bottom: 4px;
        }
        .notice-body strong {
          color: #1B2A4A;
          font-weight: 600;
        }
        .notice-body em {
          font-style: italic;
        }
        .notice-body blockquote {
          border-left: 3px solid #B8912F;
          padding-left: 14px;
          margin: 12px 0;
          color: #6c7590;
          font-style: italic;
        }
        .notice-body a {
          color: #B8912F;
          text-decoration: underline;
        }
        .notice-body a:hover {
          color: #6E2C2C;
        }
      `}</style>
    </section>
  );
}