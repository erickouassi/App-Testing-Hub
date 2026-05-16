import { loadState, saveState } from "./local-state.js";

export function toggleFlag(appId, flag) {
  const state = loadState();
  if (!state[appId]) state[appId] = {};
  state[appId][flag] = !state[appId][flag];
  saveState(state);
  return state[appId][flag];
}

export function getFlag(appId, flag) {
  const state = loadState();
  return state[appId]?.[flag] || false;
}
