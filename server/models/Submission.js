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
        url: { type: String, required: true },
        publicId: { type: String, default: "" },
        type: { type: String, default: "image" },
        label: { type: String, default: "" },
      },
    ],

    /* Legacy single file — kept for old submissions */
    proof: { type: String, default: "" },

    note: { type: String, default: "" },
    score: { type: Number, default: 0 },

    /* For incremental submissions */
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

SubmissionSchema.index({ teamId: 1, taskId: 1 });

const Submission = mongoose.model("Submission", SubmissionSchema);
export default Submission;