export async function updateAllFeeds() {
  const feeds = [
    "https://raw.githubusercontent.com/XP-DEVOTION/playlist-Daily-Rosary/refs/heads/main/appfeed.xml"
  ];

  const apps = [];

  for (const url of feeds) {
    const xml = await fetch(url).then(r => r.text());
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");

    const item = doc.querySelector("item");

    apps.push({
      title: item.querySelector("title")?.textContent || "Untitled",
      description: item.querySelector("description")?.textContent || "",
      platform: item.querySelector("app\\:platform")?.textContent || "",
      version: item.querySelector("app\\:version")?.textContent || ""
    });
  }

  return apps;
}
