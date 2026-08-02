const REGION_TO_CURRENCY: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
  IN: "INR",
  SG: "SGD",
  HK: "HKD",
  AE: "AED",
  SA: "SAR",
  QA: "QAR",
  KW: "KWD",
  BH: "BHD",
  OM: "OMR",
  EU: "EUR",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  PT: "EUR",
  IE: "EUR",
  GR: "EUR",
  FI: "EUR",
  LU: "EUR",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  CZ: "CZK",
  HU: "HUF",
  RO: "RON",
  BG: "BGN",
  TR: "TRY",
  ZA: "ZAR",
  NG: "NGN",
  KE: "KES",
  GH: "GHS",
  TZ: "TZS",
  UG: "UGX",
  BR: "BRL",
  MX: "MXN",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  PE: "PEN",
  UY: "UYU",
  CR: "CRC",
  DO: "DOP",
  JP: "JPY",
  KR: "KRW",
  CN: "CNY",
  TW: "TWD",
  TH: "THB",
  VN: "VND",
  MY: "MYR",
  PH: "PHP",
  ID: "IDR",
  PK: "PKR",
  BD: "BDT",
  LK: "LKR",
};

const TIMEZONE_TO_CURRENCY: Record<string, string> = {
  "Asia/Kolkata": "INR",
  "Asia/Colombo": "LKR",
  "Asia/Dhaka": "BDT",
  "Asia/Kathmandu": "NPR",
  "Asia/Dubai": "AED",
  "Asia/Riyadh": "SAR",
  "Asia/Jerusalem": "ILS",
  "Asia/Singapore": "SGD",
  "Asia/Hong_Kong": "HKD",
  "Asia/Tokyo": "JPY",
  "Asia/Seoul": "KRW",
  "Asia/Shanghai": "CNY",
  "Asia/Taipei": "TWD",
  "Asia/Bangkok": "THB",
  "Asia/Ho_Chi_Minh": "VND",
  "Asia/Kuala_Lumpur": "MYR",
  "Asia/Manila": "PHP",
  "Asia/Jakarta": "IDR",
  "Asia/Karachi": "PKR",
  "Europe/London": "GBP",
  "Europe/Dublin": "EUR",
  "Europe/Paris": "EUR",
  "Europe/Berlin": "EUR",
  "Europe/Madrid": "EUR",
  "Europe/Rome": "EUR",
  "Europe/Amsterdam": "EUR",
  "Europe/Brussels": "EUR",
  "Europe/Zurich": "CHF",
  "Europe/Stockholm": "SEK",
  "Europe/Oslo": "NOK",
  "Europe/Copenhagen": "DKK",
  "Europe/Warsaw": "PLN",
  "Europe/Prague": "CZK",
  "Europe/Budapest": "HUF",
  "Europe/Bucharest": "RON",
  "Europe/Sofia": "BGN",
  "Europe/Istanbul": "TRY",
  "Africa/Johannesburg": "ZAR",
  "Africa/Lagos": "NGN",
  "Africa/Accra": "GHS",
  "Africa/Nairobi": "KES",
  "Africa/Dar_es_Salaam": "TZS",
  "Africa/Kampala": "UGX",
  "America/New_York": "USD",
  "America/Chicago": "USD",
  "America/Denver": "USD",
  "America/Los_Angeles": "USD",
  "America/Toronto": "CAD",
  "America/Vancouver": "CAD",
  "America/Mexico_City": "MXN",
  "America/Bogota": "COP",
  "America/Lima": "PEN",
  "America/Santiago": "CLP",
  "America/Argentina/Buenos_Aires": "ARS",
  "America/Sao_Paulo": "BRL",
  "America/Montevideo": "UYU",
  "America/Costa_Rica": "CRC",
  "America/Santo_Domingo": "DOP",
  "Pacific/Auckland": "NZD",
  "Australia/Sydney": "AUD",
  "Australia/Perth": "AUD",
};

function getLocale() {
  try {
    if (typeof window !== "undefined") {
      const storedLocale = window.localStorage.getItem("peersplus.locale");
      if (storedLocale) return storedLocale;
    }
  } catch {
    // ignore storage access issues
  }

  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }

  return Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
}

function getRegion(locale: string) {
  try {
    return new Intl.Locale(locale).region ?? locale.split("-")[1]?.toUpperCase() ?? "US";
  } catch {
    return locale.split("-")[1]?.toUpperCase() ?? "US";
  }
}

function getTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

function getStoredCurrencyCode() {
  try {
    if (typeof window !== "undefined") {
      const storedCurrency = window.localStorage.getItem("peersplus.currencyCode")?.trim().toUpperCase();
      if (storedCurrency) return storedCurrency;
    }
  } catch {
    // ignore storage access issues
  }

  return "";
}

function getCurrencyFromTimeZone(timeZone: string) {
  return TIMEZONE_TO_CURRENCY[timeZone] ?? "";
}

export function getCurrencyCode(locale = getLocale()) {
  const storedCurrency = getStoredCurrencyCode();
  if (storedCurrency) return storedCurrency;

  const timeZoneCurrency = getCurrencyFromTimeZone(getTimeZone());
  if (timeZoneCurrency) return timeZoneCurrency;

  const region = getRegion(locale);
  return REGION_TO_CURRENCY[region] ?? "USD";
}

export function formatCurrency(value: number, options?: { locale?: string; currency?: string; maximumFractionDigits?: number }) {
  const locale = options?.locale ?? getLocale();
  const currency = options?.currency ?? getCurrencyCode(locale);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: options?.maximumFractionDigits ?? (Number.isInteger(value) ? 0 : 2),
  }).format(value);
}
