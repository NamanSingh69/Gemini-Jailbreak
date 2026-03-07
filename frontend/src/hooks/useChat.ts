import { useState, useCallback } from 'react';
import { sendMessage, getEffectiveApiKey } from '../api';
import type { Message } from '../types';
import { toast } from 'sonner';

function newSessionId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useChat(initialModel: string = 'gemini-3.1-pro-preview') {
    const [sessionId, setSessionId] = useState<string>(newSessionId());
    const [messages, setMessages] = useState<Message[]>([]);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onNewSession = useCallback(() => {
        setSessionId(newSessionId());
        setMessages([]);
        setError(null);
        toast.success('Started a new anonymous session', {
            description: 'Your previous chat history has been cleared from the view.',
        });
    }, []);

    const onSend = useCallback(
        async ({
            text,
            files,
            apiKey,
            model,
            useSystem
        }: {
            text: string;
            files?: File[];
            apiKey: string;
            model: string;
            useSystem: boolean;
        }) => {
            const effectiveKey = getEffectiveApiKey(apiKey);
            if (!effectiveKey || effectiveKey.length < 10) {
                toast.error('API Key Required', {
                    description: 'Please enter your Gemini API key in the settings panel.',
                });
                return;
            }

            if (!text.trim() && (!files || files.length === 0)) return;

            const userMsg: Message = { role: 'user', text };
            setMessages((prev) => [...prev, userMsg]);
            setIsBusy(true);
            setError(null);

            try {
                // Build history for multi-turn conversation
                const history = messages.map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.text }]
                }));

                const resp = await sendMessage({
                    model,
                    text,
                    useSystem,
                    temperature: 0.1,
                    apiKey: effectiveKey,
                    history,
                });

                const modelText = resp.text || 'No response text.';

                if (resp.error) {
                    setError(resp.error);
                    toast.error('Model encountered an error', { description: resp.error });
                }

                const modelMsg: Message = { role: 'model', text: modelText };
                setMessages((prev) => [...prev, modelMsg]);
            } catch (e: any) {
                const errText = `Request failed: ${String(e)}`;
                setError(errText);
                toast.error('Network Error', { description: errText });
                const modelMsg: Message = { role: 'model', text: errText };
                setMessages((prev) => [...prev, modelMsg]);
            } finally {
                setIsBusy(false);
            }
        },
        [messages]
    );

    return {
        sessionId,
        messages,
        isBusy,
        error,
        onSend,
        onNewSession,
    };
}
