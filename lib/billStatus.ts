export type AutoBillStatus = "Paid" | "Upcoming";

export type PayFrequency = "weekly" | "biweekly";

export type BillPayPeriod =
  | "before-next-payday"
  | "next-pay-period"
  | "later"
  | "unscheduled";

export type BillOccurrenceStatus = "Overdue" | "Upcoming";

export type PayPeriodPreferences = {
  payFrequency: PayFrequency;
  nextPayday: string;
  roundBillsForPlanning: boolean;
};

export type BillOccurrenceBill = {
  id?: string;
  name: string;
  amount: string | number;
  dueDate: string;
  paymentMethod?: string;
};

export type PaidBillOccurrences = Record<string, string>;

export type ActiveBillOccurrence = {
  billIdentity: string;
  occurrenceKey: string;
  dueDate: Date;
  dueDateKey: string;
  status: BillOccurrenceStatus;
};

export const preferencesStorageKey = "leftovr-preferences";

export const defaultPayPeriodPreferences: PayPeriodPreferences = {
  payFrequency: "biweekly",
  nextPayday: "",
  roundBillsForPlanning: true,
};

const millisecondsPerDay = 1000 * 60 * 60 * 24;

export function getPayPeriodLength(payFrequency: PayFrequency) {
  return payFrequency === "weekly" ? 7 : 14;
}

export function getCurrentPayPeriodStart(
  preferences: PayPeriodPreferences,
  referenceDate = new Date()
) {
  const nextPayday = parseLocalDate(preferences.nextPayday);

  if (!nextPayday) {
    return null;
  }

  const today = getStartOfDay(referenceDate);
  const payday = getStartOfDay(nextPayday);

  if (payday < today) {
    return null;
  }

  if (payday.getTime() === today.getTime()) {
    return today;
  }

  return addDays(
    payday,
    -getPayPeriodLength(preferences.payFrequency)
  );
}

export function getCurrentPayPeriodEnd(
  preferences: PayPeriodPreferences,
  referenceDate = new Date()
) {
  const periodStart = getCurrentPayPeriodStart(
    preferences,
    referenceDate
  );

  if (!periodStart) {
    return null;
  }

  return addDays(
    periodStart,
    getPayPeriodLength(preferences.payFrequency)
  );
}

export function isDateInCurrentPayPeriod(
  value: string | Date,
  preferences: PayPeriodPreferences,
  referenceDate = new Date()
) {
  const periodStart = getCurrentPayPeriodStart(
    preferences,
    referenceDate
  );
  const periodEnd = getCurrentPayPeriodEnd(
    preferences,
    referenceDate
  );

  if (!periodStart || !periodEnd) {
    return true;
  }

  const date =
    value instanceof Date
      ? new Date(value)
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return (
    date.getTime() >= periodStart.getTime() &&
    date.getTime() < periodEnd.getTime()
  );
}

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

export function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + amount);

  return getStartOfDay(nextDate);
}

export function parseLocalDate(value: string) {
  if (!value) {
    return null;
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const monthIndex = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);

    const parsedDate = new Date(year, monthIndex, day);

    if (
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === monthIndex &&
      parsedDate.getDate() === day
    ) {
      return parsedDate;
    }

    return null;
  }

  const parsedTimestamp = Date.parse(value);

  if (Number.isNaN(parsedTimestamp)) {
    return null;
  }

  return getStartOfDay(new Date(parsedTimestamp));
}

export function formatLocalDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function readPayPeriodPreferences(): PayPeriodPreferences {
  if (typeof window === "undefined") {
    return defaultPayPeriodPreferences;
  }

  const savedValue = window.localStorage.getItem(preferencesStorageKey);

  if (!savedValue) {
    return defaultPayPeriodPreferences;
  }

  try {
    const parsedValue = JSON.parse(
      savedValue
    ) as Partial<PayPeriodPreferences>;

    return {
      payFrequency:
        parsedValue.payFrequency === "weekly" ||
        parsedValue.payFrequency === "biweekly"
          ? parsedValue.payFrequency
          : defaultPayPeriodPreferences.payFrequency,
      nextPayday:
        typeof parsedValue.nextPayday === "string"
          ? parsedValue.nextPayday
          : defaultPayPeriodPreferences.nextPayday,
      roundBillsForPlanning:
        typeof parsedValue.roundBillsForPlanning === "boolean"
          ? parsedValue.roundBillsForPlanning
          : defaultPayPeriodPreferences.roundBillsForPlanning,
    };
  } catch {
    return defaultPayPeriodPreferences;
  }
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function buildDueDate(year: number, monthIndex: number, dueDay: number) {
  const normalizedDate = new Date(year, monthIndex, 1);
  const normalizedYear = normalizedDate.getFullYear();
  const normalizedMonth = normalizedDate.getMonth();
  const daysInMonth = getDaysInMonth(normalizedYear, normalizedMonth);
  const safeDay = Math.min(dueDay, daysInMonth);

  return new Date(normalizedYear, normalizedMonth, safeDay);
}

export function getNextBillDueDate(
  dueDate: string,
  referenceDate = new Date()
) {
  const dueDay = getDueDayFromDate(dueDate);

  if (!dueDay) {
    return null;
  }

  const today = getStartOfDay(referenceDate);

  let nextDueDate = buildDueDate(
    today.getFullYear(),
    today.getMonth(),
    dueDay
  );

  if (nextDueDate < today) {
    nextDueDate = buildDueDate(
      today.getFullYear(),
      today.getMonth() + 1,
      dueDay
    );
  }

  return nextDueDate;
}

export function getCurrentMonthBillDueDate(
  dueDate: string,
  referenceDate = new Date()
) {
  const dueDay = getDueDayFromDate(dueDate);

  if (!dueDay) {
    return null;
  }

  const referenceDay = getStartOfDay(referenceDate);

  return buildDueDate(
    referenceDay.getFullYear(),
    referenceDay.getMonth(),
    dueDay
  );
}

export function getFollowingBillDueDate(
  dueDate: string,
  occurrenceDate: Date
) {
  const dueDay = getDueDayFromDate(dueDate);

  if (!dueDay) {
    return null;
  }

  const currentOccurrence = getStartOfDay(occurrenceDate);

  return buildDueDate(
    currentOccurrence.getFullYear(),
    currentOccurrence.getMonth() + 1,
    dueDay
  );
}

export function getLegacyBillIdentity(
  bill: BillOccurrenceBill,
) {
  return [
    bill.name.trim().toLowerCase(),
    String(bill.amount).trim(),
    bill.dueDate.trim().toLowerCase(),
    (bill.paymentMethod ?? "").trim().toLowerCase(),
  ].join("|");
}

export function getBillIdentity(
  bill: BillOccurrenceBill,
) {
  const persistentId = bill.id?.trim();

  return persistentId || getLegacyBillIdentity(bill);
}

export function getBillOccurrenceKey(
  bill: BillOccurrenceBill,
  occurrenceDate: Date
) {
  return `${getBillIdentity(bill)}|${formatLocalDateKey(occurrenceDate)}`;
}

function resolveFirstUnpaidBillOccurrence(
  bill: BillOccurrenceBill,
  startingDate: Date,
  paidOccurrences: PaidBillOccurrences
) {
  let occurrenceDate = getStartOfDay(startingDate);
  let occurrenceKey = getBillOccurrenceKey(bill, occurrenceDate);
  let advancedOccurrences = 0;

  while (
    paidOccurrences[occurrenceKey] &&
    advancedOccurrences < 240
  ) {
    const followingOccurrence = getFollowingBillDueDate(
      bill.dueDate,
      occurrenceDate
    );

    if (!followingOccurrence) {
      return null;
    }

    occurrenceDate = followingOccurrence;
    occurrenceKey = getBillOccurrenceKey(bill, occurrenceDate);
    advancedOccurrences += 1;
  }

  return {
    occurrenceDate,
    occurrenceKey,
  };
}

export function getActiveBillOccurrence(
  bill: BillOccurrenceBill,
  savedOccurrenceDate: string | undefined,
  paidOccurrences: PaidBillOccurrences,
  referenceDate = new Date()
): ActiveBillOccurrence | null {
  const savedOccurrence = parseLocalDate(savedOccurrenceDate ?? "");

  // A saved occurrence belongs to an already tracked bill and remains
  // authoritative, including when it has genuinely become overdue.
  // A bill without saved tracking begins with its next real due date so
  // adding an existing monthly bill never invents a past-due occurrence.
  const startingOccurrence =
    savedOccurrence ??
    getNextBillDueDate(bill.dueDate, referenceDate);

  if (!startingOccurrence) {
    return null;
  }

  const activeOccurrence = resolveFirstUnpaidBillOccurrence(
    bill,
    startingOccurrence,
    paidOccurrences
  );

  if (!activeOccurrence) {
    return null;
  }

  const today = getStartOfDay(referenceDate);

  return {
    billIdentity: getBillIdentity(bill),
    occurrenceKey: activeOccurrence.occurrenceKey,
    dueDate: activeOccurrence.occurrenceDate,
    dueDateKey: formatLocalDateKey(
      activeOccurrence.occurrenceDate
    ),
    status:
      activeOccurrence.occurrenceDate < today
        ? "Overdue"
        : "Upcoming",
  };
}

export function getDaysUntilDate(
  targetDate: Date,
  referenceDate = new Date()
) {
  const targetStart = getStartOfDay(targetDate);
  const referenceStart = getStartOfDay(referenceDate);

  return Math.round(
    (targetStart.getTime() - referenceStart.getTime()) /
      millisecondsPerDay
  );
}

export function getBillOccurrencePayPeriod(
  occurrenceDate: Date,
  preferences: PayPeriodPreferences,
  referenceDate = new Date()
): BillPayPeriod {
  const nextPayday = parseLocalDate(preferences.nextPayday);

  if (!nextPayday) {
    return "unscheduled";
  }

  const today = getStartOfDay(referenceDate);
  const payday = getStartOfDay(nextPayday);
  const dueDate = getStartOfDay(occurrenceDate);

  if (payday < today) {
    return "unscheduled";
  }

  if (dueDate < payday) {
    return "before-next-payday";
  }

  const followingPayday = addDays(
    payday,
    getPayPeriodLength(preferences.payFrequency)
  );

  if (dueDate >= payday && dueDate < followingPayday) {
    return "next-pay-period";
  }

  return "later";
}

export function getBillPayPeriod(
  dueDate: string,
  preferences: PayPeriodPreferences,
  referenceDate = new Date()
): BillPayPeriod {
  const nextDueDate = getNextBillDueDate(dueDate, referenceDate);

  if (!nextDueDate) {
    return "unscheduled";
  }

  return getBillOccurrencePayPeriod(
    nextDueDate,
    preferences,
    referenceDate
  );
}

export function getPlanningAmount(
  amount: string | number,
  roundBillsForPlanning: boolean
) {
  const numericAmount =
    typeof amount === "number" ? amount : Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return 0;
  }

  return roundBillsForPlanning
    ? Math.ceil(numericAmount)
    : numericAmount;
}

export function sortBillsByNextDueDate<
  T extends { name: string; dueDate: string },
>(bills: T[], referenceDate = new Date()) {
  return [...bills].sort((firstBill, secondBill) => {
    const firstDueDate = getNextBillDueDate(
      firstBill.dueDate,
      referenceDate
    );
    const secondDueDate = getNextBillDueDate(
      secondBill.dueDate,
      referenceDate
    );

    if (firstDueDate && secondDueDate) {
      return firstDueDate.getTime() - secondDueDate.getTime();
    }

    if (firstDueDate && !secondDueDate) {
      return -1;
    }

    if (!firstDueDate && secondDueDate) {
      return 1;
    }

    return firstBill.name.localeCompare(secondBill.name);
  });
}

export function sortBillsByDueDay<
  T extends { name: string; dueDate: string },
>(bills: T[]) {
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

    return firstBill.bill.name.localeCompare(
      secondBill.bill.name
    );
  });
}

export function getAutoBillStatus(
  dueDate: string,
  windowDays = 7,
  referenceDate = new Date()
): AutoBillStatus {
  const nextDueDate = getNextBillDueDate(dueDate, referenceDate);

  if (!nextDueDate) {
    return "Paid";
  }

  const daysUntilDue = getDaysUntilDate(
    nextDueDate,
    referenceDate
  );

  if (daysUntilDue >= 0 && daysUntilDue <= windowDays) {
    return "Upcoming";
  }

  return "Paid";
}