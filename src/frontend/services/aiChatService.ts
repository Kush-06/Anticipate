import { Capacitor } from "@capacitor/core"

// TODO: proxy via Supabase Edge Function before production — VITE_* vars are bundled into JS and visible to end users

const isNative = Capacitor.isNativePlatform()

// In dev, requests go through the Vite proxy (same-origin, no CORS check).
// In production (Vercel web), we use the Vercel proxy (configured in vercel.json) to bypass CORS.
// In production (Capacitor native WebView), direct URLs work fine.
const OPENAI_BASE = isNative ? 'https://api.openai.com' : '/api/openai'
const GEMINI_BASE = isNative ? 'https://generativelanguage.googleapis.com' : '/api/gemini'
const CLAUDE_BASE = isNative ? 'https://api.anthropic.com' : '/api/claude'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

type Provider = 'gemini' | 'openai' | 'claude'

function geminiKey(): string {
  return ((import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? '').trim()
}

function openaiKey(): string {
  return ((import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ?? '').trim()
}

function claudeKey(): string {
  return ((import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined) ?? '').trim()
}

function keyForProvider(p: Provider): string {
  if (p === 'gemini') return geminiKey()
  if (p === 'openai') return openaiKey()
  return claudeKey()
}

export function getActiveProvider(): Provider | null {
  const provider = ((import.meta.env.VITE_AI_PROVIDER as string | undefined) ?? '').trim().toLowerCase()
  
  if (provider === 'gemini' || provider === 'openai' || provider === 'claude') {
    return keyForProvider(provider) ? provider : null
  }
  // No provider set — fall back to first key found
  for (const p of ['gemini', 'openai', 'claude'] as Provider[]) {
    if (keyForProvider(p)) return p
  }
  return null
}

export function hasActiveProvider(): boolean {
  return getActiveProvider() !== null
}

async function callGemini(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const key = geminiKey()
  const url = `${GEMINI_BASE}/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data = await res.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>
  }
  return data.candidates[0].content.parts[0].text
}

async function callOpenAI(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const key = openaiKey()

  const res = await fetch(`${OPENAI_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`OpenAI API error ${res.status}: ${err}`)
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>
  }
  return data.choices[0].message.content
}

async function callClaude(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const key = claudeKey()

  const res = await fetch(`${CLAUDE_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      // Required for direct browser/WebView access
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = await res.json() as {
    content: Array<{ type: string; text: string }>
  }
  return data.content[0].text
}

export async function sendChatMessage(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const provider = getActiveProvider()
  if (!provider) {
    throw new Error('No AI provider configured. Set VITE_AI_PROVIDER to gemini, openai, or claude and add the matching API key.')
  }
  if (provider === 'gemini') return callGemini(systemPrompt, messages)
  if (provider === 'openai') return callOpenAI(systemPrompt, messages)
  return callClaude(systemPrompt, messages)
}
