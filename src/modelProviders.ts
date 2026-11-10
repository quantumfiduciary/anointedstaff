/** OpenAI-compatible chat providers the desk can call from the browser. */

export type ModelProviderId =
  | "ollama"
  | "lmstudio"
  | "openai"
  | "openrouter"
  | "groq"
  | "together"
  | "deepseek"
  | "mistral"
  | "fireworks"
  | "gemini"
  | "custom-local"
  | "custom-cloud"

export type ModelProvider = {
  id: ModelProviderId
  label: string
  mode: "local" | "cloud"
  url: string
  model: string
  keyRequired: boolean
  /** Short setup steps shown under the provider picker. */
  needs: string[]
}

export const modelProviders: ModelProvider[] = [
  {
    id: "ollama",
    label: "Ollama",
    mode: "local",
    url: "http://127.0.0.1:11434/v1",
    model: "llama3.2",
    keyRequired: false,
    needs: [
      "Install Ollama on this computer and start it.",
      "Pull a chat model (for example: ollama pull llama3.2).",
      "Leave the API key empty. Address stays on 127.0.0.1.",
    ],
  },
  {
    id: "lmstudio",
    label: "LM Studio",
    mode: "local",
    url: "http://127.0.0.1:1234/v1",
    model: "local-model",
    keyRequired: false,
    needs: [
      "Open LM Studio, load a model, and start the local server.",
      "Turn on the OpenAI-compatible endpoint (usually port 1234).",
      "Use the model id LM Studio shows in the server panel. Key can stay empty.",
    ],
  },
  {
    id: "custom-local",
    label: "Custom local",
    mode: "local",
    url: "http://127.0.0.1:11434/v1",
    model: "llama3.2",
    keyRequired: false,
    needs: [
      "Any OpenAI-compatible /v1 chat server on this machine.",
      "Address must end with /v1. Key only if that server requires one.",
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    mode: "cloud",
    url: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    keyRequired: true,
    needs: [
      "Create an API key at platform.openai.com (not a ChatGPT login password).",
      "Billing must be enabled on the OpenAI account.",
      "Paste the key below. It stays in this browser only.",
      "This desk calls the API from the browser; if the request is blocked, use OpenRouter or a local proxy that allows CORS.",
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    mode: "cloud",
    url: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o-mini",
    keyRequired: true,
    needs: [
      "Create an OpenRouter key at openrouter.ai and add credits.",
      "Model names are provider/model (for example openai/gpt-4o-mini).",
      "Paste the key below. It stays in this browser only.",
    ],
  },
  {
    id: "groq",
    label: "Groq",
    mode: "cloud",
    url: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    keyRequired: true,
    needs: [
      "Create a GroqCloud API key at console.groq.com.",
      "Use a Groq model id from their models list.",
      "Paste the key below. Browser CORS may block some accounts; Test connection will say so.",
    ],
  },
  {
    id: "together",
    label: "Together AI",
    mode: "cloud",
    url: "https://api.together.xyz/v1",
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    keyRequired: true,
    needs: [
      "Create a Together API key at api.together.ai.",
      "Use a Together model id from their catalog.",
      "Paste the key below. It stays in this browser only.",
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    mode: "cloud",
    url: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    keyRequired: true,
    needs: [
      "Create a DeepSeek API key at platform.deepseek.com.",
      "Use deepseek-chat or deepseek-reasoner.",
      "Paste the key below. It stays in this browser only.",
    ],
  },
  {
    id: "mistral",
    label: "Mistral",
    mode: "cloud",
    url: "https://api.mistral.ai/v1",
    model: "mistral-small-latest",
    keyRequired: true,
    needs: [
      "Create a Mistral API key at console.mistral.ai.",
      "Use a chat model id such as mistral-small-latest.",
      "Paste the key below. It stays in this browser only.",
    ],
  },
  {
    id: "fireworks",
    label: "Fireworks",
    mode: "cloud",
    url: "https://api.fireworks.ai/inference/v1",
    model: "accounts/fireworks/models/llama-v3p1-8b-instruct",
    keyRequired: true,
    needs: [
      "Create a Fireworks API key at fireworks.ai.",
      "Use a full accounts/fireworks/models/… model id.",
      "Paste the key below. It stays in this browser only.",
    ],
  },
  {
    id: "gemini",
    label: "Google Gemini",
    mode: "cloud",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-2.0-flash",
    keyRequired: true,
    needs: [
      "Create a Gemini API key in Google AI Studio.",
      "Use the OpenAI-compatible Gemini base URL (already filled).",
      "Paste the key below. Model ids look like gemini-2.0-flash.",
    ],
  },
  {
    id: "custom-cloud",
    label: "Custom cloud",
    mode: "cloud",
    url: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    keyRequired: true,
    needs: [
      "Any OpenAI-compatible HTTPS /v1 chat endpoint.",
      "You need the base address, a model id, and usually an API key.",
      "The key stays in this browser. The host must allow browser requests (CORS) or sit behind a proxy you control.",
    ],
  },
]

export function providersFor(mode: "local" | "cloud"): ModelProvider[] {
  return modelProviders.filter((item) => item.mode === mode)
}

export function providerById(id: string | undefined | null): ModelProvider | undefined {
  return modelProviders.find((item) => item.id === id)
}

/** Match a saved URL/mode to a known provider, or fall back to custom. */
export function inferProviderId(mode: "local" | "cloud", url: string): ModelProviderId {
  const normalized = url.trim().replace(/\/$/, "")
  const exact = modelProviders.find((item) => item.mode === mode && item.url.replace(/\/$/, "") === normalized && !item.id.startsWith("custom-"))
  if (exact) return exact.id
  return mode === "cloud" ? "custom-cloud" : "custom-local"
}
