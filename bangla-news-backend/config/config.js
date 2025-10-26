const fs = require("fs");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "adminConfig.json");

// Read RSS feeds from adminConfig.json
function loadRssFeeds() {
  try {
    const data = fs.readFileSync(CONFIG_FILE, "utf8");
    const config = JSON.parse(data);
    return config.rssFeeds;
  } catch (error) {
    console.error("Error loading RSS feeds from adminConfig.json:", error);
    // Return empty object as fallback
    return {
      binodon: [],
      kheladhula: [],
      topnews: [],
      rajniti: [],
      orthoniti: [],
      projukti: [],
      aantorjatik: [],
      swasthya: [],
    };
  }
}

const rssFeeds = loadRssFeeds();

module.exports = { rssFeeds };
