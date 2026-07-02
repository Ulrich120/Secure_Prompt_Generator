export function analyzeSecurityFeatures(response = "") {
  const text = response.toLowerCase();

  return [
    {
      label: "Input Validation",
      found:
        text.includes("validate") ||
        text.includes("validation") ||
        text.includes("joi") ||
        text.includes("zod"),
    },
    {
      label: "Password Hashing",
      found:
        text.includes("bcrypt") ||
        text.includes("argon2") ||
        text.includes("password_hash"),
    },
    {
      label: "SQL Parameterization",
      found:
        text.includes("parameterized") ||
        text.includes("prepared statement") ||
        text.includes("$1") ||
        text.includes("?"),
    },
    {
      label: "JWT Expiration",
      found:
        text.includes("expiresin") ||
        text.includes("expires in") ||
        text.includes("expiration"),
    },
    {
      label: "Rate Limiting",
      found:
        text.includes("rate limit") ||
        text.includes("express-rate-limit"),
    },
    {
      label: "HTTPS",
      found:
        text.includes("https") ||
        text.includes("tls"),
    },
    {
      label: "CSRF Protection",
      found: text.includes("csrf"),
    },
    {
      label: "Secure Cookies",
      found:
        text.includes("httponly") ||
        text.includes("samesite") ||
        text.includes("secure cookie"),
    },
    {
      label: "Least Privilege",
      found: text.includes("least privilege"),
    },
    {
      label: "Logging",
      found:
        text.includes("logging") ||
        text.includes("logger") ||
        text.includes("console.error"),
    },
    {
      label: "MFA",
      found:
        text.includes("mfa") ||
        text.includes("multi-factor") ||
        text.includes("totp"),
    },
  ];
}