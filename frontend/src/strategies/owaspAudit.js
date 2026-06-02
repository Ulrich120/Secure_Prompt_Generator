export async function owaspAudit({

  currentResponse,

  fetchLLM

}) {
  console.log("Running OWASP audit strategy...");

  const prompt = `

Validate the following content against OWASP Top 10.

Provide:
- vulnerabilities found
- severity score
- remediation recommendations
- security score out of 100

Content:
${currentResponse}

`;

  const response = await fetchLLM(prompt);

  return {

    title: "OWASP Audit",

    content: response
  };
}