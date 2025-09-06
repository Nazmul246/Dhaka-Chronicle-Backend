const express = require("express");
const Parser = require("rss-parser");
const cron = require("node-cron");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const port = 4000;

const parser = new Parser({
  customFields: {
    item: ["source"],
  },
});

app.use(cors());
app.use(express.json()); // Add this to parse JSON bodies

// Click tracking storage (in production, use a database)
let clickTracker = new Map(); // Map of newsId -> { title, category, source, clickCount, lastClicked, clicks: [] }

const rssFeeds = {
  binodon: [
    "https://www.prothomalo.com/feed",
    "https://www.thedailystar.net/frontpage/rss.xml",
    "https://www.kalerkantho.com/rss.xml",
    "https://www.amarbanglabd.com/feed/entertainment",
    "https://www.tbsnews.net/rss.xml",
    "https://www.banglatribune.com/feed/",
    "https://www.bd24live.com/bangla/feed/",
    "https://www.risingbd.com/rss/rss.xml",
    "https://news.google.com/rss/search?q=%E0%A6%AC%E0%A6%BF%E0%A6%A8%E0%A7%8B%E0%A6%A6%E0%A6%A8&hl=bn&gl=BD&ceid=BD:bn",
    "https://www.banglanews24.com/rss/rss.xml",
    "https://www.prothomalo.com/entertainment/rss",
    "https://www.thedailystar.net/entertainment/rss.xml",
    "https://www.tbsnews.net/top-news/rss.xml",
    "https://www.amarbanglabd.com/feed/entertainment",
    "https://www.jagonews24.com/rss/rss.xml",
  ],
  kheladhula: [
    "https://www.prothomalo.com/feed",
    "https://www.thedailystar.net/frontpage/rss.xml",
    "https://www.kalerkantho.com/rss.xml",
    "https://www.amarbanglabd.com/feed/sports",
    "https://www.tbsnews.net/sports/rss.xml",
    "https://www.banglatribune.com/feed/",
    "https://www.bd24live.com/bangla/feed/",
    "https://www.risingbd.com/rss/rss.xml",
    "https://news.google.com/rss/search?q=%E0%A6%96%E0%A7%87%E0%A6%B2%E0%A6%BE%E0%A6%A7%E0%A7%81%E0%A6%B2%E0%A6%BE&hl=bn&gl=BD&ceid=BD:bn",
    "https://www.banglanews24.com/rss/rss.xml",
    "https://www.prothomalo.com/sports/rss",
    "https://www.thedailystar.net/sports/rss.xml",
    "https://www.tbsnews.net/sports/rss.xml",
    "https://www.amarbanglabd.com/feed/sports",
    "https://bdpratidin.net/rss/category/sports",
    "https://www.jagonews24.com/rss/rss.xml",
  ],
  topnews: [
    "https://www.prothomalo.com/feed",
    "https://www.thedailystar.net/frontpage/rss.xml",
    "https://www.kalerkantho.com/rss.xml",
    "https://www.amarbanglabd.com/feeds",
    "https://www.tbsnews.net/top-news/rss.xml",
    "https://www.banglatribune.com/feed/",
    "https://www.bd24live.com/bangla/feed/",
    "https://www.risingbd.com/rss/rss.xml",
    "https://news.google.com/rss?hl=bn&gl=BD&ceid=BD:bn",
    "https://www.banglanews24.com/rss/rss.xml",
    "https://www.prothomalo.com/bangladesh/rss",
    "https://www.thedailystar.net/news/rss.xml",
    "https://www.tbsnews.net/top-news/rss.xml",
    "https://bdpratidin.net/rss/latest-posts",
    "https://www.jagonews24.com/rss/rss.xml",
  ],
  rajniti: [
    "https://www.prothomalo.com/feed",
    "https://www.thedailystar.net/frontpage/rss.xml",
    "https://www.kalerkantho.com/rss.xml",
    "https://www.tbsnews.net/politics/rss.xml",
    "https://www.banglatribune.com/feed/",
    "https://www.bd24live.com/bangla/feed/",
    "https://www.risingbd.com/rss/rss.xml",
    "https://news.google.com/rss/search?q=%E0%A6%B0%E0%A6%BE%E0%A6%9C%E0%A6%A8%E0%A7%80%E0%A6%A4%E0%A6%BF&hl=bn&gl=BD&ceid=BD:bn",
    "https://www.banglanews24.com/rss/rss.xml",
    "https://www.thedailystar.net/politics/rss.xml",
    "https://www.tbsnews.net/bangladesh/politics/rss.xml",
    "https://www.amarbanglabd.com/feed/politics",
    "https://bdpratidin.net/rss/category/politics",
    "https://www.jagonews24.com/rss/rss.xml",
  ],
  orthoniti: [
    "https://www.prothomalo.com/feed",
    "https://www.thedailystar.net/frontpage/rss.xml",
    "https://www.kalerkantho.com/rss.xml",
    "https://www.tbsnews.net/economy/rss.xml",
    "https://www.banglatribune.com/feed/",
    "https://www.bd24live.com/bangla/feed/",
    "https://www.risingbd.com/rss/rss.xml",
    "https://news.google.com/rss/search?q=%E0%A6%85%E0%A6%B0%E0%A7%8D%E0%A6%A5%E0%A6%A8%E0%A7%80%E0%A6%A4%E0%A6%BF&hl=bn&gl=BD&ceid=BD:bn",
    "https://www.banglanews24.com/rss/rss.xml",
    "https://www.prothomalo.com/business/rss",
    "https://www.thedailystar.net/business/rss.xml",
    "https://www.amarbanglabd.com/feed/business",
    "https://www.jagonews24.com/rss/rss.xml",
  ],
  projukti: [
    "https://www.prothomalo.com/feed",
    "https://www.thedailystar.net/frontpage/rss.xml",
    "https://www.kalerkantho.com/rss.xml",
    "https://www.tbsnews.net/scitech/rss.xml",
    "https://www.banglatribune.com/feed/",
    "https://www.bd24live.com/bangla/feed/",
    "https://www.risingbd.com/rss/rss.xml",
    "https://news.google.com/rss/search?q=%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A6%AF%E0%A7%81%E0%A6%95%E0%A7%8D%E0%A6%A4%E0%A6%BF&hl=bn&gl=BD&ceid=BD:bn",
    "https://www.banglanews24.com/rss/rss.xml",
    "https://www.tbsnews.net/tech/rss.xml",
    "https://www.amarbanglabd.com/feed/science",
    "https://www.jagonews24.com/rss/rss.xml",
  ],
  aantorjatik: [
    "https://www.prothomalo.com/feed",
    "https://www.thedailystar.net/frontpage/rss.xml",
    "https://www.kalerkantho.com/rss.xml",
    "https://www.tbsnews.net/world/rss.xml",
    "https://www.banglatribune.com/feed/",
    "https://www.bd24live.com/bangla/feed/",
    "https://www.risingbd.com/rss/rss.xml",
    "https://news.google.com/rss/search?q=%E0%A6%86%E0%A6%A8%E0%A7%8D%E0%A6%A4%E0%A6%B0%E0%A7%8D%E0%A6%9C%E0%A6%BE%E0%A6%A4%E0%A6%BF%E0%A6%95&hl=bn&gl=BD&ceid=BD:bn",
    "https://www.banglanews24.com/rss/rss.xml",
    "https://www.amarbanglabd.com/feed/international",
    "https://bdpratidin.net/rss/category/world",
    "https://www.jagonews24.com/rss/rss.xml",
  ],
  swasthya: [
    "https://www.prothomalo.com/feed",
    "https://www.thedailystar.net/frontpage/rss.xml",
    "https://www.kalerkantho.com/rss.xml",
    "https://www.tbsnews.net/rss.xml",
    "https://www.banglatribune.com/feed/",
    "https://www.bd24live.com/bangla/feed/",
    "https://www.risingbd.com/rss/rss.xml",
    "https://news.google.com/rss/search?q=%E0%A6%B8%E0%A7%8D%E0%A6%AC%E0%A6%BE%E0%A6%B8%E0%A7%8D%E0%A6%A5%E0%A7%8D%E0%A6%AF&hl=bn&gl=BD&ceid=BD:bn",
    "https://www.banglanews24.com/rss/rss.xml",
    "https://www.prothomalo.com/lifestyle/rss",
    "https://www.thedailystar.net/health/rss.xml",
    "https://www.tbsnews.net/bangladesh/health/rss.xml",
    "https://www.amarbanglabd.com/feed/health",
    "https://www.jagonews24.com/rss/rss.xml",
  ],
};

let newsCache = {
  binodon: [],
  kheladhula: [],
  topnews: [],
  rajniti: [],
  orthoniti: [],
  projukti: [],
  aantorjatik: [],
  swasthya: [],
  lastUpdated: null,
};

// Helper to identify direct category feed
function isDirectCategoryFeedUrl(feedUrl, categoryKey) {
  if (!feedUrl || !categoryKey) return false;

  const lowerUrl = feedUrl.toLowerCase();

  // Category-specific URL patterns
  const categoryPatterns = {
    binodon: [
      "/feed/entertainment",
      "/entertainment/rss",
      "/entertainment/",
      "/arts/rss",
      "/culture/rss",
      "feed/entertainment",
      "entertainment/rss",
    ],
    kheladhula: [
      "/feed/sports",
      "/sports/rss",
      "/sports/",
      "/cricket/rss",
      "/football/rss",
      "feed/sports",
      "sports/rss",
      "category/sports",
    ],
    rajniti: [
      "/feed/politics",
      "/politics/rss",
      "/politics/",
      "/political/",
      "/bangladesh/politics/",
      "feed/politics",
      "politics/rss",
      "category/politics",
    ],
    orthoniti: [
      "/feed/business",
      "/business/rss",
      "/business/",
      "/economy/rss",
      "/economy/",
      "feed/business",
      "business/rss",
      "economy/rss",
    ],
    projukti: [
      "/feed/technology",
      "/technology/rss",
      "/tech/rss",
      "/scitech/rss",
      "/sci-tech/",
      "/science/",
      "feed/science",
      "tech/rss",
      "scitech/rss",
    ],
    aantorjatik: [
      "/feed/international",
      "/world/rss",
      "/international/rss",
      "/world/",
      "/international/",
      "feed/international",
      "world/rss",
      "category/world",
    ],
    swasthya: [
      "/feed/health",
      "/health/rss",
      "/health/",
      "/lifestyle/rss",
      "/lifestyle/",
      "feed/health",
      "health/rss",
      "lifestyle/rss",
      "bangladesh/health",
    ],
  };

  // Get patterns for the current category
  const patterns = categoryPatterns[categoryKey] || [];

  // Check if any pattern matches the URL
  return patterns.some((pattern) => lowerUrl.includes(pattern));
}

// Enhanced keyword matching
function matchesCategory(item, categoryKey) {
  const title = item.title?.toLowerCase() || "";
  const summary = item.summary?.toLowerCase() || "";
  const content = title + " " + summary;

  const binodonKeywords = [
    "বিনোদন",
    "চলচ্চিত্র",
    "তারকা",
    "সিনেমা",
    "নাটক",
    "গান",
    "অভিনেতা",
    "অভিনেত্রী",
    "অভিনয়",
    "শুটিং",
    "গায়ক",
    "গায়িকা",
    "মিউজিক",
    "ফিল্ম",
    "টেলিভিশন",
    "নায়ক",
    "নায়িকা",
    "সেলিব্রিটি",
    "বায়োপিক",
    "ড্রামা",
    "কমেডি",
    "ওয়েব সিরিজ",
    "ওটিটি",
    "স্টার",
    "আনন্দ",
    "entertainment",
    "film",
    "actor",
    "actress",
    "superstar",
    "television",
    "tv",
    "music",
    "celebrity",
    "celebrities",
    "ott",
    "bollywood",
    "hollywood",
    "web series",
    "star",
    "biopic",
    "drama",
    "cinema",
    "movie",
    "show",
    "series",
  ];

  const khelaKeywords = [
    "খেলা",
    "ক্রিকেট",
    "ফুটবল",
    "ব্রাজিল",
    "আর্জেন্টিনা",
    "বিশ্বকাপ",
    "টি-টোয়েন্টি",
    "ওয়ানডে",
    "টেস্ট",
    "সাকিব",
    "তামিম",
    "মুশফিক",
    "বাংলাদেশ দল",
    "ম্যাচ",
    "গোল",
    "ব্যাটসম্যান",
    "বোলার",
    "ফিফা",
    "স্পোর্টস",
    "ক্রীড়া",
    "অলিম্পিক",
    "চ্যাম্পিয়নস লিগ",
    "পিএসজি",
    "রিয়াল মাদ্রিদ",
    "বার্সেলোনা",
    "ঢাকা লিগ",
    "বিপিএল",
    "sports",
    "cricket",
    "football",
    "soccer",
    "kabaddi",
    "baseball",
    "basketball",
    "brazil",
    "argentina",
    "batsman",
    "bowler",
    "goalkeeper",
    "fifa",
    "shakib",
    "tamim",
    "mushfiq",
    "olympics",
    "match",
    "goal",
    "psg",
    "barcelona",
    "real madrid",
    "inter",
    "bpl",
    "bbl",
    "test",
    "odi",
    "t20",
    "premier league",
    "champions league",
    "world cup",
    "tournament",
    "team",
    "player",
    "coach",
    "league",
  ];

  const rajnitiKeywords = [
    "রাজনীতি",
    "নির্বাচন",
    "প্রার্থী",
    "ভোট",
    "ভোটার",
    "ব্যালট",
    "সংসদ",
    "মন্ত্রী",
    "প্রধানমন্ত্রী",
    "রাষ্ট্রপতি",
    "সরকার",
    "নেতা",
    "নেত্রী",
    "দল",
    "আওয়ামী লীগ",
    "বিএনপি",
    "জাতীয় পার্টি",
    "কমিউনিস্ট",
    "অপসারণ",
    "মন্ত্রণালয়",
    "রাজনৈতিক",
    "বিরোধী দল",
    "জনমত",
    "সংবিধান",
    "politics",
    "election",
    "vote",
    "ballot",
    "candidate",
    "parliament",
    "government",
    "minister",
    "prime minister",
    "president",
    "leader",
    "political",
    "party",
    "cabinet",
    "opposition",
    "awami league",
    "bnp",
    "jamaat",
    "national party",
    "policy",
    "governance",
    "democracy",
    "autocracy",
  ];

  const orthonitiKeywords = [
    "অর্থনীতি",
    "বিনিয়োগ",
    "শেয়ার বাজার",
    "ব্যাংক",
    "ঋণ",
    "মুদ্রা",
    "সুদ",
    "মুদ্রাস্ফীতি",
    "রপ্তানি",
    "আমদানি",
    "ডলার",
    "ইউরো",
    "বাজেট",
    "জিডিপি",
    "বন্ড",
    "শেয়ার",
    "স্টক",
    "শিল্প",
    "কৃষি",
    "বাণিজ্য",
    "মার্কেট",
    "মূল্য",
    "মূল্যস্ফীতি",
    "ট্যাক্স",
    "আয়",
    "ব্যয়",
    "economy",
    "finance",
    "financial",
    "bank",
    "loan",
    "interest",
    "investment",
    "stock",
    "bond",
    "share market",
    "gdp",
    "budget",
    "import",
    "export",
    "trade",
    "currency",
    "inflation",
    "dollar",
    "euro",
    "market",
    "business",
    "tax",
    "revenue",
    "expense",
    "monetary",
    "fiscal",
  ];

  const projuktiKeywords = [
    "প্রযুক্তি",
    "কম্পিউটার",
    "মোবাইল",
    "ইন্টারনেট",
    "অ্যাপ",
    "সফটওয়্যার",
    "হার্ডওয়্যার",
    "ওয়েবসাইট",
    "ডিজিটাল",
    "এআই",
    "রোবট",
    "হ্যাকিং",
    "সাইবার",
    "গেম",
    "গেমিং",
    "স্মার্টফোন",
    "ইলেকট্রনিক্স",
    "উদ্ভাবন",
    "কোডিং",
    "প্রোগ্রামিং",
    "সার্ভার",
    "ডেটা",
    "চিপ",
    "সার্কিট",
    "technology",
    "computer",
    "software",
    "hardware",
    "mobile",
    "smartphone",
    "internet",
    "app",
    "application",
    "website",
    "cyber",
    "digital",
    "robot",
    "ai",
    "machine learning",
    "data",
    "electronics",
    "chip",
    "processor",
    "startup",
    "innovation",
    "hacking",
    "gaming",
    "facebook",
    "google",
    "apple",
    "microsoft",
    "samsung",
    "coding",
    "programming",
  ];

  const aantorjatikKeywords = [
    "আন্তর্জাতিক",
    "বিশ্ব",
    "বিশ্বরাজনীতি",
    "জাতিসংঘ",
    "চুক্তি",
    "যুদ্ধ",
    "শান্তি",
    "কূটনীতি",
    "সংঘর্ষ",
    "সীমান্ত",
    "বৈদেশিক",
    "রাষ্ট্রদূত",
    "দূতাবাস",
    "ইউরোপ",
    "আমেরিকা",
    "ভারত",
    "চীন",
    "রাশিয়া",
    "ইরান",
    "ইসরাইল",
    "প্যালেস্টাইন",
    "আফগানিস্তান",
    "তালেবান",
    "international",
    "world",
    "foreign",
    "un",
    "united nations",
    "diplomacy",
    "treaty",
    "conflict",
    "border",
    "ambassador",
    "embassy",
    "america",
    "china",
    "india",
    "russia",
    "iran",
    "israel",
    "afghanistan",
    "palestine",
    "taliban",
    "europe",
    "asia",
    "global affairs",
    "foreign policy",
    "geopolitics",
    "war",
    "peace",
    "nato",
    "imf",
    "world bank",
  ];

  const swasthyaKeywords = [
    "স্বাস্থ্য",
    "চিকিৎসা",
    "রোগ",
    "হাসপাতাল",
    "ডাক্তার",
    "নার্স",
    "ওষুধ",
    "জ্বর",
    "সর্দি",
    "মাথাব্যথা",
    "ক্যান্সার",
    "ডায়াবেটিস",
    "হৃদরোগ",
    "উচ্চ রক্তচাপ",
    "পুষ্টি",
    "খাদ্য",
    "টিকা",
    "করোনা",
    "ভ্যাকসিন",
    "ব্যায়াম",
    "স্বাস্থ্যসেবা",
    "অপারেশন",
    "শল্যচিকিৎসা",
    "মেডিকেল",
    "সংক্রমণ",
    "health",
    "medical",
    "medicine",
    "disease",
    "treatment",
    "hospital",
    "doctor",
    "nurse",
    "covid",
    "vaccine",
    "fever",
    "cold",
    "headache",
    "cancer",
    "diabetes",
    "heart disease",
    "blood pressure",
    "nutrition",
    "food",
    "exercise",
    "healthcare",
    "surgery",
    "clinic",
    "infection",
    "pandemic",
    "epidemic",
    "mental health",
    "fitness",
  ];

  if (categoryKey === "binodon") {
    return binodonKeywords.some((kw) => content.includes(kw.toLowerCase()));
  }

  if (categoryKey === "kheladhula") {
    return khelaKeywords.some((kw) => content.includes(kw.toLowerCase()));
  }

  if (categoryKey === "rajniti") {
    return rajnitiKeywords.some((kw) => content.includes(kw.toLowerCase()));
  }

  if (categoryKey === "orthoniti") {
    return orthonitiKeywords.some((kw) => content.includes(kw.toLowerCase()));
  }

  if (categoryKey === "projukti") {
    return projuktiKeywords.some((kw) => content.includes(kw.toLowerCase()));
  }

  if (categoryKey === "aantorjatik") {
    return aantorjatikKeywords.some((kw) => content.includes(kw.toLowerCase()));
  }

  if (categoryKey === "swasthya") {
    return swasthyaKeywords.some((kw) => content.includes(kw.toLowerCase()));
  }

  return true; // For topnews, include everything
}

// Enhanced source name mapping and normalization
function normalizeSourceName(rawSource, feedUrl) {
  // Clean up the raw source first
  let source = rawSource?.trim() || "";

  // Map feed URLs to proper source names
  const feedToSourceMap = {
    "prothomalo.com": "Prothom Alo",
    "thedailystar.net": "The Daily Star",
    "kalerkantho.com": "Kaler Kantho",
    "amarbanglabd.com": "Amar Bangla",
    "tbsnews.net": "The Business Standard",
    "banglatribune.com": "Bangla Tribune",
    "bd24live.com": "BD24 Live",
    "risingbd.com": "Rising BD",
    "banglanews24.com": "Bangla News 24",
    "dhakatribune.com": "Dhaka Tribune",
    "newagebd.net": "New Age",
    "independent.com.bd": "The Independent",
    "financialexpress.com.bd": "The Financial Express",
  };

  // If we have a feed URL, try to map it to a proper source
  if (feedUrl) {
    for (const [domain, sourceName] of Object.entries(feedToSourceMap)) {
      if (feedUrl.includes(domain)) {
        return sourceName;
      }
    }
  }

  // Clean up common source name variations
  const sourceCleanupMap = {
    "প্রথম আলো": "Prothom Alo",
    "কালের কণ্ঠ": "Kaler Kantho",
    "দৈনিক কালের কণ্ঠ": "Kaler Kantho",
    "বাংলা ট্রিবিউন": "Bangla Tribune",
    বাংলানিউজ২৪: "Bangla News 24",
    "বাংলানিউজ টোয়েন্টিফোর": "Bangla News 24",
    "রাইজিং বিডি": "Rising BD",
    "The Daily Star": "The Daily Star",
    "দ্য ডেইলি স্টার": "The Daily Star",
    TBS: "The Business Standard",
    "TBS News": "The Business Standard",
  };

  // Apply cleanup
  if (sourceCleanupMap[source]) {
    return sourceCleanupMap[source];
  }

  // Handle Google News sources
  if (feedUrl && feedUrl.includes("news.google.com")) {
    // Extract source from title if it follows "Title - Source" pattern
    if (source.includes(" - ")) {
      const parts = source.split(" - ");
      source = parts[parts.length - 1].trim();
    }
    return source || "Google News";
  }

  // If source is still empty or generic, try to infer from feed URL
  if (!source || source === "Unknown" || source.length < 3) {
    if (feedUrl) {
      const domain = feedUrl.split("/")[2] || "";
      for (const [domainPart, sourceName] of Object.entries(feedToSourceMap)) {
        if (domain.includes(domainPart)) {
          return sourceName;
        }
      }
      // Fallback to domain name
      return domain.replace("www.", "").split(".")[0];
    }
  }

  return source || "Unknown";
}

// Update the fetchCategoryFeeds function to use better source handling
async function fetchCategoryFeeds(feeds, categoryKey = "") {
  const allFeeds = [];
  const maxItemsPerFeed = 50;

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const feedItems = feed.items.slice(0, maxItemsPerFeed);

      const items = feedItems.map((item) => {
        const titleParts = item.title?.split(" - ") || [];
        const cleanTitle = titleParts[0]?.trim() || item.title;

        // Better source extraction
        let rawSource =
          item.source?.["#"]?.trim() ||
          titleParts[1]?.trim() ||
          feed.title?.trim();

        // Use enhanced source normalization
        const normalizedSource = normalizeSourceName(rawSource, feedUrl);

        return {
          title: cleanTitle,
          link: item.link,
          pubDate: item.pubDate,
          source: normalizedSource,
          image:
            item.enclosure?.url ||
            (item["media:content"] && item["media:content"]["$"]?.url) ||
            null,
          summary: item.contentSnippet || item.content || item.summary || "",
          feedUrl: feedUrl,
        };
      });

      // Apply filtering logic based on feed type
      let filteredItems = items;
      const isDirectCategoryFeed = isDirectCategoryFeedUrl(
        feedUrl,
        categoryKey
      );

      if (categoryKey === "topnews") {
        // For topnews, include everything from all feeds
        filteredItems = items;
      } else if (isDirectCategoryFeed) {
        // For category-specific feeds, include all items without keyword filtering
        filteredItems = items;
        console.log(
          `📁 Direct ${categoryKey} feed detected: ${feedUrl} - Including ${items.length} items without filtering`
        );
      } else {
        // For general feeds, apply keyword filtering
        filteredItems = items.filter((item) =>
          matchesCategory(item, categoryKey)
        );
        console.log(
          `🔍 General feed filtered: ${feedUrl} - ${filteredItems.length}/${items.length} items matched ${categoryKey} keywords`
        );
      }

      allFeeds.push(...filteredItems);
    } catch (err) {
      console.error(`Failed to fetch feed ${feedUrl}:`, err.message);
      // Continue with other feeds
    }
  }

  // Enhanced deduplication with source diversity consideration
  const seenLinks = new Set();
  const seenTitles = new Set();
  const sourceCount = new Map();
  const uniqueItems = [];

  // Sort by date first
  allFeeds.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  for (const item of allFeeds) {
    const normalizedTitle = item.title?.toLowerCase().trim();

    if (seenLinks.has(item.link)) {
      continue;
    }

    // Allow some duplicate titles if from different sources
    if (normalizedTitle && seenTitles.has(normalizedTitle)) {
      const currentCount = sourceCount.get(item.source) || 0;
      if (currentCount >= 10) continue; // Limit per source in duplicates
    }

    uniqueItems.push(item);
    seenLinks.add(item.link);
    if (normalizedTitle) {
      seenTitles.add(normalizedTitle);
    }

    // Track source count
    sourceCount.set(item.source, (sourceCount.get(item.source) || 0) + 1);
  }

  return uniqueItems;
}

// Also add a new endpoint to get source diversity stats
app.get("/news/sources", (req, res) => {
  try {
    const sourceStats = {};

    // Collect source statistics from all categories
    for (const category of [
      "binodon",
      "kheladhula",
      "topnews",
      "rajniti",
      "orthoniti",
      "projukti",
      "aantorjatik",
      "swasthya",
    ]) {
      newsCache[category].forEach((item) => {
        const source = item.source || "Unknown";
        if (!sourceStats[source]) {
          sourceStats[source] = { total: 0, categories: {} };
        }
        sourceStats[source].total++;
        sourceStats[source].categories[category] =
          (sourceStats[source].categories[category] || 0) + 1;
      });
    }

    // Sort by total count
    const sortedSources = Object.entries(sourceStats)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([source, stats]) => ({ source, ...stats }));

    res.json({
      sources: sortedSources,
      totalSources: sortedSources.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching source stats:", error);
    res.status(500).json({ error: "Failed to fetch source statistics" });
  }
});

async function fetchCategoryFeeds(feeds, categoryKey = "") {
  const allFeeds = [];
  const maxItemsPerFeed = 50;

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const feedItems = feed.items.slice(0, maxItemsPerFeed);

      const items = feedItems.map((item) => {
        const titleParts = item.title?.split(" - ") || [];
        const cleanTitle = titleParts[0]?.trim() || item.title;
        const sourceFromTag = item.source?.["#"]?.trim();
        const inferredSource =
          sourceFromTag || titleParts[1]?.trim() || feed.title || "Unknown";

        return {
          title: cleanTitle,
          link: item.link,
          pubDate: item.pubDate,
          source: inferredSource,
          image:
            item.enclosure?.url ||
            (item["media:content"] && item["media:content"]["$"]?.url) ||
            null,
          summary: item.contentSnippet || item.content || item.summary || "",
          feedUrl: feedUrl,
        };
      });

      let filteredItems = items;
      const isDirectCategoryFeed = isDirectCategoryFeedUrl(
        feedUrl,
        categoryKey
      );

      if (!isDirectCategoryFeed && categoryKey !== "topnews") {
        filteredItems = items.filter((item) =>
          matchesCategory(item, categoryKey)
        );
      }

      allFeeds.push(...filteredItems);
    } catch (err) {
      // Silently continue on error
    }
  }

  // Enhanced deduplication
  const seenLinks = new Set();
  const seenTitles = new Set();
  const uniqueItems = [];

  for (const item of allFeeds) {
    const normalizedTitle = item.title?.toLowerCase().trim();

    if (seenLinks.has(item.link)) {
      continue;
    }

    if (normalizedTitle && seenTitles.has(normalizedTitle)) {
      continue;
    }

    uniqueItems.push(item);
    seenLinks.add(item.link);
    if (normalizedTitle) {
      seenTitles.add(normalizedTitle);
    }
  }

  // Sort by publication date (newest first)
  uniqueItems.sort((a, b) => {
    const dateA = new Date(a.pubDate);
    const dateB = new Date(b.pubDate);
    return dateB - dateA;
  });

  return uniqueItems;
}

async function fetchAndCacheNews() {
  console.log("🔄 Fetching news from RSS feeds…");

  try {
    const [
      binodonNews,
      kheladhulaNews,
      topnews,
      rajnitiNews,
      orthonitiNews,
      projuktiNews,
      aantorjatikNews,
      swasthyaNews,
    ] = await Promise.all([
      fetchCategoryFeeds(rssFeeds.binodon, "binodon"),
      fetchCategoryFeeds(rssFeeds.kheladhula, "kheladhula"),
      fetchCategoryFeeds(rssFeeds.topnews, "topnews"),
      fetchCategoryFeeds(rssFeeds.rajniti, "rajniti"),
      fetchCategoryFeeds(rssFeeds.orthoniti, "orthoniti"),
      fetchCategoryFeeds(rssFeeds.projukti, "projukti"),
      fetchCategoryFeeds(rssFeeds.aantorjatik, "aantorjatik"),
      fetchCategoryFeeds(rssFeeds.swasthya, "swasthya"),
    ]);

    newsCache.binodon = binodonNews.map((item) => ({
      ...item,
      category: "binodon",
    }));
    newsCache.kheladhula = kheladhulaNews.map((item) => ({
      ...item,
      category: "kheladhula",
    }));
    newsCache.topnews = topnews.map((item) => ({
      ...item,
      category: "topnews",
    }));
    newsCache.rajniti = rajnitiNews.map((item) => ({
      ...item,
      category: "rajniti",
    }));
    newsCache.orthoniti = orthonitiNews.map((item) => ({
      ...item,
      category: "orthoniti",
    }));
    newsCache.projukti = projuktiNews.map((item) => ({
      ...item,
      category: "projukti",
    }));
    newsCache.aantorjatik = aantorjatikNews.map((item) => ({
      ...item,
      category: "aantorjatik",
    }));
    newsCache.swasthya = swasthyaNews.map((item) => ({
      ...item,
      category: "swasthya",
    }));

    newsCache.lastUpdated = new Date();

    const totalNews =
      newsCache.binodon.length +
      newsCache.kheladhula.length +
      newsCache.topnews.length +
      newsCache.rajniti.length +
      newsCache.orthoniti.length +
      newsCache.projukti.length +
      newsCache.aantorjatik.length +
      newsCache.swasthya.length;

    console.log(`✅ News cached successfully - Total: ${totalNews} articles`);
  } catch (error) {
    console.error("❌ Error fetching news:", error.message);
  }
}

// Cache news every 2 hours
cron.schedule("0 */2 * * *", fetchAndCacheNews);

// Clean old click data every day at midnight
cron.schedule("0 0 * * *", () => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  for (const [newsId, data] of clickTracker.entries()) {
    // Remove clicks older than 7 days but keep the article if it has recent clicks
    data.clicks = data.clicks.filter(
      (click) => click.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    data.clickCount = data.clicks.length;

    // Remove articles with no clicks in the last 7 days
    if (data.clicks.length === 0) {
      clickTracker.delete(newsId);
    }
  }

  console.log(
    `🧹 Cleaned old click data. Active tracked articles: ${clickTracker.size}`
  );
});

// Initial fetch
fetchAndCacheNews();

// Click tracking endpoint
app.post("/news/track-click", (req, res) => {
  try {
    const { newsId, title, category, source, clickedAt, fromTrending } =
      req.body;

    if (!newsId || !title) {
      return res
        .status(400)
        .json({ error: "Missing required fields: newsId, title" });
    }

    const clickData = {
      timestamp: Date.now(),
      clickedAt: clickedAt || new Date().toISOString(),
      fromTrending: fromTrending || false,
    };

    if (clickTracker.has(newsId)) {
      const existing = clickTracker.get(newsId);
      existing.clicks.push(clickData);
      existing.clickCount = existing.clicks.length;
      existing.lastClicked = clickData.timestamp;
      existing.title = title; // Update title in case it changed
    } else {
      clickTracker.set(newsId, {
        title,
        category: category || "unknown",
        source: source || "unknown",
        clickCount: 1,
        lastClicked: clickData.timestamp,
        firstClicked: clickData.timestamp,
        clicks: [clickData],
        link: newsId,
      });
    }

    res.json({
      success: true,
      message: "Click tracked successfully",
      clickCount: clickTracker.get(newsId).clickCount,
    });
  } catch (error) {
    console.error("Error tracking click:", error);
    res.status(500).json({ error: "Failed to track click" });
  }
});

// Get trending news endpoint
app.get("/news/trending", (req, res) => {
  try {
    const { limit = 10, timeframe = "24h" } = req.query;

    // Calculate timeframe in milliseconds
    let timeframeMs;
    switch (timeframe) {
      case "1h":
        timeframeMs = 60 * 60 * 1000;
        break;
      case "6h":
        timeframeMs = 6 * 60 * 60 * 1000;
        break;
      case "24h":
        timeframeMs = 24 * 60 * 60 * 1000;
        break;
      case "7d":
        timeframeMs = 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        timeframeMs = 24 * 60 * 60 * 1000; // Default to 24h
    }

    const cutoffTime = Date.now() - timeframeMs;

    // Get trending news with recent clicks
    const trendingNews = Array.from(clickTracker.entries())
      .map(([link, data]) => {
        // Count recent clicks within timeframe
        const recentClicks = data.clicks.filter(
          (click) => click.timestamp > cutoffTime
        );

        return {
          link,
          title: data.title,
          category: data.category,
          source: data.source,
          clickCount: recentClicks.length,
          totalClickCount: data.clickCount,
          lastClicked: data.lastClicked,
          recentClicks: recentClicks.length,
        };
      })
      .filter((item) => item.recentClicks > 0) // Only include news with recent clicks
      .sort((a, b) => {
        // Sort by recent clicks first, then by total clicks, then by recency
        if (a.recentClicks !== b.recentClicks) {
          return b.recentClicks - a.recentClicks;
        }
        if (a.totalClickCount !== b.totalClickCount) {
          return b.totalClickCount - a.totalClickCount;
        }
        return b.lastClicked - a.lastClicked;
      })
      .slice(0, parseInt(limit));

    res.json({
      news: trendingNews,
      total: trendingNews.length,
      timeframe,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching trending news:", error);
    res.status(500).json({ error: "Failed to fetch trending news" });
  }
});

// Get click analytics endpoint
app.get("/news/analytics", (req, res) => {
  try {
    const totalArticles = clickTracker.size;
    const totalClicks = Array.from(clickTracker.values()).reduce(
      (sum, data) => sum + data.clickCount,
      0
    );

    // Category breakdown
    const categoryStats = {};
    for (const data of clickTracker.values()) {
      if (!categoryStats[data.category]) {
        categoryStats[data.category] = { articles: 0, clicks: 0 };
      }
      categoryStats[data.category].articles++;
      categoryStats[data.category].clicks += data.clickCount;
    }

    // Top sources
    const sourceStats = {};
    for (const data of clickTracker.values()) {
      if (!sourceStats[data.source]) {
        sourceStats[data.source] = { articles: 0, clicks: 0 };
      }
      sourceStats[data.source].articles++;
      sourceStats[data.source].clicks += data.clickCount;
    }

    const topSources = Object.entries(sourceStats)
      .sort(([, a], [, b]) => b.clicks - a.clicks)
      .slice(0, 10)
      .map(([source, stats]) => ({ source, ...stats }));

    // Recent activity (last 24 hours)
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const recentClicks = Array.from(clickTracker.values()).reduce(
      (sum, data) => {
        return (
          sum + data.clicks.filter((click) => click.timestamp > last24h).length
        );
      },
      0
    );

    res.json({
      totalArticles,
      totalClicks,
      recentClicks24h: recentClicks,
      categoryStats,
      topSources,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.get("/news/bydate", (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Missing date parameter" });

  const requestedDate = new Date(date);
  if (isNaN(requestedDate))
    return res.status(400).json({ error: "Invalid date format" });

  const targetDateString = requestedDate.toISOString().split("T")[0];
  const filteredNews = [];

  for (const category of [
    "binodon",
    "kheladhula",
    "topnews",
    "rajniti",
    "orthoniti",
    "projukti",
    "aantorjatik",
    "swasthya",
  ]) {
    const items = newsCache[category].filter((item) => {
      if (!item.pubDate) return false;
      const pubDate = new Date(item.pubDate);
      if (isNaN(pubDate)) return false;
      const pubDateString = pubDate.toISOString().split("T")[0];
      return pubDateString === targetDateString;
    });
    filteredNews.push(...items.map((item) => ({ ...item, category })));
  }

  res.json({ news: filteredNews, total: filteredNews.length });
});

app.get("/news/search", (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing search query" });

  const query = q.toLowerCase();
  const results = [];

  for (const category of [
    "binodon",
    "kheladhula",
    "topnews",
    "rajniti",
    "orthoniti",
    "projukti",
    "aantorjatik",
    "swasthya",
  ]) {
    const matched = newsCache[category].filter((item) => {
      return (
        item.title?.toLowerCase().includes(query) ||
        item.summary?.toLowerCase().includes(query)
      );
    });
    results.push(...matched.map((item) => ({ ...item, category })));
  }

  res.json({ news: results, total: results.length });
});

app.get("/news/all", (req, res) => {
  const { lastUpdated, ...categories } = newsCache;
  const combinedNews = Object.entries(categories).flatMap(([category, items]) =>
    items.map((item) => ({ ...item, category }))
  );

  res.json({
    lastUpdated,
    news: combinedNews,
    total: combinedNews.length,
    stats: {
      binodon: categories.binodon.length,
      kheladhula: categories.kheladhula.length,
      topnews: categories.topnews.length,
      rajniti: categories.rajniti.length,
      orthoniti: categories.orthoniti.length,
      projukti: categories.projukti.length,
      aantorjatik: categories.aantorjatik.length,
      swasthya: categories.swasthya.length,
    },
  });
});

app.get("/news/category/:category", (req, res) => {
  const { category } = req.params;
  const { limit, offset = 0 } = req.query;

  if (!newsCache[category]) {
    return res.status(404).json({ error: "Category not found" });
  }

  let categoryNews = [...newsCache[category]];

  if (limit) {
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    categoryNews = categoryNews.slice(start, end);
  }

  res.json({
    news: categoryNews,
    total: newsCache[category].length,
    returned: categoryNews.length,
  });
});

app.get("/news/full", async (req, res) => {
  const { url } = req.query;
  console.log("Fetching content for URL:", url);

  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/125 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $("script, style, nav, header, footer, aside").remove();
    $(
      ".advertisement, .ads, .ad, .social-share, .share-buttons, .related-news, .comments"
    ).remove();

    // Get title
    let title =
      $("h1").first().text().trim() ||
      $(".title, .headline, .news-title").first().text().trim() ||
      $("title").text().split("|")[0].trim();

    // Strategy 1: Try comprehensive content selectors
    let article = "";
    const allSelectors = [
      // Common content containers
      ".news-content",
      ".article-content",
      ".entry-content",
      ".post-content",
      ".story-body",
      ".news-body",
      ".content-body",
      ".news-detail",
      // Specific to Bangladeshi news sites
      ".description",
      ".details",
      ".news-details",
      ".story-content",
      ".main-content",
      ".primary-content",
      ".article-body",
      // Generic containers
      "article",
      ".content",
      "main",
      ".post",
      ".story",
    ];

    for (const selector of allSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        let text = element.text().trim().replace(/\s+/g, " ");
        if (text.length > article.length && text.length > 100) {
          article = text;
        }
      }
    }

    // Strategy 2: If no good content found, try paragraph-based extraction
    if (article.length < 200) {
      console.log("Trying paragraph-based extraction...");

      // Get all paragraphs and filter meaningful ones
      const paragraphs = [];
      $("p").each((i, el) => {
        const text = $(el).text().trim();
        const parent = $(el).parent();

        // Skip paragraphs that are likely not main content
        if (
          text.length > 50 &&
          !text.includes("শেয়ার") &&
          !text.includes("ফলো") &&
          !text.includes("গুগল") &&
          !text.includes("©") &&
          !parent.hasClass("sidebar") &&
          !parent.hasClass("footer") &&
          !parent.hasClass("header")
        ) {
          paragraphs.push(text);
        }
      });

      if (paragraphs.length > 0) {
        article = paragraphs.join(" ").replace(/\s+/g, " ").trim();
      }
    }

    // Strategy 3: If still no content, try div-based extraction
    if (article.length < 200) {
      console.log("Trying div-based extraction...");

      let bestDiv = "";
      $("div").each((i, el) => {
        const text = $(el).text().trim().replace(/\s+/g, " ");
        const hasSignificantBanglaContent =
          (text.match(/[অ-৯]/g) || []).length > 50;

        if (
          text.length > bestDiv.length &&
          text.length > 200 &&
          hasSignificantBanglaContent &&
          text.length < 5000
        ) {
          // Avoid getting entire page content
          bestDiv = text;
        }
      });

      if (bestDiv.length > article.length) {
        article = bestDiv;
      }
    }

    // Clean up the content
    if (article.length > 0) {
      article = article
        .replace(/শেয়ার.*?করুন/gi, "")
        .replace(/প্রতীকী ছবি/gi, "")
        .replace(/কালের কণ্ঠের খবর পেতে গুগল নিউজ চ্যানেল ফলো করুন/gi, "")
        .replace(/সম্পর্কিত খবর/gi, "")
        .replace(/আরও পড়ুন/gi, "")
        .replace(/অ \+অ -/gi, "")
        .replace(/ই-পেপার/gi, "")
        .replace(/প্রাসঙ্গিক/gi, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    console.log("Final content length:", article.length);
    console.log("Title found:", !!title);

    // If still no sufficient content, return what we have with debug info
    if (article.length < 100) {
      // Last resort: get any meaningful text from the page
      let fallbackText = $("body")
        .text()
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 2000); // Get first 2000 chars as fallback

      return res.status(200).json({
        content: fallbackText,
        title: title || "সংবাদ",
        wordCount: fallbackText.split(" ").length,
        warning: "Limited content extracted",
      });
    }

    res.json({
      content: article,
      title: title || "সংবাদ",
      wordCount: article.split(" ").length,
    });
  } catch (err) {
    console.error("Error fetching article:", err.message);
    res
      .status(500)
      .json({ error: "Failed to fetch article", details: err.message });
  }
});

app.get("/news/stats", (req, res) => {
  res.json({
    lastUpdated: newsCache.lastUpdated,
    stats: {
      binodon: newsCache.binodon.length,
      kheladhula: newsCache.kheladhula.length,
      topnews: newsCache.topnews.length,
      rajniti: newsCache.rajniti.length,
      orthoniti: newsCache.orthoniti.length,
      projukti: newsCache.projukti.length,
      aantorjatik: newsCache.aantorjatik.length,
      swasthya: newsCache.swasthya.length,
      total:
        newsCache.binodon.length +
        newsCache.kheladhula.length +
        newsCache.topnews.length +
        newsCache.rajniti.length +
        newsCache.orthoniti.length +
        newsCache.projukti.length +
        newsCache.aantorjatik.length +
        newsCache.swasthya.length,
    },
  });
});

app.listen(port, () => {
  console.log(`🌐 Server running at: http://localhost:${port}`);
});
