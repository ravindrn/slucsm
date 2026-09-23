import express from "express";
import CommitteeMember from "../models/CommitteeMember.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/* ============================================================
   PUBLIC — list all active members
   Query: ?year=2025/26&category=executive
   ============================================================ */
router.get("/", async (req, res) => {
  try {
    const filter = { active: true };
    if (req.query.year) filter.year = req.query.year;
    if (req.query.category) filter.category = req.query.category;

    const members = await CommitteeMember.find(filter).sort("order");
    res.json(members);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============================================================
   ADMIN — list all (including inactive)
   ============================================================ */
router.get("/all", protect, async (_req, res) => {
  try {
    const members = await CommitteeMember.find().sort("order");
    res.json(members);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============================================================
   ADMIN — get one
   ============================================================ */
router.get("/:id", protect, async (req, res) => {
  try {
    const member = await CommitteeMember.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Not found" });
    res.json(member);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============================================================
   ADMIN — create (with optional photo upload)
   ============================================================ */
router.post("/", protect, upload.single("photo"), async (req, res) => {
  try {
    const body = { ...req.body };

    /* Booleans come as strings from FormData */
    if (typeof body.active === "string") {
      body.active = body.active === "true";
    }
    if (typeof body.order === "string") {
      body.order = Number(body.order) || 0;
    }

    if (req.file) body.photo = req.file.path;

    /* Auto-derive initials if not provided */
    if (!body.initials && body.name) {
      body.initials = body.name
        .split(" ")
        .filter((w) => !/^fr\.?$/i.test(w)) // skip "Fr."
        .map((w) => w[0])
        .join("")
        .slice(0, 3)
        .toUpperCase();
    }

    const member = await CommitteeMember.create(body);
    res.status(201).json(member);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/* ============================================================
   ADMIN — update
   ============================================================ */
router.put("/:id", protect, upload.single("photo"), async (req, res) => {
  try {
    const body = { ...req.body };

    if (typeof body.active === "string") {
      body.active = body.active === "true";
    }
    if (typeof body.order === "string") {
      body.order = Number(body.order) || 0;
    }

    if (req.file) body.photo = `/uploads/${req.file.filename}`;

    const member = await CommitteeMember.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true }
    );
    if (!member) return res.status(404).json({ message: "Not found" });
    res.json(member);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/* ============================================================
   ADMIN — reorder (bulk move)
   Body: { ids: [...] in new order }
   ============================================================ */
router.post("/reorder", protect, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ message: "ids array required" });
    }

    await Promise.all(
      ids.map((id, i) =>
        CommitteeMember.findByIdAndUpdate(id, { order: i })
      )
    );

    const members = await CommitteeMember.find().sort("order");
    res.json(members);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============================================================
   ADMIN — delete
   ============================================================ */
router.delete("/:id", protect, async (req, res) => {
  try {
    const member = await CommitteeMember.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;