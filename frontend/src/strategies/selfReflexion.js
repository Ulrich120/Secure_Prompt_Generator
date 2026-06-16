export async function selfReflexion({
  currentResponse,
  fetchLLM,
}) {
  console.log("Running self-reflexion strategy...");

  const prompt = `
Review the following response.

Identify:
- weak reasoning
- missing security requirements
- possible improvements

Response:

${currentResponse}
`;

  const response = await fetchLLM(prompt);

  return {
    title: "Self Reflexion",
    prompt,
    content: response,
  };
}