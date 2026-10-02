import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 60 * 1000;       // warn 1 min before
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

/**
 * Auto-logout the ADMIN user after a period of inactivity.
 *
 * IMPORTANT: Only runs when the current route is inside /admin/*.
 * Team portal and public pages are NEVER affected by this timer.
 */
export default function SessionTimer({ timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const lastActivityRef = useRef(Date.now());
  const warnedRef = useRef(false);

  /* Only activate on admin routes */
  const isAdminRoute =
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/");

  useEffect(() => {
    /* Don't run if:
       - not on an admin route
       - no admin logged in
    */
    if (!isAdminRoute || !user) return;

    /* Reset on route change into admin */
    lastActivityRef.current = Date.now();
    warnedRef.current = false;

    const reset = () => {
      lastActivityRef.current = Date.now();
      warnedRef.current = false;
    };

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, reset, { passive: true })
    );

    const check = async () => {
      /* Re-check route — if user navigated away, do nothing */
      const stillAdminRoute =
        window.location.pathname === "/admin" ||
        window.location.pathname.startsWith("/admin/");
      if (!stillAdminRoute) return;

      const idle = Date.now() - lastActivityRef.current;

      /* Warn once */
      if (
        idle >= timeoutMs - WARNING_BEFORE_MS &&
        idle < timeoutMs &&
        !warnedRef.current
      ) {
        warnedRef.current = true;
        const keepGoing = window.confirm(
          "Your admin session will expire in 1 minute. Click OK to stay signed in."
        );
        if (keepGoing) reset();
      }

      /* Logout on timeout */
      if (idle >= timeoutMs) {
        try {
          await logout();
        } catch (e) {
          console.error(e);
        }
        window.location.href = "/login?reason=timeout";
      }
    };

    const interval = setInterval(check, 15 * 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, reset)
      );
      clearInterval(interval);
    };
  }, [isAdminRoute, user, logout, timeoutMs]);

  return null;
}