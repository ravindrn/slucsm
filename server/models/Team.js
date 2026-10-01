import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { _id: false }
);

const TeamSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    name: { type: String, required: true },
    username: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    members: [MemberSchema],
    color: { type: String, default: "#B8912F" },
    totalScore: { type: Number, default: 0 },
    active: { type: Boolean, default: true },

    /* ---------- UNIQUE TEAM CODE FOR QR ---------- */
    teamCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },

    /* ---------- SEQUENTIAL UNLOCK OVERRIDES ---------- */
    unlockedOverride: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],

    /* ---------- TASK PROGRESS TRACKING ---------- */
    /* When team confirmed they read Task 1 (Early Bird) */
    earlyBirdRead: { type: Boolean, default: false },
    earlyBirdReadAt: { type: Date, default: null },

    /* When team clicked "Start" on Task 2 (Chaos Challenges) */
    chaosStartedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

TeamSchema.index({ eventId: 1, username: 1 }, { unique: true });

export default mongoose.model("Team", TeamSchema);