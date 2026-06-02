export async function selfReflection({

  currentResponse,

  fetchLLM

}) {
  console.log("Running self-reflection strategy...");

  const prompt = `

Review the following security analysis.

Identify:
- weak reasoning
- missed vulnerabilities
- incomplete remediations

Improve the response.

Content:
${currentResponse}

`;

  const response = await fetchLLM(prompt);

  return {

    title: "Self Reflection",

    content: response
  };
}