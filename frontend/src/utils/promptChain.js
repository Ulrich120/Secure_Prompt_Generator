import { executeStrategies } from "./strategyEngine";

const DEFAULT_MODEL = "deepseek/deepseek-chat-v3-0324";

// FETCH LLM
async function fetchLLM(prompt, selectedModel = DEFAULT_MODEL) {
  try {
    console.log("MODEL SENT TO BACKEND:", selectedModel);

    const response = await fetch("http://127.0.0.1:8000/generate", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        prompt,
        model: selectedModel,
      }),
    });

    console.log("HTTP STATUS:", response.status);

    const data = await response.json();

    console.log("BACKEND RESPONSE:", data);

    if (data.error) {
      throw new Error(JSON.stringify(data.error));
    }

    return data.response;
  } catch (error) {
    console.error("FETCH LLM ERROR:", error);

    throw error;
  }
}

// MAIN CHAIN
export async function runPromptChain({
  generatedPrompt,
  selectedStrategy,
  selectedModel = DEFAULT_MODEL,
}) {
  try {
    return await executeStrategies({
      basePrompt: generatedPrompt,

      strategy: selectedStrategy,

      fetchLLM: (prompt) => fetchLLM(prompt, selectedModel),
    });
  } catch (error) {
    console.error("PROMPT CHAIN ERROR:", error);

    throw error;
  }
}