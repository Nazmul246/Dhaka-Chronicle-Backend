const express = require("express");
const router = express.Router();
const {
  trackClick,
  getTrendingNews,
  getAnalytics,
} = require("../services/clickService");

// Click tracking endpoint
router.post("/track-click", (req, res) => {
  try {
    const result = trackClick(req.body);
    res.json(result);
  } catch (error) {
    console.error("Error tracking click:", error);
    res.status(400).json({ error: error.message });
  }
});

// Get trending news endpoint
router.get("/trending", (req, res) => {
  try {
    const { limit = 10, timeframe = "24h" } = req.query;
    const result = getTrendingNews(limit, timeframe);
    res.json(result);
  } catch (error) {
    console.error("Error fetching trending news:", error);
    res.status(500).json({ error: "Failed to fetch trending news" });
  }
});

// Get click analytics endpoint
router.get("/analytics", (req, res) => {
  try {
    const result = getAnalytics();
    res.json(result);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

module.exports = router;
