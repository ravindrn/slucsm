import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Check session on mount */
  const refresh = async () => {
    try {
      const { data } = await api.get("/teams/me");
      setTeam(data.team);
      setTasks(data.tasks || []);
      setSubmissions(data.submissions || []);
    } catch {
      setTeam(null);
      setTasks([]);
      setSubmissions([]);
    }
  };

 useEffect(() => {
  (async () => {
    /* Only check team session on team-related routes.
       Prevents pointless 401s on admin / public pages. */
    const path = window.location.pathname;
    const onTeamRoute =
      path.includes("/portal") || path.startsWith("/scan/");

    if (onTeamRoute) {
      await refresh();
    }
    setLoading(false);
  })();
}, []);
  const login = async (eventSlug, username, password) => {
    const { data } = await api.post("/teams/login", {
      eventSlug,
      username,
      password,
    });
    setTeam(data.team);
    await refresh();
    return data.team;
  };

  const logout = async () => {
    await api.post("/teams/logout");
    setTeam(null);
    setTasks([]);
    setSubmissions([]);
  };

  return (
    <TeamContext.Provider
      value={{ team, tasks, submissions, loading, login, logout, refresh }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeam must be used inside <TeamProvider>");
  return ctx;
}