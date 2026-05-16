import { getStatusBadgeClass, getStatusLabel } from "./badges.js";
import { toggleFlag, getFlag } from "../state/state-helpers.js";

export function renderAppCard(app) {
  const card = document.createElement("article");
  card.className = "app-card";
  card.dataset.appId = app.guid;

  const statusClass = getStatusBadgeClass(app.status);
  const statusLabel = getStatusLabel(app.status);

  const isSaved = getFlag(app.guid, "saved");
  const isFav = getFlag(app.guid, "favorited");
  const isJoined = getFlag(app.guid, "joined");
  const isContacted = getFlag(app.guid, "contacted");
  const inGroup = getFlag(app.guid, "inGroup");

  card.innerHTML = `
    <div class="app-header">
      <div>
        <div class="app-title">${app.title || "Untitled App"}</div>
        <div class="app-meta">
          ${app.platform || "Unknown"} • v${app.version || "?"}
        </div>
        <div class="app-badges">
          <span class="badge ${statusClass}">${statusLabel}</span>
          ${app.isGame ? `<span class="badge">Game</span>` : ""}
          ${app.requiresAccount ? `<span class="badge">Account Required</span>` : ""}
        </div>
      </div>
    </div>

    <div class="app-description">
      ${app.description || "No description provided."}
    </div>

    <div class="app-footer">
      <div class="app-timing">
        ${app.daysInTesting ?? 0} days in •
        ${app.daysLeft != null ? `${app.daysLeft} days left` : "No duration"}
      </div>
      <div class="app-actions">
        <button class="btn btn-toggle ${isSaved ? "active" : ""}" data-action="saved">Save</button>
        <button class="btn btn-toggle ${isFav ? "active" : ""}" data-action="favorited">★</button>
      </div>
    </div>

    <div class="app-footer">
      <div class="app-actions">
        <a href="${app.testLink || "#"}" target="_blank" class="btn btn-primary">Test</a>
        ${
          app.groupLink
            ? `<a href="${app.groupLink}" target="_blank" class="btn btn-ghost">Group</a>`
            : ""
        }
      </div>
      <div class="app-actions">
        <button class="btn btn-toggle ${isJoined ? "active" : ""}" data-action="joined">Joined</button>
        <button class="btn btn-toggle ${isContacted ? "active" : ""}" data-action="contacted">Contacted</button>
        <button class="btn btn-toggle ${inGroup ? "active" : ""}" data-action="inGroup">In Group</button>
      </div>
    </div>
  `;

  card.querySelectorAll(".btn-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const flag = btn.dataset.action;
      const active = toggleFlag(app.guid, flag);
      btn.classList.toggle("active", active);
    });
  });

  return card;
}
