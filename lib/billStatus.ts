export type AutoBillStatus = "Paid" | "Upcoming";

export function getDueDayFromDate(value: string) {
  const match = value.match(/\d+/);

  if (!match) {
    return null;
  }

  const day = Number(match[0]);

  if (Number.isNaN(day) || day < 1 || day > 31) {
    return null;
  }

  return day;
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function buildDueDate(year: number, monthIndex: number, dueDay: number) {
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const safeDay = Math.min(dueDay, daysInMonth);

  return new Date(year, monthIndex, safeDay);
}

export function getAutoBillStatus(dueDate: string): AutoBillStatus {
  const dueDay = getDueDayFromDate(dueDate);

  if (!dueDay) {
    return "Paid";
  }

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  let nextDueDate = buildDueDate(
    todayStart.getFullYear(),
    todayStart.getMonth(),
    dueDay
  );

  if (nextDueDate <= todayStart) {
    nextDueDate = buildDueDate(
      todayStart.getFullYear(),
      todayStart.getMonth() + 1,
      dueDay
    );
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = Math.round(
    (nextDueDate.getTime() - todayStart.getTime()) / millisecondsPerDay
  );

  if (daysUntilDue >= 1 && daysUntilDue <= 7) {
    return "Upcoming";
  }

  return "Paid";
}