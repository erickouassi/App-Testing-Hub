import { parseStringPromise } from "xml2js";

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

    // Convert XML → JS object
    let json;
    try {
      json = await parseStringPromise(xml, {
        explicitArray: false,
        mergeAttrs: true,
        tagNameProcessors: [name => name.replace("app:", "").replace("dev:", "").replace("social:", "")]
      });
    } catch (err) {
      console.log("❌ XML parse error:", err);
      continue;
    }

    console.log("🟡 Parsed JSON:", JSON.stringify(json).substring(0, 300));

    // Navigate to rss.channel.item
    const item = json?.rss?.channel?.item;
    if (!item) {
      console.log("❌ No <item> found in feed");
      continue;
    }

    const title = item.title || "";
    const description = item.description || "";
    const platform = item.platform || "";
    const version = item.version || "";

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