export type BillStatus = "Paid" | "Upcoming" | "Due Soon" | "Overdue";

export type CardStatus = "Good" | "Watch" | "Pay Down";

export type MoneyNote = {
  title: string;
  category: string;
  text: string;
};

export type Bill = {
  name: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  paymentMethod: string;
};

export type CreditCard = {
  name: string;
  balance: number;
  limit: number;
  minimumPayment: number;
  dueDate: string;
  status: CardStatus;
};

export type Goal = {
  name: string;
  target: number;
  saved: number;
  note: string;
};

export type Transaction = {
  name: string;
  category: string;
  amount: number;
  date: string;
  account: string;
};

export type Resource = {
  title: string;
  category: string;
  description: string;
  steps: string[];
  examples?: string[];
};

export const financeSummary = {
  checkingBalance: 1588.99,
  monthlyIncome: 2000,
  nextPayday: "TBD",
  savingsBalance: 0,
};

export const bills: Bill[] = [
  {
    name: "Car Payment",
    amount: 377.91,
    dueDate: "TBD",
    status: "Upcoming",
    paymentMethod: "Checking",
  },
  {
    name: "Insurance",
    amount: 150.98,
    dueDate: "TBD",
    status: "Upcoming",
    paymentMethod: "Checking",
  },
  {
    name: "Storage Unit",
    amount: 86.87,
    dueDate: "TBD",
    status: "Upcoming",
    paymentMethod: "Credit Card",
  },
  {
    name: "Phone",
    amount: 47.44,
    dueDate: "TBD",
    status: "Upcoming",
    paymentMethod: "Checking",
  },
  {
    name: "Spotify",
    amount: 13.93,
    dueDate: "TBD",
    status: "Upcoming",
    paymentMethod: "Checking",
  },
  {
    name: "Snapchat+",
    amount: 4.28,
    dueDate: "TBD",
    status: "Upcoming",
    paymentMethod: "Checking",
  },
];

export const creditCards: CreditCard[] = [
  {
    name: "Amex",
    balance: 0,
    limit: 1000,
    minimumPayment: 0,
    dueDate: "TBD",
    status: "Good",
  },
  {
    name: "Freedom",
    balance: 29.21,
    limit: 1000,
    minimumPayment: 0,
    dueDate: "TBD",
    status: "Good",
  },
];

export const goals: Goal[] = [
  {
    name: "Emergency Buffer",
    target: 500,
    saved: 0,
    note: "Build a small cushion before aggressively paying down extra debt.",
  },
  {
    name: "Debt Paydown",
    target: 1000,
    saved: 0,
    note: "Track progress toward lowering credit card balances.",
  },
];

export const transactions: Transaction[] = [
  {
    name: "Gas Station",
    category: "Gas / Drinks",
    amount: 29.21,
    date: "Recent",
    account: "Freedom",
  },
];

export const notes: MoneyNote[] = [
  {
    title: "Main Priority",
    category: "Planning",
    text: "Keep bills covered first, then use extra money to build a small buffer and pay down card balances.",
  },
  {
    title: "Credit Reporting",
    category: "Credit",
    text: "Try to keep reported credit card balances low before statement/reporting dates when possible.",
  },
  {
    title: "Spending Watch",
    category: "Habits",
    text: "Watch gas, food, and small convenience purchases because they add up quickly across paychecks.",
  },
];

export const updates = [
  {
    title: "Finance tracker started",
    category: "Website",
    date: "Recent",
    text: "Converted the workspace into a simple finance dashboard structure.",
  },
  {
    title: "Manual data setup",
    category: "Tracking",
    date: "Recent",
    text: "Balances, bills, cards, and goals can be updated manually in the data file for now.",
  },
];

export const resources: Resource[] = [
  {
    title: "Monthly Reset",
    category: "Budgeting",
    description:
      "Use this at the start of each month to make sure the tracker is accurate.",
    steps: [
      "Update checking balance.",
      "Update savings balance.",
      "Update every credit card balance.",
      "Confirm upcoming bill amounts.",
      "Mark any paid bills as Paid.",
      "Review money left after bills.",
    ],
  },
  {
    title: "Before Payday",
    category: "Planning",
    description:
      "Use this before each paycheck so the money has a plan before it gets spent.",
    steps: [
      "Check current account balance.",
      "List bills due before the next payday.",
      "Subtract those bills from available money.",
      "Decide what amount can safely go toward savings or debt.",
      "Leave a small cushion for gas, food, and unexpected spending.",
    ],
  },
  {
    title: "Credit Card Check",
    category: "Credit",
    description:
      "Use this to keep credit card balances under control and avoid surprises.",
    steps: [
      "Update current card balances.",
      "Check due dates.",
      "Check minimum payments.",
      "Pay down cards before reporting dates when possible.",
      "Avoid adding new spending unless it fits the plan.",
    ],
  },
];