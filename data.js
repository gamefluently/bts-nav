// Bangkok skywalk navigation data
// Hybrid model: real station/exit geometry + custom skywalk layer + transfer logic

const STATIONS = {
  nana: {
    name: "Nana",
    line: "Sukhumvit",
    code: "E3",
    exits: [
      { id: 1, label: "Exit 1", desc: "Sukhumvit Soi 3/1, Arab Quarter side" },
      { id: 2, label: "Exit 2", desc: "Sukhumvit Soi 4, towards Soi Nana" },
      { id: 3, label: "Exit 3", desc: "Sukhumvit Soi 6 / Beach Road side" },
      { id: 4, label: "Exit 4", desc: "Robinson side, towards Soi 5" }
    ],
    skywalk: false
  },
  asok: {
    name: "Asok",
    line: "Sukhumvit",
    code: "E4",
    exits: [
      { id: 1, label: "Exit 1", desc: "Sukhumvit Soi 21 (Asok Montri Rd)" },
      { id: 2, label: "Exit 2", desc: "Terminal 21 direct skywalk link" },
      { id: 3, label: "Exit 3", desc: "Towards MRT Sukhumvit, Soi 19 side" },
      { id: 4, label: "Exit 4", desc: "Sukhumvit Soi 23 side" },
      { id: 5, label: "Exit 5", desc: "Sukhumvit Soi 21, southbound side" },
      { id: 6, label: "Exit 6", desc: "Towards MRT Sukhumvit entrance 3" }
    ],
    skywalk: true,
    skywalkNote: "Covered skywalk connects Exit 2 directly into Terminal 21, 2nd floor.",
    transfer: {
      to: "MRT Sukhumvit (Blue Line)",
      via: "Exit 3 or 6",
      walkMinutes: 4,
      notes: "No direct skywalk to MRT — short street-level walk along Soi 21, mostly shaded by building overhangs. Use Exit 6 for the most direct line to MRT entrance 3."
    }
  },
  siam: {
    name: "Siam",
    line: "Sukhumvit + Silom (Interchange)",
    code: "CEN",
    exits: [
      { id: 1, label: "Exit 1", desc: "Siam Square, Rama 1 Rd" },
      { id: 2, label: "Exit 2", desc: "Siam Discovery / MBK skywalk" },
      { id: 3, label: "Exit 3", desc: "Siam Paragon direct skywalk" },
      { id: 4, label: "Exit 4", desc: "Central World skywalk (long covered bridge)" },
      { id: 5, label: "Exit 5", desc: "Hua Chang canal side, Siam Square soi entrance" },
      { id: 6, label: "Exit 6", desc: "Chulalongkorn University side" }
    ],
    skywalk: true,
    skywalkNote: "Siam has the most extensive skywalk web on the network — covered bridges run directly into Paragon, Siam Discovery, and across to Central World/Centara. You can reach all of these without touching street level.",
    interchange: {
      type: "stacked-by-direction",
      summary: "Siam is the ONLY interchange between the Sukhumvit and Silom lines, and its layout is the single most confusing point on the network: the two platform levels are split by DIRECTION, not by LINE.",
      levels: [
        {
          level: 4,
          label: "Upper platform (Level 4)",
          serves: "Northbound: trains toward Mo Chit / Khu Khot (Sukhumvit Line, north) AND trains toward National Stadium (Silom Line, west)",
          detail: "Both platforms on this level head AWAY from the river/south side of the city."
        },
        {
          level: 3,
          label: "Lower platform (Level 3)",
          serves: "Southbound: trains toward Bang Wa / Wongwian Yai (Silom Line, south) AND trains toward Bearing/Kheha (Sukhumvit Line, south)",
          detail: "Both platforms on this level head TOWARD the river/south side of the city."
        }
      ],
      keyRule: "If you arrive on the Sukhumvit Line heading toward Khu Khot (north) and want to switch to Silom Line, you stay on the SAME level (Level 4) — just cross to the other side of the platform. But if you're heading toward Khu Khot and need a southbound Silom train, you must change levels via the stairs/escalators in the center concourse — you CANNOT just cross the platform.",
      commonMistake: "Most people assume same-line transfers are same-level. At Siam it's the opposite: level is determined by direction (north vs south), not by which line you're on. A same-direction transfer (e.g. both northbound) is a simple cross-platform move. A direction change requires changing levels entirely."
    }
  }
};

// Skywalk/walking segments between stations (the custom data layer OSM won't have)
const SEGMENTS = [
  {
    from: "nana",
    to: "asok",
    distanceKm: 1.1,
    walkMinutes: 14,
    coveredPercent: 20,
    notes: "Mostly street-level along Sukhumvit Rd. Some shop awnings but no continuous skywalk. Better to take the train one stop unless you want the walk.",
    recommendTrain: true
  },
  {
    from: "asok",
    to: "siam",
    distanceKm: 2.3,
    walkMinutes: 28,
    coveredPercent: 10,
    notes: "Too far to walk practically — take the BTS, 2 stops.",
    recommendTrain: true
  },
  {
    from: "nana",
    to: "siam",
    distanceKm: 3.0,
    walkMinutes: 35,
    coveredPercent: 5,
    notes: "Take the BTS — 3 stops via Sukhumvit Line direct.",
    recommendTrain: true
  }
];

// Route steps generator — the core routing logic
function getRoute(fromKey, toKey) {
  const from = STATIONS[fromKey];
  const to = STATIONS[toKey];
  if (!from || !to) return null;

  const steps = [];

  steps.push({
    type: "start",
    title: `Start at ${from.name} BTS`,
    detail: `Enter via any exit. Head to the platform for trains toward ${to.name === "Siam" ? "Siam (transfer point)" : to.name}.`
  });

  if (fromKey === "nana" && toKey === "asok") {
    steps.push({
      type: "ride",
      title: "Ride 1 stop toward Mo Chit",
      detail: "Sukhumvit Line, northbound direction. Asok is the very next station."
    });
    steps.push({
      type: "arrive",
      title: "Arrive at Asok",
      detail: "Use Exit 2 for direct covered skywalk into Terminal 21. Use Exit 3 or 6 if continuing on to MRT Sukhumvit."
    });
  }

  if (fromKey === "asok" && toKey === "siam") {
    steps.push({
      type: "ride",
      title: "Ride 2 stops toward National Stadium / Mo Chit",
      detail: "Sukhumvit Line, northbound direction toward Mo Chit. Get off at Siam (3rd station from Asok)."
    });
    steps.push({
      type: "transfer",
      title: "⚠ Siam is a level-change interchange",
      detail: "If continuing on Sukhumvit Line northbound (toward Mo Chit/Khu Khot), stay on Level 4 — cross platform only. If switching to Silom Line southbound (toward Bang Wa), you must go down to Level 3 via the central stairs/escalators."
    });
    steps.push({
      type: "arrive",
      title: "Arrive at Siam",
      detail: "Exit 3 → Siam Paragon (covered skywalk). Exit 4 → Central World (long covered bridge). Exit 2 → Siam Discovery/MBK."
    });
  }

  if (fromKey === "nana" && toKey === "siam") {
    steps.push({
      type: "ride",
      title: "Ride 3 stops toward National Stadium / Mo Chit",
      detail: "Sukhumvit Line, northbound direction. Pass Asok and Phloen Chit, arrive at Siam."
    });
    steps.push({
      type: "arrive",
      title: "Arrive at Siam",
      detail: "Exit 3 → Siam Paragon (covered skywalk). Exit 4 → Central World (long covered bridge). Exit 2 → Siam Discovery/MBK."
    });
  }

  // Reverse direction routes
  if (fromKey === "siam" && toKey === "asok") {
    steps.push({
      type: "transfer",
      title: "Confirm you're on the right platform",
      detail: "You want Sukhumvit Line, southbound toward Bearing/Kheha — Level 3 (lower platform)."
    });
    steps.push({
      type: "ride",
      title: "Ride 2 stops toward Bearing/Kheha",
      detail: "Get off at Asok."
    });
    steps.push({
      type: "arrive",
      title: "Arrive at Asok",
      detail: "Exit 2 → covered skywalk into Terminal 21."
    });
  }

  if (fromKey === "siam" && toKey === "nana") {
    steps.push({
      type: "transfer",
      title: "Confirm you're on the right platform",
      detail: "You want Sukhumvit Line, southbound toward Bearing/Kheha — Level 3 (lower platform)."
    });
    steps.push({
      type: "ride",
      title: "Ride 3 stops toward Bearing/Kheha",
      detail: "Get off at Nana."
    });
    steps.push({
      type: "arrive",
      title: "Arrive at Nana",
      detail: "Exit 2 → Soi Nana. Exit 4 → Robinson side."
    });
  }

  if (fromKey === "asok" && toKey === "nana") {
    steps.push({
      type: "ride",
      title: "Ride 1 stop toward Bearing/Kheha",
      detail: "Sukhumvit Line, southbound direction. Nana is the very next station."
    });
    steps.push({
      type: "arrive",
      title: "Arrive at Nana",
      detail: "Exit 2 → Soi Nana area. Exit 4 → Robinson side."
    });
  }

  const segment = SEGMENTS.find(
    s => (s.from === fromKey && s.to === toKey) || (s.from === toKey && s.to === fromKey)
  );

  return { from, to, steps, segment };
}

window.STATIONS = STATIONS;
window.SEGMENTS = SEGMENTS;
window.getRoute = getRoute;
