const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function fetchOwaspContext(resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return {
      resources: [],
      context: "",
    };
  }

  const response = await fetch(`${API_URL}/owasp-context`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      resources: resources.map((resource) => ({
        title: resource.title,
        url: resource.url,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Unable to retrieve OWASP context (${response.status}).`,
    );
  }

  const data = await response.json();

  return {
    resources: Array.isArray(data.resources)
      ? data.resources
      : [],

    context:
      typeof data.context === "string"
        ? data.context
        : "",
  };
}
