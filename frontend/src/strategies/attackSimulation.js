export async function attackSimulation({
  currentResponse,
  fetchLLM,
}) {
  console.log("Running attack simulation strategy...");

  const prompt = `
You are a Senior Penetration Tester.

Analyze the following content.

Generate possible attack scenarios.

For each attack provide:

- attack name
- attack steps
- impact
- mitigation

Content:

${currentResponse}
`;

  const response = await fetchLLM(prompt);

  return {
    title: "Attack Simulation",
    prompt,
    content: response,
  };
}