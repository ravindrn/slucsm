export default function RegistrationEditor({ data, onChange }) {
  const mode = data?.mode || "builtin";

  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div className="field-editor">
      <label className="fe-label">Registration mode</label>
      <select
        value={mode}
        onChange={(e) => set("mode", e.target.value)}
        className="fe-select"
      >
        <option value="builtin">Built-in form (coming soon)</option>
        <option value="googleForm">Google Form link</option>
        <option value="external">External link</option>
      </select>

      {mode === "googleForm" && (
        <>
          <label className="fe-label">Google Form URL</label>
          <input
            type="url"
            placeholder="https://forms.gle/..."
            value={data?.googleFormUrl || ""}
            onChange={(e) => set("googleFormUrl", e.target.value)}
          />
        </>
      )}

      {mode === "external" && (
        <>
          <label className="fe-label">External URL</label>
          <input
            type="url"
            placeholder="https://..."
            value={data?.externalUrl || ""}
            onChange={(e) => set("externalUrl", e.target.value)}
          />
        </>
      )}

      {mode === "builtin" && (
        <p className="fe-hint">
          The built-in registration form will be available in a later release.
        </p>
      )}
    </div>
  );
}