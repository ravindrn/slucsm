import { Navigate, useLocation, useParams } from "react-router-dom";
import { useTeam } from "../context/TeamContext";

export default function TeamProtectedRoute({ children }) {
  const { team, loading } = useTeam();
  const location = useLocation();
  const { slug } = useParams();

  if (loading) {
    return (
      <div style={{ padding: 100, textAlign: "center", fontFamily: "Inter" }}>
        Checking team session…
      </div>
    );
  }

  if (!team) {
    return (
      <Navigate
        to={`/events/live/${slug}/portal`}
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}