
// update.js

export async function updateAllFeeds() {
  const feeds = [
    "https://raw.githubusercontent.com/XP-DEVOTION/playlist-Daily-Rosary/refs/heads/main/appfeed.xml"
  ];

  const apps = [];

  for (const url of feeds) {
    console.log("🔵 Fetching feed:", url);

    try {
      const xml = await fetch(url).then(r => r.text());
      console.log("🟣 Raw XML received:\n", xml);

      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "application/xml");

      console.log("🟡 Parsed XML Document:", doc);

      const item = doc.querySelector("item");
      if (!item) {
        console.log("❌ No <item> found in feed:", url);
        continue;
      }

      const title = item.querySelector("title")?.textContent || "";
      const description = item.querySelector("description")?.textContent || "";
      const platform = item.querySelector("app\\:platform")?.textContent || "";
      const version = item.querySelector("app\\:version")?.textContent || "";

      console.log("🟢 Extracted fields:", {
        title,
        description,
        platform,
        version
      });

      apps.push({
        title,
        description,
        platform,
        version
      });

    } catch (err) {
      console.log("🔥 Error processing feed:", url, err);
    }
  }

  console.log("✅ Final apps array:", apps);
  return apps;
}



/*export async function updateAllFeeds() {
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
*/