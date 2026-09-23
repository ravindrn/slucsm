export default function CustomSection({ title, data }) {
  return (
    <section className="ev-section">
      {title && <h2>{title}</h2>}
      {data?.html ? (
        <div
          className="custom-html"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />
      ) : (
        <p className="ev-empty">No content.</p>
      )}
    </section>
  );
}