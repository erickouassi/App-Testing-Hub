// api/build.js

import fs from "node:fs";
import path from "node:path";
import { updateAllFeeds } from "../backend/aggregator.js";
import feedsData from "../backend/feeds.json" assert { type: "json" };

export default async function handler(req, res) {
  try {
    const FEEDS = feedsData.feeds;

    const apps = await updateAllFeeds(FEEDS);

    const output = {
      generatedAt: new Date().toISOString(),
      apps
    };

    const filePath = path.join(process.cwd(), "data", "apps.json");
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));

    return res.status(200).json({ success: true, count: apps.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
