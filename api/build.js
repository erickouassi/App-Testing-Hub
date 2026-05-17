// api/build.js

import { updateAllFeeds } from "../update.js";

export default async function handler(req, res) {
  // ✅ Allow cross‑origin requests for local testing
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const apps = await updateAllFeeds();

    const output = {
      generatedAt: new Date().toISOString(),
      apps
    };

    const token = process.env.GITHUB_TOKEN;
    const repoOwner = "erickouassi";
    const repoName = "App-Testing-Hub";
    const filePath = "apps.json";

    // Get existing file SHA
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
          message: "Update apps.json",
          content: Buffer.from(JSON.stringify(output, null, 2)).toString("base64"),
          sha
        })
      }
    ).then(r => r.json());

    return res.status(200).json({ success: true, commitRes });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
