import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["admin", "editor"],
      default: "editor",
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* Mongoose 9: async pre-hook, no `next` param */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (p) {
  return bcrypt.compare(p, this.password);
};

export default mongoose.model("User", userSchema);