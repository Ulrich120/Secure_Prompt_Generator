import { strategyRegistry } from "../strategies/strategyRegistry";

export async function executeStrategies({
  basePrompt,
  strategies,
  fetchLLM,
}) {
  let steps = [];

  // Réponse initiale
  let currentResponse = await fetchLLM(basePrompt);

  steps.push({
    title: "Initial Response",
    content: currentResponse,
  });

  // Exécution des stratégies
  for (const strategy of strategies) {
    console.log("STRATEGY TITLE:", strategy.title);

    console.log(
      "AVAILABLE REGISTRY:",
      Object.keys(strategyRegistry)
    );

    const strategyExecutor =
      strategyRegistry[strategy.title];

    console.log(
      "EXECUTOR:",
      strategyExecutor
    );

    if (!strategyExecutor) {
      console.warn(
        "NO EXECUTOR FOUND FOR:",
        strategy.title
      );

      continue;
    }

    const start = performance.now();

    const result = await strategyExecutor({
      currentResponse,
      fetchLLM,
    });

    const end = performance.now();

    result.executionTime = ((end - start) / 1000).toFixed(2) + "s";

    console.log(
      "STRATEGY RESULT:",
      result
    );

    currentResponse = result.content;

    steps.push(result);
  }

  return {
    finalResponse: currentResponse,
    chainResults: steps,
  };
}