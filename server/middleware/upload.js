import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* Detect resource type from mimetype */
const getResourceType = (mimetype) => {
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("image/")) return "image";
  return "auto";
};

/* Detect folder + transformation based on type */
const buildParams = (file) => {
  const isVideo = file.mimetype.startsWith("video/");
  return {
    folder: "slucsm",
    resource_type: isVideo ? "video" : "image",
    allowed_formats: isVideo
      ? ["mp4", "mov", "webm", "avi", "mkv"]
      : ["jpg", "jpeg", "png", "webp", "gif", "svg"],
    transformation: isVideo
      ? [{ quality: "auto", fetch_format: "auto" }]
      : [{ quality: "auto", fetch_format: "auto" }],
    public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.originalname
      .replace(/\.[^.]+$/, "")
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "")}`,
  };
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => buildParams(file),
});

export const upload = multer({
  storage,
  limits: { fileSize: 60 * 1024 * 1024 }, // 60 MB — covers video + large images
  fileFilter: (_req, file, cb) => {
    const isImage = /image\/(jpeg|jpg|png|webp|gif|svg)/.test(file.mimetype);
    const isVideo = /video\/(mp4|quicktime|webm|x-msvideo|x-matroska)/.test(file.mimetype);
    const ok = isImage || isVideo;
    cb(ok ? null : new Error("Images or videos only"), ok);
  },
});