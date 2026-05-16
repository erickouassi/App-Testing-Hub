export const FALLBACK_STATUS = {
  NOT_STARTED: "not-started",
  ACTIVE: "active-testing",
  COMPLETED: "testing-completed",
  EXPIRED: "expired",
  CLOSED: "closed"
};

export function autoStatus(daysInTesting, daysLeft, developerStatus) {
  if (developerStatus && developerStatus.trim() !== "") {
    return developerStatus.trim();
  }

  if (daysInTesting < 0) return FALLBACK_STATUS.NOT_STARTED;
  if (daysLeft === null) return daysInTesting >= 0 ? FALLBACK_STATUS.ACTIVE : FALLBACK_STATUS.NOT_STARTED;
  if (daysLeft > 0) return FALLBACK_STATUS.ACTIVE;
  if (daysLeft === 0) return FALLBACK_STATUS.COMPLETED;
  if (daysLeft < 0) return FALLBACK_STATUS.EXPIRED;

  return FALLBACK_STATUS.CLOSED;
}
