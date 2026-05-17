export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const url =
      "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/apps.json";

    const response = await fetch(url);
    const json = await response.json();

    return res.status(200).json(json);
  } catch (err) {
    return res.status(200).json({ apps: [] });
  }
}
