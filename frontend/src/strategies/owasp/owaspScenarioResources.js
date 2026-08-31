export const OWASP_RESOURCES = {
  authentication: {
    title: "OWASP Authentication Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
  },

  authorization: {
    title: "OWASP Authorization Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
  },

  passwordStorage: {
    title: "OWASP Password Storage Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
  },

  forgotPassword: {
    title: "OWASP Forgot Password Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html",
  },

  sessionManagement: {
    title: "OWASP Session Management Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html",
  },

  jwt: {
    title: "OWASP JSON Web Token Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html",
  },

  restSecurity: {
    title: "OWASP REST Security Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html",
  },

  inputValidation: {
    title: "OWASP Input Validation Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html",
  },

  csrf: {
    title: "OWASP Cross-Site Request Forgery Prevention Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html",
  },

  fileUpload: {
    title: "OWASP File Upload Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html",
  },

  sqlInjection: {
    title: "OWASP SQL Injection Prevention Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
  },

  queryParameterization: {
    title: "OWASP Query Parameterization Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Query_Parameterization_Cheat_Sheet.html",
  },

  xss: {
    title: "OWASP Cross Site Scripting Prevention Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
  },

  domXss: {
    title: "OWASP DOM based XSS Prevention Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html",
  },

  httpHeaders: {
    title: "OWASP HTTP Headers Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html",
  },

  logging: {
    title: "OWASP Logging Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html",
  },
};

const SCENARIO_RESOURCE_KEYS = {
  "csrf_protected_form": [
    "csrf",
    "sessionManagement",
  ],

  "jwt_authentication_api": [
    "authentication",
    "jwt",
    "restSecurity",
    "authorization",
  ],

  "secure_api": [
    "restSecurity",
    "authentication",
    "authorization",
    "inputValidation",
  ],

  "secure_file_upload": [
    "fileUpload",
    "inputValidation",
    "csrf",
    "authentication",
  ],

  "secure_forgot_password_flow": [
    "forgotPassword",
    "authentication",
    "sessionManagement",
  ],

  "secure_login_system": [
    "authentication",
    "passwordStorage",
    "sessionManagement",
    "inputValidation",
  ],

  "secure_sql_query": [
    "sqlInjection",
    "queryParameterization",
    "inputValidation",
  ],

  "xss_protection_form": [
    "xss",
    "domXss",
    "inputValidation",
    "httpHeaders",
  ],

  "_secure_password_storage": [
    "passwordStorage",
    "authentication",
  ],
};

const normalizeScenarioKey = (scenario) => {
  const rawValue =
    scenario?.filename ||
    scenario?.file_name ||
    scenario?.title ||
    scenario?.name ||
    "";

  return rawValue
    .trim()
    .replace(/\.txt$/i, "")
    .toLowerCase()
    .replace(/\s+/g, "_");
};

export const getOwaspResourcesForScenario = (scenario) => {
  const scenarioKey = normalizeScenarioKey(scenario);

  const resourceKeys = SCENARIO_RESOURCE_KEYS[scenarioKey] || [];

  return resourceKeys
    .map((key) => OWASP_RESOURCES[key])
    .filter(Boolean);
};

export const buildOwaspResourceContext = (scenario) => {
  const resources = getOwaspResourcesForScenario(scenario);

  if (resources.length === 0) {
    return "";
  }

  return `
Relevant OWASP resources for this scenario:

${resources
  .map(
    (resource, index) =>
      `${index + 1}. ${resource.title}
   ${resource.url}`,
  )
  .join("\n")}

Use these resources as security guidance for the requested implementation.
Apply only recommendations that are relevant to the scenario.
Do not claim that the generated implementation is fully OWASP compliant merely because these resources were consulted.
`;
};
