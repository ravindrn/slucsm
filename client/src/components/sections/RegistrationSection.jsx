export default function RegistrationSection({ title, data }) {
  const mode = data?.mode || "builtin";

  return (
    <section className="ev-section">
      <h2>{title || "Register"}</h2>

      {mode === "googleForm" && data?.googleFormUrl && (
        <div className="reg-block">
          <p className="reg-desc">
            Registration is handled through a Google Form. Click below to open it.
          </p>
          <a
            href={data.googleFormUrl}
            target="_blank"
            rel="noreferrer"
            className="btn solid"
          >
            Open Registration Form →
          </a>
        </div>
      )}

      {mode === "external" && data?.externalUrl && (
        <div className="reg-block">
          <p className="reg-desc">Register via the external link below.</p>
          <a
            href={data.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="btn solid"
          >
            Register Now →
          </a>
        </div>
      )}

      {mode === "builtin" && (
        <div className="reg-block">
          <p className="reg-desc">
            Online registration opens closer to the event. Please check back soon.
          </p>
        </div>
      )}
    </section>
  );
}