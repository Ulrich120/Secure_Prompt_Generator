import { oneShot }
from "./oneShot";

import { selfReflection }
from "./selfReflection";

import { owaspAudit }
from "./owaspAudit";

import { attackSimulation }
from "./attackSimulation";

import { securityScoring }
from "./securityScoring";

import { secureRefactoring } 
from "./secureRefactoring";

import { vulnerabilityAnalysis }
from "./vulnerabilityAnalysis";

export const strategyRegistry = {

  "One-Shot Prompting": oneShot,

  "Self Reflexion": selfReflection,

  "OWASP Audit": owaspAudit,

  "Attack Simulation": attackSimulation,

  "Security Scoring": securityScoring,

  "Secure Refactoring": secureRefactoring,

  "Vulnerability Analysis": vulnerabilityAnalysis
};