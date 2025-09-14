const axios = require("axios");
const cheerio = require("cheerio");

async function fetchFullArticle(url) {
  console.log("Fetching content for URL:", url);

  if (!url) throw new Error("Missing URL");

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/125 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $("script, style, nav, header, footer, aside").remove();
    $(
      ".advertisement, .ads, .ad, .social-share, .share-buttons, .related-news, .comments"
    ).remove();

    // Get title
    let title =
      $("h1").first().text().trim() ||
      $(".title, .headline, .news-title").first().text().trim() ||
      $("title").text().split("|")[0].trim();

    // Strategy 1: Try comprehensive content selectors
    let article = "";
    const allSelectors = [
      // Common content containers
      ".news-content",
      ".article-content",
      ".entry-content",
      ".post-content",
      ".story-body",
      ".news-body",
      ".content-body",
      ".news-detail",
      // Specific to Bangladeshi news sites
      ".description",
      ".details",
      ".news-details",
      ".story-content",
      ".main-content",
      ".primary-content",
      ".article-body",
      // Generic containers
      "article",
      ".content",
      "main",
      ".post",
      ".story",
    ];

    for (const selector of allSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        let text = element.text().trim().replace(/\s+/g, " ");
        if (text.length > article.length && text.length > 100) {
          article = text;
        }
      }
    }

    // Strategy 2: If no good content found, try paragraph-based extraction
    if (article.length < 200) {
      console.log("Trying paragraph-based extraction...");

      // Get all paragraphs and filter meaningful ones
      const paragraphs = [];
      $("p").each((i, el) => {
        const text = $(el).text().trim();
        const parent = $(el).parent();

        // Skip paragraphs that are likely not main content
        if (
          text.length > 50 &&
          !text.includes("শেয়ার") &&
          !text.includes("ফলো") &&
          !text.includes("গুগল") &&
          !text.includes("©") &&
          !parent.hasClass("sidebar") &&
          !parent.hasClass("footer") &&
          !parent.hasClass("header")
        ) {
          paragraphs.push(text);
        }
      });

      if (paragraphs.length > 0) {
        article = paragraphs.join(" ").replace(/\s+/g, " ").trim();
      }
    }

    // Strategy 3: If still no content, try div-based extraction
    if (article.length < 200) {
      console.log("Trying div-based extraction...");

      let bestDiv = "";
      $("div").each((i, el) => {
        const text = $(el).text().trim().replace(/\s+/g, " ");
        const hasSignificantBanglaContent =
          (text.match(/[অ-৯]/g) || []).length > 50;

        if (
          text.length > bestDiv.length &&
          text.length > 200 &&
          hasSignificantBanglaContent &&
          text.length < 5000
        ) {
          // Avoid getting entire page content
          bestDiv = text;
        }
      });

      if (bestDiv.length > article.length) {
        article = bestDiv;
      }
    }

    // Clean up the content
    if (article.length > 0) {
      article = article
        .replace(/শেয়ার.*?করুন/gi, "")
        .replace(/প্রতীকী ছবি/gi, "")
        .replace(/কালের কণ্ঠের খবর পেতে গুগল নিউজ চ্যানেল ফলো করুন/gi, "")
        .replace(/সম্পর্কিত খবর/gi, "")
        .replace(/আরও পড়ুন/gi, "")
        .replace(/অ \+অ -/gi, "")
        .replace(/ই-পেপার/gi, "")
        .replace(/প্রাসঙ্গিক/gi, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    console.log("Final content length:", article.length);
    console.log("Title found:", !!title);

    // If still no sufficient content, return what we have with debug info
    if (article.length < 100) {
      // Last resort: get any meaningful text from the page
      let fallbackText = $("body")
        .text()
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 2000); // Get first 2000 chars as fallback

      return {
        content: fallbackText,
        title: title || "সংবাদ",
        wordCount: fallbackText.split(" ").length,
        warning: "Limited content extracted",
      };
    }

    return {
      content: article,
      title: title || "সংবাদ",
      wordCount: article.split(" ").length,
    };
  } catch (err) {
    console.error("Error fetching article:", err.message);
    throw new Error(`Failed to fetch article: ${err.message}`);
  }
}

module.exports = {
  fetchFullArticle
};