export default async function microsoftMethod({ currentResponse, fetchLLM }) {
  /*
   * The scenario already explains what the program does.
   * Because of that, I do not repeat the first step of the method.
   * I start directly by asking what could go wrong.
   */

  const risksPrompt = `
You are performing the first analysis step of the Microsoft Method.

Review the following code or proposed solution:

${currentResponse}

The program behavior is already described in the selected scenario.

Your task is to identify what could go wrong if this solution is used.

For each problem, provide:

1. Risk name
2. Severity: Low, Medium, High, or Critical
3. What could go wrong
4. Possible security impact
5. Related OWASP category, when applicable

Do not correct the code yet.
Only identify observable risks.
Do not include hidden reasoning.
`;

  // First, I ask the LLM to identify the possible risks.
  const risksResponse = await fetchLLM(risksPrompt);

  /*
   * Once the risks are identified, the next step is to determine
   * what should be done to prevent each one.
   */

  const preventionPrompt = `
You are performing the second analysis step of the Microsoft Method.

Original solution:

${currentResponse}

Problems identified during the previous step:

${risksResponse}

For every identified risk, explain what should be done to prevent it.

Use this structure:

1. Risk name
2. Preventive security control
3. Recommended implementation
4. Expected secure behavior
5. Verification criterion

Do not assume that a control is already implemented.
Only describe what should be added or changed.
`;

  // Here, I ask for preventive controls based on the identified risks.
  const preventionResponse = await fetchLLM(preventionPrompt);

  /*
   * The third step checks whether the proposed protections
   * are really present in the code or corrected solution.
   */

  const verificationPrompt = `
You are performing the third analysis step of the Microsoft Method.

Solution to verify:

${currentResponse}

Previously identified risks:

${risksResponse}

Required preventive controls:

${preventionResponse}

Check whether each required control is actually implemented.

For every control, provide:

- Control name
- Status: Implemented, Partially Implemented, or Not Implemented
- Evidence found in the solution
- Missing element, when applicable
- Recommended correction

Finish with:

- Overall compliance percentage
- Final security score from 0 to 10
- Final verdict: Acceptable, Requires Improvement, or Unsafe

Do not invent evidence.
Base the verification only on the supplied solution.
Do not include hidden reasoning.
`;

  // This step verifies whether the expected protections are really present.
  const verificationResponse = await fetchLLM(verificationPrompt);

  /*
   * The previous calls produce separate results.
   * I use one final call to combine them into a clear report
   * that can be displayed in the application.
   */

  const finalPrompt = `
Create a final Microsoft Method security report using the results below.

Original solution:

${currentResponse}

STEP 1 — What Could Go Wrong:

${risksResponse}

STEP 2 — How to Prevent It:

${preventionResponse}

STEP 3 — Was It Implemented:

${verificationResponse}

Return the final answer using exactly this structure:

# Microsoft Method Security Review

## 1. What Could Go Wrong

Summarize the identified risks using this table:

| Risk | Severity | Impact | OWASP Category |
|------|----------|--------|----------------|

## 2. How to Prevent It

Explain the preventive controls required for each risk.

## 3. Implementation Verification

Use this table:

| Control | Status | Evidence | Missing Element |
|---------|--------|----------|-----------------|

## 4. Required Corrections

List the corrections that are still required.

## 5. Final Assessment

Include:

- Compliance percentage
- Security score from 0 to 10
- Final verdict
- Short justification

Only include findings, evidence, and recommendations.
Do not include hidden reasoning or internal deliberation.
`;

  // The final call creates one clean response from all previous steps.
  const finalResponse = await fetchLLM(finalPrompt);

  return {
    title: "Microsoft Method",
    content: finalResponse,

    /*
     * I keep every step in the result.
     * This will be useful later if I want to display
     * the complete prompt chain in the interface.
     */
    steps: [
      {
        title: "Step 1 — What Could Go Wrong",
        content: risksResponse,
      },
      {
        title: "Step 2 — How to Prevent It",
        content: preventionResponse,
      },
      {
        title: "Step 3 — Implementation Verification",
        content: verificationResponse,
      },
      {
        title: "Final Microsoft Method Report",
        content: finalResponse,
      },
    ],
  };
}
