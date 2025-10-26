const express = require("express");
const router = express.Router();
const {
  getRssFeeds,
  addRssFeed,
  removeRssFeed,
  getSiteTexts,
  updateSiteTexts,
  verifyAdmin,
} = require("../services/adminService");
const { fetchAndCacheNews } = require("../services/newsService");

// Admin login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const isValid = await verifyAdmin(username, password);

    if (isValid) {
      res.json({ success: true, message: "Login successful" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all RSS feeds
router.get("/rss-feeds", async (req, res) => {
  try {
    const feeds = await getRssFeeds();
    res.json({ success: true, feeds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add RSS feed to a category
router.post("/rss-feeds/add", async (req, res) => {
  try {
    const { category, feedUrl } = req.body;

    if (!category || !feedUrl) {
      return res.status(400).json({
        success: false,
        message: "Category and feed URL are required",
      });
    }

    const updatedFeeds = await addRssFeed(category, feedUrl);

    // Refresh news cache with updated feeds
    const allFeeds = await getRssFeeds();
    fetchAndCacheNews(allFeeds);

    res.json({
      success: true,
      message: "RSS feed added successfully",
      feeds: updatedFeeds,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove RSS feed from a category
router.post("/rss-feeds/remove", async (req, res) => {
  try {
    const { category, feedUrl } = req.body;

    if (!category || !feedUrl) {
      return res.status(400).json({
        success: false,
        message: "Category and feed URL are required",
      });
    }

    const updatedFeeds = await removeRssFeed(category, feedUrl);

    // Refresh news cache with updated feeds
    const allFeeds = await getRssFeeds();
    fetchAndCacheNews(allFeeds);

    res.json({
      success: true,
      message: "RSS feed removed successfully",
      feeds: updatedFeeds,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get site texts
router.get("/site-texts", async (req, res) => {
  try {
    const texts = await getSiteTexts();
    res.json({ success: true, texts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update site texts
router.post("/site-texts", async (req, res) => {
  try {
    const { siteTexts } = req.body;

    if (!siteTexts) {
      return res.status(400).json({
        success: false,
        message: "Site texts are required",
      });
    }

    const updatedTexts = await updateSiteTexts(siteTexts);

    res.json({
      success: true,
      message: "Site texts updated successfully",
      texts: updatedTexts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
