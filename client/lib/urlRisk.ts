export interface UrlRiskResult {
  status: "empty" | "invalid" | "safe" | "suspicious";
  reasons: string[];
  normalizedUrl?: string;
}

const trustedDomains = [
  "google.com",
  "amazon.com",
  "microsoft.com",
  "paypal.com",
  "apple.com",
  "facebook.com",
  "instagram.com",
  "whatsapp.com",
  "github.com",
  "bankofamerica.com",
  "chase.com",
  "wellsfargo.com",
  "icicibank.com",
  "hdfcbank.com",
];

const suspiciousExactDomains = [
  "paypa1.com",
  "amaz0n.com",
  "goog1e.com",
  "micr0soft.com",
];

const phishingWords = [
  "verify",
  "secure",
  "login",
  "signin",
  "update",
  "suspended",
  "wallet",
  "kyc",
  "otp",
  "refund",
];

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const isIpHost = (host: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(host);

const deLeet = (value: string) =>
  value
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/7/g, "t");

const domainCore = (host: string) => host.replace(/^www\./, "");

const isTrustedHost = (host: string) =>
  trustedDomains.some((d) => host === d || host.endsWith(`.${d}`));

export const analyzeUrlRisk = (input: string): UrlRiskResult => {
  const reasons: string[] = [];
  let score = 0;

  if (!input.trim()) {
    return { status: "empty", reasons };
  }

  const normalized = normalizeUrl(input);
  let parsed: URL;

  try {
    parsed = new URL(normalized);
  } catch {
    return { status: "invalid", reasons: ["Invalid URL format"] };
  }

  const hostname = parsed.hostname.toLowerCase();
  const coreHost = domainCore(hostname);
  const pathAndQuery = `${parsed.pathname}${parsed.search}`.toLowerCase();

  if (parsed.protocol !== "https:") {
    reasons.push("Not using HTTPS");
    score += 2;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    reasons.push("Unexpected protocol used");
    score += 3;
  }

  if (input.includes("@") || parsed.username || parsed.password) {
    reasons.push("Contains embedded credentials or @ symbol");
    score += 3;
  }

  if (normalized.length > 120) {
    reasons.push("Unusually long URL");
    score += 1;
  }

  if (hostname.includes("xn--") || /[^\x00-\x7F]/.test(hostname)) {
    reasons.push("Contains uncommon domain encoding");
    score += 2;
  }

  if (isIpHost(hostname)) {
    reasons.push("Uses raw IP address instead of domain");
    score += 2;
  }

  if (hostname.split(".").length > 4) {
    reasons.push("Too many subdomains");
    score += 1;
  }

  if (/(-|_){2,}/.test(hostname)) {
    reasons.push("Too many special characters in domain");
    score += 1;
  }

  if (!hostname.includes(".")) {
    reasons.push("Domain looks incomplete");
    score += 2;
  }

  if (!isTrustedHost(coreHost)) {
    reasons.push("Unknown or untrusted domain");
    score += 2;
  }

  if (suspiciousExactDomains.includes(coreHost)) {
    reasons.push("Looks like a spoofed trusted domain");
    score += 3;
  }

  const deleetedHost = deLeet(coreHost);
  if (trustedDomains.includes(deleetedHost) && deleetedHost !== coreHost) {
    reasons.push("Possible lookalike (typosquatting) domain");
    score += 3;
  }

  if (
    phishingWords.some((w) => pathAndQuery.includes(w)) &&
    !isTrustedHost(coreHost)
  ) {
    reasons.push("Contains phishing-style action keywords");
    score += 1;
  }

  return {
    status: score >= 2 ? "suspicious" : "safe",
    reasons,
    normalizedUrl: parsed.toString(),
  };
};
