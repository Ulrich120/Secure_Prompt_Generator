import { strategyRegistry } from "../strategies/strategyRegistry";

export async function executeStrategies({
  basePrompt,

  strategy,

  fetchLLM,
}) {
  const steps = [];

  let currentResponse = await fetchLLM(basePrompt);

  steps.push({
    title: "Initial Prompt",
    prompt: basePrompt,
    content: currentResponse,
  });

  if (!strategy) {
    return {
      finalResponse: currentResponse,
      chainResults: steps,
    };
  }

  const strategyExecutor = strategyRegistry[strategy.title];

  if (!strategyExecutor) {
    console.warn("No executor found for:", strategy.title);

    return {
      finalResponse: currentResponse,
      chainResults: steps,
    };
  }

  const result = await strategyExecutor({
    currentResponse,

    fetchLLM,
  });

  currentResponse = result.content;

  steps.push({
    title: result.title,
    content: result.content,
    steps: result.steps || [],
  });

  return {
    finalResponse: currentResponse,
    chainResults: steps,
  };
}
