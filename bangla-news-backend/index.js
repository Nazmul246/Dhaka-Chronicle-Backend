const express = require("express");
const cron = require("node-cron");
const cors = require("cors");

// Import services
const { fetchAndCacheNews } = require("./services/newsService");
const { cleanOldClickData } = require("./services/clickService");
const { getRssFeeds } = require("./services/adminService");

// Import routes
const newsRoutes = require("./routes/newsRoutes");
const clickRoutes = require("./routes/clickRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/news", newsRoutes);
app.use("/news", clickRoutes);
app.use("/admin", adminRoutes);

// Function to initialize and cache news
async function initializeNews() {
  try {
    const rssFeeds = await getRssFeeds();
    await fetchAndCacheNews(rssFeeds);
  } catch (error) {
    console.error("Error initializing news:", error);
  }
}

// Cache news every 2 hours
cron.schedule("0 */2 * * *", async () => {
  console.log("⏰ Running scheduled news update...");
  await initializeNews();
});

// Clean old click data every day at midnight
cron.schedule("0 0 * * *", cleanOldClickData);

// Initial fetch on server start
initializeNews();

app.listen(port, () => {
  console.log(`🌐 Server running at: http://localhost:${port}`);
  console.log(`🔧 Admin API available at: http://localhost:${port}/admin`);
});
