import mongoose from "mongoose";
import dotenv from "dotenv";
import Team from "../models/Team.js";

dotenv.config();

function generateTeamCode(name) {
  const numMatch = name.match(/\d+/);
  const num = numMatch ? numMatch[0].padStart(2, "0") : "XX";
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TEAM-${num}-${random}`;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🌱 Connected to:", mongoose.connection.name);

  const teams = await Team.find({
    $or: [{ teamCode: { $exists: false } }, { teamCode: "" }],
  });

  console.log(`📋 Found ${teams.length} teams without a code`);

  for (const team of teams) {
    let code;
    for (let i = 0; i < 5; i++) {
      const candidate = generateTeamCode(team.name);
      const exists = await Team.findOne({ teamCode: candidate });
      if (!exists) {
        code = candidate;
        break;
      }
    }
    if (!code) code = `TEAM-${Date.now().toString(36).toUpperCase()}`;

    team.teamCode = code;
    await team.save();
    console.log(`  ✅ ${team.name} → ${team.teamCode}`);
  }

  console.log(`\n✅ Backfilled ${teams.length} team codes`);
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});