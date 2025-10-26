const fs = require("fs").promises;
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "../config/adminConfig.json");

// Read admin configuration
async function getAdminConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading admin config:", error);
    throw error;
  }
}

// Write admin configuration
async function saveAdminConfig(config) {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error saving admin config:", error);
    throw error;
  }
}

// Get RSS feeds
async function getRssFeeds() {
  const config = await getAdminConfig();
  return config.rssFeeds;
}

// Update RSS feeds for a specific category
async function updateRssFeed(category, feeds) {
  const config = await getAdminConfig();
  config.rssFeeds[category] = feeds;
  await saveAdminConfig(config);
  return config.rssFeeds;
}

// Add a single RSS feed to a category
async function addRssFeed(category, feedUrl) {
  const config = await getAdminConfig();
  if (!config.rssFeeds[category]) {
    config.rssFeeds[category] = [];
  }
  if (!config.rssFeeds[category].includes(feedUrl)) {
    config.rssFeeds[category].push(feedUrl);
    await saveAdminConfig(config);
  }
  return config.rssFeeds[category];
}

// Remove a single RSS feed from a category
async function removeRssFeed(category, feedUrl) {
  const config = await getAdminConfig();
  if (config.rssFeeds[category]) {
    config.rssFeeds[category] = config.rssFeeds[category].filter(
      (url) => url !== feedUrl
    );
    await saveAdminConfig(config);
  }
  return config.rssFeeds[category];
}

// Get site texts
async function getSiteTexts() {
  const config = await getAdminConfig();
  return config.siteTexts;
}

// Update site texts
async function updateSiteTexts(siteTexts) {
  const config = await getAdminConfig();
  config.siteTexts = { ...config.siteTexts, ...siteTexts };
  await saveAdminConfig(config);
  return config.siteTexts;
}

// Verify admin credentials
async function verifyAdmin(username, password) {
  const config = await getAdminConfig();
  return (
    config.adminCredentials.username === username &&
    config.adminCredentials.password === password
  );
}

module.exports = {
  getAdminConfig,
  saveAdminConfig,
  getRssFeeds,
  updateRssFeed,
  addRssFeed,
  removeRssFeed,
  getSiteTexts,
  updateSiteTexts,
  verifyAdmin,
};
