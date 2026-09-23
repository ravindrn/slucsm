import mongoose from "mongoose";

const CommitteeMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    university: { type: String, default: "", trim: true },
    initials: { type: String, default: "", trim: true },
    photo: { type: String, default: "" },   // /uploads/... or full URL

    /* Grouping — useful for multiple committees / years */
    year: { type: String, default: "" },     // "2025/26"
    category: {
      type: String,
      enum: ["executive", "spiritual", "coordinator", "other"],
      default: "executive",
    },

    email: { type: String, default: "" },
    phone: { type: String, default: "" },

    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CommitteeMemberSchema.index({ active: 1, order: 1 });

export default mongoose.model("CommitteeMember", CommitteeMemberSchema);