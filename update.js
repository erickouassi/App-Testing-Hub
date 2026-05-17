export async function updateAllFeeds() {
  console.log("🚀 updateAllFeeds() started");

  const feeds = [
   "https://raw.githubusercontent.com/XP-DEVOTION/playlist-Daily-Rosary/refs/heads/main/appfeed.xml"
  ];

  console.log("📡 Feeds to fetch:", feeds);

  const apps = [];

  for (const url of feeds) {
    console.log("🔵 Fetching:", url);

    const xml = await fetch(url).then(r => r.text());

    console.log("🟣 XML length:", xml.length);
    console.log("🟣 First 200 chars of XML:\n", xml.substring(0, 200));

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");

    const item = doc.querySelector("item");
    if (!item) {
      console.log("❌ No <item> found");
      continue;
    }

    const title = item.querySelector("title")?.textContent || "";
    const description = item.querySelector("description")?.textContent || "";
    const platform = item.querySelector("app\\:platform")?.textContent || "";
    const version = item.querySelector("app\\:version")?.textContent || "";

    console.log("🟢 Extracted:", { title, description, platform, version });

    apps.push({ title, description, platform, version });
  }

  console.log("✅ Final apps:", apps);
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