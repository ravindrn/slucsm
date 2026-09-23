import { imgUrl } from "../../api/axios";

export default function GallerySection({ title, data }) {
  const photos = data?.photos || [];
  if (photos.length === 0)
    return (
      <section className="ev-section">
        <h2>{title || "Gallery"}</h2>
        <p className="ev-empty">Photos will appear here soon.</p>
      </section>
    );

  return (
    <section className="ev-section">
      <h2>{title || "Gallery"}</h2>
      <div className="gallery-grid">
        {photos.map((p, i) => {
          const src = typeof p === "string" ? p : p.url;
          const caption = typeof p === "object" ? p.caption : "";
          return (
            <figure key={i} className="gallery-item">
              <img src={imgUrl(src)} alt={caption || `Photo ${i + 1}`} loading="lazy" />
              {caption && <figcaption>{caption}</figcaption>}
            </figure>
          );
        })}
      </div>
    </section>
  );
}