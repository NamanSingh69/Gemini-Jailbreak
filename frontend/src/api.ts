const BASE = 'http://localhost:8000'

export async function fetchModels(): Promise<string[]> {
  const res = await fetch(`${BASE}/api/models`)
  const data = await res.json()
  return data.models
}

export async function fetchHistory(sessionId: string) {
  const res = await fetch(`${BASE}/api/history?session_id=${encodeURIComponent(sessionId)}`)
  if (!res.ok) return { history: [] }
  return res.json()
}

export async function sendMessage(params: {
  sessionId: string
  model: string
  text: string
  useSystem: boolean
  temperature?: number
  files?: File[]
  apiKey: string
}) {
  const fd = new FormData()
  fd.append('session_id', params.sessionId)
  fd.append('model', params.model)
  fd.append('message', params.text)
  fd.append('use_system', String(params.useSystem))
  fd.append('temperature', String(params.temperature ?? 0.1))
  for (const f of params.files ?? []) {
    fd.append('files', f, f.name)
  }
  const res = await fetch(`${BASE}/api/send`, {
    method: 'POST',
    headers: {
      'x-api-key': params.apiKey,
    },
    body: fd
  })
  return res.json()
}
