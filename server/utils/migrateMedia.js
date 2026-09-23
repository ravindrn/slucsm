import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Media from "../models/Media.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🌱 Scanning uploads folder…");

  const files = fs.readdirSync(uploadsDir).filter((f) => f !== ".gitkeep");
  let added = 0;
  let skipped = 0;

  for (const filename of files) {
    const exists = await Media.findOne({ filename });
    if (exists) {
      skipped++;
      continue;
    }

    const fullPath = path.join(uploadsDir, filename);
    const stats = fs.statSync(fullPath);

    await Media.create({
      filename,
      originalName: filename,
      url: `/uploads/${filename}`,
      size: stats.size,
      eventId: null, // default to global — admin can reassign later
    });
    added++;
  }

  console.log(`✅ Migration complete.`);
  console.log(`   Added: ${added}`);
  console.log(`   Skipped (already tracked): ${skipped}`);
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Migration failed:", e);
  process.exit(1);
});