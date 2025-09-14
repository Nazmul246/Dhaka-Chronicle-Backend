const express = require("express");
const cron = require("node-cron");
const cors = require("cors");

// Import configuration and services
const { rssFeeds } = require("./config/config");
const { fetchAndCacheNews } = require("./services/newsService");
const { cleanOldClickData } = require("./services/clickService");

// Import routes
const newsRoutes = require("./routes/newsRoutes");
const clickRoutes = require("./routes/clickRoutes");

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json()); // Add this to parse JSON bodies

// Routes
app.use("/news", newsRoutes);
app.use("/news", clickRoutes);

// Cache news every 2 hours
cron.schedule("0 */2 * * *", () => {
  fetchAndCacheNews(rssFeeds);
});

// Clean old click data every day at midnight
cron.schedule("0 0 * * *", cleanOldClickData);

// Initial fetch
fetchAndCacheNews(rssFeeds);

app.listen(port, () => {
  console.log(`🌐 Server running at: http://localhost:${port}`);
});
