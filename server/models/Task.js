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
    type: {
      type: String,
      enum: ["checkpoint", "photo", "quiz", "qrScan", "manual"],
      default: "manual",
    },
    qrCode: { type: String, default: "" },          // unique code for qrScan tasks
    location: { type: String, default: "" },
    order: { type: Number, default: 0 },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }], // empty = all teams
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Task", TaskSchema);