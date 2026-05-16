export function getStatusBadgeClass(status) {
  switch (status) {
    case "active-testing":
    case "open-testing":
      return "badge-status-active";
    case "testing-completed":
      return "badge-status-completed";
    case "expired":
      return "badge-status-expired";
    case "not-started":
      return "badge-status-not-started";
    default:
      return "";
  }
}

export function getStatusLabel(status) {
  switch (status) {
    case "active-testing":
    case "open-testing":
      return "Active";
    case "testing-completed":
      return "Completed";
    case "expired":
      return "Expired";
    case "not-started":
      return "Not started";
    case "closed":
      return "Closed";
    default:
      return "Unknown";
  }
}
