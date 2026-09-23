export default function HistorySection({ title, data }) {
  const entries = data?.entries || [];
  if (entries.length === 0)
    return (
      <section className="ev-section">
        <h2>{title || "History"}</h2>
        <p className="ev-empty">History will be added soon.</p>
      </section>
    );

  return (
    <section className="ev-section">
      <h2>{title || "History"}</h2>
      <ul className="history-list">
        {entries.map((e, i) => (
          <li key={i} className="history-item">
            <span className="history-year">{e.year}</span>
            <span className="history-note">{e.note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}