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

const isGroupActive = (group, pathname) =>
  group.children.some((c) => pathname.startsWith(c.to));

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  /* Mobile drawer state */
  const [mobileOpen, setMobileOpen] = useState(false);

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

  /* Close mobile drawer on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* Prevent body scroll when drawer is open on mobile */
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleGroup = (key) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = async () => {
    await logout();
    nav("/login");
  };

  const closeMobile = () => setMobileOpen(false);

  /* ---------- RENDER ONE NAV ITEM ---------- */
  const renderItem = (l) => {
    if (l.type === "link") {
      return (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            "admin-nav-link" + (isActive ? " active" : "")
          }
          onClick={closeMobile}
        >
          <span className="admin-nav-icon">{l.icon}</span>
          <span>{l.label}</span>
        </NavLink>
      );
    }

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
          <span className={`admin-nav-caret${isOpen ? " open" : ""}`}>▸</span>
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
                onClick={closeMobile}
              >
                <span className="admin-nav-icon">{c.icon}</span>
                <span>{c.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-shell">
      <style>{css}</style>

      {/* ---------- MOBILE TOP BAR ---------- */}
      <header className="admin-mobile-bar">
        <Link to="/" className="admin-mobile-brand">
          <img src="/slucsmLogo.png" alt="SLUCSM" />
          <span>SLUCSM Admin</span>
        </Link>
        <button
          className="admin-mobile-toggle"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <span className="hamburger">
            <span />
            <span />
            <span />
          </span>
        </button>
      </header>

      {/* ---------- MOBILE OVERLAY ---------- */}
      <div
        className={`admin-mobile-overlay${mobileOpen ? " open" : ""}`}
        onClick={closeMobile}
      />

      {/* ---------- SIDEBAR (desktop always, mobile drawer) ---------- */}
      <aside className={`admin-sidebar${mobileOpen ? " open" : ""}`}>
        {/* Close button on mobile */}
        <button
          className="admin-sidebar-close"
          onClick={closeMobile}
          aria-label="Close menu"
        >
          ×
        </button>

        <Link to="/" className="admin-brand" onClick={closeMobile}>
          <img src="/slucsmLogo.png" alt="SLUCSM" />
          <span>SLUCSM</span>
        </Link>

        <nav className="admin-nav">
          {LINKS.filter((l) => !l.adminOnly || user?.role === "admin").map(
            renderItem
          )}
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
html, body, #root{ margin:0; padding:0; width:100%; height:100%; overflow-x:hidden; }
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
  height:100vh;
  overflow:hidden;
  background:var(--ivory);
  font-family:'Inter',sans-serif;
  color:var(--ink);
}

/* ---------- MOBILE TOP BAR (hidden on desktop) ---------- */
.admin-mobile-bar{
  display:none;
  position:fixed;
  top:0; left:0; right:0;
  height:56px;
  z-index:40;
  background:var(--sidebar);
  color:var(--sidebar-text);
  align-items:center;
  justify-content:space-between;
  padding:0 16px;
  box-shadow:0 2px 12px rgba(0,0,0,0.15);
}
.admin-mobile-brand{
  display:flex; align-items:center; gap:10px;
  text-decoration:none; color:var(--sidebar-text);
  font-family:'Cormorant Garamond', serif;
  font-size:1.1rem; font-weight:600;
}
.admin-mobile-brand img{
  width:30px; height:30px; border-radius:50%;
  object-fit:contain; border:1.4px solid var(--gold);
  background:var(--paper); padding:2px;
}
.admin-mobile-toggle{
  background:none; border:none; cursor:pointer;
  padding:8px; display:flex; align-items:center; justify-content:center;
}
.hamburger{
  display:flex; flex-direction:column; gap:5px;
  width:24px;
}
.hamburger span{
  height:2px; background:var(--sidebar-text);
  border-radius:2px; transition:.2s;
}
.hamburger span:nth-child(1){ width:24px; }
.hamburger span:nth-child(2){ width:18px; }
.hamburger span:nth-child(3){ width:24px; }

/* ---------- MOBILE OVERLAY ---------- */
.admin-mobile-overlay{
  display:none;
  position:fixed; inset:0;
  background:rgba(27,42,74,0.5);
  z-index:49;
  opacity:0;
  pointer-events:none;
  transition:opacity .25s;
}
.admin-mobile-overlay.open{
  opacity:1; pointer-events:auto;
}

/* ---------- SIDEBAR ---------- */
.admin-sidebar{
  width:250px;
  background:var(--sidebar);
  color:var(--sidebar-text);
  display:flex; flex-direction:column;
  padding:22px 16px;
  height:100vh;
  flex-shrink:0;
  overflow-y:auto;
  position:relative;
}
.admin-sidebar-close{
  display:none;
  position:absolute; top:12px; right:12px;
  width:36px; height:36px;
  background:transparent; border:none;
  color:var(--sidebar-text);
  font-size:1.8rem; cursor:pointer;
  line-height:1; padding:0;
  border-radius:50%;
  transition:.15s;
}
.admin-sidebar-close:hover{
  background:rgba(255,255,255,0.1);
}

.admin-brand{
  display:flex; align-items:center; gap:10px;
  text-decoration:none; color:var(--sidebar-text);
  font-family:'Cormorant Garamond',serif;
  font-size:1.35rem; font-weight:600;
  padding:4px 8px 22px;
  border-bottom:1px solid rgba(248,244,233,0.12);
  margin-bottom:18px;
  flex-shrink:0;
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
  padding:11px 12px;
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

.admin-nav-group-btn{ position:relative; }
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
.admin-nav-caret.open{ transform:rotate(90deg); }

.admin-nav-children{
  display:flex; flex-direction:column; gap:2px;
  margin-left:14px;
  padding-left:14px;
  border-left:1px solid rgba(248,244,233,0.14);
  margin-top:2px;
  margin-bottom:4px;
}
.admin-nav-child{
  padding:9px 12px;
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
  flex-shrink:0;
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
  overflow-y:auto;
  overflow-x:auto;
  min-width:0;
  height:100vh;
}

/* ============================================================
   MOBILE (max 820px): Drawer sidebar + top bar
   ============================================================ */
@media (max-width:820px){
  .admin-shell{
    display:block;
    height:auto;
    overflow:visible;
    padding-top:56px;   /* space for the top bar */
  }

  /* Show mobile top bar */
  .admin-mobile-bar{ display:flex; }
  .admin-mobile-overlay{ display:block; }

  /* Sidebar becomes a slide-out drawer */
  .admin-sidebar{
    position:fixed;
    top:0; left:0;
    width:280px;
    max-width:85vw;
    height:100vh;
    z-index:50;
    transform:translateX(-100%);
    transition:transform .3s ease;
    box-shadow:4px 0 24px rgba(0,0,0,0.25);
    padding-top:60px;   /* space for the close button */
  }
  .admin-sidebar.open{
    transform:translateX(0);
  }

  /* Show close button on mobile */
  .admin-sidebar-close{ display:flex; align-items:center; justify-content:center; }

  /* Ensure all nav text shows */
  .admin-nav{
    flex-direction:column;
    padding:0;
    gap:4px;
  }
  .admin-nav-link{
    padding:12px 14px;
    font-size:0.95rem;
    width:100%;
  }
  .admin-nav-link span:not(.admin-nav-icon):not(.admin-nav-caret){
    display:inline;   /* make sure labels show */
  }
  .admin-nav-caret{ display:inline-block; }

  /* Children expand inline (accordion) */
  .admin-nav-children{
    position:static;
    background:transparent;
    padding:0 0 0 14px;
    margin-left:14px;
    border-left:1px solid rgba(248,244,233,0.14);
    border-radius:0;
    box-shadow:none;
    min-width:0;
  }
  .admin-nav-child{
    padding:10px 14px;
    font-size:0.9rem;
  }
  .admin-nav-child span:not(.admin-nav-icon){
    display:inline;
  }

  /* Footer stays at bottom of drawer */
  .admin-sidebar-footer{
    border-top:1px solid rgba(248,244,233,0.12);
    margin-top:16px;
    padding-top:16px;
  }
  .admin-user-info{ display:flex; }   /* show again on mobile */
  .admin-logout{ padding:9px; font-size:0.85rem; }

  /* Main content */
  .admin-main{
    padding:24px 18px;
    height:auto;
    overflow:visible;
  }
}

/* Small phones */
@media (max-width:420px){
  .admin-mobile-brand span{ font-size:0.95rem; }
  .admin-sidebar{ width:85vw; }
  .admin-main{ padding:20px 14px; }
}
`;