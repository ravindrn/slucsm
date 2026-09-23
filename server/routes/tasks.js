import express from "express";
import Task from "../models/Task.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/event/:eventId", async (req, res) => {
  const tasks = await Task.find({
    eventId: req.params.eventId,
    active: true,
  }).sort("order");
  res.json(tasks);
});

router.post("/", protect, async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(task);
});

router.delete("/:id", protect, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;