import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Team from "../models/Team.js";
import Task from "../models/Task.js";
import SiteSettings from "../models/SiteSettings.js";
import bcrypt from "bcryptjs";

dotenv.config();

/* ---------- ARCHIVE EVENTS (existing 4) ---------- */
const archiveEvents = [
  {
    slug: "seminar",
    title: "National Seminar",
    when: "Annually",
    place: "St. Anne's Church, Thalawila",
    tag: "Main event of the year",
    description:
      "The flagship gathering of SLUCSM, held at the historic shrine of St. Anne's Church, Thalawila. Catholic students from every university converge for days of prayer, talks, adoration and fellowship — renewing their faith together at one of Sri Lanka's most cherished pilgrimage sites.\n\nExpect keynote reflections, small-group sharing, Holy Mass, and the quiet grace of the shrine itself.",
    status: "archive",
    order: 1,
    sections: [
      {
        kind: "gallery",
        title: "Past Years",
        order: 0,
        data: { photos: [] },
      },
      {
        kind: "history",
        title: "History",
        order: 1,
        data: {
          entries: [
            { year: "2025", note: "Theme: Walk by Faith." },
            { year: "2024", note: "Over 200 students from 12 universities." },
            { year: "2023", note: "First post-pandemic seminar." },
          ],
        },
      },
    ],
  },
  {
    slug: "pasan",
    title: "Pasan Hymn Event",
    when: "Easter",
    place: "Location varies",
    description:
      "A moving Easter tradition where students sing Pasan — traditional Sri Lankan Passion hymns — reflecting on the suffering and resurrection of Christ through music rooted in local heritage.",
    status: "archive",
    order: 2,
    sections: [],
  },
  {
    slug: "christmas",
    title: "Christmas Get-Together",
    when: "December",
    place: "Location varies",
    description:
      "A joyful year-end celebration of Christ's birth, bringing members together for carols, games, food and fellowship before students return home for the season.",
    status: "archive",
    order: 3,
    sections: [],
  },
  {
    slug: "agm",
    title: "Annual General Meeting",
    when: "Annually",
    place: "Location varies",
    description:
      "The AGM reflects on the year gone by, welcomes new leadership, and sets the direction for the Movement's coming year — grounded in prayer and shared discernment.",
    status: "archive",
    order: 4,
    sections: [],
  },
];

/* ---------- DEMO ONGOING EVENT ---------- */
const demoOngoing = {
  slug: "seminar-2026",
  title: "National Seminar 2026",
  when: "Feb 14–16, 2026",
  place: "St. Anne's Church, Thalawila",
  tag: "Happening Now",
  description:
    "Our 2026 National Seminar is underway. Three days of prayer, talks, adoration and fellowship — this time with a full team-based game running across the weekend.",
  status: "ongoing",
  startDate: new Date("2026-02-14"),
  endDate: new Date("2026-02-16"),
  order: 0,
  sections: [
    {
      kind: "notice",
      title: "Announcements",
      order: 0,
      data: {
        notices: [
          { text: "Buses depart from campus at 6:00 AM sharp.", pinned: true },
          { text: "Bring your Bible, notebook, and comfortable shoes." },
          { text: "Registration desk open till 10:00 AM." },
        ],
      },
    },
    {
      kind: "schedule",
      title: "Schedule",
      order: 1,
      data: {
        items: [
          { time: "6:00 AM", title: "Bus departure" },
          { time: "8:30 AM", title: "Arrival & registration" },
          { time: "10:00 AM", title: "Opening Mass" },
          { time: "12:30 PM", title: "Lunch" },
          { time: "2:00 PM", title: "Keynote: Walk by Faith" },
          { time: "6:00 PM", title: "Adoration" },
        ],
      },
    },
    {
      kind: "registration",
      title: "Register",
      order: 2,
      data: {
        mode: "googleForm",
        googleFormUrl: "https://forms.gle/demo-link",
        externalUrl: "",
        fields: [],
      },
    },
    {
      kind: "games",
      title: "Team Game",
      order: 3,
      data: {
        loginMode: "username",
        enabled: true,
        intro: "Join your team portal to see tasks, submit proof, and track your score.",
      },
    },
    {
      kind: "gallery",
      title: "Live Photos",
      order: 4,
      data: { photos: [] },
    },
  ],
};

/* ---------- SETTINGS ---------- */
const settings = {
  key: "main",
  hero: {
    eyebrow: "Sri Lanka University Catholic Students' Movement",
    title: "Faith that gathers us,\nfriendship that carries us.",
    subtitle:
      "A community of Catholic undergraduates across Sri Lanka's universities, walking together in prayer, fellowship and service.",
    images: [
      "/hero/hero1.jpg",
      "/hero/hero2.jpg",
      "/hero/hero3.jpg",
      "/hero/hero4.jpg",
    ],
    ctaPrimary: { text: "This Year's National Seminar", link: "#events" },
    ctaSecondary: { text: "See All Events", link: "#events" },
  },
  about: {
    kicker: "Who we are",
    title: "One movement, every campus",
    lead: "SLUCSM brings together Catholic students from universities across the island into a single spiritual family — praying together, learning together, and supporting one another through university life and beyond.",
  },
  quote: {
    text: "Where two or three gather in my name, there am I with them.",
    cite: "Matthew 18:20",
  },
  contact: {
    email: "info@slucsm.lk",
    phone: "+94 XX XXX XXXX",
    facebook: "",
    instagram: "",
    youtube: "",
  },
  announcement: { text: "", active: false },
};

/* ---------- RUN ---------- */
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🌱 Connected. Seeding...");

  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Team.deleteMany({}),
    Task.deleteMany({}),
    SiteSettings.deleteMany({}),
  ]);

  /* Admin */
  await User.create({
    name: "Admin",
    email: "admin@slucsm.lk",
    password: "admin1234",
    role: "admin",
  });

  /* Settings */
  await SiteSettings.create(settings);

  /* Events */
  await Event.insertMany(archiveEvents);
  const ongoing = await Event.create(demoOngoing);

  /* Demo teams for the ongoing event */
  const teamPass = await bcrypt.hash("team123", 10);
  const teams = await Team.insertMany([
    {
      eventId: ongoing._id,
      name: "Team Alpha",
      username: "alpha",
      passwordHash: teamPass,
      color: "#B8912F",
    },
    {
      eventId: ongoing._id,
      name: "Team Beta",
      username: "beta",
      passwordHash: teamPass,
      color: "#6E2C2C",
    },
  ]);

  /* Demo tasks */
  await Task.insertMany([
    {
      eventId: ongoing._id,
      title: "Morning Prayer Check-in",
      description: "Scan the QR at the chapel entrance before 8 AM.",
      points: 10,
      type: "checkpoint",
      order: 0,
    },
    {
      eventId: ongoing._id,
      title: "Group Photo at the Shrine",
      description: "Take a team photo in front of the shrine and upload it.",
      points: 20,
      type: "photo",
      order: 1,
    },
    {
      eventId: ongoing._id,
      title: "Bible Verse Quiz",
      description: "Answer the quiz at the registration desk.",
      points: 30,
      type: "quiz",
      order: 2,
    },
  ]);

  console.log("✅ Seed complete!");
  console.log("   Admin login:  admin@slucsm.lk / admin1234");
  console.log("   Team logins:  alpha / team123  |  beta / team123");
  console.log("   Ongoing event slug: seminar-2026");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});