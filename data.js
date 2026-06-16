// Bangkok skywalk navigation data
// Hybrid model: real station/exit geometry + custom skywalk layer + transfer logic
//
// LINE_ORDER defines station sequence north→south on the Sukhumvit Line.
// To add a station: add one entry to STATIONS, then insert its key into
// LINE_ORDER in the correct position. That's it — routing is generic.

const STATIONS = {
  siam: {
    name: "Siam",
    code: "CEN",
    line: "Sukhumvit + Silom (Interchange)",
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
      headline: "Level = direction, not line",
      levels: [
        {
          level: 4,
          tag: "L4 · Upper",
          direction: "↑ Northbound",
          lines: "Sukhumvit → Mo Chit · Silom → Nat'l Stadium"
        },
        {
          level: 3,
          tag: "L3 · Lower",
          direction: "↓ Southbound",
          lines: "Sukhumvit → Bearing · Silom → Bang Wa"
        }
      ],
      watch: "Same direction = cross platform. Direction change = change levels."
    }
  },
  chitlom: {
    name: "Chit Lom",
    code: "E1",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Central Chidlom direct skywalk" },
      { id: 2, label: "Exit 2", desc: "Gaysorn Plaza skywalk" },
      { id: 3, label: "Exit 3", desc: "Towards Central World (short walk, partly covered)" },
      { id: 4, label: "Exit 4", desc: "Soi Chit Lom / Ratchadamri side" }
    ],
    skywalk: true,
    skywalkNote: "Direct covered skywalk into Central Chidlom (Exit 1) and Gaysorn Plaza (Exit 2). Central World is reachable mostly under cover but requires a short street crossing."
  },
  phloenchit: {
    name: "Phloen Chit",
    code: "E2",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Central Embassy direct skywalk" },
      { id: 2, label: "Exit 2", desc: "Wireless Road side" },
      { id: 3, label: "Exit 3", desc: "Towards Soi Ruamrudee" },
      { id: 4, label: "Exit 4", desc: "Sukhumvit Soi 2 side" }
    ],
    skywalk: true,
    skywalkNote: "Covered skywalk runs directly into Central Embassy from Exit 1."
  },
  nana: {
    name: "Nana",
    code: "E3",
    line: "Sukhumvit",
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
    code: "E4",
    line: "Sukhumvit",
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
  }
};

// Order of stations north → south along the Sukhumvit Line.
// Insert new station keys here in correct position as the network grows.
const LINE_ORDER = ["siam", "chitlom", "phloenchit", "nana", "asok"];

// Walking segments between ADJACENT stations only (the custom data layer
// OSM won't have). Longer routes are summed automatically.
const SEGMENTS = [
  { from: "siam", to: "chitlom", distanceKm: 0.9, walkMinutes: 11, coveredPercent: 60,
    notes: "Largely walkable under cover via Siam's skywalk network feeding toward Chit Lom, but train is faster.", recommendTrain: true },
  { from: "chitlom", to: "phloenchit", distanceKm: 0.8, walkMinutes: 10, coveredPercent: 30,
    notes: "Short hop, partial cover. Fine to walk if not in a hurry.", recommendTrain: false },
  { from: "phloenchit", to: "nana", distanceKm: 1.0, walkMinutes: 12, coveredPercent: 15,
    notes: "Mostly street-level along Sukhumvit Rd.", recommendTrain: false },
  { from: "nana", to: "asok", distanceKm: 1.1, walkMinutes: 14, coveredPercent: 20,
    notes: "Mostly street-level along Sukhumvit Rd. Some shop awnings but no continuous skywalk. Better to take the train one stop unless you want the walk.", recommendTrain: true }
];

function getSegment(aKey, bKey) {
  return SEGMENTS.find(s => (s.from === aKey && s.to === bKey) || (s.from === bKey && s.to === aKey));
}

// Sum adjacent segments to estimate a multi-stop walk (used for the meta pills,
// not turn-by-turn — nobody is walking 4 stations, but it's useful info).
function getWalkEstimate(fromIdx, toIdx) {
  const lo = Math.min(fromIdx, toIdx);
  const hi = Math.max(fromIdx, toIdx);
  let minutes = 0, km = 0;
  for (let i = lo; i < hi; i++) {
    const seg = getSegment(LINE_ORDER[i], LINE_ORDER[i + 1]);
    if (seg) { minutes += seg.walkMinutes; km += seg.distanceKm; }
  }
  return { walkMinutes: minutes, distanceKm: Math.round(km * 10) / 10 };
}

// Route steps generator — walks the ordered line array, so it works for
// any pair of stations on LINE_ORDER without per-pair hardcoding.
function getRoute(fromKey, toKey) {
  const from = STATIONS[fromKey];
  const to = STATIONS[toKey];
  if (!from || !to) return null;

  const fromIdx = LINE_ORDER.indexOf(fromKey);
  const toIdx = LINE_ORDER.indexOf(toKey);
  const goingNorth = toIdx < fromIdx; // toward Siam/Mo Chit
  const numStops = Math.abs(toIdx - fromIdx);
  const direction = goingNorth ? "northbound (toward Mo Chit / Khu Khot)" : "southbound (toward Bearing / Kheha)";

  const steps = [];

  steps.push({
    type: "start",
    title: `Start at ${from.name} BTS (${from.code})`,
    detail: `Enter via any exit. Head to the platform for trains ${direction}.`
  });

  // Does the path cross Siam (and is Siam not an endpoint)?
  const siamIdx = LINE_ORDER.indexOf("siam");
  const crossesSiam = siamIdx > Math.min(fromIdx, toIdx) && siamIdx < Math.max(fromIdx, toIdx);

  if (fromKey !== "siam" && toKey !== "siam" && !crossesSiam) {
    steps.push({
      type: "ride",
      title: `Ride ${numStops} stop${numStops > 1 ? "s" : ""} ${direction}`,
      detail: `Stay on the Sukhumvit Line. Get off at ${to.name} (${to.code}).`
    });
  } else if (fromKey === "siam") {
    steps.push({
      type: "transfer",
      title: "Confirm your platform level",
      detail: goingNorth ? "Take Level 4 (upper) — northbound." : "Take Level 3 (lower) — southbound."
    });
    steps.push({
      type: "ride",
      title: `Ride ${numStops} stop${numStops > 1 ? "s" : ""} ${direction}`,
      detail: `Get off at ${to.name} (${to.code}).`
    });
  } else if (toKey === "siam") {
    steps.push({
      type: "ride",
      title: `Ride ${numStops} stop${numStops > 1 ? "s" : ""} ${direction}`,
      detail: `Get off at Siam (${to.code}).`
    });
    steps.push({
      type: "transfer",
      title: "⚠ Siam: level = direction, not line",
      detail: "Same direction → cross platform. Switching direction → change levels via central stairs."
    });
  } else if (crossesSiam) {
    steps.push({
      type: "ride",
      title: `Ride ${numStops} stop${numStops > 1 ? "s" : ""} ${direction}, passing through Siam`,
      detail: `Stay on board through Siam (no need to change platforms since you're continuing the same direction). Get off at ${to.name} (${to.code}).`
    });
  }

  steps.push({
    type: "arrive",
    title: `Arrive at ${to.name} (${to.code})`,
    detail: to.skywalkNote || `Check exits for the closest skywalk or street access to your destination.`
  });

  const directSegment = getSegment(fromKey, toKey);
  const walkEstimate = directSegment
    ? { walkMinutes: directSegment.walkMinutes, distanceKm: directSegment.distanceKm }
    : getWalkEstimate(fromIdx, toIdx);

  const recommendTrain = numStops > 1 || (directSegment ? directSegment.recommendTrain : true);

  return {
    from, to, steps,
    segment: { ...walkEstimate, recommendTrain, notes: directSegment ? directSegment.notes : null }
  };
}

window.STATIONS = STATIONS;
window.LINE_ORDER = LINE_ORDER;
window.SEGMENTS = SEGMENTS;
window.getRoute = getRoute;
