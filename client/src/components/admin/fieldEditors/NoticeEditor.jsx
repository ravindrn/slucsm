export default function NoticeEditor({ data, onChange }) {
  const notices = data?.notices || [];

  const update = (i, key, val) => {
    const next = [...notices];
    next[i] = { ...next[i], [key]: val };
    onChange({ ...data, notices: next });
  };

  const add = () =>
    onChange({ ...data, notices: [...notices, { text: "", pinned: false }] });

  const remove = (i) =>
    onChange({ ...data, notices: notices.filter((_, idx) => idx !== i) });

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= notices.length) return;
    const next = [...notices];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...data, notices: next });
  };

  return (
    <div className="field-editor">
      {notices.length === 0 && <p className="fe-empty">No notices yet.</p>}
      {notices.map((n, i) => (
        <div key={i} className="fe-row">
          <input
            type="text"
            placeholder="Notice text"
            value={n.text || ""}
            onChange={(e) => update(i, "text", e.target.value)}
          />
          <label className="fe-check">
            <input
              type="checkbox"
              checked={!!n.pinned}
              onChange={(e) => update(i, "pinned", e.target.checked)}
            />
            Pinned
          </label>
          <div className="fe-row-actions">
            <button type="button" onClick={() => move(i, -1)} title="Up">↑</button>
            <button type="button" onClick={() => move(i, 1)} title="Down">↓</button>
            <button type="button" onClick={() => remove(i)} className="danger" title="Remove">×</button>
          </div>
        </div>
      ))}
      <button type="button" className="fe-add" onClick={add}>
        + Add notice
      </button>
    </div>
  );
}