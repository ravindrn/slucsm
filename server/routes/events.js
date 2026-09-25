import express from "express";
import Event from "../models/Event.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const filter = { published: true };
  if (req.query.status) filter.status = req.query.status;
  const events = await Event.find(filter).sort("order");
  res.json(events);
});

router.get("/:slug", async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug, published: true });
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json(event);
});

router.post("/", protect, upload.single("coverImage"), async (req, res) => {
  try {
    const body = { ...req.body };
    if (typeof body.sections === "string") body.sections = JSON.parse(body.sections);
    if (typeof body.galleryPreview === "string")
      body.galleryPreview = JSON.parse(body.galleryPreview);
    if (req.file) body.coverImage = req.file.path;
    const event = await Event.create(body);
    res.status(201).json(event);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put("/:id", protect, upload.single("coverImage"), async (req, res) => {
  try {
    const body = { ...req.body };
    if (typeof body.sections === "string") body.sections = JSON.parse(body.sections);
    if (typeof body.galleryPreview === "string")
      body.galleryPreview = JSON.parse(body.galleryPreview);
    if (req.file) body.coverImage = req.file.path;
    const event = await Event.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.post("/:id/sections", protect, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  event.sections.push({
    kind: req.body.kind,
    title: req.body.title || "",
    enabled: req.body.enabled ?? true,
    order: req.body.order ?? event.sections.length,
    data: req.body.data || {},
  });
  await event.save();
  res.status(201).json(event);
});

router.put("/:id/sections/:sectionId", protect, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  const section = event.sections.id(req.params.sectionId);
  if (!section) return res.status(404).json({ message: "Section not found" });
  if (req.body.kind !== undefined) section.kind = req.body.kind;
  if (req.body.title !== undefined) section.title = req.body.title;
  if (req.body.enabled !== undefined) section.enabled = req.body.enabled;
  if (req.body.order !== undefined) section.order = req.body.order;
  if (req.body.data !== undefined) section.data = req.body.data;
  await event.save();
  res.json(event);
});

router.delete("/:id/sections/:sectionId", protect, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  event.sections.pull({ _id: req.params.sectionId });
  await event.save();
  res.json(event);
});

export default router;