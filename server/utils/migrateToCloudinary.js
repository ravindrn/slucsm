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

/* Recursively find all image files in the uploads folder */
function walk(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🌱 Connected to:", mongoose.connection.name);

  const files = walk(uploadsDir);
  console.log(`📂 Found ${files.length} image files to consider`);

  if (files.length === 0) {
    console.log("Nothing to migrate.");
    process.exit(0);
  }

  let uploaded = 0;
  let updated = 0;
  let skipped = 0;

  for (const fullPath of files) {
    /* Relative path from uploads/, e.g. "slucsm/123-photo.jpg" */
    const relative = path.relative(uploadsDir, fullPath).replace(/\\/g, "/");
    /* Public path as stored in DB, e.g. "/uploads/slucsm/123-photo.jpg" */
    const publicPath = `/uploads/${relative}`;

    /* Was this file already uploaded to Cloudinary? */
    const existing = await Media.findOne({
      $or: [{ filename: relative }, { originalName: path.basename(fullPath) }],
    });

    if (existing && existing.url?.startsWith("http")) {
      skipped++;
      continue;
    }

    try {
      console.log(`  ⬆ ${publicPath}`);
      const result = await cloudinary.uploader.upload(fullPath, {
        folder: "slucsm",
        resource_type: "image",
        type: "upload",                 // ← ADD
        access_mode: "public",          // ← ADD
        });

      /* Update Media record if exists */
      if (existing) {
        existing.url = result.secure_url;
        existing.filename = result.public_id;
        await existing.save();
      } else {
        await Media.create({
          filename: result.public_id,
          originalName: path.basename(fullPath),
          url: result.secure_url,
          size: fs.statSync(fullPath).size,
          mimetype: "image/jpeg",
          eventId: null,
        });
      }

      /* Also update committee member if they reference this path */
      const CommitteeMember = (await import("../models/CommitteeMember.js")).default;
      const updatedMembers = await CommitteeMember.updateMany(
        { photo: publicPath },
        { $set: { photo: result.secure_url } }
      );
      if (updatedMembers.modifiedCount > 0) {
        console.log(`     ↳ Updated ${updatedMembers.modifiedCount} committee member(s)`);
        updated += updatedMembers.modifiedCount;
      }

      /* Also update events */
      const Event = (await import("../models/Event.js")).default;
      await Event.updateMany(
        { coverImage: publicPath },
        { $set: { coverImage: result.secure_url } }
      );

      console.log(`     ✅ ${result.secure_url}`);
      uploaded++;
    } catch (e) {
      console.error(`     ❌ ${e.message}`);
    }
  }

  console.log(`\n✅ Migration complete.`);
  console.log(`   Files uploaded to Cloudinary: ${uploaded}`);
  console.log(`   Committee members fixed: ${updated}`);
  console.log(`   Skipped (already migrated): ${skipped}`);

  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Migration failed:", e);
  process.exit(1);
});