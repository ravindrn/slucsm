import express from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import crypto from "crypto";
import dotenv from "dotenv";
import Media from "../models/Media.js";
import Event from "../models/Event.js";
import { protect } from "../middleware/auth.js";

dotenv.config();

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ---------- Build collision-proof public_id ---------- */
function buildPublicId(originalName) {
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  const uuid = crypto.randomUUID().slice(0, 8);
  const safe = String(originalName || "file")
    .replace(/\.[^.]+$/, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]/g, "");
  return `${stamp}-${rand}-${uuid}-${safe}`;
}

/* ---------- Cloudinary storage ---------- */
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder: "slucsm",
      resource_type: isVideo ? "video" : "image",
      type: "upload",
      access_mode: "public",
      allowed_formats: isVideo
        ? ["mp4", "mov", "webm", "avi", "mkv"]
        : ["jpg", "jpeg", "png", "webp", "gif", "svg"],
      transformation: [{ quality: "auto", fetch_format: "auto" }],
      public_id: buildPublicId(file.originalname),
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isImage = /image\/(jpeg|jpg|png|webp|gif|svg)/.test(file.mimetype);
    const isVideo = /video\/(mp4|quicktime|webm|x-msvideo|x-matroska)/.test(
      file.mimetype
    );
    const ok = isImage || isVideo;
    cb(ok ? null : new Error("Images or videos only"), ok);
  },
});

/* ============================================================
   GET /api/media
   ============================================================ */
router.get("/", protect, async (req, res) => {
  try {
    const {
      eventId,
      search,
      sort = "newest",
      limit = 200,
      skip = 0,
    } = req.query;

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

    /* ---------- DEDUPE SAFETY NET ---------- */
    /* Multer may return duplicate entries if the same File reference
       was appended multiple times on the client. Filter them here. */
    const seen = new Map();
    const unique = [];

    for (const f of req.files) {
      const key = `${f.originalname}::${f.size}`;

      if (!seen.has(key)) {
        seen.set(key, f);
        unique.push(f);
      } else {
        /* Delete the duplicate from Cloudinary to avoid orphans */
        try {
          await cloudinary.uploader.destroy(f.filename, {
            resource_type: f.mimetype?.startsWith("video/")
              ? "video"
              : "image",
            invalidate: true,
          });
        } catch (err) {
          console.warn("Failed to clean up duplicate:", err.message);
        }
      }
    }

    console.log(
      `[media upload] Received ${req.files.length} files, kept ${unique.length} unique`
    );

    const { eventId = "", tag = "" } = req.body;

    let resolvedEventId = null;
    if (eventId && eventId !== "global") {
      const exists = await Event.findById(eventId).select("_id");
      if (!exists) {
        return res.status(400).json({ message: "Event not found" });
      }
      resolvedEventId = eventId;
    }

    const docs = unique.map((f) => ({
      filename: f.filename,
      originalName: f.originalname,
      url: f.path,
      size: f.size,
      mimetype: f.mimetype,
      eventId: resolvedEventId,
      tag,
      uploadedBy: req.user.id,
    }));

    const created = await Media.insertMany(docs);

    res.status(201).json({ files: created });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({
        message: "A file with the same identifier already exists.",
      });
    }
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
   ============================================================ */
router.delete("/:id", protect, async (req, res) => {
  try {
    const doc = await Media.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    try {
      await cloudinary.uploader.destroy(doc.filename, {
        resource_type: "image",
        invalidate: true,
      });
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