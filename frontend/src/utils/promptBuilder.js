export function buildPrompt({

  mode,
  scenario,
  strategies,
  userInput,
  history

}) {

  // NO SCENARIO SELECTED
  if (!scenario) {
    return "";
  }

  let prompt = "";

  // SYSTEM ROLE
  if (mode === "generation") {

    prompt += `
You are a senior secure software engineer.

Your mission is to generate secure production-ready code.
`;
  }

  if (mode === "analysis") {

    prompt += `
You are a senior cybersecurity analyst.

Your mission is to detect vulnerabilities and recommend fixes.
`;
  }

  // SCENARIO
  prompt += `

SCENARIO:
${scenario.prompt}
`;

  // STRATEGIES
  prompt += `

PROMPT ENGINEERING STRATEGIES:
`;

  strategies.forEach((strategy) => {

    prompt += `
- ${strategy.prompt}
`;
  });

  // USER INPUT
  if (mode === "analysis") {

    prompt += `

CODE TO ANALYZE:
${userInput}
`;
  }

  if (mode === "generation") {

    prompt += `

REQUIREMENTS:
${userInput}
`;
  }

  // PROMPT CHAINING
  if (history.length > 0) {

    prompt += `

PREVIOUS LLM RESPONSES:
`;

    history.forEach((entry, index) => {

      prompt += `

Response ${index + 1}:
${entry}
`;
    });
  }

  // FINAL INSTRUCTION
  prompt += `

Provide:
- detailed analysis
- vulnerabilities detected
- security recommendations
- secure corrected code if necessary
`;

  return prompt;
}