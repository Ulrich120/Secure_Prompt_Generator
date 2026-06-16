export async function owaspAudit({
  currentResponse,
  fetchLLM,
}) {
  console.log("Running OWASP audit strategy...");

  const prompt = `
Validate the following content against OWASP Top 10.

Provide:

- vulnerabilities found
- OWASP category
- severity
- mitigation

Content:

${currentResponse}
`;

  const response = await fetchLLM(prompt);

  return {
    title: "OWASP Audit",
    prompt,
    content: response,
  };
}