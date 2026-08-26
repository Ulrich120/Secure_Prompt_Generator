import { microsoftSteps } from "./microsoft/microsoftSteps";
import { threatModelingSteps } from "./threatModeling/threatModelingSteps";

export const interactiveStrategyConfig = {
  "Microsoft Method": {
    label: "Microsoft Method",
    description: "Interactive four-step security analysis",
    steps: microsoftSteps,
  },

  "Threat Modeling": {
    label: "Threat Modeling",
    description: "Interactive two-step threat modeling workflow",
    steps: threatModelingSteps,
  },
};

export function getInteractiveStrategyConfig(strategyTitle) {
  return interactiveStrategyConfig[strategyTitle] || null;
}
