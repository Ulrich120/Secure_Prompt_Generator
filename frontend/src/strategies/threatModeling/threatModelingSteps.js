export const threatModelingSteps = [
  {
    id: 1,
    shortTitle: "Identify the threats",
    prompt: `Threat Modeling — Step 1

Analyze the requested application or feature before generating any source code.

Identify the security threats relevant to the scenario.

Structure the analysis as follows:

1. Assets to Protect
Identify the data, resources, credentials, operations, and system components that require protection.

2. Entry Points and Attack Surface
Identify the interfaces, inputs, endpoints, files, APIs, or other locations through which an attacker could interact with the system.

3. Trust Boundaries
Identify where data or control crosses between users, services, components, privilege levels, or external systems.

4. Threat Actors
Identify realistic attackers or unauthorized actors relevant to this scenario.

5. Threats
For each meaningful threat, provide:
- threat name;
- affected asset;
- attack vector;
- possible impact;
- severity: Low, Medium, High, or Critical;
- related CWE or OWASP category when applicable.

Do not generate the implementation yet.
Do not provide the final source code yet.
The purpose of this step is to establish the threat model that will guide Step 2.`,
  },

  {
    id: 2,
    shortTitle: "Generate secure code",
    prompt: `Threat Modeling — Step 2

Using the threat model produced in Step 1, generate the requested implementation.

For each relevant threat identified in Step 1:

- select an appropriate security control;
- apply that control directly in the implementation;
- preserve the requested functionality;
- avoid unnecessary security mechanisms unrelated to the identified threats.

Then provide:

1. Security Controls Selected
Map each important threat to the security control used to mitigate it.

2. Secure Source Code
Provide the complete secure implementation.

3. Threat Mitigation Review
For each threat from Step 1, state whether it is:
- Mitigated;
- Partially Mitigated; or
- Requires an external control.

4. Remaining Risks
Identify any important residual risks that cannot be fully addressed by the generated code.

The implementation must be based on the threats actually identified in Step 1.`,
  },
];

export function getThreatModelingStep(stepId) {
  return threatModelingSteps.find((step) => step.id === stepId);
}
