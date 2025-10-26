const Parser = require("rss-parser");
const {
  isDirectCategoryFeedUrl,
  matchesCategory,
  normalizeSourceName,
} = require("../utils/helpers");

const parser = new Parser({
  customFields: {
    item: ["source"],
  },
});

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

async function fetchAndCacheNews(rssFeeds) {
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

function getNewsCache() {
  return newsCache;
}

module.exports = {
  fetchAndCacheNews,
  getNewsCache,
};
