// noise_engine.js - Advanced Data Poisoning Engine
// Designed to flood tracking profiles with randomized, realistic, and confusing data.

// --- 1. KEYWORD BANKS (THE POISON) ---
const KEYWORDS = {
  tech: [
    "quantum computing explained", "best linux distro 2024", "python tensorflow tutorial", "rust vs go performance",
    "nvidia rtx 5090 rumors", "mechanical keyboard switches", "docker container security", "react hooks patterns",
    "aws lambda pricing", "kubernetes cluster setup", "raspberry pi projects", "arduino sensor library"
  ],
  finance: [
    "best roth ira rates", "crypto etf approval dates", "startups to invest in", "mortgage calculator texas",
    "forex trading strategies", "nft market crash analysis", "gold vs silver investment", "tax haven countries list",
    "how to short stocks", "compound interest formula", "best credit cards for travel", "retirement planning calculator"
  ],
  medical: [
    "symptoms of gout", "best vitamins for memory", "keto diet meal plan", "intermittent fasting benefits",
    "home remedies for flu", "stress management techniques", "yoga for back pain", "meditation apps review",
    "sleep cycle calculator", "essential oils for anxiety", "low carb recipes", "high blood pressure causes"
  ],
  lifestyle: [
    "best hiking trails near me", "vegan leather boots", "minimalist home decor", "sustainable fashion brands",
    "diy tiny house plans", "best coffee beans 2024", "craft beer brewing kit", "urban gardening tips",
    "fountain pen ink reviews", "analogue photography tips", "vintage vinyl records value", "scifi book recommendations"
  ],
  random: [
    "tractor parts for sale", "hydraulic press channel", "rare bird sightings", "soviet brutalist architecture",
    "underwater welding salary", "ancient sumerian texts", "best knot for sailing", "mushroom foraging guide",
    "lockpicking tutorial", "morse code chart", "origami dragon instructions", "chess openings for black"
  ]
};

// --- 2. SEARCH ENGINES ---
const SEARCH_ENGINES = [
  "https://www.google.com/search?q=",
  "https://www.bing.com/search?q=",
  "https://duckduckgo.com/?q=",
  "https://search.yahoo.com/search?p="
];

// --- 3. DIRECT TARGETS ---
const DIRECT_TARGETS = [
  "https://www.nytimes.com/", "https://www.wsj.com/", "https://www.bbc.com/",
  "https://www.cnn.com/", "https://www.foxnews.com/", "https://www.theguardian.com/",
  "https://www.reddit.com/r/random", "https://news.ycombinator.com/", "https://slashdot.org/",
  "https://en.wikipedia.org/wiki/Special:Random", "https://stackoverflow.com/", "https://github.com/explore",
  "https://www.imdb.com/chart/top", "https://www.goodreads.com/", "https://www.twitch.tv/"
];


// --- INIT ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    isNoiseActive: false,
    noiseLevel: "medium",
    stats: { sitesVisited: 0, lastRun: null }
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "noise_tick") generateSmartNoise();
});

// --- CORE LOGIC ---
async function generateSmartNoise() {
  const data = await chrome.storage.local.get(['isNoiseActive', 'stats', 'noiseLevel']);

  if (!data.isNoiseActive) {
    chrome.alarms.clear("noise_tick");
    return;
  }

  // DECISION: Search or Direct Visit? (60% Search, 40% Direct)
  const isSearch = Math.random() > 0.4;
  let finalUrl = "";

  if (isSearch) {
    // Pick random category and term
    const cats = Object.keys(KEYWORDS);
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const terms = KEYWORDS[cat];
    const term = terms[Math.floor(Math.random() * terms.length)];

    // Pick random engine
    const engine = SEARCH_ENGINES[Math.floor(Math.random() * SEARCH_ENGINES.length)];
    finalUrl = engine + encodeURIComponent(term);

    console.log(`[NoiseMachine] Searching (${cat}): ${term} on ${new URL(engine).hostname}`);
  } else {
    // Direct visit
    finalUrl = DIRECT_TARGETS[Math.floor(Math.random() * DIRECT_TARGETS.length)];
    console.log(`[NoiseMachine] Visiting Direct: ${finalUrl}`);
  }

  // EXECUTE
  try {
    // Mode 'no-cors' allows sending the request without waiting for full response body permission
    // This generates the network traffic record ISP/Trackers see.
    await fetch(finalUrl, { mode: 'no-cors' });

    // UPDATE STATS
    const newStats = {
      sitesVisited: (data.stats.sitesVisited || 0) + 1,
      lastRun: Date.now()
    };
    await chrome.storage.local.set({ stats: newStats });

    // SCHEDULE NEXT
    scheduleNext(data.noiseLevel);

  } catch (e) {
    console.error("Noise failed:", e);
  }
}

function scheduleNext(level) {
  let delayInMinutes = 2; // Default Medium

  // Low: 5-15 mins
  if (level === 'low') delayInMinutes = 5 + (Math.random() * 10);

  // Medium: 1-3 mins
  if (level === 'medium') delayInMinutes = 1 + (Math.random() * 2);

  // High: 10-40 seconds (approx 0.15 - 0.6 mins)
  if (level === 'high') delayInMinutes = 0.15 + (Math.random() * 0.5);

  chrome.alarms.create("noise_tick", { delayInMinutes });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleNoise") {
    if (request.value) {
      generateSmartNoise(); // Trigger immediate start
    } else {
      chrome.alarms.clear("noise_tick");
    }
  }
});
