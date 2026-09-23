import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import Media from "../models/Media.js";
import Event from "../models/Event.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

/* ---------- MULTER ---------- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.originalname
        .replace(/\s+/g, "_")
        .replace(/[^\w.\-]/g, "")}`
    ),
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|webp|gif|svg/.test(file.mimetype);
    cb(ok ? null : new Error("Images only"), ok);
  },
});

/* ============================================================
   GET /api/media
   Query params:
     eventId=<id>      → filter by event (or "global" for null)
     search=<string>   → filename filter
     sort=<newest|oldest|name|size>
     limit, skip       → pagination
   ============================================================ */
router.get("/", protect, async (req, res) => {
  try {
    const { eventId, search, sort = "newest", limit = 200, skip = 0 } = req.query;

    const filter = {};
    if (eventId && eventId !== "all") {
      if (eventId === "global") filter.eventId = null;
      else filter.eventId = eventId;
    }
    if (search) filter.filename = { $regex: search, $options: "i" };

    let sortObj = { createdAt: -1 };
    if (sort === "oldest") sortObj = { createdAt: 1 };
    else if (sort === "name") sortObj = { filename: 1 };
    else if (sort === "size") sortObj = { size: -1 };

    const [files, total, totalSizeResult] = await Promise.all([
      Media.find(filter)
        .populate("eventId", "title slug status")
        .sort(sortObj)
        .limit(Number(limit))
        .skip(Number(skip)),
      Media.countDocuments(filter),
      Media.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$size" } } },
      ]),
    ]);

    res.json({
      files,
      stats: {
        count: total,
        totalSize: totalSizeResult[0]?.total || 0,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============================================================
   GET /api/media/stats
   Returns per-event counts + sizes — powers the filter dropdown
   ============================================================ */
router.get("/stats", protect, async (_req, res) => {
  try {
    const perEvent = await Media.aggregate([
      {
        $group: {
          _id: "$eventId",
          count: { $sum: 1 },
          size: { $sum: "$size" },
        },
      },
    ]);

    /* Attach event details */
    const eventIds = perEvent
      .map((p) => p._id)
      .filter(Boolean); // exclude null (global)
    const events = await Event.find({ _id: { $in: eventIds } }).select(
      "title slug status"
    );

    const grouped = perEvent.map((p) => {
      if (!p._id) {
        return {
          eventId: null,
          title: "Global (no event)",
          slug: null,
          count: p.count,
          size: p.size,
        };
      }
      const ev = events.find((e) => e._id.toString() === p._id.toString());
      return {
        eventId: p._id,
        title: ev?.title || "(deleted event)",
        slug: ev?.slug || null,
        status: ev?.status,
        count: p.count,
        size: p.size,
      };
    });

    res.json({ groups: grouped });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============================================================
   POST /api/media
   Body (multipart):
     files[]  → the images
     eventId  → optional event to attach them to
     tag      → optional label
   ============================================================ */
router.post("/", protect, upload.array("files", 30), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const { eventId = "", tag = "" } = req.body;

    /* If eventId is provided, verify it exists */
    let resolvedEventId = null;
    if (eventId && eventId !== "global") {
      const exists = await Event.findById(eventId).select("_id");
      if (!exists) {
        return res.status(400).json({ message: "Event not found" });
      }
      resolvedEventId = eventId;
    }

    const docs = await Media.insertMany(
      req.files.map((f) => ({
        filename: f.filename,
        originalName: f.originalname,
        url: `/uploads/${f.filename}`,
        size: f.size,
        mimetype: f.mimetype,
        eventId: resolvedEventId,
        tag,
        uploadedBy: req.user.id,
      }))
    );

    res.status(201).json({ files: docs });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/* ============================================================
   PUT /api/media/:id
   Move a file to a different event or update its tag
   ============================================================ */
router.put("/:id", protect, async (req, res) => {
  try {
    const updates = {};
    if (req.body.eventId !== undefined) {
      updates.eventId =
        req.body.eventId === "global" || !req.body.eventId
          ? null
          : req.body.eventId;
    }
    if (req.body.tag !== undefined) updates.tag = req.body.tag;

    const doc = await Media.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).populate("eventId", "title slug status");

    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/* ============================================================
   DELETE /api/media/:id
   Removes the DB record AND the file from disk
   ============================================================ */
router.delete("/:id", protect, async (req, res) => {
  try {
    const doc = await Media.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    /* Delete from disk */
    const safe = path.basename(doc.filename);
    const filePath = path.join(uploadsDir, safe);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await doc.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;