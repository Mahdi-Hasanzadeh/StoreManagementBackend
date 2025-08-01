// export function getAfghanistanDateRange() {
//   const now = new Date();

//   // Format current date in Afghanistan time zone
//   const formatter = new Intl.DateTimeFormat("en-CA", {
//     timeZone: "Asia/Kabul",
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   });

//   // Get parts: "2025-07-26"
//   const [year, month, day] = formatter.format(now).split("-").map(Number);

//   // Create Afghanistan start of day in UTC (00:00 Asia/Kabul = 19:30 UTC of previous day)
//   const startOfAfghanistanToday = new Date(
//     Date.UTC(year, month - 1, day, 0, 0, 0)
//   );
//   const startOfAfghanistanTomorrow = new Date(
//     Date.UTC(year, month - 1, day + 1, 0, 0, 0)
//   );

//   return {
//     startOfTodayUTC: startOfAfghanistanToday,
//     startOfTomorrowUTC: startOfAfghanistanTomorrow,
//   };
// }

export function getAfghanistanDateRange() {
  const now = new Date();

  // Format current date in Asia/Kabul time zone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kabul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const [year, month, day] = formatter.format(now).split("-").map(Number);

  // Correct: Afghanistan is UTC+4:30, so subtract 4h30m to get UTC midnight
  const startOfTodayUTC = new Date(Date.UTC(year, month - 1, day, -4, -30, 0));
  const startOfTomorrowUTC = new Date(
    Date.UTC(year, month - 1, day + 1, -4, -30, 0)
  );

  // Start of 7 days ago (start of this week)
  const startOfWeekUTC = new Date(
    Date.UTC(year, month - 1, day - 6, -4, -30, 0)
  );

  // Start of 30 days ago (start of this month)
  const startOfMonthUTC = new Date(
    Date.UTC(year, month - 1, day - 29, -4, -30, 0)
  );

  return {
    startOfTodayUTC,
    startOfTomorrowUTC,
    startOfWeekUTC,
    startOfMonthUTC,
    nowUTC: new Date(),
  };
}

export function getAfghanistanDayRange(fromISO, toISO) {
  const AFG_OFFSET_MS = 4.5 * 60 * 60 * 1000; // 4.5 hours in milliseconds

  // Parse input ISO strings as UTC Date objects
  const fromUTC = new Date(fromISO);
  const toUTC = new Date(toISO);

  // Convert input UTC to Afghanistan local time by adding offset
  const fromAFT = new Date(fromUTC.getTime() + AFG_OFFSET_MS);
  const toAFT = new Date(toUTC.getTime() + AFG_OFFSET_MS);

  // Extract local Afghan date string YYYY-MM-DD
  const fromDateStr = fromAFT.toISOString().split("T")[0];
  const toDateStr = toAFT.toISOString().split("T")[0];

  // Calculate UTC time for start of local Afghan day (00:00 AFT)
  // To get UTC, subtract offset from local midnight (since AFT = UTC + offset)
  const startDate = new Date(
    new Date(fromDateStr + "T00:00:00").getTime() - AFG_OFFSET_MS
  );

  // Calculate UTC time for end of local Afghan day (next day 00:00 AFT)
  // Add 1 day (24h) to local midnight, then subtract offset to get UTC
  const endDate = new Date(
    new Date(toDateStr + "T00:00:00").getTime() +
      24 * 60 * 60 * 1000 -
      AFG_OFFSET_MS
  );

  // Now startDate and endDate are UTC dates representing full Afghan day range

  return { startDate, endDate };
}
