import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token =
    req.cookies?.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Admins only" });
  next();
};

/* ---------- TEAM AUTH (separate from admin) ---------- */
export const teamAuth = async (req, res, next) => {
  const token =
    req.cookies?.teamToken || req.headers["x-team-token"];
  if (!token) return res.status(401).json({ message: "Team not authenticated" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.team = payload; // { teamId, eventId, name }
    next();
  } catch {
    res.status(401).json({ message: "Invalid team session" });
  }
};