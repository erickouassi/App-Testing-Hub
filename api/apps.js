import { updateAllFeeds } from "/update.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const result = await updateAllFeeds();

    // ✅ Return clean structure: { generatedAt: "...", apps: [ ... ] }
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ /api/apps error:", err);
    return res.status(500).json({ generatedAt: null, apps: [] });
  }
}
