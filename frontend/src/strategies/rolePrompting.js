export async function rolePrompting({
  currentResponse,
  fetchLLM,
}) {
  const prompt = `
Act as a senior cybersecurity engineer.

Review and improve the following generated response.

Focus on:
- secure coding practices
- OWASP recommendations
- authentication security
- input validation
- secret management
- error handling

Response to improve:

${currentResponse}
`;

  const content = await fetchLLM(prompt);

  return {
    title: "Role Prompting",
    prompt,
    content,
  };
}