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
    "বিনোদন", "চলচ্চিত্র", "তারকা", "সিনেমা", "নাটক", "গান", "অভিনেতা", "অভিনেত্রী", "অভিনয়", "শুটিং",
    "গায়ক", "গায়িকা", "মিউজিক", "ফিল্ম", "টেলিভিশন", "নায়ক", "নায়িকা", "সেলিব্রিটি", "বায়োপিক", "ড্রামা",
    "কমেডি", "ওয়েব সিরিজ", "ওটিটি", "স্টার", "আনন্দ", "entertainment", "film", "actor", "actress", "superstar",
    "television", "tv", "music", "celebrity", "celebrities", "ott", "bollywood", "hollywood", "web series", "star",
    "biopic", "drama", "cinema", "movie", "show", "series",
  ];

  const khelaKeywords = [
    "খেলা", "ক্রিকেট", "ফুটবল", "ব্রাজিল", "আর্জেন্টিনা", "বিশ্বকাপ", "টি-টোয়েন্টি", "ওয়ানডে", "টেস্ট", "সাকিব",
    "তামিম", "মুশফিক", "বাংলাদেশ দল", "ম্যাচ", "গোল", "ব্যাটসম্যান", "বোলার", "ফিফা", "স্পোর্টস", "ক্রীড়া",
    "অলিম্পিক", "চ্যাম্পিয়নস লিগ", "পিএসজি", "রিয়াল মাদ্রিদ", "বার্সেলোনা", "ঢাকা লিগ", "বিপিএল", "sports",
    "cricket", "football", "soccer", "kabaddi", "baseball", "basketball", "brazil", "argentina", "batsman", "bowler",
    "goalkeeper", "fifa", "shakib", "tamim", "mushfiq", "olympics", "match", "goal", "psg", "barcelona", "real madrid",
    "inter", "bpl", "bbl", "test", "odi", "t20", "premier league", "champions league", "world cup", "tournament", "team",
    "player", "coach", "league",
  ];

  const rajnitiKeywords = [
    "রাজনীতি", "নির্বাচন", "প্রার্থী", "ভোট", "ভোটার", "ব্যালট", "সংসদ", "মন্ত্রী", "প্রধানমন্ত্রী", "রাষ্ট্রপতি",
    "সরকার", "নেতা", "নেত্রী", "দল", "আওয়ামী লীগ", "বিএনপি", "জাতীয় পার্টি", "কমিউনিস্ট", "অপসারণ", "মন্ত্রণালয়",
    "রাজনৈতিক", "বিরোধী দল", "জনমত", "সংবিধান", "politics", "election", "vote", "ballot", "candidate", "parliament",
    "government", "minister", "prime minister", "president", "leader", "political", "party", "cabinet", "opposition",
    "awami league", "bnp", "jamaat", "national party", "policy", "governance", "democracy", "autocracy",
  ];

  const orthonitiKeywords = [
    "অর্থনীতি", "বিনিয়োগ", "শেয়ার বাজার", "ব্যাংক", "ঋণ", "মুদ্রা", "সুদ", "মুদ্রাস্ফীতি", "রপ্তানি", "আমদানি",
    "ডলার", "ইউরো", "বাজেট", "জিডিপি", "বন্ড", "শেয়ার", "স্টক", "শিল্প", "কৃষি", "বাণিজ্য", "মার্কেট", "মূল্য",
    "মূল্যস্ফীতি", "ট্যাক্স", "আয়", "ব্যয়", "economy", "finance", "financial", "bank", "loan", "interest", "investment",
    "stock", "bond", "share market", "gdp", "budget", "import", "export", "trade", "currency", "inflation", "dollar",
    "euro", "market", "business", "tax", "revenue", "expense", "monetary", "fiscal",
  ];

  const projuktiKeywords = [
    "প্রযুক্তি", "কম্পিউটার", "মোবাইল", "ইন্টারনেট", "অ্যাপ", "সফটওয়্যার", "হার্ডওয়্যার", "ওয়েবসাইট", "ডিজিটাল",
    "এআই", "রোবট", "হ্যাকিং", "সাইবার", "গেম", "গেমিং", "স্মার্টফোন", "ইলেকট্রনিক্স", "উদ্ভাবন", "কোডিং",
    "প্রোগ্রামিং", "সার্ভার", "ডেটা", "চিপ", "সার্কিট", "technology", "computer", "software", "hardware", "mobile",
    "smartphone", "internet", "app", "application", "website", "cyber", "digital", "robot", "ai", "machine learning",
    "data", "electronics", "chip", "processor", "startup", "innovation", "hacking", "gaming", "facebook", "google",
    "apple", "microsoft", "samsung", "coding", "programming",
  ];

  const aantorjatikKeywords = [
    "আন্তর্জাতিক", "বিশ্ব", "বিশ্বরাজনীতি", "জাতিসংঘ", "চুক্তি", "যুদ্ধ", "শান্তি", "কূটনীতি", "সংঘর্ষ", "সীমান্ত",
    "বৈদেশিক", "রাষ্ট্রদূত", "দূতাবাস", "ইউরোপ", "আমেরিকা", "ভারত", "চীন", "রাশিয়া", "ইরান", "ইসরাইল",
    "প্যালেস্টাইন", "আফগানিস্তান", "তালেবান", "international", "world", "foreign", "un", "united nations", "diplomacy",
    "treaty", "conflict", "border", "ambassador", "embassy", "america", "china", "india", "russia", "iran", "israel",
    "afghanistan", "palestine", "taliban", "europe", "asia", "global affairs", "foreign policy", "geopolitics", "war",
    "peace", "nato", "imf", "world bank",
  ];

  const swasthyaKeywords = [
    "স্বাস্থ্য", "চিকিৎসা", "রোগ", "হাসপাতাল", "ডাক্তার", "নার্স", "ওষুধ", "জ্বর", "সর্দি", "মাথাব্যথা", "ক্যান্সার",
    "ডায়াবেটিস", "হৃদরোগ", "উচ্চ রক্তচাপ", "পুষ্টি", "খাদ্য", "টিকা", "করোনা", "ভ্যাকসিন", "ব্যায়াম", "স্বাস্থ্যসেবা",
    "অপারেশন", "শল্যচিকিৎসা", "মেডিকেল", "সংক্রমণ", "health", "medical", "medicine", "disease", "treatment", "hospital",
    "doctor", "nurse", "covid", "vaccine", "fever", "cold", "headache", "cancer", "diabetes", "heart disease",
    "blood pressure", "nutrition", "food", "exercise", "healthcare", "surgery", "clinic", "infection", "pandemic",
    "epidemic", "mental health", "fitness",
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

module.exports = {
  isDirectCategoryFeedUrl,
  matchesCategory,
  normalizeSourceName
};