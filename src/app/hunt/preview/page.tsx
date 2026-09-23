import HuntClient from "../HuntClient";
import { PuzzleData } from "@/components/hunt/PuzzleDispatch";

const SAMPLE_PUZZLES: PuzzleData[] = [
  {
    id: "puz-1",
    orderIndex: 1,
    title: "Loguetown: The Town of the Beginning",
    description:
      "Gold Roger's final words echo across the Gallows Square. Decipher the coordinates left in the executioner's parchment.",
    assetUrl: null,
    assetType: null,
    basePoints: 100,
    isSolved: true,
    isActive: false,
    isLocked: false,
    hints: [
      {
        id: "h-1-1",
        orderIndex: 1,
        penaltyPoints: 15,
        unlockDelayMinutes: 0,
        isUnlocked: true,
        content: "Look at the capital letters etched into the wooden base.",
      },
    ],
    attemptsCount: 0,
  },
  {
    id: "puz-2",
    orderIndex: 2,
    title: "Reverse Mountain: Canal of Updrafts",
    description:
      "The twin currents converge up the vertical mountain cliff. Calculate the bearing to enter the Grand Line canal.",
    assetUrl: null,
    assetType: null,
    basePoints: 120,
    isSolved: true,
    isActive: false,
    isLocked: false,
    hints: [],
    attemptsCount: 1,
  },
  {
    id: "puz-3",
    orderIndex: 3,
    title: "Whiskey Peak: Cactus Rock",
    description:
      "A seemingly hospitable greeting hides a bounty hunter syndicate under the full moon. Find the cipher in the feast.",
    assetUrl: null,
    assetType: null,
    basePoints: 150,
    isSolved: true,
    isActive: false,
    isLocked: false,
    hints: [],
    attemptsCount: 0,
  },
  {
    id: "puz-4",
    orderIndex: 4,
    title: "Little Garden: Primeval Jungle",
    description:
      "Two warrior giants duel at the volcano signal. Chart the survival route before the Log Pose resets its magnetic needle.",
    assetUrl: null,
    assetType: null,
    basePoints: 200,
    isSolved: false,
    isActive: true,
    isLocked: false,
    hints: [
      {
        id: "h-4-1",
        orderIndex: 1,
        penaltyPoints: 25,
        unlockDelayMinutes: 5,
        isUnlocked: false,
      },
    ],
    attemptsCount: 2,
  },
  {
    id: "puz-5",
    orderIndex: 5,
    title: "Drum Kingdom: Castle of Cherry Blossoms",
    description:
      "A perennial winter shroud guards the peak of Drum Rock. Solve the medical alchemy formula.",
    assetUrl: null,
    assetType: null,
    basePoints: 220,
    isSolved: false,
    isActive: false,
    isLocked: true,
    hints: [],
    attemptsCount: 0,
  },
  {
    id: "puz-6",
    orderIndex: 6,
    title: "Alabasta: Rainbase Casino Oasis",
    description:
      "Beneath the arid sand dunes lies the secret subterranean chamber of the ancient Poneglyph.",
    assetUrl: null,
    assetType: null,
    basePoints: 250,
    isSolved: false,
    isActive: false,
    isLocked: true,
    hints: [],
    attemptsCount: 0,
  },
  {
    id: "puz-7",
    orderIndex: 7,
    title: "Jaya & The Knock Up Stream",
    description:
      "Calculate the atmospheric tidal burst required to ride the vertical ocean geyser into the clouds.",
    assetUrl: null,
    assetType: null,
    basePoints: 280,
    isSolved: false,
    isActive: false,
    isLocked: true,
    hints: [],
    attemptsCount: 0,
  },
  {
    id: "puz-8",
    orderIndex: 8,
    title: "Skypiea: Golden Belfry of Shandora",
    description:
      "Ring the golden bell hidden atop the Giant Jack beanstalk above the White-White Sea.",
    assetUrl: null,
    assetType: null,
    basePoints: 320,
    isSolved: false,
    isActive: false,
    isLocked: true,
    hints: [],
    attemptsCount: 0,
  },
  {
    id: "puz-9",
    orderIndex: 9,
    title: "Water 7: The Blue Station Aqueduct",
    description:
      "Decode the blueprint schematics of the Pluton warship locked in the Galley-La vault.",
    assetUrl: null,
    assetType: null,
    basePoints: 350,
    isSolved: false,
    isActive: false,
    isLocked: true,
    hints: [],
    attemptsCount: 0,
  },
  {
    id: "puz-10",
    orderIndex: 10,
    title: "Enies Lobby: The Tower of Justice",
    description:
      "Retrieve the Buster Call cipher key from CP9 before the Gates of Justice slam shut.",
    assetUrl: null,
    assetType: null,
    basePoints: 400,
    isSolved: false,
    isActive: false,
    isLocked: true,
    hints: [],
    attemptsCount: 0,
  },
  {
    id: "puz-11",
    orderIndex: 11,
    title: "Sabaody Archipelago: Groove 41",
    description:
      "Coat the ship's hull with Yarukiman mangrove resin to prepare for the 10,000 meter ocean descent.",
    assetUrl: null,
    assetType: null,
    basePoints: 450,
    isSolved: false,
    isActive: false,
    isLocked: true,
    hints: [],
    attemptsCount: 0,
  },
  {
    id: "puz-12",
    orderIndex: 12,
    title: "Raftel: Laugh Tale (The One Piece)",
    description:
      "The culmination of all four Road Poneglyphs. The final coordinates where Joy Boy left the ultimate treasure.",
    assetUrl: null,
    assetType: null,
    basePoints: 1000,
    isSolved: false,
    isActive: false,
    isLocked: true,
    hints: [],
    attemptsCount: 0,
  },
];

export default function HuntPreviewPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      <HuntClient
        team={{
          id: "crew-strawhat",
          name: "Straw Hat Pirates",
          isFrozen: false,
        }}
        puzzles={SAMPLE_PUZZLES}
        activeOrderIndex={4}
        competitionState="LIVE"
        supportFeatureEnabled={true}
      />
    </div>
  );
}
