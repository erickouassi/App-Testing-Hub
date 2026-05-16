// api/build.js

import fs from "node:fs";
import path from "node:path";
import { updateAllFeeds } from "../backend/aggregator.js";

export default async function handler(req, res) {
  try {
    // Load feeds.json manually (Vercel-safe)
    const feedsPath = path.join(process.cwd(), "backend", "feeds.json");
    const feedsData = JSON.parse(fs.readFileSync(feedsPath, "utf8"));
    const FEEDS = feedsData.feeds;

    // Process feeds
    const apps = await updateAllFeeds(FEEDS);

    const output = {
      generatedAt: new Date().toISOString(),
      apps
    };

    // Save to /data/apps.json
    const outputPath = path.join(process.cwd(), "data", "apps.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    return res.status(200).json({
      success: true,
      count: apps.length
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
