'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function ChatInterface({ isOpen, onClose, initialPrompt }: { isOpen: boolean; onClose: () => void; initialPrompt?: string | null }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Intelligence Protocol online. I can search clients, view policies, track renewals, run analytics, update premiums, change client info, and modify policy status. What do you need?',
      }]);
      if (initialPrompt) {
        setTimeout(() => {
          sendMessage(initialPrompt);
        }, 500);
      }
    }
  }, [isOpen, initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const conversationHistory = messages.map(m => ({ role: m.role, content: m.content }));
      conversationHistory.push({ role: 'user', content: text });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.content,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Failed to get response');
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message}. Check your DASHSCOPE_API_KEY and try again.`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
    }
  };

  const handleReset = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Intelligence Protocol online. I can search clients, view policies, track renewals, run analytics, update premiums, change client info, and modify policy status. What do you need?',
    }]);
    setInput('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-end pt-16 pr-8">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-[420px] h-[650px] bg-surface rounded-[32px] shadow-2xl border border-black/5 flex flex-col overflow-hidden font-body">
        {/* Header */}
        <div className="p-5 border-b border-black/5 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg relative">
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-surface"></div>
              </div>
              <div>
                <h3 className="font-black text-on-surface italic font-headline tracking-tight text-sm">Intelligence Protocol</h3>
                <p className="text-[9px] font-black text-secondary uppercase tracking-widest">
                  {isLoading ? 'Processing...' : error ? 'Error — Reset & Retry' : 'Active • Forensic Assistant'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {error && (
                <button
                  onClick={handleReset}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 transition-all"
                  title="Reset Chat"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                </button>
              )}
              <button
                onClick={handleReset}
                className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface/40 hover:text-on-surface hover:bg-black/5 transition-all"
                title="Reset Chat"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface/40 hover:text-on-surface hover:bg-black/5 transition-all"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-7 h-7 bg-primary/5 border border-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-slate-50 border border-black/5 text-on-surface'
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium italic">
                  {message.content}
                </div>
                <div className={`text-[9px] font-black uppercase tracking-widest mt-2 ${
                  message.role === 'user' ? 'text-white/40' : 'text-on-surface/20'
                }`}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="w-7 h-7 bg-slate-100 border border-black/5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-on-surface/40 text-sm">person</span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 bg-primary/5 border border-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
              </div>
              <div className="bg-slate-50 border border-black/5 px-4 py-3 rounded-2xl">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-on-surface/30 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-on-surface/30 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-on-surface/30 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-black/5">
          <form onSubmit={handleSubmit} className="flex gap-2.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Request agency intelligence..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
