export function buildPrompt({
  mode,
  scenario,
  strategy,
  userInput,
}) {
  if (!scenario) return "";

  let prompt = "";

  prompt += `
SCENARIO:

${scenario.prompt}
`;

  if (strategy) {
    prompt += `

STRATEGY:

${strategy.prompt}
`;
  }

  if (mode === "generation") {
    prompt += `

APPLICATION REQUIREMENTS:

${userInput}
`;
  }

  if (mode === "verification") {
    prompt += `

CODE TO ANALYZE:

${userInput}
`;
  }

  return prompt;
}