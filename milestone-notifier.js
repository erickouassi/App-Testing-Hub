/**
 * 🔔 milestone-notifier.js (Personalized Pseudo-Random Edition)
 * 100% Independent & Pluggable Notification & Tip Module
 * Displays a unique random tip per user that stays locked for the entire day.
 * Links safely at the bottom of your HTML pages: <script src="milestone-notifier.js"></script>
 */

(function () {
  console.log("🔔 [MilestoneNotifier] Personalized random tip engine activated.");

  const STORAGE_KEY = "testingHubState";
  const triggeredMilestones = { joined: {}, likes: {}, completed: {} };
  const TIPS_JSON_URL = "pro-tips.json"; 

  let cachedProTips = [
    "Explore user interface components freely and try rotating your device screen layout layout orientation context!"
  ];

  /* -------------------------------------------------------------------------
     🛠️ CRITICAL FIX: AUTOMATED STATE SANITIZATION BLOCK
     Safeguards app.js by auto-initializing missing filter/tracking keys
     ------------------------------------------------------------------------- */
  (function sanitizeAndVerifyState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let state = {};
      
      try {
        state = raw ? JSON.parse(raw) : {};
      } catch {
        state = {};
      }

      // Ensure all standard baseline buckets are initialized as objects
      const requiredCollections = ["favorites", "likes", "joined", "completed", "saved", "daily-rosary"];
      let stateUpdated = false;

      requiredCollections.forEach(collection => {
        if (!state[collection] || typeof state[collection] !== "object") {
          state[collection] = {};
          stateUpdated = true;
          console.log(`🛠️ [MilestoneNotifier] Initialized missing state collection: '${collection}'`);
        }
      });

      // Global safety net fallback hook logic pattern
      if (stateUpdated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) {
      console.error("⚠️ [MilestoneNotifier] Core state sanitization failed:", e);
    }
  })();

  /**
   * 🆔 Tester Identity Check
   * Finds or establishes a persistent, unique tester fingerprint inside localStorage
   */
  function getOrCreateTesterId(stateObj) {
    if (!stateObj.testerId) {
      // Generate a quick pseudo-random structural key phrase
      stateObj.testerId = "tester-" + Math.floor(Math.random() * 1000000);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
    }
    return stateObj.testerId;
  }

  /**
   * 🧼 String Hash Function
   * Converts any text string into a reliable mathematical integer index split
   */
  function hashStringToInt(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to a 32-bit signed integer parameter
    }
    return Math.abs(hash);
  }

  /**
   * Asynchronously fetches the tips array from your external json asset file
   */
  async function loadExternalProTips() {
    try {
      const res = await fetch(`${TIPS_JSON_URL}?v=${Date.now()}`); 
      if (!res.ok) throw new Error(`HTTP error status: ${res.status}`);
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
        cachedProTips = data;
        console.log("🎯 [MilestoneNotifier] Loaded updated structured JSON file.");
      }
    } catch (e) {
      console.warn("⚠️ [MilestoneNotifier] Using offline local PWA fallbacks:", e.message);
    }
  }

  /**
   * 🎲 Calculates a persistent random tip selection unique to this user today
   */
  function getPersonalizedDailyTip() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || "{}";
      const state = JSON.parse(raw);
      const testerId = getOrCreateTesterId(state);

      // Generate a dynamic string key bound to the date and this specific user ID
      const todayStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const deterministicSeed = `${todayStr}-${testerId}`;

      // Convert the seed into a reliable index boundary math wrap
      const targetHashValue = hashStringToInt(deterministicSeed);

      // 🛠️ FIX: Flatten the structured category JSON into a simple list of tip strings
      let flatTipsList = [];
      if (cachedProTips[0] && typeof cachedProTips[0] === 'object' && cachedProTips[0].tips) {
        // Extract strings from the new layout structure
        flatTipsList = cachedProTips.flatMap(categoryObj => categoryObj.tips || []);
      } else {
        // Fallback to traditional flat array behavior if needed
        flatTipsList = cachedProTips;
      }

      if (flatTipsList.length === 0) return "Keep testing and helping indie developers scale structural layouts!";

      const tipIndex = targetHashValue % flatTipsList.length;
      return flatTipsList[tipIndex];
    } catch (err) {
      // Emergency absolute fallback safety calculation index
      return typeof cachedProTips[0] === 'object' ? "Explore user interface components freely!" : cachedProTips[0];
    }
  }

  /**
   * Injects the personalized card components safely into the placeholder zone
   */
  function injectDailyTipUI() {
    const targetContainer = document.getElementById("daily-pro-tip-container");
    if (!targetContainer) return; 

    const dailyTip = getPersonalizedDailyTip();

    targetContainer.innerHTML = `
      <div class="pro-tip-card" style="background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 18px 0; font-family: system-ui, sans-serif;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 1.2rem;">💡</span>
          <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #111827;">Your Daily Tester Inspiration</h3>
        </div>
        <p style="margin: 0; font-size: 0.88rem; color: #4b5563; line-height: 1.45;">
          ${dailyTip}
        </p>
      </div>
    `;
  }

  /**
   * Native Browser Push Notifications Alert Pipeline
   */
  function fireNativeAlert(title, bodyText, options = {}) {
    if (!("Notification" in window)) return;
    const notificationOptions = { body: bodyText, icon: "/img/favicon.svg", ...options };

    if (Notification.permission === "granted") {
      new Notification(title, notificationOptions);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") new Notification(title, notificationOptions);
      });
    }
  }

  /**
   * Background state milestone tracking inspection routines
   */
  function processStateAnalysis() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      
      const joinedApps = state.joined ? Object.keys(state.joined).filter(k => state.joined[k]) : [];
      const likedApps = state.likes ? Object.keys(state.likes).filter(k => state.likes[k]) : [];
      const completedApps = state.completed ? Object.keys(state.completed).filter(k => state.completed[k]) : [];

      if (joinedApps.length === 1 && !triggeredMilestones.joined[1]) {
        triggeredMilestones.joined[1] = true;
        fireNativeAlert("🤝 Track Joined!", "Awesome! You've officially stepped up to support a fellow developer.");
      }

      if (likedApps.length > 0 && likedApps.length % 5 === 0 && !triggeredMilestones.likes[likedApps.length]) {
        triggeredMilestones.likes[likedApps.length] = true;
        fireNativeAlert("💖 Community Champion", `You've liked ${likedApps.length} apps on the hub!`);
      }

      completedApps.forEach(slug => {
        if (!triggeredMilestones.completed[slug]) {
          triggeredMilestones.completed[slug] = true;
          fireNativeAlert("🏆 Track Completed!", "You officially marked a 14-day production clearance testing run as complete!");
        }
      });
    } catch (e) {
      console.error("⚠️ State analysis error:", e);
    }
  }

  async function initializeModule() {
    await loadExternalProTips();
    processStateAnalysis();
    injectDailyTipUI();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    initializeModule();
  } else {
    window.addEventListener("DOMContentLoaded", initializeModule);
  }

  // Intercept local storage saves cleanly under the hood
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);
    if (key === STORAGE_KEY) {
      // Intercept state mutation filters safely
      try {
        const parsed = JSON.parse(value);
        if (parsed && !parsed["daily-rosary"]) {
          parsed["daily-rosary"] = {};
          arguments[1] = JSON.stringify(parsed);
        }
      } catch {}
      setTimeout(processStateAnalysis, 50);
    }
  };

  window.MilestoneNotifier = {
    emit: function (title, message, options = {}) {
      fireNativeAlert(title, message, options);
    },
    refreshTipDisplay: function() {
      injectDailyTipUI();
    }
  };

})();