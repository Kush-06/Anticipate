// TODO: proxy via Supabase Edge Function before production — VITE_* vars are bundled into JS and visible to end users

// In dev, requests go through the Vite proxy (same-origin, no CORS check).
// In production (Capacitor native WebView), direct URLs work fine.
const OPENAI_BASE = import.meta.env.DEV ? '/api/openai' : 'https://api.openai.com'
const GEMINI_BASE = import.meta.env.DEV
  ? '/api/gemini'
  : 'https://generativelanguage.googleapis.com'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

type Provider = 'gemini' | 'openai'

function getProviderOrder(): Provider[] {
  const raw = import.meta.env.VITE_AI_PROVIDER_ORDER as string | undefined
  const list = (raw ?? 'gemini,openai')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Provider => s === 'gemini' || s === 'openai')
  return list.length > 0 ? list : ['gemini', 'openai']
}

function geminiKey(): string {
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? ''
}

function openaiKey(): string {
  return (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ?? ''
}

function keyForProvider(p: Provider): string {
  return p === 'gemini' ? geminiKey() : openaiKey()
}

export function getActiveProvider(): Provider | null {
  for (const p of getProviderOrder()) {
    if (keyForProvider(p)) return p
  }
  return null
}

export function hasActiveProvider(): boolean {
  return getActiveProvider() !== null
}

async function callGemini(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const key = geminiKey()
  const url = `${GEMINI_BASE}/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`

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

export async function sendChatMessage(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const provider = getActiveProvider()
  if (!provider) {
    throw new Error('No AI provider configured. Add VITE_GEMINI_API_KEY or VITE_OPENAI_API_KEY to .env.')
  }
  if (provider === 'gemini') return callGemini(systemPrompt, messages)
  return callOpenAI(systemPrompt, messages)
}
