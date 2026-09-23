import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    hero: {
      eyebrow: { type: String, default: "" },
      title: { type: String, default: "" },
      subtitle: { type: String, default: "" },
      images: [{ type: String }],
      ctaPrimary: { text: String, link: String },
      ctaSecondary: { text: String, link: String },
    },
    about: {
      kicker: String,
      title: String,
      lead: String,
    },
    quote: {
      text: String,
      cite: String,
    },
    contact: {
      email: String,
      phone: String,
      facebook: String,
      instagram: String,
      youtube: String,
    },
    announcement: { text: String, active: Boolean },
  },
  { timestamps: true }
);

export default mongoose.model("SiteSettings", SettingsSchema);