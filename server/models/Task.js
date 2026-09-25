import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    title: { type: String, required: true },
    description: { type: String, default: "" },

    points: { type: Number, default: 10 },
    pointsPerItem: { type: Number, default: 0 },

    submissionType: {
      type: String,
      enum: ["single", "multi", "progress"],
      default: "single",
    },
    allowVideo: { type: Boolean, default: false },
    maxFiles: { type: Number, default: 1 },
    requireAllItems: { type: Boolean, default: false },

    /* ---------- SEQUENTIAL UNLOCK ---------- */
    requiresPrevious: { type: Boolean, default: true },

    type: {
      type: String,
      enum: ["manual", "photo", "quiz", "qrScan", "checkpoint", "video", "multi"],
      default: "manual",
    },
    qrCode: { type: String, default: "" },
    location: { type: String, default: "" },
    order: { type: Number, default: 0 },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Task", TaskSchema);