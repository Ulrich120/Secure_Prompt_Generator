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
    const response = await fetchLLM(basePrompt);

    return {
      finalResponse: response,
      chainResults: [
        {
          title: "Initial Prompt",
          prompt: basePrompt,
          content: response,
        },
      ],
    };
  }

  const registryEntry = strategyRegistry[strategy.title];

  /*
   * Interactive multi-step strategies do not execute their
   * complete workflow automatically.
   *
   * One click on Send = one LLM request.
   */
  if (registryEntry?.type === "interactive-multi-step") {
    const response = await fetchLLM(basePrompt);

    return {
      finalResponse: response,
      chainResults: [
        {
          title: "Interactive Microsoft Step",
          prompt: basePrompt,
          content: response,
        },
      ],
    };
  }

  /*
   * New automatic multi-step strategies can still use
   * their own executor later, for example Threat Modeling.
   */
  if (
    registryEntry?.type === "multi-step" &&
    typeof registryEntry.executor === "function"
  ) {
    const result = await registryEntry.executor({
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
   * Normal strategies keep the existing behavior.
   */
  let currentResponse = await fetchLLM(basePrompt);

  steps.push({
    title: "Initial Prompt",
    prompt: basePrompt,
    content: currentResponse,
  });

  const strategyExecutor =
    typeof registryEntry === "function"
      ? registryEntry
      : registryEntry?.executor;

  if (!strategyExecutor) {
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
