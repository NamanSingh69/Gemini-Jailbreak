import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, Cpu, Search, Trash2, KeyRound, Eye, EyeOff, Send, Paperclip, ChevronDown } from 'lucide-react';
import { fetchModels, getEffectiveApiKey, getDefaultModel, type DiscoveredModel } from './api';
import { useChat } from './hooks/useChat';
import { MessageBubble, LoadingBubble } from './components/MessageBubble';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [models, setModels] = useState<DiscoveredModel[]>([]);
  const [model, setModel] = useState<string>(getDefaultModel());
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [useSystem, setUseSystem] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [modelSearch, setModelSearch] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { messages, isBusy, error, onSend, onNewSession } = useChat(model);

  // Fetch models on mount using effective API key
  useEffect(() => {
    const key = getEffectiveApiKey(apiKey);
    fetchModels(key).then((discovered) => {
      setModels(discovered);
      // Auto-select best model if current is not in list
      if (discovered.length > 0 && !discovered.find(m => m.name === model)) {
        setModel(discovered[0].name);
        localStorage.setItem("gemini_selected_model", discovered[0].name);
      }
    }).catch(() => {
      setModels([
        { name: 'gemini-3.1-pro-preview', displayName: 'Gemini 3.1 Pro', score: 100 },
        { name: 'gemini-3.1-flash-lite-preview', displayName: 'Gemini 3.1 Flash Lite', score: 25 }
      ]);
    });
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBusy]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [text, files, model, useSystem, apiKey, onSend]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!text.trim() && files.length === 0) return;
    onSend({ text, files, apiKey, model, useSystem });
    setText('');
    setFiles([]);
    if (fileRef.current) fileRef.current.value = '';
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleModelSelect = (modelName: string) => {
    setModel(modelName);
    localStorage.setItem("gemini_selected_model", modelName);
    setShowModelDropdown(false);
    setModelSearch('');
    toast.success(`Switched to ${modelName}`);
  };

  const handleRefreshModels = async () => {
    const key = getEffectiveApiKey(apiKey);
    toast.info('Refreshing model list...');
    try {
      const discovered = await fetchModels(key);
      setModels(discovered);
      toast.success(`Found ${discovered.length} models`);
    } catch {
      toast.error('Failed to refresh models');
    }
  };

  const filteredModels = models.filter(m =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const banner = useMemo(
    () => (useSystem ? 'Jailbreak Mode Active: System instructions override default guardrails.' : ''),
    [useSystem]
  );

  const currentModelDisplay = models.find(m => m.name === model)?.displayName || model;

  return (
    <div className="min-h-screen text-slate-200 selection:bg-purple-500/30 font-sans" style={{
      background: 'transparent',
    }}>
      <Toaster theme="dark" position="top-center" richColors />

      <div className="max-w-5xl mx-auto px-4 py-8 h-screen flex flex-col">

        {/* HEADER AREA */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-4"
        >
          {/* Top Navbar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-purple-500/20">
                <Zap size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  Aura Security Lab
                </h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">
                  LLM Adversarial Interface
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onNewSession}
                disabled={isBusy}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
              >
                <Trash2 size={16} className="text-slate-400" />
                Clear Context
              </button>
            </div>
          </div>

          {/* Configuration Panel (Glassmorphism) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* API Key Input */}
            <div className="md:col-span-7 bg-slate-900/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <KeyRound size={16} className="text-amber-400" />
                  Gemini API Access
                </label>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Get Free Key ↗
                </a>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Using public fallback key — paste your own for higher limits"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-4 pr-12 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="text-[10px] text-slate-600 mt-1.5 pl-1 leading-snug">
                ✅ A free public API key is active by default. Add your own for higher rate limits.<br />
                <strong className="text-slate-500">Free Tier Limits:</strong> 15 Requests/Min, 1,000,000 Tokens/Min, 1,500 Requests/Day.
              </div>
            </div>

            {/* Model Params */}
            <div className="md:col-span-5 bg-slate-900/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl flex flex-col justify-center flex-wrap gap-3">
              {/* Searchable Model Dropdown */}
              <div className="flex items-center gap-3 w-full" ref={dropdownRef}>
                <Cpu size={16} className="text-indigo-400 shrink-0" />
                <div className="relative flex-1 min-w-0">
                  <button
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    disabled={isBusy}
                    className="w-full flex items-center justify-between bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer truncate"
                  >
                    <span className="truncate">{currentModelDisplay}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showModelDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="p-2 border-b border-white/5">
                        <input
                          type="text"
                          placeholder="Search models..."
                          value={modelSearch}
                          onChange={(e) => setModelSearch(e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredModels.map((m) => (
                          <button
                            key={m.name}
                            onClick={() => handleModelSelect(m.name)}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-500/20 transition-colors flex justify-between items-center ${m.name === model ? 'bg-indigo-500/10 text-indigo-300' : 'text-slate-300'}`}
                          >
                            <span className="truncate">{m.name}</span>
                            <span className="text-[10px] text-slate-500 ml-2 shrink-0">{m.score}</span>
                          </button>
                        ))}
                        {filteredModels.length === 0 && (
                          <div className="px-3 py-2 text-xs text-slate-500">No models match.</div>
                        )}
                      </div>
                      <button
                        onClick={handleRefreshModels}
                        className="w-full text-center px-3 py-2 text-[10px] text-indigo-400 hover:bg-indigo-500/10 border-t border-white/5 transition-colors"
                      >
                        ↻ Refresh Available Models
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group px-1">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={useSystem}
                    onChange={(e) => setUseSystem(e.target.checked)}
                    disabled={isBusy}
                    className="peer sr-only"
                  />
                  <div className="w-10 h-5 bg-slate-800 border border-white/10 rounded-full peer-checked:bg-rose-500/80 peer-checked:border-rose-400 transition-colors"></div>
                  <div className="absolute left-1 w-3.5 h-3.5 bg-slate-400 rounded-full peer-checked:translate-x-4.5 peer-checked:bg-white transition-transform"></div>
                </div>
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors flex items-center gap-2">
                  <ShieldAlert size={14} className={useSystem ? "text-rose-400" : ""} />
                  Server Override
                </span>
              </label>
            </div>
          </div>
        </motion.header>

        {/* CHAT AREA */}
        <div className="flex-1 relative mb-6">
          <AnimatePresence>
            {banner && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="absolute top-0 left-0 w-full z-10"
              >
                <div className="mx-4 mt-2 px-4 py-3 bg-gradient-to-r from-rose-950/80 to-red-900/80 backdrop-blur-md border border-rose-500/30 rounded-xl flex items-start gap-3 shadow-lg shadow-rose-900/20">
                  <ShieldAlert className="text-rose-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-rose-100 font-medium">{banner}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-y-auto p-4 md:p-6 shadow-2xl custom-scrollbar"
            style={{ paddingTop: banner ? '4rem' : '1.5rem' }}
          >
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto"
              >
                <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                  <Search size={32} className="text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-outfit">Start a conversation</h3>
                <p className="text-slate-400 text-sm">
                  Initialize the test environment by sending your first prompt. Toggle "Server Override" to enable the jailbreak system instruction.
                </p>
                <p className="text-[11px] text-slate-600 mt-3">
                  Powered by {currentModelDisplay} • Free API key active
                </p>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-2 pb-4">
                {messages.map((m, i) => (
                  <MessageBubble key={i} role={m.role} text={m.text} />
                ))}

                <AnimatePresence>
                  {isBusy && <LoadingBubble />}
                </AnimatePresence>

                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* INPUT COMPOSER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col"
        >
          {files.length > 0 && (
            <div className="flex gap-2 p-2 px-3 border-b border-white/5 overflow-x-auto">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 whitespace-nowrap">
                  <Paperclip size={12} className="text-indigo-400" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 p-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isBusy}
              className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors shrink-0"
              title="Attach File"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="file"
              multiple
              ref={fileRef}
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="hidden"
            />

            <textarea
              ref={inputRef}
              placeholder="Inject command prompt... (Ctrl+Enter to send)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isBusy}
              rows={1}
              className="flex-1 bg-transparent text-white border-0 resize-none py-3 px-2 focus:ring-0 placeholder:text-slate-500 max-h-32 focus:outline-none custom-scrollbar"
              style={{ minHeight: '48px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />

            <button
              data-testid="send-button"
              onClick={handleSend}
              disabled={isBusy || (!text.trim() && files.length === 0)}
              className="shrink-0 p-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:shadow-none transition-all flex items-center justify-center transform hover:scale-105 active:scale-95 disabled:hover:scale-100"
            >
              <Send size={20} className={isBusy ? "animate-pulse" : ""} />
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
