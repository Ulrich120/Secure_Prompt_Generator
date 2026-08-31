const isOwaspComplianceStrategy = (strategy) =>
  strategy?.title?.trim().toLowerCase() === "owasp compliance";

const getStrategyContext = (
  strategy,
  owaspContext = "",
) => {
  const strategyPrompt = strategy?.prompt || "";

  if (!isOwaspComplianceStrategy(strategy)) {
    return strategyPrompt;
  }

  if (!owaspContext?.trim()) {
    return strategyPrompt;
  }

  return `${strategyPrompt}

REAL OWASP SECURITY GUIDANCE

The following reference material was retrieved from approved OWASP Cheat Sheet resources by the application backend.

Use this material as authoritative security guidance where relevant to the requested implementation.

Do not blindly reproduce the reference material.
Do not claim that the resulting application is fully OWASP compliant.
Apply only recommendations that are relevant to the scenario.

${owaspContext}`;
};

export function buildPrompt({
  mode,
  scenario,
  strategy,
  userInput,
  owaspContext = "",
}) {
  const strategyContext = getStrategyContext(
    strategy,
    owaspContext,
  );

  if (mode === "verification") {
    return `
You are a senior application security auditor.

Analyze the following code for security vulnerabilities.

Scenario:
${scenario?.prompt || ""}

Strategy:
${strategyContext}

Code to analyze:
${userInput || ""}

Return your answer using exactly this structure:

1. Summary
Briefly explain what the code does and the main security concerns.

2. Vulnerabilities Found
For each vulnerability:
- Vulnerability name
- Severity: Low / Medium / High / Critical
- OWASP category
- Vulnerable code section
- Explanation
- Potential impact

3. Secure Corrected Code
Provide a secure corrected version of the code.

4. Remediation Steps
List concrete steps to fix the issues.

5. Final Security Score
Give a score from 0 to 10 and justify it.

Do not provide harmful exploit automation.
`.trim();
  }

  return `
You are a senior secure software engineer.

Generate production-ready secure source code.

Scenario:
${scenario?.prompt || ""}

Strategy:
${strategyContext}

User request:
${userInput || ""}

Return your answer using exactly this structure:

1. Solution Overview
Briefly explain the architecture and the security objective.

2. Secure Source Code
Provide the complete secure source code.

3. Security Controls Applied
Explain every security mechanism used.

4. OWASP Best Practices
List the OWASP recommendations respected.

5. Potential Remaining Risks
Mention any limitations or risks that still require attention.

6. Security Score
Give a score from 0 to 10 and justify it.
`.trim();
}
