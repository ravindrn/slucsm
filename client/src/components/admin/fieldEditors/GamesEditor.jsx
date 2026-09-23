export default function GamesEditor({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div className="field-editor">
      <label className="fe-label">Intro text shown to teams</label>
      <textarea
        rows={3}
        placeholder="Welcome to the team game…"
        value={data?.intro || ""}
        onChange={(e) => set("intro", e.target.value)}
      />
      <p className="fe-hint">
        Enabling this section shows the "Enter Team Portal" button on the live event page.
        Teams are managed from <strong>Admin → Teams</strong>.
      </p>
    </div>
  );
}