import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import teamRoutes from "./routes/teams.js";
import taskRoutes from "./routes/tasks.js";
import submissionRoutes from "./routes/submissions.js";
import settingsRoutes from "./routes/settings.js";
import qrRoutes from "./routes/qrcodes.js";
import mediaRoutes from "./routes/media.js";
import committeeRoutes from "./routes/committee.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------- ROUTES ---------- */
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/qrcodes", qrRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/committee", committeeRoutes);

app.get("/", (_, res) =>
  res.json({ ok: true, service: "SLUCSM API", version: "1.0.0" })
);

/* ---------- 404 ---------- */
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.url}` });
});

/* ---------- ERROR HANDLER ---------- */
app.use((err, _req, res, _next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

/* ---------- DATABASE ---------- */
const PORT = process.env.PORT || 5000;

mongoose.connection.on("connected", () =>
  console.log(`✅ MongoDB connected: ${mongoose.connection.name}`)
);
mongoose.connection.on("error", (err) =>
  console.error("❌ MongoDB error:", err.message)
);
mongoose.connection.on("disconnected", () =>
  console.warn("⚠️  MongoDB disconnected")
);

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    app.listen(PORT, () =>
      console.log(`🚀 API running at http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start:", err.message);
    process.exit(1);
  }
}

start();