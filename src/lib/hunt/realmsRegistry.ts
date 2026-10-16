export type TitlePosition = "top" | "bottom" | "left" | "right";

export interface RealmNodeCoord {
  x: number;
  y: number;
  landmarkName: string;
  titlePosition?: TitlePosition;
}

export interface RealmPuzzleDefinition {
  orderIndex: number; // Index within the realm (1-indexed)
  globalIndex?: number; // Index in the global expedition ladder (1-indexed)
  landmarkName: string;
  title: string;
  description: string;
  coord: { x: number; y: number };
  titlePosition?: TitlePosition;
  answer: string;
  bountyPoints: number;
}

export interface RealmPathSegment {
  fromIndex: number; // 1-indexed within the realm
  toIndex: number; // 1-indexed within the realm
  d: string; // Exact SVG path in 1000x1000 coordinate space tracing map terrain
  notes?: string;
}

export interface RealmConfig {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  totalPuzzles: number;
  stageIndices: number[]; // Global 0-indexed indices into expedition landmarks
  nodeCoords: RealmNodeCoord[];
  puzzles: RealmPuzzleDefinition[];
  pathSegments: RealmPathSegment[];
}

export const CAMPAIGN_REALMS: RealmConfig[] = [
  // --- REALM 1: THE COASTAL HAVEN (4 Puzzles - Lighthouse removed for optimal pier-to-inland progression) ---
  {
    id: 1,
    title: "Chapter I: The Coastal Haven",
    subtitle: "Departure Docks & Ocean Bluffs",
    image: "/images/hunt/realms/realm_1.webp",
    totalPuzzles: 4,
    stageIndices: [0, 1, 2, 3],
    nodeCoords: [
      {
        x: 33.5,
        y: 72.5,
        landmarkName: "Harbor Mooring Docks",
        titlePosition: "bottom",
      },
      {
        x: 51.7,
        y: 53.0,
        landmarkName: "Haven Coastal Settlement",
        titlePosition: "bottom",
      },
      {
        x: 70.5,
        y: 45.5,
        landmarkName: "The Valley Crossroads",
        titlePosition: "top",
      },
      {
        x: 89.6,
        y: 21.8,
        landmarkName: "Mountain Pass Sanctuary Gate",
        titlePosition: "left",
      },
    ],
    puzzles: [
      {
        orderIndex: 1,
        landmarkName: "Harbor Mooring Docks",
        title: "The Flagship's Anchorage",
        description:
          "You drop anchor in the sheltered cove of Cape Storm as salt spray lashes the weathered timber wharves. Below your keel, abyssal tentacles stir in the deep. To secure your vessel against the churning swells, decipher the mooring runes carved into the grand capstan.",
        coord: { x: 33.5, y: 72.5 },
        titlePosition: "bottom",
        answer: "anchor",
        bountyPoints: 100,
      },
      {
        orderIndex: 2,
        landmarkName: "Haven Coastal Settlement",
        title: "The Whispering Waystation",
        description:
          "At the base of the cliffs lies a bustling settlement of steep-gabled shacks and trading posts. Embedded at the village gate is an obsidian compass seal marking the old cart road inland. Decrypt the harbormaster's ledger to gain passage through the valley.",
        coord: { x: 51.7, y: 53.0 },
        titlePosition: "bottom",
        answer: "haven",
        bountyPoints: 200,
      },
      {
        orderIndex: 3,
        landmarkName: "The Valley Crossroads",
        title: "The Verdant Fork",
        description:
          "Deep within the emerald valley between two sheer ridgelines, the dirt highway splits into ancient divergence points. A moss-covered milestone demands that travelers discern the true high road to the sanctuary from the perilous lowlands.",
        coord: { x: 70.5, y: 45.5 },
        titlePosition: "top",
        answer: "crossroads",
        bountyPoints: 300,
      },
      {
        orderIndex: 4,
        landmarkName: "Mountain Pass Sanctuary Gate",
        title: "The Cloudreach Sanctum",
        description:
          "Winding past the tree line into the sharp alpine peaks, a dashed switchback path terminates before the colossal arched citadel gate. Here, mountain winds howl through silent colonnades guarding the realm's sacred crest.",
        coord: { x: 89.6, y: 21.8 },
        titlePosition: "left",
        answer: "sanctuary",
        bountyPoints: 400,
      },
    ],
    pathSegments: [
      {
        fromIndex: 1,
        toIndex: 2,
        d: "M 335 725 C 355 745, 375 765, 395 780 C 422 750, 450 705, 472 655 C 488 615, 502 572, 517 530",
        notes: "Mooring pier boardwalk southeast to shoreline, curving northeast along sandy beach wharves to coastal settlement plaza",
      },
      {
        fromIndex: 2,
        toIndex: 3,
        d: "M 517 530 C 538 518, 558 502, 580 485 C 610 468, 642 458, 672 455 C 684 454, 695 454, 705 455",
        notes: "Double-lined dirt highway ascending through bluff pass into emerald valley floor, continuing east to crossroads fork",
      },
      {
        fromIndex: 3,
        toIndex: 4,
        d: "M 705 455 C 712 425, 722 395, 728 368 C 734 340, 755 315, 782 296 C 808 278, 830 265, 852 248 C 868 236, 882 226, 896 218",
        notes: "Northern crossroads fork climbing mountain switchback trail through alpine pass to high sanctuary gate",
      },
    ],
  },

  // --- REALM 2: THE REALMS OF AETHELIA (4 Puzzles - Redesigned & Decluttered with Generous Spacing) ---
  {
    id: 2,
    title: "Chapter II: The Realms of Aethelia",
    subtitle: "High Spires, Delta Bridges & Dragon's Breach",
    image: "/images/hunt/realms/realm_2.webp",
    totalPuzzles: 4,
    stageIndices: [4, 5, 6, 7],
    nodeCoords: [
      {
        x: 17.5,
        y: 30.5,
        landmarkName: "Celestia Castle",
        titlePosition: "bottom",
      },
      {
        x: 42.0,
        y: 55.0,
        landmarkName: "Silverflow River Delta",
        titlePosition: "top",
      },
      {
        x: 63.5,
        y: 49.0,
        landmarkName: "Morgana's Fortress",
        titlePosition: "bottom",
      },
      {
        x: 67.5,
        y: 17.5,
        landmarkName: "Dragon's Breach",
        titlePosition: "left",
      },
    ],
    puzzles: [
      {
        orderIndex: 1,
        landmarkName: "Celestia Castle",
        title: "The High Spires of Celestia",
        description:
          "Perched upon the western sea cliffs of Aethelia, the white marble spires of Celestia watch over the Sea of Whispers. Within the astronomy tower, the Royal Astrologer keeps the ancient celestial prism aligned with the North Star. Speak the cipher of the luminous guiding flare that pierces the evening gloom.",
        coord: { x: 17.5, y: 30.5 },
        titlePosition: "bottom",
        answer: "starlight",
        bountyPoints: 150,
      },
      {
        orderIndex: 2,
        landmarkName: "Silverflow River Delta",
        title: "Crossroads of the Silverflow Delta",
        description:
          "Cascading down from the snows of The Iron Spine, the Silverflow branches into a labyrinth of silvery braids and silted sandbars before spilling into the Misty Sea. Only seasoned river pilots know the deep-channel ford where the freshwater greets the ocean tide. Name this tidal marine threshold.",
        coord: { x: 42.0, y: 55.0 },
        titlePosition: "top",
        answer: "estuary",
        bountyPoints: 250,
      },
      {
        orderIndex: 3,
        landmarkName: "Morgana's Fortress",
        title: "The Obsidian Citadel of Morgana",
        description:
          "Looming ominously on the desolate frontier between Eldoria and the Wasteland, Morgana's Fortress is forged from volcanic basalt and warded by dark incantations. Its twin gargoyle towers channel eldritch energies across the scorched plains. Name the forbidden art of occult spellcraft practiced within its walls.",
        coord: { x: 63.5, y: 49.0 },
        titlePosition: "bottom",
        answer: "sorcery",
        bountyPoints: 350,
      },
      {
        orderIndex: 4,
        landmarkName: "Dragon's Breach",
        title: "The Crags of Dragon's Breach",
        description:
          "Towering high above the barren Wasteland, the jagged razor-peaks of Dragon's Breach pierce the northern sky. Here, where sulfurous vents smoke amidst basalt crags, the Great Red Wyrm guards its hoarded millennia of relics. Name the molten volcanic flame breathed forth from the dragon's maw.",
        coord: { x: 67.5, y: 17.5 },
        titlePosition: "left",
        answer: "wyrmfire",
        bountyPoints: 500,
      },
    ],
    pathSegments: [
      {
        fromIndex: 1,
        toIndex: 2,
        d: "M 175 305 C 190 320, 205 340, 225 355 C 245 370, 270 385, 295 400 C 320 415, 345 440, 370 470 C 390 495, 408 525, 420 550",
        notes: "Eastward descent from Celestia Castle bluff through valley corridor south of Forbiddenwood and The Iron Spine to Silverflow Delta crossing",
      },
      {
        fromIndex: 2,
        toIndex: 3,
        d: "M 420 550 C 440 540, 460 525, 480 510 C 505 492, 535 482, 565 480 C 590 480, 615 485, 635 490",
        notes: "East across the open plains skimming northern perimeter of Eldoria Forest directly into Morgana's Fortress",
      },
      {
        fromIndex: 3,
        toIndex: 4,
        d: "M 635 490 C 638 450, 642 410, 648 370 C 652 335, 656 295, 660 255 C 664 225, 668 200, 675 175",
        notes: "North from Morgana's Fortress traversing Wasteland basin and ascending steep defile into Dragon's Breach",
      },
    ],
  },

  // --- REALM 3: THE SUNKEN DESERT CANYON & ANCIENT RUINS (5 Puzzles - Level 2 Dry Gorge removed) ---
  {
    id: 3,
    title: "Chapter III: The Sunken Canyon of Khemet",
    subtitle: "Caravan Trails & Ancient Khemet Monoliths",
    image: "/images/hunt/realms/realm_3.webp",
    totalPuzzles: 5,
    stageIndices: [8, 9, 10, 11, 12],
    nodeCoords: [
      {
        x: 20.0,
        y: 52.0,
        landmarkName: "Caravanserai & Forgotten Tombs",
        titlePosition: "bottom",
      },
      {
        x: 45.2,
        y: 52.5,
        landmarkName: "The Great Arch of Akhen",
        titlePosition: "bottom",
      },
      {
        x: 64.0,
        y: 35.0,
        landmarkName: "Ziggurat of Khemet-Ka",
        titlePosition: "top",
      },
      {
        x: 59.5,
        y: 66.5,
        landmarkName: "The Sphinx's Gate",
        titlePosition: "bottom",
      },
      {
        x: 88.0,
        y: 54.5,
        landmarkName: "Mirage Oasis",
        titlePosition: "bottom",
      },
    ],
    puzzles: [
      {
        orderIndex: 1,
        landmarkName: "Caravanserai & Forgotten Tombs",
        title: "The Wayfarer's Salt Toll",
        description:
          "Beneath the bleached canvas awnings of the Caravanserai, grizzled camel merchants trade whispers of the sunken wastes. Before braving the descent past the eroded pylons of the Forgotten Tombs, the caravan master demands the customary toll of mineral currency gathered from the high salt flats.",
        coord: { x: 20.0, y: 52.0 },
        titlePosition: "bottom",
        answer: "salt",
        bountyPoints: 150,
      },
      {
        orderIndex: 2,
        landmarkName: "The Great Arch of Akhen",
        title: "The Colossus Keystone",
        description:
          "Rising out of the rippling sands, the Great Arch of Akhen stands as a colossal monolithic portal guarding the inner sanctum of the sunken desert. Chiseled across its eroded lintel are solar hieroglyphs and winged scarabs that require a sacred invocation to break the ancient ward.",
        coord: { x: 45.2, y: 52.5 },
        titlePosition: "bottom",
        answer: "solaris",
        bountyPoints: 250,
      },
      {
        orderIndex: 3,
        landmarkName: "Ziggurat of Khemet-Ka",
        title: "The Star-Altar of Khemet-Ka",
        description:
          "Ascending above the colonnaded courts and granite obelisks, the stepped ziggurat of Khemet-Ka crowns the sunken necropolis. At its summit terrace sits an astronomical star-altar aligned with cosmic coordinates that unlock the subterranean waters of the old empire.",
        coord: { x: 64.0, y: 35.0 },
        titlePosition: "top",
        answer: "zenith",
        bountyPoints: 300,
      },
      {
        orderIndex: 4,
        landmarkName: "The Sphinx's Gate",
        title: "The Riddle of the Sand Sentinel",
        description:
          "Carved into the southern crimson cliff face stands the fortified bastion of the Sphinx's Gate. An ancient weathered sentinel watches over the narrow portal leading outward toward the Dune Sea, challenging all wayfarers with an eternal riddle of stone and shadow.",
        coord: { x: 59.5, y: 66.5 },
        titlePosition: "bottom",
        answer: "enigma",
        bountyPoints: 350,
      },
      {
        orderIndex: 5,
        landmarkName: "Mirage Oasis",
        title: "The Emerald Waters of the Dune Sea",
        description:
          "Following the Temple of the Sun trail across the shifting dunes, the shimmering desert haze yields to a miraculous emerald sanctuary sheltered beneath the Scorched Plateau. Fed by a subterranean aquifer, the crystalline springs of Mirage Oasis conceal the final relic of the realm.",
        coord: { x: 88.0, y: 54.5 },
        titlePosition: "bottom",
        answer: "mirage",
        bountyPoints: 500,
      },
    ],
    pathSegments: [
      {
        fromIndex: 1,
        toIndex: 2,
        d: "M 200 520 L 225 522 C 245 524 260 535 275 550 C 295 575 310 615 325 655 C 338 685 358 710 382 715 C 405 718 425 690 436 650 C 445 610 448 560 452 525",
        notes: "Caravan trail east past tombs, descending gorge wash into sunken desert, then curving north under the Great Arch of Akhen",
      },
      {
        fromIndex: 2,
        toIndex: 3,
        d: "M 452 525 C 468 510 482 495 498 482 C 515 468 532 455 552 445 C 572 435 595 422 612 400 C 625 382 634 365 640 350",
        notes: "Temple courtyard past obelisks, ascending grand stair to Ziggurat summit",
      },
      {
        fromIndex: 3,
        toIndex: 4,
        d: "M 640 350 C 648 375 655 410 652 445 C 648 485 638 525 626 565 C 616 595 608 625 602 645 C 599 655 597 660 595 665",
        notes: "Descending south terrace stairs to Sphinx's Gate portal",
      },
      {
        fromIndex: 4,
        toIndex: 5,
        d: "M 595 665 C 615 675 635 665 655 645 C 680 620 708 585 738 555 C 768 525 798 500 825 490 C 848 482 865 505 880 545",
        notes: "Curving northeast along Temple of the Sun trail down into Mirage Oasis",
      },
    ],
  },

  // --- REALM 4: THE PRIMEVAL VOLCANO & FIRE RIDGE (4 Puzzles - 2 Cluttered Bottom Nodes Removed) ---
  {
    id: 4,
    title: "Chapter IV: The Primeval Volcano & Fire Ridge",
    subtitle: "Ancient Tribal Megaliths & Smoldering Caldera",
    image: "/images/hunt/realms/realm_4.webp",
    totalPuzzles: 4,
    stageIndices: [13, 14, 15, 16],
    nodeCoords: [
      {
        x: 21.0,
        y: 70.0,
        landmarkName: "Ancient Tribal Megalith Portal",
        titlePosition: "bottom",
      },
      {
        x: 59.8,
        y: 73.2,
        landmarkName: "Upper Volcanic Chasm Bridge",
        titlePosition: "top",
      },
      {
        x: 79.5,
        y: 75.5,
        landmarkName: "Ancient Stone Totem Sentinel",
        titlePosition: "bottom",
      },
      {
        x: 32.5,
        y: 20.5,
        landmarkName: "Smoking Caldera Summit",
        titlePosition: "bottom",
      },
    ],
    puzzles: [
      {
        orderIndex: 1,
        landmarkName: "Ancient Tribal Megalith Portal",
        title: "The Gateway of Forgotten Runes",
        description:
          "At the edge of the primeval canopy stands a colossal trilithon arch carved by an extinct jungle civilization. Weathered glyphs pulse with dormant elemental fire, marking the start of the perilous ascent.",
        coord: { x: 21.0, y: 70.0 },
        titlePosition: "bottom",
        answer: "megalith",
        bountyPoints: 150,
      },
      {
        orderIndex: 2,
        landmarkName: "Upper Volcanic Chasm Bridge",
        title: "The Chasm of Smoldering Ash",
        description:
          "High above the lower gorge, a second ancient rope span bridges the gaping volcanic chasm. Dense clouds of sulfurous steam and boiling cinder draft upward from the abyss below.",
        coord: { x: 59.8, y: 73.2 },
        titlePosition: "top",
        answer: "chasm",
        bountyPoints: 250,
      },
      {
        orderIndex: 3,
        landmarkName: "Ancient Stone Totem Sentinel",
        title: "Guardian of the Fire Ridge",
        description:
          "An immense winged stone effigy carved with the grim visages of primeval deities stands eternal vigil at the foot of Fire Ridge. Its hollowed obsidian eyes gaze across the smoking badlands.",
        coord: { x: 79.5, y: 75.5 },
        titlePosition: "bottom",
        answer: "totem",
        bountyPoints: 350,
      },
      {
        orderIndex: 4,
        landmarkName: "Smoking Caldera Summit",
        title: "The Primeval Pyre",
        description:
          "The crowning summit of the primeval volcano, where rivers of incandescent rock erupt from the planet's core. Billowing dark plumes blot out the sun, concealing the ultimate secret of the Fire Ridge.",
        coord: { x: 32.5, y: 20.5 },
        titlePosition: "bottom",
        answer: "caldera",
        bountyPoints: 500,
      },
    ],
    pathSegments: [
      {
        fromIndex: 1,
        toIndex: 2,
        d: "M 210 700 C 220 735, 245 770, 280 790 C 315 810, 360 825, 410 822 C 460 820, 508 798, 550 765 C 568 750, 584 738, 598 732",
        notes: "Megalith portal descending through jungle glade and rising along canyon terrace to Upper Chasm Bridge",
      },
      {
        fromIndex: 2,
        toIndex: 3,
        d: "M 598 732 C 625 730, 655 736, 685 748 C 718 760, 758 762, 795 755",
        notes: "Upper Chasm Bridge east across the gorge rock shelf to Ancient Stone Totem Sentinel",
      },
      {
        fromIndex: 3,
        toIndex: 4,
        d: "M 795 755 C 785 700, 762 635, 728 565 C 696 500, 656 440, 608 392 C 556 342, 492 302, 432 268 C 388 242, 354 222, 325 205",
        notes: "Stone Totem ascending high Fire Ridge spine northwest between lava torrents to Smoking Caldera Summit",
      },
    ],
  },

  // --- REALM 5: THE FROZEN ROCK CITADEL & BLIZZARDS (4 Puzzles - Alternating Left/Right Titles) ---
  {
    id: 5,
    title: "Chapter V: The Frozen Rock Citadel & Blizzards",
    subtitle: "Frostbite Ridge & Summit Fortress",
    image: "/images/hunt/realms/realm_5.webp",
    totalPuzzles: 4,
    stageIndices: [17, 18, 19, 20],
    nodeCoords: [
      {
        x: 54.0,
        y: 86.0,
        landmarkName: "Pine Forest Entrance",
        titlePosition: "left",
      },
      {
        x: 66.5,
        y: 46.0,
        landmarkName: "The Glacial Ice Arch",
        titlePosition: "right",
      },
      {
        x: 50.0,
        y: 31.5,
        landmarkName: "The High Citadel Portcullis",
        titlePosition: "left",
      },
      {
        x: 42.0,
        y: 16.5,
        landmarkName: "The Summit Fortress Keep",
        titlePosition: "right",
      },
    ],
    puzzles: [
      {
        orderIndex: 1,
        landmarkName: "Pine Forest Entrance",
        title: "Whispers of the Frostwood",
        description:
          "At the southern foothills of the Shivering Peaks, a blizzard-choked pine forest stands vigil over the forgotten ascent. Ancient evergreen trunks bear icy frost-runes indicating the safe path before the mountain pass becomes impassable. Decipher the glacial rune to begin the ascent.",
        coord: { x: 54.0, y: 86.0 },
        titlePosition: "left",
        answer: "frostwood",
        bountyPoints: 100,
      },
      {
        orderIndex: 2,
        landmarkName: "The Glacial Ice Arch",
        title: "Span of the Glacial Arch",
        description:
          "A colossal bridge of translucent glacial ice spans the bottomless crevasse between the eastern crags and the central citadel peak. Hanging icicles chime like eerie carillons in the howling mountain winds. Calculate the resonance pitch and solve the ice-arch cipher to traverse the crevasse safely.",
        coord: { x: 66.5, y: 46.0 },
        titlePosition: "right",
        answer: "crevasse",
        bountyPoints: 250,
      },
      {
        orderIndex: 3,
        landmarkName: "The High Citadel Portcullis",
        title: "Gate of the Frozen Bastion",
        description:
          "Reaching the sheer precipice below the mountain fortress, the monumental iron portcullis is locked tight and coated in heavy rime frost. Counterweighted frost-chains and stone gargoyle sentinels bar entry. Utter the ancient command of the Frostguard to raise the portcullis and breach the inner citadel.",
        coord: { x: 50.0, y: 31.5 },
        titlePosition: "left",
        answer: "portcullis",
        bountyPoints: 400,
      },
      {
        orderIndex: 4,
        landmarkName: "The Summit Fortress Keep",
        title: "Throne of the Blizzard Keep",
        description:
          "Crowning the highest pinnacle of the Frozen Rock where tempestuous winds howl and blizzards rage eternal, the inner sanctum of the citadel keep shelters the ancient throne. Unravel the celestial snowflake sigil carved into the keep's frost-veined dais to claim the ultimate sovereign relic of the realm.",
        coord: { x: 42.0, y: 16.5 },
        titlePosition: "right",
        answer: "blizzard",
        bountyPoints: 500,
      },
    ],
    pathSegments: [
      {
        fromIndex: 1,
        toIndex: 2,
        d: "M 540 860 C 536 822, 522 776, 504 742 C 496 728, 502 720, 518 710 C 546 690, 580 662, 612 628 C 618 622, 615 614, 602 604 C 580 588, 556 576, 545 568 C 538 560, 545 554, 564 542 C 582 530, 596 516, 592 500 C 586 480, 560 470, 575 460 C 598 450, 634 450, 665 460",
        notes: "Ascends from pine forest along lower Frostbite Trail, navigating three switchback hairpins across rock face to Glacial Ice Arch",
      },
      {
        fromIndex: 2,
        toIndex: 3,
        d: "M 665 460 C 642 448, 614 430, 588 410 C 564 390, 546 368, 530 346 C 518 332, 508 322, 500 315",
        notes: "Crosses westward from Glacial Ice Arch along upper cliff causeway directly to High Citadel Portcullis",
      },
      {
        fromIndex: 3,
        toIndex: 4,
        d: "M 500 315 C 500 288, 496 264, 488 242 C 478 218, 460 196, 442 180 C 432 172, 425 168, 420 165",
        notes: "Passes through Citadel Portcullis into inner bailey and climbs defensive stone stairs to Summit Fortress Keep",
      },
    ],
  },

  // --- REALM 6: THE SUNKEN AQUEDUCT & WATER METROPOLIS (5 Puzzles - Optimized Breathing Space) ---
  {
    id: 6,
    title: "Chapter VI: The Sunken Aqueduct & Water Metropolis",
    subtitle: "Tidal Locks, Sunken Bazaars & Temple of the Waves",
    image: "/images/hunt/realms/realm_6.webp",
    totalPuzzles: 5,
    stageIndices: [21, 22, 23, 24, 25],
    nodeCoords: [
      {
        x: 84.0,
        y: 86.5,
        landmarkName: "Sea Gate Watch",
        titlePosition: "top",
      },
      {
        x: 63.8,
        y: 68.8,
        landmarkName: "Sea Bazaar",
        titlePosition: "bottom",
      },
      {
        x: 41.5,
        y: 55.5,
        landmarkName: "Lockmaster's Fort",
        titlePosition: "top",
      },
      {
        x: 27.5,
        y: 41.0,
        landmarkName: "The Water Citadel",
        titlePosition: "left",
      },
      {
        x: 53.5,
        y: 19.5,
        landmarkName: "The Temple of the Waves",
        titlePosition: "right",
      },
    ],
    puzzles: [
      {
        orderIndex: 1,
        landmarkName: "Sea Gate Watch",
        title: "The Tide-Watcher's Toll",
        description:
          "Standing sentinel where the ocean surge breaches the grand arcade, the Sea Gate Watch monitors all maritime approaches. Decipher the harbor beacon's rotating solar cipher to open the sea portcullis.",
        coord: { x: 84.0, y: 86.5 },
        titlePosition: "top",
        answer: "beacon",
        bountyPoints: 250,
      },
      {
        orderIndex: 2,
        landmarkName: "Sea Bazaar",
        title: "The Pearl Merchant's Ledger",
        description:
          "Beneath the ribbed copper dome of the sunken market, merchants from across the seven straits barter in abyssal relics and tidal spices. Unravel the celestial trade ledger hidden within the central rotunda.",
        coord: { x: 63.8, y: 68.8 },
        titlePosition: "bottom",
        answer: "corsair",
        bountyPoints: 300,
      },
      {
        orderIndex: 3,
        landmarkName: "Lockmaster's Fort",
        title: "The Bastion of the Sluice Gates",
        description:
          "Perched upon a jagged sea crag, this fortress commands the massive brass floodgates regulating the metropolis's water levels. Crack the gear-wheel lock mechanism housed within the central keep.",
        coord: { x: 41.5, y: 55.5 },
        titlePosition: "top",
        answer: "sluice",
        bountyPoints: 380,
      },
      {
        orderIndex: 4,
        landmarkName: "The Water Citadel",
        title: "Sanctum of the Sunken Sovereign",
        description:
          "An impregnable island palace of soaring domes and sea-washed battlements, ringed by turbulent reef gardens. Seek the secret royal water-seal inscribed into the mosaic floor of the Sovereign's rotunda.",
        coord: { x: 27.5, y: 41.0 },
        titlePosition: "left",
        answer: "sovereign",
        bountyPoints: 450,
      },
      {
        orderIndex: 5,
        landmarkName: "The Temple of the Waves",
        title: "The High Cascade of Tethys",
        description:
          "Crowning the Grand Aqueduct at the confluence of sky and sea, this sacred sanctuary channels the purest mountain aquifers into the oceanic metropolis. Offer the resonance hymn to still the abyssal tides.",
        coord: { x: 53.5, y: 19.5 },
        titlePosition: "right",
        answer: "aquifer",
        bountyPoints: 500,
      },
    ],
    pathSegments: [
      {
        fromIndex: 1,
        toIndex: 2,
        d: "M 840 865 C 825 825, 800 775, 765 755 C 725 730, 680 715, 638 688",
        notes: "Northwest through sea lane canal under soaring aqueduct arcade arch to domed Sea Bazaar",
      },
      {
        fromIndex: 2,
        toIndex: 3,
        d: "M 638 688 C 618 666, 588 648, 555 630 C 518 610, 470 588, 438 570 C 426 563, 420 558, 415 555",
        notes: "West-northwest across entirety of multi-arched Winding Promenade bridge into Lockmaster's Fort gatehouse",
      },
      {
        fromIndex: 3,
        toIndex: 4,
        d: "M 415 555 C 390 530, 365 502, 340 478 C 315 452, 292 430, 275 410",
        notes: "West gate across 3-arched stone viaduct spanning sea strait to Water Citadel palace rotunda",
      },
      {
        fromIndex: 4,
        toIndex: 5,
        d: "M 275 410 C 305 378, 345 342, 385 315 C 430 282, 485 240, 535 195",
        notes: "Northeast along elevated aqueduct conduit past Tower of Aeolus directly to Temple of the Waves",
      },
    ],
  },

  // --- REALM 7: THE ABYSSAL RIFT & VOID HORIZON (5 Puzzles - Sweeping Full-Spiral Geometry) ---
  {
    id: 7,
    title: "Chapter VII: The Abyssal Rift & Void Horizon",
    subtitle: "Cosmic Vortex & Ancient Void Monoliths",
    image: "/images/hunt/realms/realm_7.webp",
    totalPuzzles: 5,
    stageIndices: [26, 27, 28, 29, 30],
    nodeCoords: [
      {
        x: 30.0,
        y: 78.0,
        landmarkName: "Port Sorrow Landing",
        titlePosition: "bottom",
      },
      {
        x: 26.0,
        y: 32.0,
        landmarkName: "Reef of the Outer Currents",
        titlePosition: "right",
      },
      {
        x: 74.0,
        y: 28.0,
        landmarkName: "Monolith of the Void Horizon",
        titlePosition: "left",
      },
      {
        x: 76.0,
        y: 65.0,
        landmarkName: "Eye of the Maelstrom",
        titlePosition: "bottom",
      },
      {
        x: 51.5,
        y: 51.5,
        landmarkName: "The Abyssal Singularity Core",
        titlePosition: "top",
      },
    ],
    puzzles: [
      {
        orderIndex: 1,
        landmarkName: "Port Sorrow Landing",
        title: "The Anchorage of the Forsaken Tide",
        description:
          "Moored upon the basalt jetties of Port Sorrow, your vessel rolls against churning abyssal tides under the guidance of the ancient compass rose. Ahead lies the spiraling ocean descent toward the event horizon. An old harbourmaster's brass astrolabe bears the riddle: 'I hold the vessel steadfast against howling deep-sea currents, yet when cast to the ocean bed, I grant no motion until retrieved. What am I?'",
        coord: { x: 30.0, y: 78.0 },
        titlePosition: "bottom",
        answer: "anchor",
        bountyPoints: 150,
      },
      {
        orderIndex: 2,
        landmarkName: "Reef of the Outer Currents",
        title: "Wake of the Great Leviathan",
        description:
          "Riding mountainous white-capped breakers along the northwestern perimeter, your crew skirts the colossal thrashing coils of the Great Leviathan. Primordial sea-spray obscures the sky as the outer current accelerates. Inscribed upon an emerald reef crest lies the sea-beast's cipher: 'Monarch of the untamed tempest and dread of ancient navies, speak the name of the abyssal serpent of legend.'",
        coord: { x: 26.0, y: 32.0 },
        titlePosition: "right",
        answer: "leviathan",
        bountyPoints: 250,
      },
      {
        orderIndex: 3,
        landmarkName: "Monolith of the Void Horizon",
        title: "The Spire of Shattered Echoes",
        description:
          "Perched high upon the northeastern precipice overlooking the roaring abyss, a titanic runic obelisk stands intact beside the Shattered Monoliths. Its carved facets glow with ethereal cyan witchfire, defying the cosmic gravitational tide. The runic cipher asks: 'Beyond the threshold where stars are swallowed and time ceases its march, name the boundless expanse of absolute nothingness.'",
        coord: { x: 74.0, y: 28.0 },
        titlePosition: "left",
        answer: "void",
        bountyPoints: 350,
      },
      {
        orderIndex: 4,
        landmarkName: "Eye of the Maelstrom",
        title: "Whirlpool of the Outer Abyss",
        description:
          "Swept down the eastern rim past Blackpeak Rock, your vessel plunges into the furious cataracts of Maelstrom's Edge. Torrential foam spins in a deafening spiral toward the subterranean abyss. Carved into a storm-tossed spar of ironwood is the question: 'Neither sail nor oar can break free from my unrelenting aquatic funnel. Name the great spinning maw of the open ocean.'",
        coord: { x: 76.0, y: 65.0 },
        titlePosition: "bottom",
        answer: "maelstrom",
        bountyPoints: 450,
      },
      {
        orderIndex: 5,
        landmarkName: "The Abyssal Singularity Core",
        title: "The Singularity at World's End",
        description:
          "Crossing the radiant orbit of celestial glyphs along the inner funnel, your flagship breaches the event horizon and enters the blinding nexus at the bottom of the Great Abyssal Rift. Here, the laws of mortal realms shatter into pure cosmic resonance. Speak the cosmic astronomical term for this infinitely dense point of spacetime singularity to conquer the ultimate trial of FIND X.",
        coord: { x: 51.5, y: 51.5 },
        titlePosition: "top",
        answer: "singularity",
        bountyPoints: 600,
      },
    ],
    pathSegments: [
      {
        fromIndex: 1,
        toIndex: 2,
        d: "M 300 780 C 280 740, 260 690, 240 640 C 220 590, 200 530, 195 470 C 190 410, 215 360, 260 320",
        notes: "Ascends north from Port Sorrow through western ocean swells past Leviathan's coils into upper-left wave crests",
      },
      {
        fromIndex: 2,
        toIndex: 3,
        d: "M 260 320 C 290 280, 340 240, 400 220 C 460 200, 530 195, 600 205 C 655 212, 705 240, 740 280",
        notes: "Sweeps eastward along northern sea horizon past Skyfall Ruins and Shattered Monoliths colonnade to tall standing monolith",
      },
      {
        fromIndex: 3,
        toIndex: 4,
        d: "M 740 280 C 770 320, 795 380, 805 440 C 815 510, 800 580, 760 650",
        notes: "Sweeps down eastern shipping channel between Blackpeak Rock and rift rim into Maelstrom's Edge",
      },
      {
        fromIndex: 4,
        toIndex: 5,
        d: "M 760 650 C 730 710, 670 750, 600 750 C 520 750, 430 710, 390 630 C 365 570, 385 490, 440 450 C 485 420, 550 435, 575 480 C 590 515, 555 545, 515 515",
        notes: "Grand ~450° spiral: sweeps along southern Void Currents, climbs northwest past Eye of the Storm, circles northern ring of glowing runes, and plunges into core singularity",
      },
    ],
  },
];

/**
 * Returns all 31 waypoint keys formatted as 'r{realmId}-p{orderIndex}'
 */
export function getAllWaypointKeys(): string[] {
  const keys: string[] = [];
  for (const realm of CAMPAIGN_REALMS) {
    for (const puzzle of realm.puzzles) {
      keys.push(`r${realm.id}-p${puzzle.orderIndex}`);
    }
  }
  return keys;
}

/**
 * Returns the first 15 standard waypoint keys for a 15-puzzle hunt
 */
export function getDefault15WaypointKeys(): string[] {
  return getAllWaypointKeys().slice(0, 15);
}

/**
 * Builds the expedition ladder, optionally filtered by activeWaypointKeys curated by organizers.
 * Active waypoints are assigned clean sequential 1-indexed orderIndex values.
 */
export function buildExpeditionLadder(activeWaypointKeys?: string[] | null) {
  let globalOrder = 1;
  const ladder = [];
  const filterActive = Array.isArray(activeWaypointKeys) && activeWaypointKeys.length > 0;

  for (const realm of CAMPAIGN_REALMS) {
    for (const puzzle of realm.puzzles) {
      const waypointKey = `r${realm.id}-p${puzzle.orderIndex}`;
      const isSelected = !filterActive || activeWaypointKeys.includes(waypointKey);

      if (!isSelected) {
        continue; // Waypoint is bypassed/skipped by organizer
      }

      ladder.push({
        id: `realm-${realm.id}-stage-${puzzle.orderIndex}`,
        waypointKey,
        realmId: realm.id,
        orderIndex: globalOrder,
        realmOrderIndex: puzzle.orderIndex,
        title: puzzle.title,
        landmarkName: puzzle.landmarkName,
        region: `${realm.title.split(":")[0]?.trim()} • ${realm.subtitle.split("&")[0]?.trim()}`,
        description: puzzle.description,
        coord: puzzle.coord,
        titlePosition: puzzle.titlePosition || "bottom",
        answer: puzzle.answer,
        basePoints: puzzle.bountyPoints,
        bountyPoints: puzzle.bountyPoints,
        assetUrl: null,
        assetType: null,
        isSolved: false,
        isActive: globalOrder === 1,
        isLocked: globalOrder > 1,
        hints: [
          {
            id: `hint-${realm.id}-${puzzle.orderIndex}-1`,
            orderIndex: 1,
            penaltyPoints: 20,
            unlockDelayMinutes: 5,
            isUnlocked: false,
            content: `Field inscription: Decipher the cipher for '${puzzle.landmarkName}' (Answer: ${puzzle.answer})`,
          },
        ],
        attemptsCount: 0,
      });
      globalOrder++;
    }
  }

  return ladder;
}
