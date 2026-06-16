import { oneShot }
from "./oneShot";

import { selfReflexion }
from "./selfReflexion";

import { owaspAudit }
from "./owaspAudit";

import { attackSimulation }
from "./attackSimulation";

import { secureRefactoring } 
from "./secureRefactoring";

import { vulnerabilityAnalysis }
from "./vulnerabilityAnalysis";

export const strategyRegistry = {

  "One-Shot Prompting": oneShot,

  "Self Reflexion": selfReflexion,

  "OWASP Audit": owaspAudit,

  "Attack Simulation": attackSimulation,

  "Secure Refactoring": secureRefactoring,

  "Vulnerability Analysis": vulnerabilityAnalysis
};