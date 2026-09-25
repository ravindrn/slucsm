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