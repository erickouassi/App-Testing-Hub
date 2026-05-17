// api/build.js

import { updateAllFeeds } from "../backend/aggregator.js";
import fs from "node:fs";
import path from "node:path";

export default async function handler(req, res) {
  try {
    // Load feeds.json
    const feedsPath = path.join(process.cwd(), "backend", "feeds.json");
    const feedsData = JSON.parse(fs.readFileSync(feedsPath, "utf8"));
    const FEEDS = feedsData.feeds;

    // Process feeds
    const apps = await updateAllFeeds(FEEDS);

    const output = {
      generatedAt: new Date().toISOString(),
      apps
    };

    // Convert to string
    const jsonString = JSON.stringify(output, null, 2);

    // Commit to GitHub
    const repoOwner = "erickouassi";
    const repoName = "App-Testing-Hub";
    const filePath = "data/apps.json";
    const token = process.env.GITHUB_TOKEN;

    // Get existing file SHA (required for updates)
    const existing = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        }
      }
    ).then(r => r.json());

    const sha = existing.sha;

    // Commit new file
    const commitRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        },
        body: JSON.stringify({
          message: "Update apps.json via Vercel cron",
          content: Buffer.from(jsonString).toString("base64"),
          sha
        })
      }
    ).then(r => r.json());

    return res.status(200).json({
      success: true,
      committed: true,
      githubResponse: commitRes
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
