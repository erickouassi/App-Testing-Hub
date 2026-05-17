// api/apps.js

export default async function handler(req, res) {
  try {
    const url =
      "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/data/apps.json";

    const response = await fetch(url);
    const json = await response.json();

    return res.status(200).json(json);
  } catch (err) {
    return res.status(200).json({ apps: [] });
  }
}
