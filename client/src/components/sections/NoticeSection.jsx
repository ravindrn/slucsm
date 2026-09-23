export default function NoticeSection({ title, data }) {
  const notices = data?.notices || [];
  if (notices.length === 0)
    return (
      <section className="ev-section">
        <h2>{title || "Announcements"}</h2>
        <p className="ev-empty">No announcements yet.</p>
      </section>
    );

  return (
    <section className="ev-section">
      <h2>{title || "Announcements"}</h2>
      <ul className="notice-list">
        {notices.map((n, i) => (
          <li key={i} className={n.pinned ? "notice pinned" : "notice"}>
            {n.pinned && <span className="notice-pin">📌</span>}
            <span>{n.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}