// api/apps.js

import path from "node:path";
import fs from "node:fs";

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "data", "apps.json");

  if (!fs.existsSync(filePath)) {
    return res.status(200).json({ apps: [] });
  }

  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return res.status(200).json(json);
}
