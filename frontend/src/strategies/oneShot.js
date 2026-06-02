export async function oneShot({

  currentResponse,

  fetchLLM

}) {
  console.log("Running one-shot improvement strategy...");

  const prompt = `

Improve the following secure code generation.

Ensure:
- production-ready code
- strong authentication
- secure input validation
- proper session management

Content:
${currentResponse}

`;

  const improvedResponse = await fetchLLM(prompt);

  return {

    title: "One-Shot Improvement",

    content: improvedResponse
  };
}