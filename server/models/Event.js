import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["notice", "schedule", "registration", "games", "gallery", "history", "custom", "contact"],
      required: true,
    },
    title: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true }
);

const EventSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    theme: { type: String, default: "" },

    when: { type: String, default: "" },
    place: { type: String, default: "" },
    tag: { type: String, default: "" },
    description: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    galleryPreview: [{ type: String }],

    /* ---------- PUBLIC GALLERY ---------- */
    galleryPublished: { type: Boolean, default: false },
    galleryPublishedAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ["archive", "upcoming", "ongoing", "completed"],
      default: "archive",
    },
    startDate: { type: Date },
    endDate: { type: Date },

    sections: [SectionSchema],

    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

EventSchema.index({ status: 1, published: 1, order: 1 });

export default mongoose.model("Event", EventSchema);