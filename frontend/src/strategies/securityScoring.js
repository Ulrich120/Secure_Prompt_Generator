export async function securityScoring({

  currentResponse,

  fetchLLM

}) {console.log("Running security scoring strategy...");

  const prompt = `

Analyze the following response.

Generate:
- security score /100
- risk level
- critical vulnerabilities
- recommendations

Content:
${currentResponse}

`;

  const scoredResponse = await fetchLLM(prompt);

  return {

    title: "Security Scoring",

    content: scoredResponse
  };
}