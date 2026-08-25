import { strategyRegistry } from "../strategies/strategyRegistry";

export async function executeStrategies({
  basePrompt,
  strategy,
  mode,
  scenario,
  userInput,
  fetchLLM,
}) {
  const steps = [];

  if (!strategy) {
    const currentResponse = await fetchLLM(basePrompt);

    steps.push({
      title: "Initial Prompt",
      prompt: basePrompt,
      content: currentResponse,
    });

    return {
      finalResponse: currentResponse,
      chainResults: steps,
    };
  }

  const registryEntry = strategyRegistry[strategy.title];

  /*
   * Old strategies are still stored directly as functions.
   * New strategies can use an object with a type and an executor.
   * This keeps the old code working while allowing multi-step strategies.
   */
  const isStructuredEntry =
    registryEntry &&
    typeof registryEntry === "object" &&
    typeof registryEntry.executor === "function";

  const strategyType = isStructuredEntry
    ? registryEntry.type
    : "post-process";

  const strategyExecutor = isStructuredEntry
    ? registryEntry.executor
    : registryEntry;

  /*
   * Multi-step strategies control their complete execution flow.
   * They receive the original prompt and the complete user context.
   */
  if (strategyType === "multi-step" && strategyExecutor) {
    const result = await strategyExecutor({
      basePrompt,
      mode,
      scenario,
      strategy,
      userInput,
      fetchLLM,
    });

    return {
      finalResponse: result.content,
      chainResults: result.steps || [],
    };
  }

  /*
   * Existing strategies keep the previous behavior:
   * first generate a response, then apply the strategy executor.
   */
  let currentResponse = await fetchLLM(basePrompt);

  steps.push({
    title: "Initial Prompt",
    prompt: basePrompt,
    content: currentResponse,
  });

  if (!strategyExecutor) {
    console.warn("No executor found for:", strategy.title);

    return {
      finalResponse: currentResponse,
      chainResults: steps,
    };
  }

  const result = await strategyExecutor({
    basePrompt,
    currentResponse,
    mode,
    scenario,
    strategy,
    userInput,
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
