import { executeStrategies } from "./strategyEngine";

// FETCH LLM
async function fetchLLM(prompt, selectedModel = "llama3") {
  try {
    console.log("MODEL SENT TO BACKEND:", selectedModel);

    const response = await fetch(
      "http://127.0.0.1:8000/generate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          prompt,
          model: selectedModel,
        }),
      }
    );

    console.log("HTTP STATUS:", response.status);

    const data = await response.json();

    console.log("BACKEND RESPONSE:", data);

    if (data.error) {
      throw new Error(data.error);
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
  selectedModels,
}) {

  try {

    return await executeStrategies({

      basePrompt: generatedPrompt,

      strategy: selectedStrategy,

      fetchLLM: (prompt) =>
        fetchLLM(
          prompt,
          selectedModels?.[0] || "llama3"
        ),

    });

  } catch (error) {

    console.error(
      "PROMPT CHAIN ERROR:",
      error
    );

    throw error;
  }
}