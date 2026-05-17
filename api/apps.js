export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const url =
      "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/apps.json";

    const response = await fetch(url);
    const json = await response.json();

    return res.status(200).json(json);
  } catch (err) {
    console.log("❌ /api/apps error:", err);
    return res.status(200).json({ generatedAt: null, apps: [] });
  }
}
