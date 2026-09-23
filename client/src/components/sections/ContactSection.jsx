export default function ContactSection({ title, data }) {
  return (
    <section className="ev-section">
      <h2>{title || "Contact"}</h2>
      <ul className="contact-list">
        {data?.name && (
          <li>
            <strong>{data.name}</strong>
            {data.role ? ` — ${data.role}` : ""}
          </li>
        )}
        {data?.email && (
          <li>
            ✉️ <a href={`mailto:${data.email}`}>{data.email}</a>
          </li>
        )}
        {data?.phone && <li>📞 {data.phone}</li>}
      </ul>
    </section>
  );
}