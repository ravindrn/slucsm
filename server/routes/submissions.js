import express from "express";
import Submission from "../models/Submission.js";
import Task from "../models/Task.js";
import Team from "../models/Team.js";
import { protect, teamAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/", teamAuth, upload.single("proof"), async (req, res) => {
  try {
    const { taskId, note } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const proof = req.file ? `/uploads/${req.file.filename}` : "";

    const sub = await Submission.findOneAndUpdate(
      { teamId: req.team.teamId, taskId },
      {
        eventId: req.team.eventId,
        teamId: req.team.teamId,
        taskId,
        proof,
        note: note || "",
        status: "pending",
      },
      { new: true, upsert: true }
    );

    res.status(201).json(sub);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get("/event/:eventId", protect, async (req, res) => {
  const subs = await Submission.find({ eventId: req.params.eventId })
    .populate("teamId", "name color")
    .populate("taskId", "title points");
  res.json(subs);
});

router.put("/:id", protect, async (req, res) => {
  try {
    const { status, score } = req.body;
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Not found" });

    const previousScore = sub.score;
    sub.status = status ?? sub.status;
    sub.score = score ?? sub.score;
    sub.reviewedBy = req.user.id;
    sub.reviewedAt = new Date();
    await sub.save();

    const team = await Team.findById(sub.teamId);
    if (team) {
      team.totalScore = team.totalScore - previousScore + sub.score;
      await team.save();
    }

    res.json(sub);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get("/leaderboard/:eventId", async (req, res) => {
  const teams = await Team.find({
    eventId: req.params.eventId,
    active: true,
  })
    .select("name color totalScore")
    .sort("-totalScore");
  res.json(teams);
});

export default router;