import { useEffect, useMemo, useRef, useState } from "react";
import api, { imgUrl } from "../../api/axios";

export default function MediaManager() {
  const [events, setEvents] = useState([]);
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ count: 0, totalSize: 0 });
  const [groups, setGroups] = useState([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Filters */
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  /* Upload target */
  const [uploadEvent, setUploadEvent] = useState("global");

  /* UI state */
  const [dragging, setDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [copied, setCopied] = useState("");

  const fileInputRef = useRef(null);

  /* ---------- LOAD EVENTS ONCE ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/events");
        setEvents(data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  /* ---------- LOAD MEDIA ---------- */
  const load = async () => {
    setLoading(true);
    try {
      setError("");
      const params = new URLSearchParams();
      if (selectedEvent !== "all") params.set("eventId", selectedEvent);
      if (search.trim()) params.set("search", search.trim());
      params.set("sort", sort);

      const [{ data }, statsRes] = await Promise.all([
        api.get(`/media?${params.toString()}`),
        api.get("/media/stats"),
      ]);

      setFiles(data.files);
      setStats(data.stats);
      setGroups(statsRes.data.groups);
    } catch (e) {
      setError("Failed to load media. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent, sort]);

  /* Debounced search */
  useEffect(() => {
    const id = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  /* ---------- UPLOAD ---------- */
  const uploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const fd = new FormData();
    Array.from(fileList).forEach((f) => fd.append("files", f));
    if (uploadEvent && uploadEvent !== "global") {
      fd.append("eventId", uploadEvent);
    }

    setUploading(true);
    setError("");
    setSuccess("");
    setUploadProgress(
      `Uploading ${fileList.length} file${fileList.length > 1 ? "s" : ""}…`
    );

    try {
      const { data } = await api.post("/media", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(
        `Uploaded ${data.files.length} file${
          data.files.length > 1 ? "s" : ""
        } successfully.`
      );
      setTimeout(() => setSuccess(""), 3000);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ---------- DRAG & DROP ---------- */
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };
  const onDragOver = (e) => {
    e.preventDefault();
    if (!dragging) setDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    if (e.currentTarget === e.target) setDragging(false);
  };

  /* ---------- COPY URL ---------- */
  const copyUrl = async (file) => {
    const url = imgUrl(file.url);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(file._id);
    setTimeout(() => setCopied(""), 1500);
  };

  /* ---------- DELETE ---------- */
  const del = async (file) => {
    if (!window.confirm(`Delete "${file.filename}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/media/${file._id}`);
      setFiles((list) => list.filter((f) => f._id !== file._id));
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  /* ---------- MOVE TO EVENT ---------- */
  const moveFile = async (file, newEventId) => {
    try {
      await api.put(`/media/${file._id}`, {
        eventId: newEventId === "global" ? null : newEventId,
      });
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Move failed");
    }
  };

  /* ---------- HELPERS ---------- */
  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const eventLabel = (ev) => `${ev.title} (${ev.status})`;

  return (
    <div className="media-manager">
      <style>{css}</style>

      {/* ---------- HEAD ---------- */}
      <div className="mm-head">
        <div>
          <h1>Media Library</h1>
          <p className="mm-sub">
            Upload images and scope them to an event (or keep global). Filter, search
            and copy URLs to use anywhere on the site.
          </p>
        </div>
        <div className="mm-stats">
          <div className="mm-stat">
            <span className="mm-stat-num">{stats.count}</span>
            <span className="mm-stat-lbl">
              {selectedEvent === "all"
                ? "files"
                : selectedEvent === "global"
                ? "global files"
                : "files"}
            </span>
          </div>
          <div className="mm-stat">
            <span className="mm-stat-num">{formatSize(stats.totalSize)}</span>
            <span className="mm-stat-lbl">used</span>
          </div>
        </div>
      </div>

      {error && <div className="mm-banner error">{error}</div>}
      {success && <div className="mm-banner success">{success}</div>}

      {/* ---------- UPLOAD TARGET ---------- */}
      <div className="mm-upload-target">
        <label>Upload to:</label>
        <select
          value={uploadEvent}
          onChange={(e) => setUploadEvent(e.target.value)}
        >
          <option value="global">🌐 Global (no event)</option>
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>
              {eventLabel(ev)}
            </option>
          ))}
        </select>
      </div>

      {/* ---------- DROP ZONE ---------- */}
      <div
        className={`mm-drop${dragging ? " dragging" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => uploadFiles(e.target.files)}
          hidden
        />
        <div className="mm-drop-icon">⬆</div>
        <p className="mm-drop-title">
          {uploading
            ? uploadProgress || "Uploading…"
            : dragging
            ? "Drop files to upload"
            : "Drag & drop images here"}
        </p>
        <p className="mm-drop-hint">
          or click to browse — uploads to{" "}
          <strong>
            {uploadEvent === "global"
              ? "Global"
              : events.find((e) => e._id === uploadEvent)?.title || "…"}
          </strong>
        </p>
      </div>

      {/* ---------- FILTERS ---------- */}
      <div className="mm-filters">
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="mm-filter-select"
        >
          <option value="all">
            📁 All files ({groups.reduce((s, g) => s + g.count, 0)})
          </option>
          <option value="global">
            🌐 Global — no event (
            {groups.find((g) => g.eventId === null)?.count || 0})
          </option>
          {events.map((ev) => {
            const g = groups.find(
              (grp) => grp.eventId?.toString() === ev._id.toString()
            );
            return (
              <option key={ev._id} value={ev._id}>
                {ev.title} ({g?.count || 0})
              </option>
            );
          })}
        </select>

        <input
          type="text"
          placeholder="Search by filename…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mm-search"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="mm-sort"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A → Z</option>
          <option value="size">Largest first</option>
        </select>
      </div>

      {/* ---------- GRID ---------- */}
      {loading ? (
        <p className="mm-loading">Loading…</p>
      ) : files.length === 0 ? (
        <div className="mm-empty">
          <p>
            {search || selectedEvent !== "all"
              ? "No files match your filter."
              : "No media uploaded yet."}
          </p>
          <p className="mm-empty-sub">
            {search || selectedEvent !== "all"
              ? "Try a different event or clear the search."
              : "Drop some files above to get started."}
          </p>
        </div>
      ) : (
        <div className="mm-grid">
          {files.map((file) => (
            <div key={file._id} className="mm-card">
              <div
                className="mm-card-img"
                onClick={() => setPreviewFile(file)}
              >
                <img
                  src={imgUrl(file.url)}
                  alt={file.filename}
                  loading="lazy"
                />
              </div>

              <div className="mm-card-body">
                <p className="mm-card-name" title={file.filename}>
                  {file.filename}
                </p>
                <p className="mm-card-meta">
                  {formatSize(file.size)} · {formatDate(file.createdAt)}
                </p>

                {file.eventId ? (
                  <span className="mm-card-event">
                    {file.eventId.title}
                  </span>
                ) : (
                  <span className="mm-card-event global">🌐 Global</span>
                )}

                <div className="mm-card-actions">
                  <button
                    className="mm-btn small"
                    onClick={() => copyUrl(file)}
                  >
                    {copied === file._id ? "✓ Copied" : "Copy URL"}
                  </button>
                  <button
                    className="mm-btn small danger"
                    onClick={() => del(file)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------- LIGHTBOX ---------- */}
      {previewFile && (
        <div
          className="mm-lightbox"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="mm-lightbox-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="mm-lightbox-close"
              onClick={() => setPreviewFile(null)}
            >
              ×
            </button>
            <img
              src={imgUrl(previewFile.url)}
              alt={previewFile.filename}
            />
            <div className="mm-lightbox-info">
              <div>
                <p className="mm-lightbox-name">{previewFile.filename}</p>
                <p className="mm-lightbox-meta">
                  {formatSize(previewFile.size)} ·{" "}
                  {formatDate(previewFile.createdAt)}
                </p>
              </div>

              <div className="mm-lightbox-move">
                <label>Assign to event</label>
                <select
                  value={previewFile.eventId?._id || "global"}
                  onChange={(e) => {
                    moveFile(previewFile, e.target.value);
                    setPreviewFile(null);
                  }}
                >
                  <option value="global">🌐 Global</option>
                  {events.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {eventLabel(ev)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mm-lightbox-actions">
                <button
                  className="mm-btn"
                  onClick={() => copyUrl(previewFile)}
                >
                  {copied === previewFile._id ? "✓ Copied" : "Copy URL"}
                </button>
                <button
                  className="mm-btn danger"
                  onClick={() => {
                    del(previewFile);
                    setPreviewFile(null);
                  }}
                >
                  Delete file
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const css = `
.media-manager{ color:#1B2A4A; }

/* ---------- HEAD ---------- */
.mm-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:16px; flex-wrap:wrap; margin-bottom:20px;
}
.mm-head h1{
  font-family:'Cormorant Garamond', serif;
  font-size:2rem; font-weight:600; margin:0 0 6px;
}
.mm-sub{ color:#5a6380; font-size:0.9rem; margin:0; max-width:560px; }
.mm-stats{ display:flex; gap:20px; }
.mm-stat{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:12px 18px;
  text-align:center;
  min-width:88px;
}
.mm-stat-num{
  display:block;
  font-family:'Cormorant Garamond', serif;
  font-size:1.5rem; font-weight:600;
  color:#B8912F;
  line-height:1;
}
.mm-stat-lbl{
  display:block;
  font-size:0.7rem; color:#7b8399;
  text-transform:uppercase; letter-spacing:0.06em;
  margin-top:4px;
}

/* ---------- BANNERS ---------- */
.mm-banner{
  padding:12px 18px; border-radius:4px;
  font-size:0.9rem; margin-bottom:16px;
}
.mm-banner.error{ background:#fff2f0; color:#b23b3b; border:1px solid #f0c8c2; }
.mm-banner.success{ background:#E3F3E5; color:#2e7d32; border:1px solid #bfe0c4; }

/* ---------- UPLOAD TARGET ---------- */
.mm-upload-target{
  display:flex; align-items:center; gap:10px;
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  padding:12px 16px;
  margin-bottom:16px;
  flex-wrap:wrap;
}
.mm-upload-target label{
  font-size:0.85rem; font-weight:500; color:#3a4560;
}
.mm-upload-target select{
  flex:1; min-width:220px;
  padding:9px 12px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  font-family:inherit; font-size:0.9rem;
  background:#fff; color:#1B2A4A;
  cursor:pointer;
}

/* ---------- DROP ZONE ---------- */
.mm-drop{
  background:#FFFDF8;
  border:2px dashed rgba(27,42,74,0.22);
  border-radius:8px;
  padding:36px 24px;
  text-align:center;
  cursor:pointer;
  transition:.2s;
  margin-bottom:20px;
}
.mm-drop:hover{
  border-color:#B8912F;
  background:#fdfaf1;
}
.mm-drop.dragging{
  border-color:#B8912F;
  background:#fdf5e3;
  transform:scale(1.005);
}
.mm-drop-icon{
  font-size:2rem; color:#B8912F;
  margin-bottom:8px;
}
.mm-drop-title{
  font-family:'Cormorant Garamond', serif;
  font-size:1.35rem; font-weight:600;
  margin:0 0 6px;
}
.mm-drop-hint{
  color:#7b8399; font-size:0.85rem;
  margin:0;
}
.mm-drop-hint strong{ color:#1B2A4A; }

/* ---------- FILTERS ---------- */
.mm-filters{
  display:flex; gap:10px; margin-bottom:20px;
  flex-wrap:wrap;
}
.mm-filter-select, .mm-sort{
  padding:10px 14px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:4px;
  font-family:inherit; font-size:0.9rem;
  background:#fff; color:#1B2A4A;
  cursor:pointer;
}
.mm-filter-select{ flex:1 1 240px; }
.mm-search{
  flex:1 1 200px;
  padding:10px 14px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:4px;
  font-family:inherit; font-size:0.9rem;
  background:#fff;
}
.mm-search:focus, .mm-filter-select:focus, .mm-sort:focus{
  outline:none; border-color:#B8912F;
  box-shadow:0 0 0 3px rgba(184,145,47,0.12);
}

/* ---------- EMPTY/LOADING ---------- */
.mm-loading{
  padding:40px; text-align:center; color:#7b8399;
}
.mm-empty{
  text-align:center;
  padding:60px 20px;
  color:#7b8399;
  background:#FFFDF8;
  border:1px dashed rgba(27,42,74,0.14);
  border-radius:6px;
}
.mm-empty p{ margin:0 0 6px; font-size:1rem; }
.mm-empty-sub{ font-size:0.85rem !important; }

/* ---------- GRID ---------- */
.mm-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));
  gap:16px;
}
.mm-card{
  background:#FFFDF8;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:6px;
  overflow:hidden;
  transition:.2s;
  display:flex;
  flex-direction:column;
}
.mm-card:hover{
  box-shadow:0 8px 24px rgba(27,42,74,0.10);
  transform:translateY(-2px);
}
.mm-card-img{
  aspect-ratio:1;
  background:#F8F4E9;
  cursor:pointer;
  overflow:hidden;
  display:flex; align-items:center; justify-content:center;
}
.mm-card-img img{
  width:100%; height:100%;
  object-fit:cover;
  transition:transform .3s;
}
.mm-card:hover .mm-card-img img{ transform:scale(1.04); }
.mm-card-body{
  padding:12px 14px;
  display:flex; flex-direction:column; gap:6px;
}
.mm-card-name{
  font-size:0.82rem;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  margin:0; color:#1B2A4A;
  font-weight:500;
}
.mm-card-meta{
  font-size:0.72rem; color:#7b8399;
  margin:0;
}
.mm-card-event{
  display:inline-block;
  font-size:0.7rem;
  background:#F8F4E9;
  color:#6E2C2C;
  border:1px solid rgba(110,44,44,0.15);
  padding:2px 8px;
  border-radius:10px;
  align-self:flex-start;
  max-width:100%;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.mm-card-event.global{
  background:#eef4f8;
  color:#2a5779;
  border-color:rgba(42,87,121,0.18);
}
.mm-card-actions{
  display:flex; gap:6px; margin-top:4px;
}

/* ---------- BUTTONS ---------- */
.mm-btn{
  padding:8px 14px;
  border:1px solid rgba(27,42,74,0.18);
  background:transparent;
  color:#1B2A4A;
  border-radius:3px;
  font-family:inherit;
  font-size:0.85rem;
  cursor:pointer;
  transition:.15s;
}
.mm-btn:hover{ background:#F8F4E9; }
.mm-btn.small{ padding:6px 10px; font-size:0.78rem; }
.mm-btn.danger{ color:#b23b3b; border-color:#f0c8c2; }
.mm-btn.danger:hover{ background:#fff2f0; }

/* ---------- LIGHTBOX ---------- */
.mm-lightbox{
  position:fixed; inset:0; z-index:100;
  background:rgba(27,42,74,0.85);
  display:flex; align-items:center; justify-content:center;
  padding:24px;
  backdrop-filter:blur(4px);
  -webkit-backdrop-filter:blur(4px);
  cursor:zoom-out;
}
.mm-lightbox-inner{
  background:#FFFDF8;
  border-radius:8px;
  max-width:90vw;
  max-height:92vh;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  position:relative;
  cursor:default;
  box-shadow:0 30px 80px rgba(0,0,0,0.4);
}
.mm-lightbox-inner > img{
  max-width:90vw;
  max-height:65vh;
  object-fit:contain;
  background:#F8F4E9;
  display:block;
}
.mm-lightbox-close{
  position:absolute; top:10px; right:12px;
  width:36px; height:36px;
  border:none;
  background:rgba(27,42,74,0.85);
  color:#F8F4E9;
  border-radius:50%;
  font-size:1.4rem; cursor:pointer;
  z-index:2;
  display:flex; align-items:center; justify-content:center;
  line-height:1;
}
.mm-lightbox-close:hover{ background:#b23b3b; }
.mm-lightbox-info{
  padding:16px 22px;
  border-top:1px solid rgba(27,42,74,0.14);
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
  flex-wrap:wrap;
  background:#FFFDF8;
}
.mm-lightbox-name{
  font-size:0.92rem; font-weight:500;
  margin:0; color:#1B2A4A;
}
.mm-lightbox-meta{
  font-size:0.78rem; color:#7b8399;
  margin:2px 0 0;
}
.mm-lightbox-move{
  display:flex; flex-direction:column; gap:4px;
  min-width:200px;
  flex:1;
  max-width:260px;
}
.mm-lightbox-move label{
  font-size:0.72rem;
  color:#7b8399;
  text-transform:uppercase;
  letter-spacing:0.05em;
}
.mm-lightbox-move select{
  padding:8px 10px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  font-family:inherit; font-size:0.85rem;
  background:#fff; color:#1B2A4A;
  cursor:pointer;
}
.mm-lightbox-actions{
  display:flex; gap:8px;
}

/* ---------- RESPONSIVE ---------- */
@media (max-width:600px){
  .mm-grid{ grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:12px; }
  .mm-stats{ width:100%; justify-content:space-between; }
  .mm-stat{ flex:1; min-width:0; }
  .mm-lightbox-info{ flex-direction:column; align-items:stretch; }
  .mm-lightbox-move{ max-width:none; }
  .mm-lightbox-actions{ justify-content:flex-end; }
}
`;