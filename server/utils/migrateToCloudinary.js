import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import Media from "../models/Media.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🌱 Migrating local uploads → Cloudinary…");

  if (!fs.existsSync(uploadsDir)) {
    console.log("No uploads folder. Nothing to migrate.");
    process.exit(0);
  }

  const files = fs.readdirSync(uploadsDir).filter((f) => f !== ".gitkeep");
  let uploaded = 0;
  let skipped = 0;

  for (const filename of files) {
    /* Skip if already migrated (by originalName match) */
    const exists = await Media.findOne({
      $or: [{ filename }, { originalName: filename }],
    });
    if (exists && exists.url?.startsWith("http")) {
      skipped++;
      continue;
    }

    const filePath = path.join(uploadsDir, filename);
    const stats = fs.statSync(filePath);

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "slucsm",
        public_id: `${Date.now()}-${filename.replace(/\.[^.]+$/, "")}`,
        resource_type: "image",
      });

      /* Upsert DB record */
      if (exists) {
        exists.url = result.secure_url;
        exists.filename = result.public_id;
        exists.size = stats.size;
        await exists.save();
      } else {
        await Media.create({
          filename: result.public_id,
          originalName: filename,
          url: result.secure_url,
          size: stats.size,
          mimetype: "image/*",
          eventId: null,
        });
      }

      console.log(`  ✅ ${filename} → ${result.secure_url}`);
      uploaded++;
    } catch (e) {
      console.error(`  ❌ ${filename}:`, e.message);
    }
  }

  console.log(`\n✅ Migration complete.`);
  console.log(`   Uploaded: ${uploaded}`);
  console.log(`   Skipped (already in Cloudinary): ${skipped}`);
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Migration failed:", e);
  process.exit(1);
});