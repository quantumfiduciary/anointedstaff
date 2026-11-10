/** Parse OpenAI-compatible chat.completion.chunk SSE into assistant text deltas. */

export type ChatStreamHandlers = {
  onDelta: (text: string) => void
  signal?: AbortSignal
}

export async function streamChatCompletion(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  handlers: ChatStreamHandlers,
): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers,
    signal: handlers.signal,
    body: JSON.stringify({ ...body, stream: true }),
  })
  if (!response.ok) throw new Error(String(response.status))
  if (!response.body) {
    // Some local servers ignore stream=true and return JSON anyway.
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    const content = data.choices?.[0]?.message?.content?.trim() ?? ""
    if (!content) throw new Error("empty")
    handlers.onDelta(content)
    return content
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let full = ""
  let sawChunk = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue
      const data = trimmed.slice(5).trim()
      if (!data || data === "[DONE]") continue
      try {
        const json = JSON.parse(data) as {
          choices?: { delta?: { content?: string }; message?: { content?: string } }[]
        }
        const delta = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? ""
        if (!delta) continue
        sawChunk = true
        full += delta
        handlers.onDelta(full)
      } catch {
        // ignore malformed SSE lines
      }
    }
  }

  if (!sawChunk && buffer.trim()) {
    // Non-SSE JSON body delivered as a single buffer
    try {
      const json = JSON.parse(buffer) as { choices?: { message?: { content?: string } }[] }
      const content = json.choices?.[0]?.message?.content?.trim() ?? ""
      if (content) {
        handlers.onDelta(content)
        return content
      }
    } catch {
      // fall through
    }
  }

  if (!full.trim()) throw new Error("empty")
  return full.trim()
}

/** Fallback non-streaming completion when the host rejects stream=true. */
export async function completeChat(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers,
    signal,
    body: JSON.stringify({ ...body, stream: false }),
  })
  if (!response.ok) throw new Error(String(response.status))
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error("empty")
  return content
}
