const STORAGE_KEY = "appUserState";

export function initLocalState() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
  }

  window.getAppLocalState = function (appId) {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return state[appId] || {
      saved: false,
      favorited: false,
      joined: false,
      contacted: false,
      inGroup: false
    };
  };
}

export function loadState() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
