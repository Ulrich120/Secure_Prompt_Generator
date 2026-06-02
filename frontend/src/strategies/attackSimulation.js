export async function attackSimulation({

  currentResponse,

  fetchLLM

}) {

  console.log("Running attack simulation strategy...");

  const prompt = `

Simulate real-world cyberattacks against the following code or analysis.

Identify:
- exploit vectors
- privilege escalation
- data leaks
- remote code execution risks

Content:
${currentResponse}

`;

  const response = await fetchLLM(prompt);

  return {

    title: "Attack Simulation",

    content: response
  };
}