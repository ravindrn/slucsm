import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Team from "../models/Team.js";
import Event from "../models/Event.js";
import Task from "../models/Task.js";
import Submission from "../models/Submission.js";
import { protect, teamAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { eventSlug, username, password } = req.body;
    const event = await Event.findOne({ slug: eventSlug });
    if (!event) return res.status(404).json({ message: "Event not found" });

    const team = await Team.findOne({
      eventId: event._id,
      username: username.toLowerCase(),
      active: true,
    });
    if (!team) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, team.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { teamId: team._id, eventId: event._id, name: team.name },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res
      .cookie("teamToken", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 3600 * 1000,
      })
      .json({
        team: {
          id: team._id,
          name: team.name,
          color: team.color,
          totalScore: team.totalScore,
        },
        token,
      });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/logout", (_req, res) =>
  res.clearCookie("teamToken").json({ ok: true })
);

router.get("/me", teamAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.team.teamId).select("-passwordHash");
    if (!team) return res.status(404).json({ message: "Team not found" });

    const tasks = await Task.find({
      eventId: team.eventId,
      active: true,
      $or: [{ assignedTo: { $size: 0 } }, { assignedTo: team._id }],
    }).sort("order");

    const submissions = await Submission.find({
      teamId: team._id,
    }).populate("taskId", "title points");

    res.json({ team, tasks, submissions });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/event/:eventId", protect, async (req, res) => {
  const teams = await Team.find({ eventId: req.params.eventId }).select(
    "-passwordHash"
  );
  res.json(teams);
});

router.post("/", protect, async (req, res) => {
  try {
    const { eventId, name, username, password, members, color } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const team = await Team.create({
      eventId,
      name,
      username: username.toLowerCase(),
      passwordHash,
      members: members || [],
      color: color || "#B8912F",
    });
    res.status(201).json({
      id: team._id,
      name: team.name,
      username: team.username,
      members: team.members,
      color: team.color,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }
    const team = await Team.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-passwordHash");
    res.json(team);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  await Team.findByIdAndDelete(req.params.id);
  await Submission.deleteMany({ teamId: req.params.id });
  res.json({ ok: true });
});

export default router;