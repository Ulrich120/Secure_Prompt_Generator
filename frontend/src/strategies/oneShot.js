export async function oneShot({
  currentResponse,
  fetchLLM,
}) {

  const prompt = `
Example:

Input:
Create a login system.

Output:
A secure login system must include:
- password hashing
- authentication
- authorization
- session management

Now analyze the following content:

${currentResponse}
`;

  const response = await fetchLLM(prompt);

  return {
    title: "One-Shot Prompting",
    prompt,
    content: response,
  };
}