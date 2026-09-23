import mongoose from "mongoose";

/**
 * Section kinds:
 *  - notice        : announcements list
 *  - schedule      : agenda items with time + title
 *  - registration  : builtin form | googleForm link | external link
 *  - games         : teams + tasks module (enables team portal)
 *  - gallery       : photos
 *  - history       : year-by-year notes
 *  - custom        : free HTML/markdown block
 *  - contact       : who to reach out to
 */

const SectionSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["notice", "schedule", "registration", "games", "gallery", "history", "custom", "contact"],
      required: true,
    },
    title: { type: String, default: "" },   // optional heading override
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
    when: { type: String, default: "" },          // "Annually" / "Feb 14–16"
    place: { type: String, default: "" },
    tag: { type: String, default: "" },
    description: { type: String, default: "" },   // main paragraphs
    coverImage: { type: String, default: "" },
    galleryPreview: [{ type: String }],           // 3-4 preview photos on home

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