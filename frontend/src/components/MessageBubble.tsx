import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { User, Cpu } from 'lucide-react';

export function MessageBubble({ role, text }: { role: 'user' | 'model'; text: string }) {
    const isUser = role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                margin: '18px 0',
                width: '100%'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    gap: 8,
                    maxWidth: '85%'
                }}
            >
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: isUser ? '#7dd3fc' : '#c4b5fd',
                    background: isUser ? 'rgba(125, 211, 252, 0.1)' : 'rgba(196, 181, 253, 0.1)',
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${isUser ? 'rgba(125, 211, 252, 0.2)' : 'rgba(196, 181, 253, 0.2)'}`
                }}>
                    {isUser ? <User size={14} /> : <Cpu size={14} />}
                    {isUser ? 'YOU' : 'GEMINI MODEL'}
                </div>

                <div
                    style={{
                        padding: '16px 20px',
                        borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: isUser
                            ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.6), rgba(15, 23, 42, 0.8))'
                            : 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(12px)',
                        color: '#f8fafc',
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                        lineHeight: 1.6,
                        fontSize: '0.95rem',
                        wordBreak: 'break-word',
                        width: '100%'
                    }}
                    className="prose prose-invert max-w-none"
                >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {text}
                    </ReactMarkdown>
                </div>
            </div>
        </motion.div>
    );
}

export function LoadingBubble() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', justifyContent: 'flex-start', margin: '18px 0' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                    color: '#c4b5fd', background: 'rgba(196, 181, 253, 0.1)', padding: '4px 10px',
                    borderRadius: 999, border: '1px solid rgba(196, 181, 253, 0.2)'
                }}>
                    <Cpu size={14} className="animate-pulse" /> GEMINI MODEL
                </div>

                <div style={{
                    padding: '16px 20px', borderRadius: '20px 20px 20px 4px',
                    background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex', gap: 6, alignItems: 'center'
                }}>
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }}
                        />
                    ))}
                    <span style={{ marginLeft: 8, color: '#94a3b8', fontSize: '0.9rem' }}>Generating intelligent response...</span>
                </div>
            </div>
        </motion.div>
    );
}
