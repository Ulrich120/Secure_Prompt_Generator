import { oneShot }
from "./oneShot";

import { rolePrompting } 
from "./rolePrompting";

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

import microsoftMethod 
from "./executors/microsoftMethod";

export const strategyRegistry = {

  "One-Shot Prompting": oneShot,

  "Role Prompting": rolePrompting,

  "Self Reflexion": selfReflexion,

  "OWASP Audit": owaspAudit,

  "Attack Simulation": attackSimulation,

  "Secure Refactoring": secureRefactoring,

  "Vulnerability Analysis": vulnerabilityAnalysis,

  "Microsoft Method": microsoftMethod,
};