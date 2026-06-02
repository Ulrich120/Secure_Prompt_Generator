export async function secureRefactoring({

  currentResponse,

  fetchLLM

}) {console.log("Running secure refactoring strategy...");

  const prompt = `

Refactor the following code securely.

Objectives:
- improve security
- reduce attack surface
- improve maintainability
- eliminate insecure patterns

Content:
${currentResponse}

`;

  const response = await fetchLLM(prompt);

  return {

    title: "Secure Refactoring",

    content: response
  };
}