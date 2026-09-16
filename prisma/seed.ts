import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Seeding FIND X platform data...");

  // 1. System Configuration
  // startTime is intentionally only set on create: re-seeding must not reset
  // the hunt clock (it would also shift every timed hint's unlock window).
  await prisma.systemConfig.upsert({
    where: { id: "default" },
    update: {
      competitionState: "LIVE",
      lockoutMaxAttempts: 5,
      lockoutWindowMinutes: 2,
      lockoutDurationMinutes: 5,
      broadcastMessage: "Welcome to FIND X! Good luck decoding the crypts.",
    },
    create: {
      id: "default",
      competitionState: "LIVE",
      lockoutMaxAttempts: 5,
      lockoutWindowMinutes: 2,
      lockoutDurationMinutes: 5,
      broadcastMessage: "Welcome to FIND X! Good luck decoding the crypts.",
      startTime: new Date(),
    },
  });

  // 2. Organizer User
  await prisma.user.upsert({
    where: { email: "admin@iiitl.ac.in" },
    update: { role: "ORGANIZER" },
    create: {
      email: "admin@iiitl.ac.in",
      name: "Lead Cryptarch (Admin)",
      role: "ORGANIZER",
      branch: "org",
      batchYear: 2023,
      rollNumber: "000",
      batchTier: "SENIOR",
      isFirstYear: false,
    },
  });

  // 3. Puzzles & Timed Hints
  // Puzzle 1: Silhouette / Visual Cipher
  const puzzle1 = await prisma.puzzle.upsert({
    where: { orderIndex: 1 },
    update: {},
    create: {
      orderIndex: 1,
      title: "The Genesis Silhouette",
      description: `### Log Entry #001: The Architect
> *"The ones who are crazy enough to think they can change the world are the ones who do."*

A shadowy figure once stood in a garage in Los Altos. Look closely at the silhouette. Whose identity was veiled behind the turtleneck and the wireframe specs?

**Target Format**: First Name + Last Name`,
      assetType: "image",
      assetUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
      basePoints: 100,
      acceptedAnswers: ["steve jobs", "stevejobs", "steven paul jobs"],
    },
  });

  await prisma.hint.upsert({
    where: { puzzleId_orderIndex: { puzzleId: puzzle1.id, orderIndex: 1 } },
    update: {},
    create: {
      puzzleId: puzzle1.id,
      orderIndex: 1,
      content: "Cupertino garage, April Fools' Day 1976. Fruit-themed revolution.",
      penaltyPoints: 20,
      unlockDelayMinutes: 5,
    },
  });

  // Puzzle 2: Audio Transmission Clue
  const puzzle2 = await prisma.puzzle.upsert({
    where: { orderIndex: 2 },
    update: {},
    create: {
      orderIndex: 2,
      title: "Signals from the Interstellar Medium",
      description: `### Transmission Stream: Frequency 1420 MHz
Deep space listening station *Arecibo* picked up a recurring harmonic signal. The onboard probe carries greetings in 55 human languages and sounds of Earth on a phonograph record plated with 24-karat gold.

Which legendary interstellar messenger continues its silent voyage across the heliopause?`,
      assetType: "audio",
      assetUrl: "https://actions.google.com/sounds/v1/science_fiction/teleport.ogg",
      basePoints: 150,
      acceptedAnswers: ["voyager 1", "voyager1", "voyager"],
    },
  });

  await prisma.hint.upsert({
    where: { puzzleId_orderIndex: { puzzleId: puzzle2.id, orderIndex: 1 } },
    update: {},
    create: {
      puzzleId: puzzle2.id,
      orderIndex: 1,
      content: "Launched in September 1977, pale blue dot photographer.",
      penaltyPoints: 30,
      unlockDelayMinutes: 10,
    },
  });

  // Puzzle 3: Cryptic Document & Mathematical Cipher
  const puzzle3 = await prisma.puzzle.upsert({
    where: { orderIndex: 3 },
    update: {},
    create: {
      orderIndex: 3,
      title: "The Bletchley Manuscript",
      description: `### Decryption Protocol: Sector 8
An electromechanical rotor device designated *Bombe* ticked rhythmically in Hut 8. A pioneering mathematician asked: *"Can machines think?"*

Name the father of modern theoretical computer science whose morphogenesis and imitation game unlocked the fate of nations.`,
      assetType: "pdf",
      assetUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      basePoints: 200,
      acceptedAnswers: ["alan turing", "alanturing", "turing"],
    },
  });

  await prisma.hint.upsert({
    where: { puzzleId_orderIndex: { puzzleId: puzzle3.id, orderIndex: 1 } },
    update: {},
    create: {
      puzzleId: puzzle3.id,
      orderIndex: 1,
      content: "The universal computing machine conceptualized in 1936.",
      penaltyPoints: 40,
      unlockDelayMinutes: 15,
    },
  });

  // 4. Sample Teams & Solves for Initial Dynamic Leaderboard
  // Fresher Team 1 (Batch 2026)
  const fresherUser1 = await prisma.user.upsert({
    where: { email: "lcs2026001@iiitl.ac.in" },
    update: {},
    create: {
      email: "lcs2026001@iiitl.ac.in",
      name: "Rohan Verma",
      branch: "cs",
      batchYear: 2026,
      rollNumber: "001",
      batchTier: "FIRST_YEAR",
      isFirstYear: true,
    },
  });

  const fresherUser2 = await prisma.user.upsert({
    where: { email: "lit2026042@iiitl.ac.in" },
    update: {},
    create: {
      email: "lit2026042@iiitl.ac.in",
      name: "Aarav Sharma",
      branch: "it",
      batchYear: 2026,
      rollNumber: "042",
      batchTier: "FIRST_YEAR",
      isFirstYear: true,
    },
  });

  const team1 = await prisma.team.upsert({
    where: { name: "Null Pointers" },
    update: {},
    create: {
      name: "Null Pointers",
      batchTier: "FIRST_YEAR",
      isFrozen: true,
      currentPuzzleId: puzzle2.id,
    },
  });

  await prisma.user.update({
    where: { id: fresherUser1.id },
    data: { teamId: team1.id },
  });
  await prisma.user.update({
    where: { id: fresherUser2.id },
    data: { teamId: team1.id },
  });

  // Team 1 solved Puzzle 1
  await prisma.submission.create({
    data: {
      teamId: team1.id,
      puzzleId: puzzle1.id,
      attemptText: "steve jobs",
      isCorrect: true,
      pointsAwarded: 100,
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    },
  });

  // Senior Team (Batch 2024)
  const seniorUser1 = await prisma.user.upsert({
    where: { email: "lcs2024012@iiitl.ac.in" },
    update: {},
    create: {
      email: "lcs2024012@iiitl.ac.in",
      name: "Vikram Malhotra",
      branch: "cs",
      batchYear: 2024,
      rollNumber: "012",
      batchTier: "SENIOR",
      isFirstYear: false,
    },
  });

  const team2 = await prisma.team.upsert({
    where: { name: "Byte Busters" },
    update: {},
    create: {
      name: "Byte Busters",
      batchTier: "SENIOR",
      isFrozen: true,
      currentPuzzleId: puzzle3.id,
    },
  });

  await prisma.user.update({
    where: { id: seniorUser1.id },
    data: { teamId: team2.id },
  });

  await prisma.submission.create({
    data: {
      teamId: team2.id,
      puzzleId: puzzle1.id,
      attemptText: "steve jobs",
      isCorrect: true,
      pointsAwarded: 100,
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
    },
  });

  await prisma.submission.create({
    data: {
      teamId: team2.id,
      puzzleId: puzzle2.id,
      attemptText: "voyager 1",
      isCorrect: true,
      pointsAwarded: 150,
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
    },
  });

  console.log("[Seed] Successfully seeded initial puzzles, hints, users, and teams!");
}

main()
  .catch((e) => {
    console.error("[Seed Error]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
