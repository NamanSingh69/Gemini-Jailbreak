import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useChat } from './useChat'
import { sendMessage } from '../api'

vi.mock('../api', () => ({
    sendMessage: vi.fn(),
    fetchModels: vi.fn().mockResolvedValue(['gemini-3.1-pro']),
    fetchHistory: vi.fn().mockResolvedValue({ history: [] })
}))

describe('useChat Hook State Transitions', () => {
    it('initializes with empty state and default loading', async () => {
        const { result } = renderHook(() => useChat())

        await waitFor(() => {
            expect(result.current.isBusy).toBe(false)
        })
        expect(result.current.messages).toEqual([])
    })

    it('handles sending a message and state transition to busy then success', async () => {
        // @ts-ignore
        sendMessage.mockResolvedValueOnce({ text: 'Hello from AI' })
        const { result } = renderHook(() => useChat())

        await waitFor(() => {
            expect(result.current.isBusy).toBe(false)
        })

        let sendPromise: Promise<void> | undefined;

        act(() => {
            sendPromise = result.current.onSend({ text: 'Hello', apiKey: 'test-key', model: 'gemini-3.1-pro', useSystem: false })
        })

        // Immediately after calling onSend, state should be busy and user message added
        expect(result.current.isBusy).toBe(true)
        expect(result.current.messages).toHaveLength(1)
        expect(result.current.messages[0]).toEqual({ role: 'user', text: 'Hello' })

        await act(async () => {
            await sendPromise
        })

        // After resolution, state should not be busy and AI message added
        expect(result.current.isBusy).toBe(false)
        expect(result.current.messages).toHaveLength(2)
        expect(result.current.messages[1]).toEqual({ role: 'model', text: 'Hello from AI' })
    })

    it('handles API errors gracefully and adds human-readable error messages', async () => {
        // @ts-ignore
        sendMessage.mockRejectedValueOnce(new Error('Invalid API Key'))
        const { result } = renderHook(() => useChat())

        await waitFor(() => {
            expect(result.current.isBusy).toBe(false)
        })

        await act(async () => {
            await result.current.onSend({ text: 'Hello', apiKey: 'bad-key', model: 'gemini-3.1-pro', useSystem: false })
        })

        expect(result.current.isBusy).toBe(false)
        expect(result.current.messages).toHaveLength(2)
        expect(result.current.messages[1].role).toBe('model')
        expect(result.current.messages[1].text).toContain('Request failed')
    })
})
