import { JOD_TO_USD, SAR_TO_USD, USD_TO_JOD, USD_TO_SAR } from "@/constants/exchangeRates";
import type { InventoryItem } from "@/types/inventory";

export type CurrencyCode = "SAR" | "JOD" | "USD";

export interface MoneySource {
  sourceId?: string;
  sourceCountry?: string;
}

export interface MoneyTotals {
  original: Record<Exclude<CurrencyCode, "USD">, number>;
  sar: number;
  jod: number;
  usd: number;
}

const zeroTotals: MoneyTotals = {
  original: { SAR: 0, JOD: 0 },
  sar: 0,
  jod: 0,
  usd: 0,
};
const moneySeparator = " · ";
const ltrIsolateStart = "\u2066";
const isolateEnd = "\u2069";
const defaultDisplayCurrencies: CurrencyCode[] = ["SAR", "JOD", "USD"];

function isolateLtr(value: string) {
  return `${ltrIsolateStart}${value}${isolateEnd}`;
}

function normalized(value?: string) {
  return String(value ?? "").trim().toLowerCase();
}

function numberValue(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

export function detectOriginalCurrency(item: MoneySource): Exclude<CurrencyCode, "USD"> {
  const sourceId = normalized(item.sourceId);
  const sourceCountry = normalized(item.sourceCountry);

  if (sourceId === "laith" || sourceCountry === "saudi arabia") {
    return "SAR";
  }

  if (["baraka", "dania", "laithcars"].includes(sourceId) || sourceCountry === "jordan") {
    return "JOD";
  }

  return "JOD";
}

export function convertMoney(amount: number | null | undefined, fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number {
  const value = numberValue(amount);

  if (fromCurrency === toCurrency) {
    return value;
  }

  const usd =
    fromCurrency === "USD"
      ? value
      : fromCurrency === "SAR"
        ? value * SAR_TO_USD
        : value * JOD_TO_USD;

  if (toCurrency === "USD") {
    return usd;
  }

  return toCurrency === "SAR" ? usd * USD_TO_SAR : usd * USD_TO_JOD;
}

export function formatCurrency(amount: number | null | undefined, currency: CurrencyCode, locale = "en"): string {
  if (amount === null || amount === undefined) {
    return "-";
  }

  const formattedAmount = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(amount);

  return isolateLtr(`${formattedAmount} ${currency}`);
}

export function createMoneyTotals(): MoneyTotals {
  return {
    original: { ...zeroTotals.original },
    sar: 0,
    jod: 0,
    usd: 0,
  };
}

export function addMoneyToTotals(totals: MoneyTotals, amount: number | null | undefined, source: MoneySource): MoneyTotals {
  const value = numberValue(amount);
  const originalCurrency = detectOriginalCurrency(source);

  return {
    original: {
      SAR: totals.original.SAR + (originalCurrency === "SAR" ? value : 0),
      JOD: totals.original.JOD + (originalCurrency === "JOD" ? value : 0),
    },
    sar: totals.sar + convertMoney(value, originalCurrency, "SAR"),
    jod: totals.jod + convertMoney(value, originalCurrency, "JOD"),
    usd: totals.usd + convertMoney(value, originalCurrency, "USD"),
  };
}

export function sumMoney(items: InventoryItem[], amountSelector: (item: InventoryItem) => number | null | undefined): MoneyTotals {
  return items.reduce((totals, item) => addMoneyToTotals(totals, amountSelector(item), item), createMoneyTotals());
}

export function divideMoneyTotals(totals: MoneyTotals, divisor: number): MoneyTotals {
  if (divisor <= 0) {
    return createMoneyTotals();
  }

  return {
    original: {
      SAR: totals.original.SAR / divisor,
      JOD: totals.original.JOD / divisor,
    },
    sar: totals.sar / divisor,
    jod: totals.jod / divisor,
    usd: totals.usd / divisor,
  };
}

function displayCurrencies(selectedCurrencies?: CurrencyCode[]) {
  return selectedCurrencies?.length ? selectedCurrencies : defaultDisplayCurrencies;
}

function sortedBundleCurrencies(originalCurrency: CurrencyCode, selectedCurrencies?: CurrencyCode[]) {
  const selected = displayCurrencies(selectedCurrencies);

  return selected.includes(originalCurrency)
    ? [originalCurrency, ...selected.filter((currency) => currency !== originalCurrency)]
    : selected;
}

export function formatMoneyBundle(amount: number | null | undefined, source: MoneySource, locale = "en", selectedCurrencies?: CurrencyCode[]): string {
  if (amount === null || amount === undefined) {
    return "-";
  }

  const originalCurrency = detectOriginalCurrency(source);

  return isolateLtr(
    sortedBundleCurrencies(originalCurrency, selectedCurrencies)
      .map((currency) => formatCurrency(convertMoney(amount, originalCurrency, currency), currency, locale))
      .join(moneySeparator),
  );
}

export function formatMoneyTotalsCompact(totals: MoneyTotals, locale = "en", selectedCurrencies?: CurrencyCode[]): string {
  return isolateLtr(
    displayCurrencies(selectedCurrencies)
      .map((currency) => {
        const value = currency === "SAR" ? totals.sar : currency === "JOD" ? totals.jod : totals.usd;
        return formatCurrency(value, currency, locale);
      })
      .join(moneySeparator),
  );
}

export function formatMoneyTotalsBreakdown(
  totals: MoneyTotals,
  locale = "en",
  labels: { original?: string; sar?: string; jod?: string; usd?: string } = {},
  selectedCurrencies?: CurrencyCode[],
): string {
  const originalLabel = labels.original ?? "Original";
  const originalParts = [
    `${originalLabel} SAR: ${formatCurrency(totals.original.SAR, "SAR", locale)}`,
    `${originalLabel} JOD: ${formatCurrency(totals.original.JOD, "JOD", locale)}`,
  ];
  const convertedParts = displayCurrencies(selectedCurrencies).map((currency) => {
    const value = currency === "SAR" ? totals.sar : currency === "JOD" ? totals.jod : totals.usd;
    const label = currency === "SAR" ? labels.sar : currency === "JOD" ? labels.jod : labels.usd;

    return `${label ?? currency}: ${formatCurrency(value, currency, locale)}`;
  });

  return isolateLtr(
    [...originalParts, ...convertedParts].join(moneySeparator),
  );
}
