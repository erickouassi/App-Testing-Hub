export function renderFilters(onChange) {
  const container = document.getElementById("filters");

  container.innerHTML = `
    <div class="filters-title">
      Filters
      <span>Refine apps on this device only</span>
    </div>

    <div class="filter-group">
      <div class="filter-label">Quick</div>
      <div class="filter-chips">
        <button class="filter-chip" data-filter="saved">Saved</button>
        <button class="filter-chip" data-filter="joined">Joined</button>
        <button class="filter-chip" data-filter="favorited">Favorited</button>
      </div>
    </div>

    <div class="filter-group">
      <div class="filter-label">Status</div>
      <div class="filter-chips">
        <button class="filter-chip" data-status="active-testing">Active</button>
        <button class="filter-chip" data-status="testing-completed">Completed</button>
        <button class="filter-chip" data-status="expired">Expired</button>
      </div>
    </div>
  `;

  const quickChips = container.querySelectorAll("[data-filter]");
  const statusChips = container.querySelectorAll("[data-status]");

  const state = {
    saved: false,
    joined: false,
    favorited: false,
    status: null
  };

  quickChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const key = chip.dataset.filter;
      state[key] = !state[key];
      chip.classList.toggle("active", state[key]);
      onChange({ ...state });
    });
  });

  statusChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const value = chip.dataset.status;
      const isActive = chip.classList.contains("active");

      statusChips.forEach(c => c.classList.remove("active"));
      state.status = isActive ? null : value;
      if (!isActive) chip.classList.add("active");

      onChange({ ...state });
    });
  });
}

export function applyFilters(apps, filters) {
  return apps.filter(app => {
    if (filters.status && app.status !== filters.status) return false;

    const localState = window.getAppLocalState(app.guid);

    if (filters.saved && !localState.saved) return false;
    if (filters.joined && !localState.joined) return false;
    if (filters.favorited && !localState.favorited) return false;

    return true;
  });
}
