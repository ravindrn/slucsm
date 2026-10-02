import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* Build a collision-proof public_id */
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

/* Detect folder + transformation based on type */
const buildParams = (file) => {
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
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => buildParams(file),
});

/* ============================================================
   MULTER CONFIG
   ------------------------------------------------------------
   fileFilter runs for EVERY file multer receives. If the same
   File object is appended twice to the FormData, multer calls
   fileFilter twice — producing duplicate uploads to Cloudinary.
   ============================================================ */
export const upload = multer({
  storage,
  limits: { fileSize: 60 * 1024 * 1024 }, // 60 MB
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
   DEDUPE MIDDLEWARE
   ------------------------------------------------------------
   Runs AFTER multer. If multer somehow produced duplicate
   entries (same originalName + size + min gap), drop the extras.
   ============================================================ */
export function dedupeUploads(req, res, next) {
  if (!Array.isArray(req.files) || req.files.length <= 1) return next();

  const seen = new Map();
  const unique = [];

  for (const f of req.files) {
    const key = `${f.originalname}::${f.size}`;

    if (!seen.has(key)) {
      seen.set(key, f);
      unique.push(f);
    } else {
      /* Drop later duplicate — already have one with this signature */
      console.log(
        "[dedupeUploads] Dropped duplicate:",
        f.originalname,
        f.size
      );
    }
  }

  req.files = unique;
  next();
}