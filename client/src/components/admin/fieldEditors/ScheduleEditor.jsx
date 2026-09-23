export default function ScheduleEditor({ data, onChange }) {
  const items = data?.items || [];

  const update = (i, key, val) => {
    const next = [...items];
    next[i] = { ...next[i], [key]: val };
    onChange({ ...data, items: next });
  };

  const add = () => onChange({ ...data, items: [...items, { time: "", title: "" }] });
  const remove = (i) => onChange({ ...data, items: items.filter((_, idx) => idx !== i) });

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...data, items: next });
  };

  return (
    <div className="field-editor">
      {items.length === 0 && <p className="fe-empty">No schedule items yet.</p>}
      {items.map((it, i) => (
        <div key={i} className="fe-row">
          <input
            type="text"
            placeholder="Time (e.g. 9:00 AM)"
            value={it.time || ""}
            onChange={(e) => update(i, "time", e.target.value)}
            style={{ maxWidth: 140 }}
          />
          <input
            type="text"
            placeholder="Title"
            value={it.title || ""}
            onChange={(e) => update(i, "title", e.target.value)}
          />
          <div className="fe-row-actions">
            <button type="button" onClick={() => move(i, -1)}>↑</button>
            <button type="button" onClick={() => move(i, 1)}>↓</button>
            <button type="button" onClick={() => remove(i)} className="danger">×</button>
          </div>
        </div>
      ))}
      <button type="button" className="fe-add" onClick={add}>
        + Add schedule item
      </button>
    </div>
  );
}