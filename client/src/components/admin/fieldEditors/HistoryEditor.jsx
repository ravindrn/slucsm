export default function HistoryEditor({ data, onChange }) {
  const entries = data?.entries || [];

  const update = (i, key, val) => {
    const next = [...entries];
    next[i] = { ...next[i], [key]: val };
    onChange({ ...data, entries: next });
  };

  const add = () => onChange({ ...data, entries: [...entries, { year: "", note: "" }] });
  const remove = (i) =>
    onChange({ ...data, entries: entries.filter((_, idx) => idx !== i) });

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= entries.length) return;
    const next = [...entries];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...data, entries: next });
  };

  return (
    <div className="field-editor">
      {entries.length === 0 && <p className="fe-empty">No history entries yet.</p>}
      {entries.map((e, i) => (
        <div key={i} className="fe-row">
          <input
            type="text"
            placeholder="Year"
            value={e.year || ""}
            onChange={(ev) => update(i, "year", ev.target.value)}
            style={{ maxWidth: 100 }}
          />
          <input
            type="text"
            placeholder="Note"
            value={e.note || ""}
            onChange={(ev) => update(i, "note", ev.target.value)}
          />
          <div className="fe-row-actions">
            <button type="button" onClick={() => move(i, -1)}>↑</button>
            <button type="button" onClick={() => move(i, 1)}>↓</button>
            <button type="button" onClick={() => remove(i)} className="danger">×</button>
          </div>
        </div>
      ))}
      <button type="button" className="fe-add" onClick={add}>
        + Add history entry
      </button>
    </div>
  );
}