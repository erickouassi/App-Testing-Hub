export function countDaysSince(dateString) {
  if (!dateString) return 0;

  const start = new Date(dateString);
  const today = new Date();

  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diff = today - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function calculateDaysLeft(daysInTesting, testingDuration) {
  if (!testingDuration || testingDuration <= 0) return null;
  return testingDuration - daysInTesting;
}
