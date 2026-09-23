import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

const signToken = (u) =>
  jwt.sign(
    { id: u._id, role: u.role, name: u.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);
   res
  .cookie("token", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: 7 * 24 * 3600 * 1000,
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
  res.json(u);
});

router.post("/register", protect, adminOnly, async (req, res) => {
  try {
    const u = await User.create(req.body);
    res.status(201).json({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get("/users", protect, adminOnly, async (_req, res) => {
  res.json(await User.find().select("-password"));
});

router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;