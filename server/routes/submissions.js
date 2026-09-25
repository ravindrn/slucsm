import express from "express";
import { v2 as cloudinary } from "cloudinary";
import Submission from "../models/Submission.js";
import Task from "../models/Task.js";
import Team from "../models/Team.js";
import { protect, teamAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { computeTaskUnlocks } from "../utils/taskUnlock.js";

const router = express.Router();

/* ============================================================
   TEAM: submit a task
   Body (multipart):
     taskId       — the task being submitted
     note         — optional note
     labels       — JSON array of labels matching file order (e.g. ["Black","Blue"])
     files[]      — one or more files
   ============================================================ */
router.post(
  "/",
  teamAuth,
  upload.array("files", 20),
  async (req, res) => {
    try {
      const { taskId, note = "", labels = "[]" } = req.body;

      const task = await Task.findById(taskId);
      if (!task) return res.status(404).json({ message: "Task not found" });

      /* ---------- CHECK IF TASK IS UNLOCKED FOR THIS TEAM ---------- */
      const allTasks = await Task.find({
        eventId: req.team.eventId,
        active: true,
      });

      const team = await Team.findById(req.team.teamId);
      const allSubs = await Submission.find({ teamId: req.team.teamId });

      const { unlocked } = computeTaskUnlocks(
        allTasks,
        allSubs,
        team?.unlockedOverride || []
      );

      if (!unlocked.has(String(taskId))) {
        return res.status(403).json({
          message: "Complete previous tasks first",
        });
      }
      /* ------------------------------------------------------------ */

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      if (task.maxFiles && req.files.length > task.maxFiles) {
        return res.status(400).json({
          message: `This task allows up to ${task.maxFiles} files`,
        });
      }

      let parsedLabels = [];
      try {
        parsedLabels = JSON.parse(labels);
      } catch {
        parsedLabels = [];
      }

      const files = req.files.map((f, i) => ({
        url: f.path,
        publicId: f.filename,
        type: f.mimetype.startsWith("video/") ? "video" : "image",
        label: parsedLabels[i] || "",
      }));

      /* ------------------------------------------------------------
         EXISTING BEHAVIOR — unchanged for now.
         Progress tasks: create new submission each time.
         Single/multi: upsert (replace previous if not approved).
         ------------------------------------------------------------ */
      let sub;
      if (task.submissionType === "progress") {
        sub = await Submission.create({
          eventId: req.team.eventId,
          teamId: req.team.teamId,
          taskId,
          files,
          note,
          status: "pending",
        });
      } else {
        const existing = await Submission.findOne({
          teamId: req.team.teamId,
          taskId,
        });

        if (existing && existing.status === "approved") {
          return res.status(400).json({ message: "Task already approved" });
        }

        sub = await Submission.findOneAndUpdate(
          { teamId: req.team.teamId, taskId },
          {
            eventId: req.team.eventId,
            teamId: req.team.teamId,
            taskId,
            files,
            note,
            status: "pending",
            score: 0,
            itemsScored: [],
          },
          { new: true, upsert: true }
        );
      }

      res.status(201).json({ task, submission: sub });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
);

/* ============================================================
   ADMIN: list submissions for an event
   ============================================================ */
router.get("/event/:eventId", protect, async (req, res) => {
  const subs = await Submission.find({ eventId: req.params.eventId })
    .populate("teamId", "name color")
    .populate("taskId", "title points pointsPerItem submissionType")
    .sort("-createdAt");
  res.json(subs);
});

/* ============================================================
   ADMIN: list submissions for a specific team + task
   ============================================================ */
router.get("/team/:teamId/task/:taskId", protect, async (req, res) => {
  const subs = await Submission.find({
    teamId: req.params.teamId,
    taskId: req.params.taskId,
  }).sort("-createdAt");
  res.json(subs);
});

/* ============================================================
   ADMIN: approve / reject / adjust score
   Body: { status, score, itemsScored: [{ label, points }] }
   ============================================================ */
router.put("/:id", protect, async (req, res) => {
  try {
    const { status, score, itemsScored } = req.body;
    const sub = await Submission.findById(req.params.id).populate("taskId");
    if (!sub) return res.status(404).json({ message: "Not found" });

    const task = sub.taskId;
    const previousScore = sub.score;

    /* For multi-item tasks, compute score from itemsScored */
    let finalScore = score ?? sub.score;

    if (Array.isArray(itemsScored) && itemsScored.length > 0) {
      sub.itemsScored = itemsScored;
      finalScore = itemsScored.reduce((sum, i) => sum + (i.points || 0), 0);
    } else if (
      status === "approved" &&
      task?.submissionType === "multi" &&
      task.pointsPerItem > 0 &&
      sub.files?.length > 0
    ) {
      /* Auto-score: pointsPerItem × number of files */
      finalScore = task.pointsPerItem * sub.files.length;
    } else if (status === "approved" && !score && task?.points) {
      /* Default: award the task's base points */
      finalScore = task.points;
    }

    sub.status = status ?? sub.status;
    sub.score = finalScore;
    sub.reviewedBy = req.user.id;
    sub.reviewedAt = new Date();
    await sub.save();

    /* Update team total score */
    const team = await Team.findById(sub.teamId);
    if (team) {
      team.totalScore = team.totalScore - previousScore + finalScore;
      await team.save();
    }

    res.json(sub);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/* ============================================================
   PUBLIC: leaderboard for event
   ============================================================ */
router.get("/leaderboard/:eventId", async (req, res) => {
  const teams = await Team.find({
    eventId: req.params.eventId,
    active: true,
  })
    .select("name color totalScore")
    .sort("-totalScore");
  res.json(teams);
});

/* ============================================================
   ADMIN: bulk approve all pending for a team + task
   ============================================================ */
router.post("/bulk-approve/:taskId/:teamId", protect, async (req, res) => {
  try {
    const subs = await Submission.find({
      taskId: req.params.taskId,
      teamId: req.params.teamId,
      status: "pending",
    }).populate("taskId");

    let totalAwarded = 0;
    for (const sub of subs) {
      const prev = sub.score;
      const task = sub.taskId;
      let score = task?.points || 0;
      if (task?.pointsPerItem > 0 && sub.files?.length) {
        score = task.pointsPerItem * sub.files.length;
      }
      sub.status = "approved";
      sub.score = score;
      sub.reviewedBy = req.user.id;
      sub.reviewedAt = new Date();
      await sub.save();
      totalAwarded += score - prev;
    }

    const team = await Team.findById(req.params.teamId);
    if (team) {
      team.totalScore += totalAwarded;
      await team.save();
    }

    res.json({ approved: subs.length, awarded: totalAwarded });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;