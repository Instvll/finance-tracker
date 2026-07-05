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

export function sortBillsByDueDay<T extends { name: string; dueDate: string }>(
  bills: T[]
) {
  return [...bills].sort((firstBill, secondBill) => {
    const firstDueDay = getDueDayFromDate(firstBill.dueDate);
    const secondDueDay = getDueDayFromDate(secondBill.dueDate);

    if (firstDueDay && secondDueDay) {
      return firstDueDay - secondDueDay;
    }

    if (firstDueDay && !secondDueDay) {
      return -1;
    }

    if (!firstDueDay && secondDueDay) {
      return 1;
    }

    return firstBill.name.localeCompare(secondBill.name);
  });
}

export function sortIndexedBillsByDueDay<
  T extends { name: string; dueDate: string },
>(bills: { bill: T; index: number }[]) {
  return [...bills].sort((firstBill, secondBill) => {
    const firstDueDay = getDueDayFromDate(firstBill.bill.dueDate);
    const secondDueDay = getDueDayFromDate(secondBill.bill.dueDate);

    if (firstDueDay && secondDueDay) {
      return firstDueDay - secondDueDay;
    }

    if (firstDueDay && !secondDueDay) {
      return -1;
    }

    if (!firstDueDay && secondDueDay) {
      return 1;
    }

    return firstBill.bill.name.localeCompare(secondBill.bill.name);
  });
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