export default function ScheduleSection({ title, data }) {
  const items = data?.items || [];
  if (items.length === 0)
    return (
      <section className="ev-section">
        <h2>{title || "Schedule"}</h2>
        <p className="ev-empty">Schedule will be published soon.</p>
      </section>
    );

  return (
    <section className="ev-section">
      <h2>{title || "Schedule"}</h2>
      <ul className="schedule-list">
        {items.map((it, i) => (
          <li key={i} className="schedule-item">
            <span className="schedule-time">{it.time}</span>
            <span className="schedule-title">{it.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}