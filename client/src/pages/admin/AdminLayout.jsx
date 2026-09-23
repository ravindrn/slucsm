import { useState, useEffect } from "react";
import { NavLink, Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/* ---------- NAV CONFIG ---------- */
const LINKS = [
  { type: "link", to: "/admin", label: "Dashboard", end: true, icon: "▦" },
  { type: "link", to: "/admin/events", label: "Events", icon: "🗓" },
  { type: "link", to: "/admin/committee", label: "Committee", icon: "🎓" },
  { type: "link", to: "/admin/media", label: "Media", icon: "🖼" },
  {
    type: "group",
    key: "games",
    label: "Games",
    icon: "🎮",
    children: [
      { to: "/admin/teams", label: "Teams", icon: "👥" },
      { to: "/admin/tasks", label: "Tasks", icon: "✓" },
      { to: "/admin/submissions", label: "Submissions", icon: "📤" },
    ],
  },
  { type: "link", to: "/admin/settings", label: "Site Settings", icon: "⚙" },
  { type: "link", to: "/admin/users", label: "Users", icon: "🔑", adminOnly: true },
];

/* ---------- HELPERS ---------- */
const isGroupActive = (group, pathname) =>
  group.children.some((c) => pathname.startsWith(c.to));

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  /* Track which groups are open. Initialize based on active route. */
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    LINKS.filter((l) => l.type === "group").forEach((g) => {
      initial[g.key] = isGroupActive(g, location.pathname);
    });
    return initial;
  });

  /* Auto-open group when navigating into a child route */
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      LINKS.filter((l) => l.type === "group").forEach((g) => {
        if (isGroupActive(g, location.pathname)) next[g.key] = true;
      });
      return next;
    });
  }, [location.pathname]);

  const toggleGroup = (key) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = async () => {
    await logout();
    nav("/login");
  };

  return (
    <div className="admin-shell">
      <style>{css}</style>

      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <img src="/slucsmLogo.png" alt="SLUCSM" />
          <span>SLUCSM</span>
        </Link>

        <nav className="admin-nav">
          {LINKS.filter((l) => !l.adminOnly || user?.role === "admin").map((l) => {
            /* ---------- SIMPLE LINK ---------- */
            if (l.type === "link") {
              return (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    "admin-nav-link" + (isActive ? " active" : "")
                  }
                >
                  <span className="admin-nav-icon">{l.icon}</span>
                  <span>{l.label}</span>
                </NavLink>
              );
            }

            /* ---------- COLLAPSIBLE GROUP ---------- */
            const isOpen = !!openGroups[l.key];
            const groupActive = isGroupActive(l, location.pathname);

            return (
              <div key={l.key} className="admin-nav-group">
                <button
                  type="button"
                  className={`admin-nav-link admin-nav-group-btn${
                    groupActive ? " group-active" : ""
                  }`}
                  onClick={() => toggleGroup(l.key)}
                  aria-expanded={isOpen}
                >
                  <span className="admin-nav-icon">{l.icon}</span>
                  <span className="admin-nav-label">{l.label}</span>
                  <span className={`admin-nav-caret${isOpen ? " open" : ""}`}>
                    ▸
                  </span>
                </button>

                {isOpen && (
                  <div className="admin-nav-children">
                    {l.children.map((c) => (
                      <NavLink
                        key={c.to}
                        to={c.to}
                        className={({ isActive }) =>
                          "admin-nav-link admin-nav-child" +
                          (isActive ? " active" : "")
                        }
                      >
                        <span className="admin-nav-icon">{c.icon}</span>
                        <span>{c.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="admin-user-info">
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
            </div>
          </div>
          <button className="admin-logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

/* ============================================================
   CSS
   ============================================================ */
const css = `
html, body, #root{ margin:0; padding:0; width:100%; overflow-x:hidden; }
*, *::before, *::after{ box-sizing:border-box; }

.admin-shell{
  --ink:#1B2A4A;
  --ivory:#F8F4E9;
  --gold:#B8912F;
  --maroon:#6E2C2C;
  --paper:#FFFDF8;
  --line:rgba(27,42,74,0.14);
  --sidebar:#1B2A4A;
  --sidebar-text:#F8F4E9;

  display:flex;
  min-height:100vh;
  background:var(--ivory);
  font-family:'Inter',sans-serif;
  color:var(--ink);
}

/* ---------- SIDEBAR ---------- */
.admin-sidebar{
  width:250px;
  background:var(--sidebar);
  color:var(--sidebar-text);
  display:flex; flex-direction:column;
  padding:22px 16px;
  position:sticky; top:0;
  height:100vh;
  flex-shrink:0;
  overflow-y:auto;
}
.admin-brand{
  display:flex; align-items:center; gap:10px;
  text-decoration:none; color:var(--sidebar-text);
  font-family:'Cormorant Garamond',serif;
  font-size:1.35rem; font-weight:600;
  padding:4px 8px 22px;
  border-bottom:1px solid rgba(248,244,233,0.12);
  margin-bottom:18px;
}
.admin-brand img{
  width:36px; height:36px; border-radius:50%;
  object-fit:contain;
  border:1.4px solid var(--gold);
  background:var(--paper);
  padding:2px;
}

.admin-nav{
  display:flex; flex-direction:column; gap:4px;
  flex:1;
}
.admin-nav-link{
  display:flex; align-items:center; gap:12px;
  padding:10px 12px;
  border-radius:5px;
  text-decoration:none;
  color:var(--sidebar-text);
  opacity:0.78;
  font-size:0.92rem;
  transition:.15s;
  background:transparent;
  border:none;
  font-family:inherit;
  cursor:pointer;
  width:100%;
  text-align:left;
}
.admin-nav-link:hover{
  opacity:1;
  background:rgba(255,255,255,0.06);
}
.admin-nav-link.active{
  opacity:1;
  background:var(--gold);
  color:#fff;
}
.admin-nav-icon{
  width:20px; display:inline-flex; justify-content:center;
  font-size:1rem;
  flex-shrink:0;
}

/* ---------- GROUP ---------- */
.admin-nav-group{ display:flex; flex-direction:column; gap:2px; }

.admin-nav-group-btn{
  position:relative;
}
.admin-nav-group-btn.group-active{
  opacity:1;
  color:var(--gold);
}
.admin-nav-label{ flex:1; }
.admin-nav-caret{
  font-size:0.8rem;
  transition:transform .2s;
  opacity:0.7;
  display:inline-block;
}
.admin-nav-caret.open{
  transform:rotate(90deg);
}

.admin-nav-children{
  display:flex; flex-direction:column; gap:2px;
  margin-left:14px;
  padding-left:14px;
  border-left:1px solid rgba(248,244,233,0.14);
  margin-top:2px;
  margin-bottom:4px;
}
.admin-nav-child{
  padding:8px 12px;
  font-size:0.88rem;
  opacity:0.72;
}
.admin-nav-child.active{
  opacity:1;
  background:var(--gold);
  color:#fff;
}

/* ---------- FOOTER ---------- */
.admin-sidebar-footer{
  border-top:1px solid rgba(248,244,233,0.12);
  padding-top:16px;
  margin-top:16px;
}
.admin-user{
  display:flex; align-items:center; gap:10px;
  margin-bottom:12px;
}
.admin-user-avatar{
  width:36px; height:36px;
  border-radius:50%;
  background:var(--gold);
  color:#fff;
  display:flex; align-items:center; justify-content:center;
  font-weight:600;
  flex-shrink:0;
}
.admin-user-info{
  display:flex; flex-direction:column;
  font-size:0.82rem;
  overflow:hidden;
}
.admin-user-info strong{
  font-size:0.9rem;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.admin-user-info span{
  opacity:0.6; text-transform:capitalize;
}
.admin-logout{
  width:100%;
  padding:9px;
  background:transparent;
  border:1px solid rgba(248,244,233,0.25);
  color:var(--sidebar-text);
  border-radius:4px;
  font-size:0.85rem;
  cursor:pointer;
  font-family:inherit;
  transition:.2s;
}
.admin-logout:hover{
  background:var(--maroon);
  border-color:var(--maroon);
}

/* ---------- MAIN ---------- */
.admin-main{
  flex:1;
  padding:32px 40px;
  overflow-x:auto;
  min-width:0;
}

/* ---------- RESPONSIVE ---------- */
@media (max-width:820px){
  .admin-shell{ flex-direction:column; }
  .admin-sidebar{
    width:100%; height:auto;
    position:relative;
    flex-direction:row;
    align-items:center;
    padding:12px 16px;
    overflow-x:auto;
  }
  .admin-brand{ padding:0; border:none; margin:0; flex-shrink:0; }
  .admin-brand span{ display:none; }
  .admin-nav{
    flex-direction:row;
    padding:0 12px;
    gap:2px;
  }
  .admin-nav-link span:not(.admin-nav-icon):not(.admin-nav-caret){
    display:none;
  }
  .admin-nav-link{ padding:8px 10px; width:auto; }
  .admin-nav-group-btn{
    padding:8px 12px;
  }
  .admin-nav-caret{ display:none; }
  .admin-nav-children{
    position:absolute;
    top:100%;
    left:0;
    background:var(--sidebar);
    padding:8px;
    border-left:none;
    border-radius:0 0 6px 6px;
    box-shadow:0 8px 24px rgba(0,0,0,0.3);
    margin:0;
    min-width:180px;
    z-index:50;
  }
  .admin-nav-child span:not(.admin-nav-icon){
    display:inline;
  }
  .admin-sidebar-footer{ border:none; margin:0; padding:0; }
  .admin-user-info{ display:none; }
  .admin-logout{ padding:6px 10px; font-size:0.75rem; }
  .admin-main{ padding:24px 18px; }
}
`;