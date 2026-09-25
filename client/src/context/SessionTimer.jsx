import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 min
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
 * Auto-logout the user after a period of inactivity.
 * Resets on mouse/keyboard/scroll activity.
 */
export default function SessionTimer({ timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const { user, logout } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!user) return; // only when logged in

    const reset = () => {
      lastActivityRef.current = Date.now();
      warnedRef.current = false;
    };

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, reset, { passive: true })
    );

    const check = async () => {
      const idle = Date.now() - lastActivityRef.current;

      /* Warn once when approaching timeout */
      if (
        idle >= timeoutMs - WARNING_BEFORE_MS &&
        idle < timeoutMs &&
        !warnedRef.current
      ) {
        warnedRef.current = true;
        const keepGoing = window.confirm(
          "Your session will expire in 1 minute. Click OK to stay signed in."
        );
        if (keepGoing) {
          reset();
        }
      }

      /* Log out when timed out */
      if (idle >= timeoutMs) {
        try {
          await logout();
        } catch (e) {
          console.error(e);
        }
        window.location.href = "/login?reason=timeout";
      }
    };

    const interval = setInterval(check, 15 * 1000); // check every 15s

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, reset)
      );
      clearInterval(interval);
    };
  }, [user, logout, timeoutMs]);

  return null; // no UI
}