export const financeSummary = {
  checkingBalance: 0,
  monthlyIncome: 0,
  savingsBalance: 0,
  nextPayday: "",
};

export const bills: {
  name: string;
  amount: number;
  dueDate: string;
  status: "Paid" | "Upcoming" | "Due Soon" | "Overdue";
  paymentMethod: string;
}[] = [];

export const creditCards: {
  name: string;
  balance: number;
  limit: number;
  minimumPayment: number;
  dueDate: string;
  status: "Good" | "Watch" | "Pay Down";
}[] = [];