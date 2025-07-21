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
    // Add more entertainment-specific feeds
    "https://www.prothomalo.com/entertainment/rss",
    "https://www.thedailystar.net/entertainment/rss.xml"
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
    // Add more sports-specific feeds
    "https://www.prothomalo.com/sports/rss",
    "https://www.thedailystar.net/sports/rss.xml"
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
    // Add more general news feeds
    "https://www.prothomalo.com/bangladesh/rss",
    "https://www.thedailystar.net/news/rss.xml"
  ],
};

let newsCache = {
  binodon: [],
  kheladhula: [],
  topnews: [],
  lastUpdated: null,
};

// Helper to identify direct category feed
function isDirectCategoryFeedUrl(feedUrl, categoryKey) {
  const lowerUrl = feedUrl.toLowerCase();

  if (categoryKey === "binodon") {
    return (
      lowerUrl.includes("entertainment") ||
      lowerUrl.includes("binodon") ||
      lowerUrl.includes("arts") ||
      lowerUrl.includes("culture") ||
      lowerUrl.includes("/feed/entertainment")
    );
  }

  if (categoryKey === "kheladhula") {
    return (
      lowerUrl.includes("sports") ||
      lowerUrl.includes("khela") ||
      lowerUrl.includes("cricket") ||
      lowerUrl.includes("football") ||
      lowerUrl.includes("/feed/sports")
    );
  }

  return false;
}

// Enhanced keyword matching
function matchesCategory(item, categoryKey) {
  const title = item.title?.toLowerCase() || "";
  const summary = item.summary?.toLowerCase() || "";
  const content = title + " " + summary;

  const binodonKeywords = [
    "বিনোদন", "চলচ্চিত্র", "তারকা", "সিনেমা", "নাটক", "গান",
    "অভিনেতা", "অভিনেত্রী", "অভিনয়", "শুটিং", "গায়ক", "গায়িকা",
    "মিউজিক", "ফিল্ম", "টেলিভিশন", "নায়ক", "নায়িকা", "সেলিব্রিটি",
    "বায়োপিক", "ড্রামা", "কমেডি", "ওয়েব সিরিজ", "ওটিটি", "স্টার", "আনন্দ", 
    "entertainment", "film", "actor", "actress", "superstar", "television", "tv",
    "music", "celebrity", "celebrities", "ott", "bollywood", "hollywood", "web series", "star", 
    "biopic", "drama", "cinema", "movie", "show", "series"
  ];

  const khelaKeywords = [
    "খেলা", "ক্রিকেট", "ফুটবল", "ব্রাজিল", "আর্জেন্টিনা", "বিশ্বকাপ", "টি-টোয়েন্টি",
    "ওয়ানডে", "টেস্ট", "সাকিব", "তামিম", "মুশফিক", "বাংলাদেশ দল", "ম্যাচ", "গোল",
    "ব্যাটসম্যান", "বোলার", "ফিফা", "স্পোর্টস", "ক্রীড়া", "অলিম্পিক", "চ্যাম্পিয়নস লিগ",
    "পিএসজি", "রিয়াল মাদ্রিদ", "বার্সেলোনা", "ঢাকা লিগ", "বিপিএল",
    "sports", "cricket", "football", "soccer", "kabaddi", "baseball", "basketball", "brazil", "argentina",
    "batsman", "bowler", "goalkeeper", "fifa", "shakib", "tamim", "mushfiq", "olympics", "match", "goal",
    "psg", "barcelona", "real madrid", "inter", "bpl", "bbl", "test", "odi", "t20", "premier league",
    "champions league", "world cup", "tournament", "team", "player", "coach", "league"
  ];

  if (categoryKey === "binodon") {
    return binodonKeywords.some(kw => content.includes(kw.toLowerCase()));
  }
  
  if (categoryKey === "kheladhula") {
    return khelaKeywords.some(kw => content.includes(kw.toLowerCase()));
  }

  return true; // For topnews, include everything
}

async function fetchCategoryFeeds(feeds, categoryKey = "") {
  const allFeeds = [];
  const maxItemsPerFeed = 50; // Increase this to get more items

  for (const feedUrl of feeds) {
    try {
      console.log(`Fetching: ${feedUrl}`);
      const feed = await parser.parseURL(feedUrl);

      // Get more items from each feed
      const feedItems = feed.items.slice(0, maxItemsPerFeed);

      const items = feedItems.map((item) => {
        const titleParts = item.title?.split(" - ") || [];
        const cleanTitle = titleParts[0]?.trim() || item.title;
        const sourceFromTag = item.source?.["#"]?.trim();
        const inferredSource = sourceFromTag || titleParts[1]?.trim() || feed.title || "Unknown";

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
          feedUrl: feedUrl // Add feed URL for debugging
        };
      });

      let filteredItems = items;

      // Only filter if it's not a direct category feed
      const isDirectCategoryFeed = isDirectCategoryFeedUrl(feedUrl, categoryKey);

      if (!isDirectCategoryFeed && categoryKey !== "topnews") {
        filteredItems = items.filter((item) => matchesCategory(item, categoryKey));
      }

      console.log(`${feedUrl}: ${items.length} total, ${filteredItems.length} filtered`);
      allFeeds.push(...filteredItems); // Use spread operator to flatten immediately

    } catch (err) {
      console.error(`⚠️  Failed to fetch feed: ${feedUrl}`, err.message);
    }
  }

  // Enhanced deduplication - only remove exact duplicates
  const seenLinks = new Set();
  const seenTitles = new Set();
  const uniqueItems = [];

  for (const item of allFeeds) {
    // Create a normalized title for comparison
    const normalizedTitle = item.title?.toLowerCase().trim();
    
    // Skip if we've seen the exact same link
    if (seenLinks.has(item.link)) {
      continue;
    }
    
    // Skip if we've seen very similar title (but be less strict)
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

  console.log(`Final ${categoryKey} count: ${uniqueItems.length}`);
  return uniqueItems;
}

async function fetchAndCacheNews() {
  console.log("🔄 Fetching news from RSS feeds…");

  try {
    // Fetch all categories in parallel for better performance
    const [binodonNews, kheladhulaNews, topnews] = await Promise.all([
      fetchCategoryFeeds(rssFeeds.binodon, "binodon"),
      fetchCategoryFeeds(rssFeeds.kheladhula, "kheladhula"),
      fetchCategoryFeeds(rssFeeds.topnews, "topnews")
    ]);

    newsCache.binodon = binodonNews.map(item => ({ ...item, category: "binodon" }));
    newsCache.kheladhula = kheladhulaNews.map(item => ({ ...item, category: "kheladhula" }));
    newsCache.topnews = topnews.map(item => ({ ...item, category: "topnews" }));
    
    newsCache.lastUpdated = new Date();

    console.log("✅ News cached at", newsCache.lastUpdated.toLocaleString());
    console.log("📊 Cache stats:", {
      binodon: newsCache.binodon.length,
      kheladhula: newsCache.kheladhula.length,
      topnews: newsCache.topnews.length
    });

  } catch (error) {
    console.error("❌ Error fetching news:", error);
  }
}

// Cache news every 2 hours instead of once daily for more frequent updates
cron.schedule("0 */2 * * *", fetchAndCacheNews);

// Initial fetch
fetchAndCacheNews();

app.get("/news/bydate", (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Missing date parameter" });

  const requestedDate = new Date(date);
  if (isNaN(requestedDate)) return res.status(400).json({ error: "Invalid date format" });

  const targetDateString = requestedDate.toISOString().split("T")[0];

  const filteredNews = [];

  for (const category of ["binodon", "kheladhula", "topnews"]) {
    const items = newsCache[category].filter((item) => {
      if (!item.pubDate) {
        return false;
      }

      const pubDate = new Date(item.pubDate);
      if (isNaN(pubDate)) {
        return false;
      }

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

  for (const category of ["binodon", "kheladhula", "topnews"]) {
    const matched = newsCache[category].filter((item) => {
      return (
        item.title?.toLowerCase().includes(query) ||
        item.summary?.toLowerCase().includes(query)
      );
    });

    results.push(...matched.map((item) => ({ ...item, category })));
  }

  console.log("Query:", query);
  console.log("Matched Results:", results.length);
  res.json({ news: results, total: results.length });
});

app.get("/news/all", (req, res) => {
  const { lastUpdated, ...categories } = newsCache;
  const combinedNews = Object.entries(categories).flatMap(([category, items]) =>
    items.map((item) => ({ ...item, category }))
  );
  
  console.log("📤 Sending all news:", {
    binodon: categories.binodon.length,
    kheladhula: categories.kheladhula.length,
    topnews: categories.topnews.length,
    total: combinedNews.length
  });
  
  res.json({ 
    lastUpdated, 
    news: combinedNews, 
    total: combinedNews.length,
    stats: {
      binodon: categories.binodon.length,
      kheladhula: categories.kheladhula.length,
      topnews: categories.topnews.length
    }
  });
});

// Add a new endpoint to get news by category
app.get("/news/category/:category", (req, res) => {
  const { category } = req.params;
  const { limit, offset = 0 } = req.query;
  
  if (!newsCache[category]) {
    return res.status(404).json({ error: "Category not found" });
  }
  
  let categoryNews = [...newsCache[category]]; // Create a copy
  
  // Apply limit and offset for pagination
  if (limit) {
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    categoryNews = categoryNews.slice(start, end);
  }
  
  res.json({ 
    news: categoryNews, 
    total: newsCache[category].length,
    returned: categoryNews.length
  });
});

app.get("/news/full", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/125 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const candidateSelectors = [
      "article",
      ".content, .article-content, .entry-content, .post-content",
      "main",
      "body",
    ];

    let article = "";
    for (const sel of candidateSelectors) {
      article = $(sel).text().replace(/\s+/g, " ").trim();
      if (article.length > 50) break;
    }

    if (article.length < 50) {
      return res.status(404).json({ error: "Could not extract article content" });
    }

    res.json({ content: article });
  } catch (err) {
    console.error("❌ Failed to fetch article:", err);
    res.status(500).json({ error: "Failed to fetch article", details: err.message });
  }
});

// Add stats endpoint for debugging
app.get("/news/stats", (req, res) => {
  res.json({
    lastUpdated: newsCache.lastUpdated,
    stats: {
      binodon: newsCache.binodon.length,
      kheladhula: newsCache.kheladhula.length,
      topnews: newsCache.topnews.length,
      total: newsCache.binodon.length + newsCache.kheladhula.length + newsCache.topnews.length
    }
  });
});

app.listen(port, () => {
  console.log("🌐 Live backend (Railway): https://dhaka-chronicle-backend-production.up.railway.app");
});