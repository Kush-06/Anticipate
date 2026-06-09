// Provider-agnostic tool-use service. Supports Claude (tool_use/tool_result) and
// Gemini (functionCall/functionResponse). OpenAI falls through to the caller as a
// plain-text fallback — tool use requires one of the two supported providers.
import { CLAUDE_BASE, claudeKey, GEMINI_BASE, geminiKey, OPENAI_BASE, openaiKey, getActiveProvider } from './aiChatService'

export interface SageTool {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface SageHistoryMessage {
  role: 'user' | 'assistant'
  text: string
  toolCalls?: Array<{ id: string; name: string; input: Record<string, unknown>; result: string }>
}

export type ToolCallHandler = (name: string, input: Record<string, unknown>) => Promise<string>

export async function sendWithTools(
  systemPrompt: string,
  history: SageHistoryMessage[],
  tools: SageTool[],
  onToolCall: ToolCallHandler,
): Promise<{
  text: string
  toolCalls: Array<{ name: string; input: Record<string, unknown> }>
  newTurn: SageHistoryMessage
}> {
  const provider = getActiveProvider()
  if (provider === 'claude') return sendClaude(systemPrompt, history, tools, onToolCall)
  if (provider === 'gemini') return sendGemini(systemPrompt, history, tools, onToolCall)
  if (provider === 'openai') return sendOpenAI(systemPrompt, history, tools, onToolCall)
  throw new Error('No AI provider configured.')
}

// ─── Claude ──────────────────────────────────────────────────────────────────

type ClaudeTextBlock   = { type: 'text'; text: string }
type ClaudeToolUse     = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
type ClaudeToolResult  = { type: 'tool_result'; tool_use_id: string; content: string }
type ClaudeBlock       = ClaudeTextBlock | ClaudeToolUse | ClaudeToolResult
type ClaudeMsg         = { role: 'user' | 'assistant'; content: string | ClaudeBlock[] }

function historyToClaudeMessages(history: SageHistoryMessage[]): ClaudeMsg[] {
  const out: ClaudeMsg[] = []
  for (const turn of history) {
    if (turn.role === 'user') {
      out.push({ role: 'user', content: turn.text })
    } else if (!turn.toolCalls || turn.toolCalls.length === 0) {
      out.push({ role: 'assistant', content: turn.text })
    } else {
      const assistantContent: ClaudeBlock[] = []
      if (turn.text) assistantContent.push({ type: 'text', text: turn.text })
      for (const tc of turn.toolCalls) {
        assistantContent.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.input })
      }
      out.push({ role: 'assistant', content: assistantContent })
      out.push({
        role: 'user',
        content: turn.toolCalls.map((tc) => ({
          type: 'tool_result' as const,
          tool_use_id: tc.id,
          content: tc.result,
        })),
      })
    }
  }
  return out
}

async function sendClaude(
  systemPrompt: string,
  history: SageHistoryMessage[],
  tools: SageTool[],
  onToolCall: ToolCallHandler,
): Promise<{ text: string; toolCalls: Array<{ name: string; input: Record<string, unknown> }>; newTurn: SageHistoryMessage }> {
  const key = claudeKey()
  if (!key) throw new Error('Claude API key not configured.')

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  }
  const claudeTools = tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters }))

  async function call(messages: ClaudeMsg[]) {
    const res = await fetch(`${CLAUDE_BASE}/v1/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        tools: claudeTools,
        tool_choice: { type: 'auto' },
      }),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText)
      throw new Error(`Claude API error ${res.status}: ${err}`)
    }
    return res.json() as Promise<{ content: ClaudeBlock[] }>
  }

  const messages = historyToClaudeMessages(history)
  const first = await call(messages)
  const toolUseBlocks = first.content.filter((b): b is ClaudeToolUse => b.type === 'tool_use')

  if (toolUseBlocks.length === 0) {
    const text = (first.content.find((b): b is ClaudeTextBlock => b.type === 'text')?.text) ?? ''
    return { text, toolCalls: [], newTurn: { role: 'assistant', text } }
  }

  const resolvedCalls: SageHistoryMessage['toolCalls'] = []
  for (const block of toolUseBlocks) {
    const result = await onToolCall(block.name, block.input)
    resolvedCalls!.push({ id: block.id, name: block.name, input: block.input, result })
  }

  const preText = (first.content.find((b): b is ClaudeTextBlock => b.type === 'text')?.text) ?? ''
  const partialTurn: SageHistoryMessage = { role: 'assistant', text: preText, toolCalls: resolvedCalls }

  const secondMessages = [...historyToClaudeMessages(history), ...historyToClaudeMessages([partialTurn])]
  const second = await call(secondMessages)
  const finalText = (second.content.find((b): b is ClaudeTextBlock => b.type === 'text')?.text) ?? ''

  return {
    text: finalText,
    toolCalls: resolvedCalls!.map(({ name, input }) => ({ name, input })),
    newTurn: { role: 'assistant', text: finalText, toolCalls: resolvedCalls },
  }
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

type GeminiTextPart     = { text: string }
type GeminiFnCallPart   = { functionCall: { name: string; args: Record<string, unknown> } }
type GeminiFnRespPart   = { functionResponse: { name: string; response: Record<string, unknown> } }
type GeminiPart         = GeminiTextPart | GeminiFnCallPart | GeminiFnRespPart
type GeminiContent      = { role: 'user' | 'model'; parts: GeminiPart[] }
type GeminiResponse     = { candidates: Array<{ content: GeminiContent }> }

function historyToGeminiContents(history: SageHistoryMessage[]): GeminiContent[] {
  const out: GeminiContent[] = []
  for (const turn of history) {
    if (turn.role === 'user') {
      out.push({ role: 'user', parts: [{ text: turn.text }] })
    } else if (!turn.toolCalls || turn.toolCalls.length === 0) {
      out.push({ role: 'model', parts: [{ text: turn.text }] })
    } else {
      const modelParts: GeminiPart[] = []
      if (turn.text) modelParts.push({ text: turn.text })
      for (const tc of turn.toolCalls) {
        modelParts.push({ functionCall: { name: tc.name, args: tc.input } })
      }
      out.push({ role: 'model', parts: modelParts })
      out.push({
        role: 'user',
        parts: turn.toolCalls.map((tc) => ({
          functionResponse: { name: tc.name, response: { result: tc.result } },
        })),
      })
    }
  }
  return out
}

async function sendGemini(
  systemPrompt: string,
  history: SageHistoryMessage[],
  tools: SageTool[],
  onToolCall: ToolCallHandler,
): Promise<{ text: string; toolCalls: Array<{ name: string; input: Record<string, unknown> }>; newTurn: SageHistoryMessage }> {
  const key = geminiKey()
  if (!key) throw new Error('Gemini API key not configured.')

  const url = `${GEMINI_BASE}/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`
  const geminiTools = [{ function_declarations: tools.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters })) }]

  async function call(contents: GeminiContent[]) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        tools: geminiTools,
        tool_config: { function_calling_config: { mode: 'AUTO' } },
      }),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText)
      throw new Error(`Gemini API error ${res.status}: ${err}`)
    }
    return res.json() as Promise<GeminiResponse>
  }

  const contents = historyToGeminiContents(history)
  const first = await call(contents)
  const parts = first.candidates[0]?.content?.parts ?? []

  const fnCallParts = parts.filter((p): p is GeminiFnCallPart => 'functionCall' in p)

  if (fnCallParts.length === 0) {
    const text = (parts.find((p): p is GeminiTextPart => 'text' in p)?.text) ?? ''
    return { text, toolCalls: [], newTurn: { role: 'assistant', text } }
  }

  const resolvedCalls: SageHistoryMessage['toolCalls'] = []
  for (const part of fnCallParts) {
    const { name, args } = part.functionCall
    const result = await onToolCall(name, args)
    resolvedCalls!.push({ id: name, name, input: args, result })
  }

  const preText = (parts.find((p): p is GeminiTextPart => 'text' in p)?.text) ?? ''
  const partialTurn: SageHistoryMessage = { role: 'assistant', text: preText, toolCalls: resolvedCalls }

  const secondContents = [...historyToGeminiContents(history), ...historyToGeminiContents([partialTurn])]
  const second = await call(secondContents)
  const secondParts = second.candidates[0]?.content?.parts ?? []
  const finalText = (secondParts.find((p): p is GeminiTextPart => 'text' in p)?.text) ?? ''

  return {
    text: finalText,
    toolCalls: resolvedCalls!.map(({ name, input }) => ({ name, input })),
    newTurn: { role: 'assistant', text: finalText, toolCalls: resolvedCalls },
  }
}

// ─── OpenAI ──────────────────────────────────────────────────────────────────

type OpenAIToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } }
type OpenAIMsg =
  | { role: 'system' | 'user' | 'assistant'; content: string | null; tool_calls?: OpenAIToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string }

function historyToOpenAIMessages(systemPrompt: string, history: SageHistoryMessage[]): OpenAIMsg[] {
  const out: OpenAIMsg[] = [{ role: 'system', content: systemPrompt }]
  for (const turn of history) {
    if (turn.role === 'user') {
      out.push({ role: 'user', content: turn.text })
    } else if (!turn.toolCalls || turn.toolCalls.length === 0) {
      out.push({ role: 'assistant', content: turn.text })
    } else {
      out.push({
        role: 'assistant',
        content: turn.text || null,
        tool_calls: turn.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: JSON.stringify(tc.input) },
        })),
      })
      for (const tc of turn.toolCalls) {
        out.push({ role: 'tool', tool_call_id: tc.id, content: tc.result })
      }
    }
  }
  return out
}

async function sendOpenAI(
  systemPrompt: string,
  history: SageHistoryMessage[],
  tools: SageTool[],
  onToolCall: ToolCallHandler,
): Promise<{ text: string; toolCalls: Array<{ name: string; input: Record<string, unknown> }>; newTurn: SageHistoryMessage }> {
  const key = openaiKey()
  if (!key) throw new Error('OpenAI API key not configured.')

  const openAITools = tools.map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }))

  async function call(messages: OpenAIMsg[]) {
    const res = await fetch(`${OPENAI_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, tools: openAITools, tool_choice: 'auto' }),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText)
      throw new Error(`OpenAI API error ${res.status}: ${err}`)
    }
    return res.json() as Promise<{
      choices: Array<{ message: { role: string; content: string | null; tool_calls?: OpenAIToolCall[] } }>
    }>
  }

  const messages = historyToOpenAIMessages(systemPrompt, history)
  const first = await call(messages)
  const msg = first.choices[0]?.message
  const toolCalls = msg?.tool_calls ?? []

  if (toolCalls.length === 0) {
    const text = msg?.content ?? ''
    return { text, toolCalls: [], newTurn: { role: 'assistant', text } }
  }

  const resolvedCalls: SageHistoryMessage['toolCalls'] = []
  for (const tc of toolCalls) {
    const input = JSON.parse(tc.function.arguments) as Record<string, unknown>
    const result = await onToolCall(tc.function.name, input)
    resolvedCalls!.push({ id: tc.id, name: tc.function.name, input, result })
  }

  const preText = msg?.content ?? ''
  const partialTurn: SageHistoryMessage = { role: 'assistant', text: preText, toolCalls: resolvedCalls }
  const secondMessages = historyToOpenAIMessages(systemPrompt, [...history, partialTurn])
  const second = await call(secondMessages)
  const finalText = second.choices[0]?.message?.content ?? ''

  return {
    text: finalText,
    toolCalls: resolvedCalls!.map(({ name, input }) => ({ name, input })),
    newTurn: { role: 'assistant', text: finalText, toolCalls: resolvedCalls },
  }
}
