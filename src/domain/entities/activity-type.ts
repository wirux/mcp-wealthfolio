export type ActivityType =
  | "BUY"
  | "SELL"
  | "DIVIDEND"
  | "INTEREST"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "FEE"
  | "TAX";

export const ACTIVITY_TYPES: ReadonlyArray<ActivityType> = [
  "BUY",
  "SELL",
  "DIVIDEND",
  "INTEREST",
  "DEPOSIT",
  "WITHDRAWAL",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "FEE",
  "TAX",
] as const;
