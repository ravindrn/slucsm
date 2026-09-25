import mongoose from "mongoose";
import dotenv from "dotenv";
import Event from "../models/Event.js";
import Task from "../models/Task.js";
import Team from "../models/Team.js";
import bcrypt from "bcryptjs";

dotenv.config();

const EVENT_SLUG = "seminar-2026";

/* ============================================================
   ALL 18 GAMES
   ============================================================ */
const GAMES = [
  {
    title: "Breaking News: NS Edition 📰",
    points: 20,
    submissionType: "single",
    allowVideo: true,
    maxFiles: 1,
    order: 1,
    requiresPrevious: false,
    description: `Something absolutely ridiculous has happened at NS… and your team is now the official news channel.

Create a fake breaking-news report about the most ridiculous thing that happened during the seminar.

🎥 Make it dramatic.`,
  },
  {
    title: "NS: The Musical 🎵",
    points: 25,
    submissionType: "single",
    allowVideo: true,
    maxFiles: 1,
    order: 2,
    description: `You have 30 seconds to prove your group belongs in the music industry.

🎵 Create a 30-second music video using one of the given songs.

Find the best 30 seconds of the song — it doesn't have to be the first 30 seconds!

And yeah, if you're really enjoying the process, it's okay to exceed the time limit a little. 👀😂

Songs:
🎵 Oyata Seethalada – Dushan Jayathilaka
🎵 Mage Girlfriend – Doctor
🎵 Digu Dasa Dutuwama – Romesh Sugathapala
🎵 Amma Amma Me Mata – Rukshan Mark
🎵 Kotthu – Iraj Weeraratne
🎵 Dukata Natanne – Kasun Wickramasinghe

Just make it entertaining! 💃🕺`,
  },
  {
    title: "Advertisement Nobody Asked For 📢",
    points: 20,
    submissionType: "single",
    allowVideo: true,
    maxFiles: 1,
    order: 3,
    description: `Choose a completely useless object.

Now convince us that it is the greatest invention humanity has ever witnessed.

📢 Create an advertisement for it.`,
  },
  {
    title: "University Swap 🎓",
    points: 20,
    submissionType: "single",
    allowVideo: true,
    maxFiles: 1,
    order: 4,
    description: `Imitate the stereotypical student life of another university.

Example: Life of a student in Colombo Med.

😭 Your university has been temporarily replaced. Act accordingly!`,
  },
  {
    title: "Expectation vs Reality 🩵",
    points: 15,
    submissionType: "multi",
    allowVideo: false,
    maxFiles: 2,
    pointsPerItem: 0,
    order: 5,
    description: `Take TWO photos:

📸 Photo 1: What you expected NS to be.
📸 Photo 2: What NS actually became.

Make the contrast as dramatic as possible.

Upload BOTH photos in one submission.`,
  },
  {
    title: "Meme: Live Action 😂",
    points: 15,
    submissionType: "multi",
    allowVideo: false,
    maxFiles: 2,
    pointsPerItem: 0,
    order: 6,
    description: `Pick a meme picture.

Now recreate it IRL with your group.

Same pose.
Same expressions.
Same energy.

📸 Submit the ORIGINAL meme + YOUR recreation (2 photos in one submission).`,
  },
  {
    title: "Wrong Answers Only 🤡",
    points: 20,
    submissionType: "single",
    allowVideo: true,
    maxFiles: 1,
    order: 7,
    description: `Do a TikTok-style video of:

"WRONG ANSWERS ONLY — NS EDITION"

Give the WRONGEST answers possible. 😭`,
  },
  {
    title: "The Colour Hunt 🌈",
    points: 35,
    submissionType: "progress",
    allowVideo: false,
    maxFiles: 1,
    pointsPerItem: 5,
    order: 8,
    description: `Find 1 person wearing the given colour and take a selfie/group photo with them.

Don't only stick to your own group! Drag people wearing that colour from other groups as well. 👀

The 7 colours (5 points each, 35 total):
🖤 Black
💙 Blue
❤️ Red
💚 Green
🤍 White
🩷 Pink
💜 Purple

Submit ONE photo per colour as separate submissions. Each approved colour = 5 points.`,
  },
  {
    title: "Complain About Something Good 😭",
    points: 20,
    submissionType: "single",
    allowVideo: true,
    maxFiles: 1,
    order: 9,
    description: `Choose a past SLUCSM committee member.

Your mission is to complain and scold them about something that was actually GOOD. 😭

🎥 Capture it as a video.

IMPORTANT: Try to somehow get the person into the video — they don't have to stand next to you. They can even appear somewhere in the background.

They also don't have to be in your group.`,
  },
  {
    title: "SLUCSM Paparazzi 📸",
    points: 45,
    submissionType: "progress",
    allowVideo: true,
    maxFiles: 1,
    pointsPerItem: 5,
    order: 10,
    description: `The current SLUCSM committee members are officially celebrities for today.

Your mission:

📸 Take paparazzi-style photos of current SLUCSM committee members.

🎥 Videos are also allowed.

Caught walking? 📸
Caught talking? 📸
Caught completely unaware? 📸

PERFECT.

Don't know who they are? Go check the website. 👀

Submit ONE photo/video per committee member as separate submissions. Each approved capture = 5 points.`,
  },
  {
    title: "NS Moment — Social Media Takeover 📱",
    points: 25,
    submissionType: "single",
    allowVideo: false,
    maxFiles: 1,
    order: 11,
    description: `Take a selfie or photo of one of your favourite NS moments.

Then:

📱 Post it on your Facebook Story.
🏷️ Tag the official SLUCSM page.
❤️ Like the official SLUCSM page.
➕ Follow the official SLUCSM page.

Then upload the screenshot of your posted story as proof.

And don't think: "They won't know if I didn't like/follow." 👀
Your team facilitator will check. 😌`,
  },
  {
    title: "Welcome to Hogwarts ⚡",
    points: 30,
    submissionType: "multi",
    allowVideo: false,
    maxFiles: 15,
    pointsPerItem: 0,
    order: 12,
    description: `Imagine your entire group received their Hogwarts letters.

Your mission:

✨ Create an image showing how your group members would look at Hogwarts.

If you're creating the images individually (not as a group), upload ALL members' pictures.

And don't stop there…

🏰 Which Hogwarts house would each person belong to?

Upload all your Hogwarts character images in one submission.`,
  },
  {
    title: "Parana Janadhipathi Interview 🎤",
    points: 70,
    submissionType: "progress",
    allowVideo: false,
    maxFiles: 1,
    pointsPerItem: 10,
    order: 13,
    description: `Find පරණ ජනාධිපතිලා (past presidents) and take a picture with them.

But there's a catch…

🎤 Ask them:
"What was your best memory at NS during your year?"

Then put their answer ON THE PHOTO.

And yes… try to find ALL of them. 👀
The more you find, the more scores you can get!

18–19 | Asanka
19–20 | Ruklan
20–21 | Pasindu
21–22 | Nivein
22–23 | Yoshell
23–24 | Nithil
24–25 | Arlaka

Submit ONE photo per president as separate submissions. Each approved president = 10 points.`,
  },
  {
    title: "Civil War: Group Edition ⚔️",
    points: 20,
    submissionType: "single",
    allowVideo: false,
    maxFiles: 1,
    order: 14,
    description: `Your group has officially split into TWO SIDES.

Choose your teams.

Now create a picture that looks like you are fighting each other.

EVERY group member must be visible in the picture.

And yes — ask someone else to take the photo.`,
  },
  {
    title: "Scholarship Exam: Press Conference 🎤",
    points: 20,
    submissionType: "single",
    allowVideo: true,
    maxFiles: 1,
    order: 15,
    description: `Imagine you just sat for the Scholarship Exam.

You walk out of the exam hall…

…and suddenly NEWS REPORTERS are waiting for your reaction. 🎤📸

Your group has to recreate the scene.

Give us the most dramatic post-exam reactions possible.`,
  },
  {
    title: "The SLUCSM Wristband Photoshoot 📸",
    points: 10,
    submissionType: "single",
    allowVideo: false,
    maxFiles: 1,
    order: 16,
    description: `Take a creative group picture while wearing your SLUCSM wristbands.

Don't have one? NO ISSUES. WE GOT YOU. 😌
You can purchase one from your team facilitator.

Now don't just stand in a line and smile. 😭
Be creative!`,
  },
  {
    title: "Titanic: The Alternate Ending 🚢",
    points: 25,
    submissionType: "single",
    allowVideo: true,
    maxFiles: 1,
    order: 17,
    description: `What if Titanic had a completely different ending?

Your group has to act it out.

Be creative. Make your own ending.

And yes… if you want to bring characters from other movies into the scene, GO FOR IT. 😭

Example:
Princess Ariel from The Little Mermaid comes to save Jack when he is drowning, and they both live happily ever after. 😂

The more ridiculous the ending, the better.`,
  },
  {
    title: "Let's See How Well You Know Each Other 👀",
    points: 20,
    submissionType: "single",
    allowVideo: true,
    maxFiles: 1,
    order: 18,
    description: `Time to expose your own teammates. 😭

Create a short video where you expose who is who.
If more than one person matches the description, show them ALL.

Who is the…

🎥 Director among us?
🤡 Team එකේ Joker?
😇 Most innocent?
🤦‍♀️ "වෙන්නේ මොනාද? වුණේ මොනාද? කිසි දෙයක් දන්නේ නැති" කෙනා?
😈 Most mischievous?
📸 පින්තූර ගන්න පටන් ගත්තම නවත්තගන්න බැරි කෙනා?
🫠 Most likely to embarrass the entire group?
🗣️ කියවන්න පටන් ගත්තම නවත්තගන්න බැරි කෙනා?
⏰ Most likely to come late and make the entire team lose marks?
📚 Most likely to have a GPA of 4.0?

And finally…

😭 Who is මල්සරා among us?`,
  },
];

/* ============================================================
   BONUS: Early Bird (as a task with 0 points — admin awards manually)
   ============================================================ */
const EARLY_BIRD = {
  title: "🌟 EARLY BIRD BONUS",
  points: 0,
  submissionType: "single",
  allowVideo: false,
  maxFiles: 1,
  order: 0,
  requiresPrevious: false,
  description: `Think the points start when the outdoor games start?
WRONG. 😌

The FIRST 5 TEAMS to be present for ALL sessions and tasks will receive ADDITIONAL marks.

Don't waste time. Drag your group members and start collecting those additional marks! 👀

(Admin will award points manually to the first 5 eligible teams.)`,
};

/* ============================================================
   RUN
   ============================================================ */
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🌱 Connecting to:", mongoose.connection.name);

  /* Find the ongoing event */
  const event = await Event.findOne({ slug: EVENT_SLUG });
  if (!event) {
    console.error(`❌ Event "${EVENT_SLUG}" not found. Run "npm run seed" first.`);
    process.exit(1);
  }
  console.log(`📍 Event found: ${event.title} (${event._id})`);

  /* Wipe existing tasks for this event */
  const deleted = await Task.deleteMany({ eventId: event._id });
  console.log(`🗑  Deleted ${deleted.deletedCount} existing tasks.`);

  /* Insert all games */
  const tasksToInsert = [
    { ...EARLY_BIRD, eventId: event._id },
    ...GAMES.map((g) => ({ ...g, eventId: event._id })),
  ];

  const created = await Task.insertMany(tasksToInsert);
  console.log(`✅ Created ${created.length} tasks:`);
  created.forEach((t, i) => {
    const pts =
      t.pointsPerItem > 0
        ? `${t.pointsPerItem} pts/item`
        : `${t.points} pts`;
    console.log(
      `   ${String(i).padStart(2)}. ${t.title.padEnd(45)} [${t.submissionType}] ${pts}`
    );
  });

  /* ============================================================
     OPTION: Create 14 teams if they don't exist
     ============================================================ */
  const existingTeams = await Team.countDocuments({ eventId: event._id });
  if (existingTeams === 0) {
    console.log("\n👥 No teams exist — creating 14 default teams...");

    const teamPassword = await bcrypt.hash("team123", 10);
    const teamNames = [
      "Team 01", "Team 02", "Team 03", "Team 04", "Team 05",
      "Team 06", "Team 07", "Team 08", "Team 09", "Team 10",
      "Team 11", "Team 12", "Team 13", "Team 14",
    ];
    const colors = [
      "#1B2A4A", "#6E2C2C", "#B8912F", "#77886A",
      "#2c3e6e", "#8b3a62", "#4a7c59", "#c47a3c",
      "#5a3a6e", "#1f5c4c", "#8a4040", "#3d5a80",
      "#6b4423", "#5f6e3a",
    ];

    const teamDocs = teamNames.map((name, i) => ({
      eventId: event._id,
      name,
      username: `team${String(i + 1).padStart(2, "0")}`,
      passwordHash: teamPassword,
      color: colors[i],
      members: [],
      totalScore: 0,
      active: true,
    }));

    const teams = await Team.insertMany(teamDocs);
    console.log(`✅ Created ${teams.length} teams:`);
    teams.forEach((t) => {
      console.log(`   ${t.name} — username: ${t.username}, password: team123`);
    });
  } else {
    console.log(`\n👥 ${existingTeams} teams already exist — skipping team creation.`);
  }

  console.log("\n🎉 Seed complete!");
  console.log("   Open /admin/tasks to see all games");
  console.log("   Open /admin/teams to manage teams");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});