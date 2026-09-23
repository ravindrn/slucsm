export default function ContactEditor({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div className="field-editor">
      <label className="fe-label">Name</label>
      <input
        type="text"
        value={data?.name || ""}
        onChange={(e) => set("name", e.target.value)}
      />

      <label className="fe-label">Role</label>
      <input
        type="text"
        value={data?.role || ""}
        onChange={(e) => set("role", e.target.value)}
      />

      <label className="fe-label">Email</label>
      <input
        type="email"
        value={data?.email || ""}
        onChange={(e) => set("email", e.target.value)}
      />

      <label className="fe-label">Phone</label>
      <input
        type="text"
        value={data?.phone || ""}
        onChange={(e) => set("phone", e.target.value)}
      />
    </div>
  );
}