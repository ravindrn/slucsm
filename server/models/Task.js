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

    /* If false, teams can't submit — admin awards manually */
    submittable: { type: Boolean, default: true },

    /* ---------- SEQUENTIAL UNLOCK ---------- */
    requiresPrevious: { type: Boolean, default: true },

    /* ---------- GROUPING (task hierarchy) ---------- */
    /* "early-bird" | "chaos-challenges" (or any custom group) */
    group: { type: String, default: "" },

    /* If true, this "task" is a section header/intro card, not a real task */
    isGroupIntro: { type: Boolean, default: false },

    /* If true, this intro card requires the team to click "Start" to see the group's items */
    hasStartGate: { type: Boolean, default: false },

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