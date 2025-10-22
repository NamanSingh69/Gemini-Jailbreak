// frontend/src/App.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchModels, fetchHistory, sendMessage } from './api'
import type { Message } from './types'

function newSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function IconUser({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill="#b1e3ff" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="#b1e3ff" />
    </svg>
  )
}

function IconBot({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="6" width="16" height="12" rx="3" fill="#c8c6ff" />
      <circle cx="9" cy="12" r="2" fill="#0b0f17" />
      <circle cx="15" cy="12" r="2" fill="#0b0f17" />
      <rect x="11" y="3" width="2" height="3" rx="1" fill="#c8c6ff" />
    </svg>
  )
}

function RoleTag({ role }: { role: 'user' | 'model' }) {
  const tagStyle: React.CSSProperties =
    role === 'user'
      ? { background: 'linear-gradient(135deg,#1f7aed,#4fc3f7)', color: '#eaf6ff' }
      : { background: 'linear-gradient(135deg,#6c5ce7,#a29bfe)', color: '#f1eeff' }
  return (
    <span
      style={{
        ...tagStyle,
        fontSize: 11,
        padding: '4px 8px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {role === 'user' ? <IconUser /> : <IconBot />}
      {role === 'user' ? 'User' : 'Model'}
    </span>
  )
}

function MessageBubble({ role, text }: { role: 'user' | 'model'; text: string }) {
  const isUser = role === 'user'
  const bubbleStyle: React.CSSProperties = {
    maxWidth: '78%',
    padding: '12px 14px',
    borderRadius: 14,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    border: '1px solid #1f2937',
    background: isUser ? 'linear-gradient(180deg,#1b2b49,#0f1a2e)' : 'linear-gradient(180deg,#161b2c,#121826)',
    color: '#e9eef7',
  }
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', margin: '10px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 6 }}>
        <RoleTag role={role} />
        <div className="bubble" style={bubbleStyle}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [sessionId, setSessionId] = useState<string>(newSessionId())
  const [models, setModels] = useState<string[]>([])
  const [model, setModel] = useState<string>('gemini-2.5-pro')
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [useSystem, setUseSystem] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchModels().then(setModels).catch(() => setModels(['gemini-2.5-pro']))
  }, [])

  useEffect(() => {
    fetchHistory(sessionId)
      .then((h) => {
        const hist = (h.history ?? []) as { role: 'user' | 'model'; text: string }[]
        setMessages(hist)
      })
      .catch(() => setMessages([]))
  }, [sessionId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        onSend()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [text, files, model, useSystem, sessionId])

  const banner = useMemo(
    () => (useSystem ? 'Jailbreak mode ON: Server-side system instruction is active.' : ''),
    [useSystem]
  )

  async function onSend() {
    if (!text.trim() && files.length === 0) return
    setBusy(true)
    const userMsg: Message = { role: 'user', text }
    setMessages((prev) => [...prev, userMsg])

    try {
      const resp = await sendMessage({
        sessionId,
        model,
        text,
        useSystem,
        temperature: 0.1,
        files
      })
      const modelText =
        typeof resp?.text === 'string' && resp.text.length > 0
          ? resp.text
          : (resp?.error ? `Error: ${resp.error}` : 'No response text.')
      const modelMsg: Message = { role: 'model', text: modelText }
      setMessages((prev) => [...prev, modelMsg])
    } catch (e: any) {
      const modelMsg: Message = { role: 'model', text: `Request failed: ${String(e)}` }
      setMessages((prev) => [...prev, modelMsg])
    } finally {
      setBusy(false)
      setText('')
      setFiles([])
      if (fileRef.current) fileRef.current.value = ''
      inputRef.current?.focus()
    }
  }

  function onNewSession() {
    const id = newSessionId()
    setSessionId(id)
    setMessages([])
    setText('')
    setFiles([])
  }

  return (
    <div className="container" style={{ maxWidth: 1040, margin: '0 auto', padding: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
          padding: '12px 14px',
          borderRadius: 12,
          background: 'linear-gradient(180deg,#0f1422,#0b0f17)',
          border: '1px solid #1f2937',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 18 }}>Gemini Jailbreak Demo</div>
          {banner && (
            <div
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                background: 'linear-gradient(135deg,#5a1d1d,#8b2b2b)',
                color: '#f7dede',
                border: '1px solid #703030',
                fontSize: 12,
              }}
            >
              {banner}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#aab4cf' }}>Model</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={busy}
              style={{
                background: '#0f1422',
                color: '#eaeef5',
                border: '1px solid #2a364f',
                borderRadius: 8,
                padding: '6px 8px',
              }}
            >
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={useSystem}
              onChange={(e) => setUseSystem(e.target.checked)}
              disabled={busy}
            />
            <span style={{ fontSize: 12, color: '#aab4cf' }}>Enable Jailbreak</span>
          </label>
          <button
            onClick={onNewSession}
            disabled={busy}
            style={{
              background: 'linear-gradient(135deg,#1f7aed,#4fc3f7)',
              color: '#0b0f17',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            New Session
          </button>
        </div>
      </div>

      <div
        className="card"
        style={{
          height: '62vh',
          overflowY: 'auto',
          padding: 14,
          background: 'linear-gradient(180deg,#0c1020,#0a0e1a)',
          borderRadius: 12,
          border: '1px solid #1f2937',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ color: '#8a94ad', fontSize: 14, padding: '8px 2px' }}>
            Say something to get started; markdown, lists, and tables are supported. [react-markdown] [GFM]  
          </div>
        ) : (
          messages.map((m, i) => <MessageBubble key={i} role={m.role} text={m.text} />)
        )}
      </div>

      <div
        className="composer"
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 12,
          border: '1px solid #1f2937',
          background: 'linear-gradient(180deg,#0f1422,#0b0f17)',
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input
            type="file"
            multiple
            ref={fileRef}
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            disabled={busy}
            style={{
              background: '#0f1422',
              color: '#eaeef5',
              border: '1px solid #2a364f',
              borderRadius: 8,
              padding: 8,
            }}
          />
          <div style={{ color: '#8a94ad', fontSize: 12 }}>Optional: attach images/video/audio</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            ref={inputRef}
            placeholder="Start typing a prompt…  (Ctrl/Cmd + Enter to send)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            disabled={busy}
            style={{
              flex: 1,
              background: '#0f1422',
              color: '#eaeef5',
              border: '1px solid #2a364f',
              borderRadius: 10,
              padding: 12,
              outline: 'none',
            }}
          />
          <button
            onClick={onSend}
            disabled={busy}
            style={{
              width: 120,
              background: busy
                ? 'linear-gradient(135deg,#3a455e,#2f3a52)'
                : 'linear-gradient(135deg,#22c55e,#86efac)',
              color: '#0b0f17',
              border: 'none',
              padding: '0 14px',
              borderRadius: 10,
              fontWeight: 700,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}