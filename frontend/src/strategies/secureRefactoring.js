export async function secureRefactoring({
  currentResponse,
  fetchLLM,
}) {
  console.log("Running secure refactoring strategy...");

  const prompt = `
Refactor the following code securely.

Objectives:

- improve security
- remove vulnerabilities
- follow OWASP recommendations

Code:

${currentResponse}
`;

  const response = await fetchLLM(prompt);

  return {
    title: "Secure Refactoring",
    prompt,
    content: response,
  };
}