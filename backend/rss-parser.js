import { countDaysSince, calculateDaysLeft } from "./date-utils.js";
import { autoStatus } from "./status-logic.js";

function textOrNull(parent, selector) {
  const el = parent.querySelector(selector);
  return el ? el.textContent.trim() : null;
}

export function parseXML(xmlString) {
  const parser = new DOMParser();
  return parser.parseFromString(xmlString, "application/xml");
}

export function extractAppData(xml) {
  const channel = xml.querySelector("channel");
  const item = xml.querySelector("item");
  if (!channel || !item) return null;

  const pubDate = textOrNull(item, "pubDate");
  const testingDuration = parseInt(
    textOrNull(item, "app\\:testingDuration") || "0",
    10
  );

  const daysInTesting = countDaysSince(pubDate);
  const daysLeft = calculateDaysLeft(daysInTesting, testingDuration);
  const developerStatus = textOrNull(item, "app\\:status") || "";
  const finalStatus = autoStatus(daysInTesting, daysLeft, developerStatus);

  const devNode = channel.querySelector("dev\\:developer");

  return {
    feedTitle: textOrNull(channel, "title"),
    feedLink: textOrNull(channel, "link"),
    feedDescription: textOrNull(channel, "description"),

    developer: devNode
      ? {
          name: textOrNull(devNode, "dev\\:name"),
          email: textOrNull(devNode, "dev\\:email"),
          website: textOrNull(devNode, "dev\\:website"),
          social: {
            reddit: textOrNull(devNode, "social\\:links > social\\:reddit"),
            facebook: textOrNull(devNode, "social\\:links > social\\:facebook"),
            github: textOrNull(devNode, "social\\:links > social\\:github"),
            discord: textOrNull(devNode, "social\\:links > social\\:discord"),
            twitter: textOrNull(devNode, "social\\:links > social\\:twitter"),
            youtube: textOrNull(devNode, "social\\:links > social\\:youtube")
          }
        }
      : null,

    title: textOrNull(item, "title"),
    guid: textOrNull(item, "guid"),
    platform: textOrNull(item, "app\\:platform"),
    version: textOrNull(item, "app\\:version"),
    isGame: textOrNull(item, "app\\:isGame") === "true",

    languages: Array.from(
      item.querySelectorAll("app\\:languages > app\\:language")
    ).map(el => el.textContent.trim()),

    countries: Array.from(
      item.querySelectorAll("app\\:countries > app\\:country")
    ).map(el => el.textContent.trim()),

    requiresAccount: textOrNull(item, "app\\:requiresAccount") === "true",

    testLink: textOrNull(item, "app\\:testLink"),
    groupLink: textOrNull(item, "app\\:groupLink"),

    description: textOrNull(item, "description"),

    requirements: Array.from(
      item.querySelectorAll("app\\:requirements > app\\:requirement")
    ).map(el => el.textContent.trim()),

    pubDate,
    testingDuration: isNaN(testingDuration) ? null : testingDuration,
    daysInTesting,
    daysLeft,
    status: finalStatus
  };
}
