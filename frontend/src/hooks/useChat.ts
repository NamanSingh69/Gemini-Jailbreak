import { useState, useCallback, useEffect } from 'react';
import { fetchHistory, sendMessage } from '../api';
import type { Message } from '../types';
import { toast } from 'sonner';

function newSessionId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useChat(initialModel: string = 'gemini-3.1-pro') {
    const [sessionId, setSessionId] = useState<string>(newSessionId());
    const [messages, setMessages] = useState<Message[]>([]);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setIsBusy(true);
        fetchHistory(sessionId)
            .then((h) => {
                if (mounted) {
                    const hist = (h.history ?? []) as Message[];
                    setMessages(hist);
                }
            })
            .catch(() => {
                if (mounted) setMessages([]);
            })
            .finally(() => {
                if (mounted) setIsBusy(false);
            });
        return () => { mounted = false; };
    }, [sessionId]);

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
            if (!apiKey.trim()) {
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
                const resp = await sendMessage({
                    sessionId,
                    model,
                    text,
                    useSystem,
                    temperature: 0.1,
                    files: files || [],
                    apiKey: apiKey.trim(),
                });

                const modelText =
                    typeof resp?.text === 'string' && resp.text.length > 0
                        ? resp.text
                        : resp?.error
                            ? `Error: ${resp.error}`
                            : 'No response text.';

                if (resp?.error) {
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
        [sessionId]
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
