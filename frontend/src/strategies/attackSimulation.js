export async function attackSimulation({

  currentResponse,

  fetchLLM,

}) {

  console.log("Running attack simulation strategy...");

  const prompt = `

You are a Senior Penetration Tester and Red Team Expert.

Analyze the following security report and simulate realistic cyberattacks.

For EACH vulnerability found, provide:

# Attack Scenario

Attack Type:
- vulnerability category

Severity:
- Critical / High / Medium / Low

Attack Payload:
- realistic payload example

Attack Steps:
1. step one
2. step two
3. step three

Expected Result:
- what the attacker gains

Business Impact:
- data breach
- privilege escalation
- service disruption
- remote code execution
- etc.

Mitigation:
- precise remediation recommendation

Format everything in markdown.

Security Report:

${currentResponse}

`;

  const response = await fetchLLM(prompt);

  return {

    title: "Attack Simulation",

    content: response,

  };
}