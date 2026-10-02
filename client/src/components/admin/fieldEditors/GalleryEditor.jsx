import { useRef, useState } from "react";
import api, { imgUrl } from "../../../api/axios";

export default function GalleryEditor({ data, onChange, eventId }) {
  const photos = data?.photos || [];
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [err, setErr] = useState("");
  const fileInputRef = useRef(null);

  /* ---------- HELPERS ---------- */
  const normalizePhoto = (p) => {
    if (typeof p === "string") return { url: p, caption: "" };
    return { url: p.url || "", caption: p.caption || "" };
  };

  const updatePhoto = (i, key, val) => {
    const next = photos.map((p, idx) =>
      idx === i ? { ...normalizePhoto(p), [key]: val } : p
    );
    onChange({ ...data, photos: next });
  };

  const removePhoto = (i) => {
    if (!window.confirm("Remove this photo?")) return;
    onChange({ ...data, photos: photos.filter((_, idx) => idx !== i) });
  };

  const movePhoto = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...data, photos: next });
  };

  /* ---------- UPLOAD ---------- */
  const uploadFiles = async (rawFiles) => {
    /* STEP 1: Convert FileList to a stable array IMMEDIATELY */
    const incoming = Array.from(rawFiles || []).filter(
      (f) => f && f.type && f.type.startsWith("image/")
    );

    if (!incoming.length) {
      setErr("Please select image files only.");
      return;
    }

    /* STEP 2: Reset the input value BEFORE any async work */
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setErr("");
    setUploading(true);

    try {
      const fd = new FormData();
      /* STEP 3: Append each file exactly once */
      incoming.forEach((f, i) => {
        fd.append("files", f, f.name || `file-${i}.jpg`);
      });

      if (eventId) fd.append("eventId", eventId);
      fd.append("tag", "event-gallery");

      const { data: res } = await api.post("/media", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const added = (res.files || []).map((f) => ({
        url: f.url,
        caption: "",
      }));

      onChange({ ...data, photos: [...photos, ...added] });
    } catch (e) {
      setErr(e.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* Capture files from input and IMMEDIATELY clear the input */
  const onPickFiles = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    /* Copy to array synchronously to avoid stale references */
    const copied = Array.from(files);
    e.target.value = "";

    uploadFiles(copied);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length) {
      const copied = Array.from(files);
      uploadFiles(copied);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (!dragging) setDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    if (e.currentTarget === e.target) setDragging(false);
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="field-editor">
      {/* Drop zone */}
      <div
        className={`fe-dropzone${dragging ? " dragging" : ""}${
          uploading ? " uploading" : ""
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onPickFiles}
          hidden
        />
        <div className="fe-dropzone-icon">📸</div>
        <div className="fe-dropzone-title">
          {uploading
            ? "Uploading…"
            : dragging
            ? "Drop images to upload"
            : "Drag & drop images here"}
        </div>
        <div className="fe-dropzone-hint">
          or click to browse · JPG, PNG, WEBP · select multiple at once
        </div>
      </div>

      {err && <div className="fe-error">{err}</div>}

      {/* Photo grid */}
      {photos.length > 0 && (
        <>
          <div className="fe-photo-count">
            {photos.length} photo{photos.length !== 1 && "s"} in this gallery
          </div>

          <div className="fe-gallery-grid">
            {photos.map((p, i) => {
              const photo = normalizePhoto(p);
              return (
                <div key={i} className="fe-gallery-item">
                  <div className="fe-gallery-thumb">
                    <img
                      src={imgUrl(photo.url)}
                      alt={photo.caption || `Photo ${i + 1}`}
                      loading="lazy"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={photo.caption}
                    onChange={(e) => updatePhoto(i, "caption", e.target.value)}
                    className="fe-gallery-caption"
                  />

                  <div className="fe-gallery-actions">
                    <button
                      type="button"
                      className="fe-icon-btn"
                      onClick={() => movePhoto(i, -1)}
                      disabled={i === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="fe-icon-btn"
                      onClick={() => movePhoto(i, 1)}
                      disabled={i === photos.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="fe-icon-btn danger"
                      onClick={() => removePhoto(i)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add-by-URL fallback */}
      <div className="fe-url-add">
        <label>Or add by URL</label>
        <div className="fe-url-row">
          <input
            type="text"
            placeholder="https://res.cloudinary.com/..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const val = e.target.value.trim();
                if (val) {
                  onChange({
                    ...data,
                    photos: [...photos, { url: val, caption: "" }],
                  });
                  e.target.value = "";
                }
              }
            }}
          />
        </div>
        <p className="fe-hint">
          Press <strong>Enter</strong> to add the URL
        </p>
      </div>

      <style>{`
        .fe-dropzone {
          border:2px dashed rgba(27,42,74,0.22);
          border-radius:8px;
          padding:26px 20px;
          text-align:center;
          cursor:pointer;
          background:#F8F4E9;
          transition:.2s;
          margin-bottom:14px;
        }
        .fe-dropzone:hover {
          border-color:#B8912F;
          background:#fdf5e3;
        }
        .fe-dropzone.dragging {
          border-color:#B8912F;
          background:#fdf5e3;
          transform:scale(1.005);
        }
        .fe-dropzone.uploading {
          cursor:wait;
          opacity:0.8;
        }
        .fe-dropzone-icon {
          font-size:1.8rem;
          margin-bottom:6px;
        }
        .fe-dropzone-title {
          font-family:'Cormorant Garamond', serif;
          font-size:1.15rem;
          font-weight:600;
          color:#1B2A4A;
          margin-bottom:4px;
        }
        .fe-dropzone-hint {
          font-size:0.78rem;
          color:#7b8399;
        }
        .fe-error {
          background:#fff2f0;
          color:#b23b3b;
          border:1px solid #f0c8c2;
          padding:8px 12px;
          border-radius:3px;
          font-size:0.82rem;
          margin-bottom:12px;
        }
        .fe-photo-count {
          font-size:0.78rem;
          color:#7b8399;
          text-transform:uppercase;
          letter-spacing:0.05em;
          margin-bottom:10px;
        }
        .fe-gallery-grid {
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));
          gap:12px;
          margin-bottom:16px;
        }
        .fe-gallery-item {
          background:#fff;
          border:1px solid rgba(27,42,74,0.14);
          border-radius:6px;
          overflow:hidden;
          display:flex;
          flex-direction:column;
        }
        .fe-gallery-thumb {
          width:100%;
          aspect-ratio:1;
          background:#F8F4E9;
          overflow:hidden;
        }
        .fe-gallery-thumb img {
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }
        .fe-gallery-caption {
          border:none;
          border-top:1px solid rgba(27,42,74,0.08);
          padding:6px 8px;
          font-size:0.72rem;
          font-family:inherit;
          background:#fff;
        }
        .fe-gallery-caption:focus {
          outline:none;
          background:#fdfaf1;
        }
        .fe-gallery-actions {
          display:flex;
          gap:2px;
          padding:4px;
          border-top:1px solid rgba(27,42,74,0.08);
          background:#F8F4E9;
        }
        .fe-icon-btn {
          flex:1;
          padding:4px;
          border:1px solid rgba(27,42,74,0.14);
          background:#fff;
          border-radius:3px;
          cursor:pointer;
          font-size:0.75rem;
          font-family:inherit;
        }
        .fe-icon-btn:hover:not(:disabled) { background:#F8F4E9; }
        .fe-icon-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .fe-icon-btn.danger { color:#b23b3b; border-color:#f0c8c2; }
        .fe-icon-btn.danger:hover { background:#fff2f0; }
        .fe-url-add {
          margin-top:12px;
          padding-top:12px;
          border-top:1px dashed rgba(27,42,74,0.14);
        }
        .fe-url-add label {
          font-size:0.78rem;
          font-weight:500;
          color:#3a4560;
          display:block;
          margin-bottom:6px;
        }
        .fe-url-row input {
          width:100%;
          padding:8px 12px;
          border:1px solid rgba(27,42,74,0.14);
          border-radius:3px;
          font-size:0.85rem;
          font-family:inherit;
        }
        .fe-url-row input:focus {
          outline:none;
          border-color:#B8912F;
          box-shadow:0 0 0 3px rgba(184,145,47,0.12);
        }
      `}</style>
    </div>
  );
}