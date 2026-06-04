function getSeverity(score) {
  if (score < 20) return "Critical";
  if (score < 40) return "High";
  if (score < 60) return "Medium";
  return "Low";
}

export function generateRecommendations(metrics) {
  const recommendations = [];

  if (metrics.authentication < 60) {
    recommendations.push({
      severity: getSeverity(metrics.authentication),
      title: "Authentication",
      recommendation:
        "Implement JWT authentication with bcrypt password hashing and MFA.",
    });
  }

  if (metrics.authorization < 60) {
    recommendations.push({
      severity: getSeverity(metrics.authorization),
      title: "Authorization",
      recommendation:
        "Implement Role-Based Access Control (RBAC) and enforce least-privilege access.",
    });
  }

  if (metrics.input_validation < 60) {
    recommendations.push({
      severity: getSeverity(metrics.input_validation),
      title: "Input Validation",
      recommendation:
        "Validate all inputs using Zod, Joi, or Express Validator and sanitize user data.",
    });
  }

  if (metrics.secret_management < 60) {
    recommendations.push({
      severity: getSeverity(metrics.secret_management)      ,
      title: "Secret Management",
      recommendation:
        "Move secrets to .env files and use Hashicorp Vault, AWS Secrets Manager, or Azure Key Vault.",
    });
  }

  if (metrics.logging < 60) {
    recommendations.push({
      severity: "Low",
      title: "Logging",
      recommendation:
        "Implement centralized logging with Winston, Morgan, or a SIEM platform.",
    });
  }

  return recommendations;
}