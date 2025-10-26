const express = require("express");
const { getSiteTexts } = require("../services/adminService");
const router = express.Router();
const { getNewsCache } = require("../services/newsService");
const { fetchFullArticle } = require("../services/scraperService");

router.get("/bydate", (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Missing date parameter" });

  const requestedDate = new Date(date);
  if (isNaN(requestedDate))
    return res.status(400).json({ error: "Invalid date format" });

  const targetDateString = requestedDate.toISOString().split("T")[0];
  const filteredNews = [];
  const newsCache = getNewsCache();

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

router.get("/search", (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing search query" });

  const query = q.toLowerCase();
  const results = [];
  const newsCache = getNewsCache();

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

router.get("/all", (req, res) => {
  const newsCache = getNewsCache();
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

router.get("/category/:category", (req, res) => {
  const { category } = req.params;
  const { limit, offset = 0 } = req.query;
  const newsCache = getNewsCache();

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

router.get("/full", async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const result = await fetchFullArticle(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats", (req, res) => {
  const newsCache = getNewsCache();
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

router.get("/sources", (req, res) => {
  try {
    const sourceStats = {};
    const newsCache = getNewsCache();

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

// Public endpoint to fetch site configuration
router.get("/site-config", async (req, res) => {
  try {
    const texts = await getSiteTexts();
    res.json({ success: true, texts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
