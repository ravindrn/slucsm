export default function GalleryEditor({ data, onChange }) {
  const photos = data?.photos || [];

  const update = (i, key, val) => {
    const next = [...photos];
    next[i] = typeof next[i] === "object" ? { ...next[i], [key]: val } : { url: next[i] };
    onChange({ ...data, photos: next });
  };

  const add = () => onChange({ ...data, photos: [...photos, { url: "", caption: "" }] });
  const remove = (i) =>
    onChange({ ...data, photos: photos.filter((_, idx) => idx !== i) });

  return (
    <div className="field-editor">
      {photos.length === 0 && <p className="fe-empty">No photos yet.</p>}
      {photos.map((p, i) => {
        const url = typeof p === "string" ? p : p.url;
        const caption = typeof p === "object" ? p.caption : "";
        return (
          <div key={i} className="fe-photo-row">
            <input
              type="text"
              placeholder="Image URL or /uploads/..."
              value={url || ""}
              onChange={(e) => update(i, "url", e.target.value)}
            />
            <input
              type="text"
              placeholder="Caption (optional)"
              value={caption || ""}
              onChange={(e) => update(i, "caption", e.target.value)}
            />
            <button
              type="button"
              className="danger"
              onClick={() => remove(i)}
              title="Remove"
            >
              ×
            </button>
          </div>
        );
      })}
      <button type="button" className="fe-add" onClick={add}>
        + Add photo
      </button>
      <p className="fe-hint">
        Upload files from <strong>Admin → Settings → Media</strong> (coming soon) or paste
        external image URLs.
      </p>
    </div>
  );
}