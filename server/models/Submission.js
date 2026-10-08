import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "partial"],
      default: "pending",
    },

    /* Multiple files now supported */
    files: [
      {
        url: { type: String, required: true },       // Cloudinary URL
        publicId: { type: String, default: "" },     // Cloudinary public_id (for deletion)
        type: { type: String, default: "image" },    // "image" or "video"
        label: { type: String, default: "" },        // e.g. "Black", "Blue" for colour hunt
      },
    ],

    /* Legacy single file — kept for old submissions */
    proof: { type: String, default: "" },

    note: { type: String, default: "" },
    score: { type: Number, default: 0 },

    /* For incremental submissions (Parana Janadhipathi, Paparazzi) */
    itemsScored: [
      {
        label: { type: String, default: "" },
        points: { type: Number, default: 0 },
      },
    ],

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

/* Only enforce uniqueness for non-progress submissions */
SubmissionSchema.index({ teamId: 1, taskId: 1 });

const Submission = mongoose.model("Submission", SubmissionSchema);
export default Submission;

/* ============================================================
   PUBLIC: All approved submission files for an event
   Returns 403 if the event hasn't been published for the public.
   ============================================================ */
router.get("/gallery/:eventId", async (req, res) => {
  try {
    /* Verify event exists AND gallery is published */
    const Event = (await import("../models/Event.js")).default;
    const event = await Event.findById(req.params.eventId).select(
      "title slug galleryPublished galleryPublishedAt"
    );
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (!event.galleryPublished) {
      return res.status(403).json({
        message: "Gallery not yet published",
        code: "GALLERY_NOT_PUBLISHED",
      });
    }

    const { type = "all" } = req.query;

    const submissions = await Submission.find({
      eventId: req.params.eventId,
      status: "approved",
    })
      .populate("teamId", "name color teamCode")
      .populate("taskId", "title group order")
      .sort("-createdAt");

    const items = [];
    for (const sub of submissions) {
      if (!sub.teamId) continue;
      const files = sub.files || [];
      for (const f of files) {
        if (!f.url) continue;
        if (type === "image" && f.type !== "image") continue;
        if (type === "video" && f.type !== "video") continue;
        items.push({
          _id: `${sub._id}-${f.url}`,
          url: f.url,
          type: f.type || "image",
          label: f.label || "",
          note: sub.note || "",
          submittedAt: sub.createdAt,
          team: {
            _id: sub.teamId._id,
            name: sub.teamId.name,
            color: sub.teamId.color || "#B8912F",
            teamCode: sub.teamId.teamCode || "",
          },
          task: {
            title: sub.taskId?.title || "Challenge",
            group: sub.taskId?.group || "",
          },
        });
      }
    }

    const counts = {
      all: items.length,
      image: items.filter((i) => i.type === "image").length,
      video: items.filter((i) => i.type === "video").length,
    };

    const teamsMap = {};
    for (const item of items) {
      if (!teamsMap[item.team._id]) {
        teamsMap[item.team._id] = { ...item.team, count: 0 };
      }
      teamsMap[item.team._id].count += 1;
    }
    const teams = Object.values(teamsMap).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    res.json({
      items,
      counts,
      teams,
      event: {
        title: event.title,
        slug: event.slug,
        galleryPublishedAt: event.galleryPublishedAt,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
/* ============================================================
   ADMIN: Publish gallery for public view
   ============================================================ */
router.put("/gallery/:eventId/publish", protect, async (req, res) => {
  try {
    const Event = (await import("../models/Event.js")).default;
    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      {
        galleryPublished: true,
        galleryPublishedAt: new Date(),
      },
      { new: true }
    ).select("title slug galleryPublished galleryPublishedAt");

    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ ok: true, event });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/* ============================================================
   ADMIN: Unpublish gallery
   ============================================================ */
router.put("/gallery/:eventId/unpublish", protect, async (req, res) => {
  try {
    const Event = (await import("../models/Event.js")).default;
    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      {
        galleryPublished: false,
        galleryPublishedAt: null,
      },
      { new: true }
    ).select("title slug galleryPublished galleryPublishedAt");

    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ ok: true, event });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/* ============================================================
   ADMIN: Count approved files (preview before publishing)
   ============================================================ */
router.get("/gallery/:eventId/stats", protect, async (req, res) => {
  try {
    const submissions = await Submission.find({
      eventId: req.params.eventId,
      status: "approved",
    }).select("files");

    let total = 0;
    let images = 0;
    let videos = 0;
    for (const sub of submissions) {
      for (const f of sub.files || []) {
        if (!f.url) continue;
        total += 1;
        if (f.type === "video") videos += 1;
        else images += 1;
      }
    }

    res.json({ total, images, videos });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});