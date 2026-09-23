import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

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
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "svg"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
    public_id: `${Date.now()}-${file.originalname
      .replace(/\.[^.]+$/, "")
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "")}`,
  }),
});

export const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|webp|gif|svg/.test(file.mimetype);
    cb(ok ? null : new Error("Images only"), ok);
  },
});