import { FIELD_EDITORS, SECTION_KINDS, defaultDataFor, labelFor } from "./fieldEditors/index.jsx";

export default function SectionEditor({ section, onChange, onRemove, onMove }) {
  const kind = section.kind;
  const Editor = FIELD_EDITORS[kind];

  const setField = (key, val) => onChange({ ...section, [key]: val });
  const setData = (newData) => onChange({ ...section, data: newData });

  const changeKind = (newKind) => {
    /* When kind changes, reset data to defaults */
    const reset = window.confirm(
      "Changing the section type will reset its content. Continue?"
    );
    if (!reset) return;
    onChange({ ...section, kind: newKind, data: defaultDataFor(newKind) });
  };

  return (
    <div className="section-editor">
      <div className="se-head">
        <div className="se-head-left">
          <span className="se-kind-badge">{labelFor(kind)}</span>
          <select
            value={kind}
            onChange={(e) => changeKind(e.target.value)}
            className="se-kind-select"
          >
            {SECTION_KINDS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="se-head-right">
          <label className="se-toggle">
            <input
              type="checkbox"
              checked={section.enabled !== false}
              onChange={(e) => setField("enabled", e.target.checked)}
            />
            <span>Enabled</span>
          </label>
          <button
            type="button"
            onClick={() => onMove(-1)}
            title="Move up"
            className="se-icon-btn"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            title="Move down"
            className="se-icon-btn"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="se-icon-btn danger"
            title="Remove section"
          >
            ×
          </button>
        </div>
      </div>

      <div className="se-body">
        <label className="fe-label">Section title (optional)</label>
        <input
          type="text"
          placeholder={labelFor(kind)}
          value={section.title || ""}
          onChange={(e) => setField("title", e.target.value)}
          className="se-title-input"
        />

        {Editor ? (
          <Editor data={section.data || {}} onChange={setData} />
        ) : (
          <p className="fe-empty">No editor for this section type.</p>
        )}
      </div>
    </div>
  );
}