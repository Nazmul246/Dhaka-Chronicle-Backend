// Click tracking storage (in production, use a database)
let clickTracker = new Map(); // Map of newsId -> { title, category, source, clickCount, lastClicked, clicks: [] }

function trackClick(clickData) {
  const { newsId, title, category, source, clickedAt, fromTrending } =
    clickData;

  if (!newsId || !title) {
    throw new Error("Missing required fields: newsId, title");
  }

  const clickInfo = {
    timestamp: Date.now(),
    clickedAt: clickedAt || new Date().toISOString(),
    fromTrending: fromTrending || false,
  };

  if (clickTracker.has(newsId)) {
    const existing = clickTracker.get(newsId);
    existing.clicks.push(clickInfo);
    existing.clickCount = existing.clicks.length;
    existing.lastClicked = clickInfo.timestamp;
    existing.title = title; // Update title in case it changed
  } else {
    clickTracker.set(newsId, {
      title,
      category: category || "unknown",
      source: source || "unknown",
      clickCount: 1,
      lastClicked: clickInfo.timestamp,
      firstClicked: clickInfo.timestamp,
      clicks: [clickInfo],
      link: newsId,
    });
  }

  return {
    success: true,
    message: "Click tracked successfully",
    clickCount: clickTracker.get(newsId).clickCount,
  };
}

function getTrendingNews(limit = 10, timeframe = "24h") {
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

  return {
    news: trendingNews,
    total: trendingNews.length,
    timeframe,
    generatedAt: new Date().toISOString(),
  };
}

function getAnalytics() {
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
  const recentClicks = Array.from(clickTracker.values()).reduce((sum, data) => {
    return (
      sum + data.clicks.filter((click) => click.timestamp > last24h).length
    );
  }, 0);

  return {
    totalArticles,
    totalClicks,
    recentClicks24h: recentClicks,
    categoryStats,
    topSources,
    generatedAt: new Date().toISOString(),
  };
}

function cleanOldClickData() {
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
}

module.exports = {
  trackClick,
  getTrendingNews,
  getAnalytics,
  cleanOldClickData,
};
