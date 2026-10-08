import express from "express";
import { v2 as cloudinary } from "cloudinary";
import Submission from "../models/Submission.js";
import Task from "../models/Task.js";
import Team from "../models/Team.js";
import Event from "../models/Event.js";
import { protect, teamAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { computeTaskUnlocks } from "../utils/taskUnlock.js";

const router = express.Router();

/* ============================================================
   ⚠️  ROUTE ORDER MATTERS
   Specific routes first. Generic /:id routes LAST.
   ============================================================ */

/* ============================================================
   1. PUBLIC GALLERY ROUTES (must be first)
   ============================================================ */

/* GET /api/submissions/gallery/:eventId/stats — admin stats */
router.get("/gallery/:eventId/stats", protect, async (req, res) => {
  try {
    const submissions = await Submission.find({
      eventId: req.params.eventId,
      status: "approved",
    }).select("files");

    let total = 0;
    let images = 0;
    let videos = 0;
    for (const sub of submissions) {
      for (const f of sub.files || []) {
        if (!f.url) continue;
        total += 1;
        if (f.type === "video") videos += 1;
        else images += 1;
      }
    }

    res.json({ total, images, videos });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* PUT /api/submissions/gallery/:eventId/publish */
router.put("/gallery/:eventId/publish", protect, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      {
        galleryPublished: true,
        galleryPublishedAt: new Date(),
      },
      { new: true }
    ).select("title slug galleryPublished galleryPublishedAt");

    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ ok: true, event });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/* PUT /api/submissions/gallery/:eventId/unpublish */
router.put("/gallery/:eventId/unpublish", protect, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      {
        galleryPublished: false,
        galleryPublishedAt: null,
      },
      { new: true }
    ).select("title slug galleryPublished galleryPublishedAt");

    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ ok: true, event });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/* GET /api/submissions/gallery/:eventId — public gallery data */
router.get("/gallery/:eventId", async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).select(
      "title slug galleryPublished galleryPublishedAt"
    );
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (!event.galleryPublished) {
      return res.status(403).json({
        message: "Gallery not yet published",
        code: "GALLERY_NOT_PUBLISHED",
      });
    }

    const { type = "all" } = req.query;

    const submissions = await Submission.find({
      eventId: req.params.eventId,
      status: "approved",
    })
      .populate("teamId", "name color teamCode")
      .populate("taskId", "title group order")
      .sort("-createdAt");

    const items = [];
    for (const sub of submissions) {
      if (!sub.teamId) continue;
      const files = sub.files || [];
      for (const f of files) {
        if (!f.url) continue;
        if (type === "image" && f.type !== "image") continue;
        if (type === "video" && f.type !== "video") continue;
        items.push({
          _id: `${sub._id}-${f.url}`,
          url: f.url,
          type: f.type || "image",
          label: f.label || "",
          note: sub.note || "",
          submittedAt: sub.createdAt,
          team: {
            _id: sub.teamId._id,
            name: sub.teamId.name,
            color: sub.teamId.color || "#B8912F",
            teamCode: sub.teamId.teamCode || "",
          },
          task: {
            title: sub.taskId?.title || "Challenge",
            group: sub.taskId?.group || "",
          },
        });
      }
    }

    const counts = {
      all: items.length,
      image: items.filter((i) => i.type === "image").length,
      video: items.filter((i) => i.type === "video").length,
    };

    const teamsMap = {};
    for (const item of items) {
      if (!teamsMap[item.team._id]) {
        teamsMap[item.team._id] = { ...item.team, count: 0 };
      }
      teamsMap[item.team._id].count += 1;
    }
    const teams = Object.values(teamsMap).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    res.json({
      items,
      counts,
      teams,
      event: {
        title: event.title,
        slug: event.slug,
        galleryPublishedAt: event.galleryPublishedAt,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============================================================
   2. PUBLIC: Leaderboard
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
   3. ADMIN: Event submissions list
   ============================================================ */

router.get("/event/:eventId", protect, async (req, res) => {
  const subs = await Submission.find({ eventId: req.params.eventId })
    .populate("teamId", "name color")
    .populate("taskId", "title points pointsPerItem submissionType")
    .sort("-createdAt");
  res.json(subs);
});

/* ============================================================
   4. ADMIN: Submissions for a specific team + task
   ============================================================ */

router.get("/team/:teamId/task/:taskId", protect, async (req, res) => {
  const subs = await Submission.find({
    teamId: req.params.teamId,
    taskId: req.params.taskId,
  }).sort("-createdAt");
  res.json(subs);
});

/* ============================================================
   5. TEAM: Submit a task
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

      if (task.submittable === false) {
        return res.status(400).json({
          message:
            "This task doesn't accept submissions — it's admin-awarded.",
        });
      }

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

        if (existing?.files?.length) {
          for (const f of existing.files) {
            if (f.publicId) {
              try {
                await cloudinary.uploader.destroy(f.publicId, {
                  resource_type: f.type === "video" ? "video" : "image",
                });
              } catch (e) {
                console.warn("Cloudinary delete failed:", e.message);
              }
            }
          }
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
   6. ADMIN: Approve / reject / adjust score
   ============================================================ */

router.put("/:id", protect, async (req, res) => {
  try {
    const { status, score, itemsScored } = req.body;
    const sub = await Submission.findById(req.params.id).populate("taskId");
    if (!sub) return res.status(404).json({ message: "Not found" });

    const task = sub.taskId;
    const previousScore = sub.score;

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
      finalScore = task.pointsPerItem * sub.files.length;
    } else if (status === "approved" && !score && task?.points) {
      finalScore = task.points;
    }

    sub.status = status ?? sub.status;
    sub.score = finalScore;
    sub.reviewedBy = req.user.id;
    sub.reviewedAt = new Date();
    await sub.save();

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
   7. ADMIN: Bulk approve all pending for a team + task
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