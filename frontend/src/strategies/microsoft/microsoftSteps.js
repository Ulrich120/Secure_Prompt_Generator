export const microsoftSteps = [
  {
    id: 1,
    shortTitle: "What does the program do?",
    prompt: `Microsoft Method — Step 1

Explain what the supplied code does.

Describe:
- its main purpose;
- its inputs;
- its outputs;
- its main operations;
- any security-sensitive operations.

Do not identify vulnerabilities yet.
Do not propose corrections yet.`,
  },

  {
    id: 2,
    shortTitle: "What could go wrong?",
    prompt: `Microsoft Method — Step 2

Based on the code and your explanation from Step 1, what could go wrong from a security perspective?

Identify each potential vulnerability or security problem.

For each one, provide:
- vulnerability name;
- severity;
- where it occurs;
- possible impact;
- related CWE or OWASP category when applicable.

Do not correct the code yet.`,
  },

  {
    id: 3,
    shortTitle: "How can it be prevented?",
    prompt: `Microsoft Method — Step 3

For each vulnerability identified in Step 2, explain what must be done to prevent it.

For every vulnerability, provide:
- the required security control;
- the recommended correction;
- where the correction must be applied;
- the expected secure behavior.

Then provide a corrected version of the code that applies these protections.`,
  },

  {
    id: 4,
    shortTitle: "Was it implemented?",
    prompt: `Microsoft Method — Step 4

Review the corrected version produced in Step 3.

For each protection required in Step 3, verify whether it was actually implemented.

Report:
- security control;
- status: Implemented, Partially Implemented, or Not Implemented;
- evidence in the corrected code;
- anything still missing.

Finish with a short final security assessment.`,
  },
];

export function getMicrosoftStep(stepId) {
  return microsoftSteps.find((step) => step.id === stepId);
}
