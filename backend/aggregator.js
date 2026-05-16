// backend/aggregator.js

import { fetchFeed } from "./fetcher.js";
import { parseXML, extractAppData } from "./rss-parser.js";

export async function processFeed(url) {
  try {
    const xmlText = await fetchFeed(url);
    const xml = parseXML(xmlText);
    const appData = extractAppData(xml);
    if (!appData) {
      console.warn(`No valid <channel>/<item> found for feed: ${url}`);
      return null;
    }
    return { feedUrl: url, ...appData };
  } catch (err) {
    console.error(`Error processing feed ${url}:`, err.message);
    return null;
  }
}

export async function updateAllFeeds(feedUrls) {
  const results = [];
  for (const url of feedUrls) {
    const appData = await processFeed(url);
    if (appData) results.push(appData);
  }
  return results;
}
