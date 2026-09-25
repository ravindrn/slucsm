import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

const signToken = (u) =>
  jwt.sign(
    { id: u._id, role: u.role, name: u.name },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

/* ============================================================
   PUBLIC: login
   ============================================================ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    if (user.active === false) {
      return res
        .status(403)
        .json({ message: "Your account has been deactivated" });
    }

    const token = signToken(user);
    res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",        // ← first-party via Vercel proxy
        secure: true,
        maxAge: 1 * 24 * 3600 * 1000,
      })
      .json({ user: { id: user._id, name: user.name, role: user.role } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/logout", (_req, res) =>
  res.clearCookie("token").json({ ok: true })
);

router.get("/me", protect, async (req, res) => {
  const u = await User.findById(req.user.id).select("-password");
  if (!u) return res.status(404).json({ message: "User not found" });
  if (u.active === false)
    return res.status(403).json({ message: "Account deactivated" });
  res.json(u);
});

/* ============================================================
   ADMIN: create a new user
   ============================================================ */
router.post("/register", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "editor",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/* ============================================================
   ADMIN: list all users
   ============================================================ */
router.get("/users", protect, adminOnly, async (_req, res) => {
  const users = await User.find().select("-password").sort("createdAt");
  res.json(users);
});

/* ============================================================
   ADMIN: update a user
   ============================================================ */
router.put("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, active } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (String(user._id) === String(req.user.id)) {
      if (role && role !== "admin") {
        return res
          .status(400)
          .json({ message: "You cannot change your own role" });
      }
      if (active === false) {
        return res
          .status(400)
          .json({ message: "You cannot deactivate your own account" });
      }
    }

    if (email && email !== user.email) {
      const dup = await User.findOne({ email });
      if (dup) return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (active !== undefined) user.active = active;

    if (password && password.length >= 6) {
      user.password = password;
    } else if (password && password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/* ============================================================
   ADMIN: delete a user
   ============================================================ */
router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "Cannot delete the only remaining admin" });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;