import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Seeding FIND X platform data (15 puzzles, 30 teams)...");

  // 1. System Configuration
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

  // 3. Generate 15 Puzzles
  const puzzles = [];
  for (let i = 1; i <= 15; i++) {
    const puzzle = await prisma.puzzle.upsert({
      where: { orderIndex: i },
      update: {
        title: `Mystery of Island ${i}`,
      },
      create: {
        orderIndex: i,
        title: `Mystery of Island ${i}`,
        description: `### Log Entry #${i}\nYou have arrived at Island ${i}. Decode the ancient text to proceed.\n\n**Target Format**: Secret${i}`,
        assetType: i % 3 === 0 ? "audio" : "image",
        assetUrl: i % 3 === 0 
          ? "https://actions.google.com/sounds/v1/science_fiction/teleport.ogg"
          : "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
        basePoints: 100 * i,
        acceptedAnswers: [`secret${i}`, `secret ${i}`],
      },
    });
    puzzles.push(puzzle);

    await prisma.hint.upsert({
      where: { puzzleId_orderIndex: { puzzleId: puzzle.id, orderIndex: 1 } },
      update: {},
      create: {
        puzzleId: puzzle.id,
        orderIndex: 1,
        content: `Hint for Island ${i}: Look closer at the number.`,
        penaltyPoints: 10 * i,
        unlockDelayMinutes: 5,
      },
    });
  }

  // 4. Generate 30 Teams and Users
  for (let t = 1; t <= 30; t++) {
    const isFirstYear = t <= 15;
    const batchYear = isFirstYear ? 2026 : 2024;
    const batchTier = isFirstYear ? "FIRST_YEAR" : "SENIOR";

    const user = await prisma.user.upsert({
      where: { email: `player${t}@iiitl.ac.in` },
      update: {},
      create: {
        email: `player${t}@iiitl.ac.in`,
        name: `Player ${t}`,
        branch: "cs",
        batchYear: batchYear,
        rollNumber: t.toString().padStart(3, '0'),
        batchTier: batchTier,
        isFirstYear: isFirstYear,
      },
    });

    const team = await prisma.team.upsert({
      where: { name: `Team ${t}` },
      update: {},
      create: {
        name: `Team ${t}`,
        batchTier: batchTier,
        isFrozen: true,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { teamId: team.id },
    });

    // Generate random solves for teams to simulate leaderboard
    // Teams solve a random number of puzzles between 0 and 15, correlated with team number (better teams solve more)
    const puzzlesToSolve = Math.floor(Math.random() * 10) + (t % 6); 
    
    let currentPuzzleId = puzzles[0].id;

    for (let p = 0; p < Math.min(puzzlesToSolve, 15); p++) {
      const puzzle = puzzles[p];
      currentPuzzleId = puzzle.id;
      
      const isAlreadySolved = await prisma.submission.findFirst({
        where: {
          teamId: team.id,
          puzzleId: puzzle.id,
          isCorrect: true
        }
      });

      if (!isAlreadySolved) {
        await prisma.submission.create({
          data: {
            teamId: team.id,
            puzzleId: puzzle.id,
            attemptText: `secret${p+1}`,
            isCorrect: true,
            pointsAwarded: puzzle.basePoints,
            createdAt: new Date(Date.now() - (15 - p) * Math.random() * 60 * 60 * 1000), // Randomize time
          },
        });
      }
    }
    
    // Set current puzzle id to the next unsolved puzzle
    const nextPuzzleIndex = Math.min(puzzlesToSolve, 14);
    await prisma.team.update({
      where: { id: team.id },
      data: { currentPuzzleId: puzzles[nextPuzzleIndex].id }
    });
  }

  console.log("[Seed] Successfully seeded 15 puzzles and 30 teams with randomized solves!");
}

main()
  .catch((e) => {
    console.error("[Seed Error]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
