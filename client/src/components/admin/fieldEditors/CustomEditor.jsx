export default function CustomEditor({ data, onChange }) {
  return (
    <div className="field-editor">
      <label className="fe-label">HTML content</label>
      <textarea
        rows={8}
        placeholder="<p>Your custom HTML here…</p>"
        value={data?.html || ""}
        onChange={(e) => onChange({ ...data, html: e.target.value })}
        className="fe-code"
      />
      <p className="fe-hint">
        ⚠️ Raw HTML is rendered as-is. Only paste trusted content.
      </p>
    </div>
  );
}