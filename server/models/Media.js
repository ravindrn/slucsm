import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true },
    originalName: { type: String, default: "" },
    url: { type: String, required: true },
    size: { type: Number, default: 0 },
    mimetype: { type: String, default: "" },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },

    /* Scope — which event this belongs to (optional) */
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
      index: true,
    },

    /* Optional label / category */
    tag: { type: String, default: "" },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

MediaSchema.index({ eventId: 1, createdAt: -1 });

export default mongoose.model("Media", MediaSchema);