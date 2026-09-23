import express from "express";
import SiteSettings from "../models/SiteSettings.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  let s = await SiteSettings.findOne({ key: "main" });
  if (!s) s = await SiteSettings.create({ key: "main" });
  res.json(s);
});

router.put("/", protect, async (req, res) => {
  const s = await SiteSettings.findOneAndUpdate({ key: "main" }, req.body, {
    new: true,
    upsert: true,
  });
  res.json(s);
});

export default router;