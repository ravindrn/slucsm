import express from "express";
import QRCode from "qrcode";
import Task from "../models/Task.js";
import Submission from "../models/Submission.js";
import { protect, teamAuth } from "../middleware/auth.js";
import Team from "../models/Team.js";

const router = express.Router();

/* GET /api/qrcodes/task/:taskId — PNG stream (admin) */
router.get("/task/:taskId", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!task.qrCode)
      return res.status(400).json({ message: "Task has no QR code set" });

    const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const scanUrl = `${baseUrl}/scan/${encodeURIComponent(task.qrCode)}`;

    const png = await QRCode.toBuffer(scanUrl, {
      errorCorrectionLevel: "M",
      type: "png",
      margin: 2,
      width: 512,
      color: { dark: "#1B2A4A", light: "#FFFDF8" },
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="qr-${task.qrCode}.png"`
    );
    res.send(png);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* GET /api/qrcodes/preview/:taskId — JSON with data URL (admin) */
router.get("/preview/:taskId", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task || !task.qrCode)
      return res.status(404).json({ message: "QR not available" });

    const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const scanUrl = `${baseUrl}/scan/${encodeURIComponent(task.qrCode)}`;

    const dataUrl = await QRCode.toDataURL(scanUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 512,
      color: { dark: "#1B2A4A", light: "#FFFDF8" },
    });

    res.json({ dataUrl, scanUrl, qrCode: task.qrCode });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* POST /api/qrcodes/redeem — team redeems a code */
router.post("/redeem", teamAuth, async (req, res) => {
  try {
    const { code, note = "" } = req.body;
    if (!code) return res.status(400).json({ message: "Missing code" });

    const task = await Task.findOne({
      eventId: req.team.eventId,
      qrCode: code.trim(),
      active: true,
    });

    if (!task)
      return res.status(404).json({ message: "Invalid code for this event" });

    if (
      task.assignedTo?.length > 0 &&
      !task.assignedTo.some((id) => id.toString() === req.team.teamId.toString())
    ) {
      return res
        .status(403)
        .json({ message: "This task is not assigned to your team" });
    }

    const existing = await Submission.findOne({
      teamId: req.team.teamId,
      taskId: task._id,
    });

    if (existing && existing.status === "approved") {
      return res.status(400).json({ message: "Task already approved" });
    }

    const sub = await Submission.findOneAndUpdate(
      { teamId: req.team.teamId, taskId: task._id },
      {
        eventId: req.team.eventId,
        teamId: req.team.teamId,
        taskId: task._id,
        status: "pending",
        note: note || `Scanned at ${new Date().toLocaleString()}`,
        proof: "",
      },
      { new: true, upsert: true }
    );

    res.status(201).json({ task, submission: sub });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* GET /api/qrcodes/tasks/:eventId — list QR tasks for print view (admin) */
router.get("/tasks/:eventId", protect, async (req, res) => {
  const tasks = await Task.find({
    eventId: req.params.eventId,
    type: { $in: ["qrScan", "checkpoint"] },
    qrCode: { $ne: "" },
    active: true,
  }).sort("order");
  res.json(tasks);
});


/* ============================================================
   TEAM QR — PNG stream (admin)
   ============================================================ */
router.get("/team/:teamId", protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).populate(
      "eventId",
      "title"
    );
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!team.teamCode) {
      return res
        .status(400)
        .json({ message: "This team has no code yet" });
    }

    const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const scanUrl = `${baseUrl}/team/${encodeURIComponent(team.teamCode)}`;

    const png = await QRCode.toBuffer(scanUrl, {
      errorCorrectionLevel: "M",
      type: "png",
      margin: 2,
      width: 512,
      color: { dark: "#1B2A4A", light: "#FFFDF8" },
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="team-${team.teamCode}.png"`
    );
    res.send(png);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============================================================
   TEAM QR — JSON preview with data URL (admin)
   ============================================================ */
router.get("/team-preview/:teamId", protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).populate(
      "eventId",
      "title when place"
    );
    if (!team || !team.teamCode) {
      return res.status(404).json({ message: "QR not available" });
    }

    const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const scanUrl = `${baseUrl}/team/${encodeURIComponent(team.teamCode)}`;

    const dataUrl = await QRCode.toDataURL(scanUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 512,
      color: { dark: "#1B2A4A", light: "#FFFDF8" },
    });

    res.json({
      dataUrl,
      scanUrl,
      teamCode: team.teamCode,
      teamName: team.name,
      teamColor: team.color || "#B8912F",
      eventTitle: team.eventId?.title || "",
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;