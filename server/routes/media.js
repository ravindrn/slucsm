import express from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
import Media from "../models/Media.js";
import Event from "../models/Event.js";
import { protect } from "../middleware/auth.js";

dotenv.config();

const router = express.Router();

/* ---------- Cloudinary config ---------- */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ---------- Storage ---------- */
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => ({
  folder: "slucsm",
  resource_type: file.mimetype.startsWith("video/") ? "video" : "image",
  type: "upload",                       // ← ADD
  access_mode: "public",                // ← ADD
  allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "svg"],
  transformation: [{ quality: "auto", fetch_format: "auto" }],
  public_id: `...`,
}),
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
      stats: { count: total, totalSize: totalSizeResult[0]?.total || 0 },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============================================================
   GET /api/media/stats
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

    const eventIds = perEvent.map((p) => p._id).filter(Boolean);
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
   ============================================================ */
router.post("/", protect, upload.array("files", 30), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const { eventId = "", tag = "" } = req.body;

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
        filename: f.filename,           // Cloudinary public_id
        originalName: f.originalname,
        url: f.path,                    // Full Cloudinary URL
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
   Deletes from DB and Cloudinary
   ============================================================ */
router.delete("/:id", protect, async (req, res) => {
  try {
    const doc = await Media.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    /* Delete from Cloudinary */
    try {
      await cloudinary.uploader.destroy(doc.filename);
    } catch (e) {
      console.warn("Cloudinary delete failed:", e.message);
    }

    await doc.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;