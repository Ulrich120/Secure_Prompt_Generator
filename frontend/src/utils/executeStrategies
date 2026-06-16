import { strategyRegistry } from "../strategies/strategyRegistry";

export async function executeStrategies({
  basePrompt,
  strategy,
  fetchLLM,
}) {
  let steps = [];

  // Réponse initiale du LLM
  let currentResponse = await fetchLLM(basePrompt);

  steps.push({
    title: "Initial Prompt",
    prompt: basePrompt,
    content: currentResponse,
  });

  // Si aucune stratégie n'est sélectionnée
  if (!strategy) {
    return {
      finalResponse: currentResponse,
      chainResults: steps,
    };
  }

  console.log("STRATEGY TITLE:", strategy.title);

  const strategyExecutor =
    strategyRegistry[strategy.title];

  console.log(
    "AVAILABLE REGISTRY:",
    Object.keys(strategyRegistry)
  );

  console.log(
    "EXECUTOR:",
    strategyExecutor
  );

  if (!strategyExecutor) {
    console.warn(
      "NO EXECUTOR FOUND FOR:",
      strategy.title
    );

    return {
      finalResponse: currentResponse,
      chainResults: steps,
    };
  }

  const start = performance.now();

  const result = await strategyExecutor({
    currentResponse,
    fetchLLM,
  });

  const end = performance.now();

  result.executionTime =
    ((end - start) / 1000).toFixed(2) + "s";

  currentResponse = result.content;

  steps.push(result);

  return {
    finalResponse: currentResponse,
    chainResults: steps,
  };
}