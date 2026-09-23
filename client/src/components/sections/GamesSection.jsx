import { Link } from "react-router-dom";

export default function GamesSection({ title, data, eventSlug }) {
  return (
    <section className="ev-section">
      <h2>{title || "Team Game"}</h2>
      <p className="reg-desc">
        {data?.intro ||
          "Log in with your team credentials to see tasks, submit proof, and track your score."}
      </p>
      <Link to={`/events/live/${eventSlug}/portal`} className="btn solid">
        Enter Team Portal →
      </Link>
    </section>
  );
}