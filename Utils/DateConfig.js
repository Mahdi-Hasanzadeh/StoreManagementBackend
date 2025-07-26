export function getAfghanistanDateRange() {
  const now = new Date();

  // Format current date in Afghanistan time zone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kabul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // Get parts: "2025-07-26"
  const [year, month, day] = formatter.format(now).split("-").map(Number);

  // Create Afghanistan start of day in UTC (00:00 Asia/Kabul = 19:30 UTC of previous day)
  const startOfAfghanistanToday = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0)
  );
  const startOfAfghanistanTomorrow = new Date(
    Date.UTC(year, month - 1, day + 1, 0, 0, 0)
  );

  return {
    startOfTodayUTC: startOfAfghanistanToday,
    startOfTomorrowUTC: startOfAfghanistanTomorrow,
  };
}
