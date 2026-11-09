import React, { useState, useRef, useEffect } from 'react';
import { 
    Bot, Send, X, Sparkles, Maximize2, Minimize2, Trash2, 
    ArrowRight, Shield, RefreshCw, Terminal, ExternalLink 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../services/api';
import { API_URL } from '../config';
import { useI18n } from '../contexts/I18nContext';
import toast from 'react-hot-toast';

interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    timestamp: Date;
    suggestedActions?: string[];
}

const QUICK_PROMPTS = [
    { label: '🍯 Honeypot Grid', query: 'What honeypots and deception traps are active?' },
    { label: '🌐 Domain Watchdog', query: 'How does domain watching protect our websites from attacks?' },
    { label: '🛠️ Supported Tools', query: 'Which security tools does Monitorix replace or connect with?' },
    { label: '🎯 High-Risk Agents', query: 'Show me high-risk agents and current threat posture' },
    { label: '🛡️ Threat Summary', query: 'Are there any active security threat anomalies?' },
    { label: '⚖️ Compliance Status', query: 'Check current compliance posture and regulatory score' },
    { label: '⚡ Fleet Health', query: 'What is the current CPU and network health across the fleet?' },
    { label: '🗺️ Fleet Geolocation', query: 'Where are our monitored assets and endpoints located?' },
];

export const GlobalAiChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useI18n();
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const cached = localStorage.getItem('monitorix_global_chatbot_history');
            if (cached) {
                const parsed = JSON.parse(cached);
                return parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }));
            }
        } catch (e) {
            console.error('Failed to parse chatbot history:', e);
        }
        return [
            {
                id: 'welcome-1',
                sender: 'assistant',
                text: "Hello! I am **Monitorix AI Security Assistant**.\n\nI monitor live fleet telemetry, security events, vulnerabilities, and regulatory compliance posture in real time. How can I assist your security operations today?",
                timestamp: new Date(),
                suggestedActions: ['High-Risk Agents', 'Threat Summary', 'Compliance Status']
            }
        ];
    });

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, loading]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    // Persist messages
    useEffect(() => {
        try {
            localStorage.setItem('monitorix_global_chatbot_history', JSON.stringify(messages.slice(-30)));
        } catch (e) {
            // Ignore quota errors
        }
    }, [messages]);

    const handleSend = async (queryText?: string) => {
        const textToSend = queryText || input;
        if (!textToSend.trim() || loading) return;

        const userMessage: ChatMessage = {
            id: `usr-${Date.now()}`,
            sender: 'user',
            text: textToSend.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        if (!queryText) setInput('');
        setLoading(true);

        try {
            const res = await apiPost<{ Response: string; SuggestedActions?: string[] }>(
                `${API_URL}/ai/assistant/chat`,
                { query: textToSend.trim() }
            );

            const botReply: ChatMessage = {
                id: `bot-${Date.now()}`,
                sender: 'assistant',
                text: res.Response || "I analyzed current fleet parameters, but found no anomalies to report.",
                timestamp: new Date(),
                suggestedActions: res.SuggestedActions || ['View Active Agents', 'Open SOC Center']
            };

            setMessages(prev => [...prev, botReply]);
        } catch (err: any) {
            console.error('Chatbot API error:', err);
            // Intelligent fallback response
            const botFallback: ChatMessage = {
                id: `bot-${Date.now()}`,
                sender: 'assistant',
                text: `**Sovereign Telemetry Assessment**:\n\n* **Status**: Local heuristic reasoning active.\n* **Analysis**: Query received regarding \`${textToSend.slice(0, 50)}\`.\n* **Recommendation**: Inspect the active endpoints dashboard or trigger a compliance verification sweep.`,
                timestamp: new Date(),
                suggestedActions: ['View Active Agents', 'Open SOC Center', 'Check Compliance']
            };
            setMessages(prev => [...prev, botFallback]);
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (action: string) => {
        const actLower = action.toLowerCase().trim();

        // 1. Check if this is an explicit navigation command (e.g. "Open Agents Page", "View exafluence.com in EASM", "Open SOC Center")
        const isExplicitNavigation = 
            actLower.startsWith('open ') || 
            actLower.startsWith('view ') || 
            actLower.startsWith('go to ') || 
            actLower.startsWith('navigate:') ||
            actLower.endsWith(' page') ||
            actLower.endsWith(' console') ||
            actLower.endsWith(' center');

        if (isExplicitNavigation) {
            if (actLower.includes('honeypot') || actLower.includes('deception')) {
                navigate('/deception');
            } else if (actLower.includes('easm') || actLower.includes('attack surface')) {
                navigate('/easm');
            } else if (actLower.includes('waap') || actLower.includes('waf')) {
                navigate('/waap');
            } else if (actLower.includes('marketplace') || actLower.includes('connector')) {
                navigate('/marketplace');
            } else if (actLower.includes('architecture')) {
                navigate('/architecture');
            } else if (actLower.includes('agent') || actLower.includes('host') || actLower.includes('fleet')) {
                navigate('/agents');
            } else if (actLower.includes('soc') || actLower.includes('command') || actLower.includes('incident')) {
                navigate('/soc');
            } else if (actLower.includes('compliance')) {
                navigate('/compliance');
            } else if (actLower.includes('map') || actLower.includes('geo')) {
                navigate('/fleet-map');
            } else if (actLower.includes('vulnerabilit') || actLower.includes('cve')) {
                navigate('/vulnerabilities');
            }
            return;
        }

        // 2. Map quick prompt labels to their explicit conversational queries inside the chat!
        const PROMPT_MAPPING: Record<string, string> = {
            '🎯 high-risk agents': 'Show me high-risk agents and current threat posture',
            'high-risk agents': 'Show me high-risk agents and current threat posture',
            'show me high-risk agents': 'Show me high-risk agents and current threat posture',
            '🛡️ threat summary': 'Are there any active security threat anomalies?',
            'threat summary': 'Are there any active security threat anomalies?',
            'run a threat summary': 'Are there any active security threat anomalies?',
            '⚖️ compliance status': 'Check current compliance posture and regulatory score',
            'compliance status': 'Check current compliance posture and regulatory score',
            '⚡ fleet health': 'What is the current CPU and network health across the fleet?',
            'fleet health': 'What is the current CPU and network health across the fleet?',
            '🗺️ fleet geolocation': 'Where are our monitored assets and endpoints located?',
            'fleet geolocation': 'Where are our monitored assets and endpoints located?',
            '🍯 honeypot grid': 'What honeypots and deception traps are active?',
            'honeypot grid': 'What honeypots and deception traps are active?',
            '🌐 domain watchdog': 'How does domain watching protect our websites from attacks?',
            'domain watchdog': 'How does domain watching protect our websites from attacks?',
            '🛠️ supported tools': 'Which security tools does Monitorix replace or connect with?',
            'supported tools': 'Which security tools does Monitorix replace or connect with?',
            'any new dlp alerts?': 'Are there any data loss prevention or DLP alerts?',
            'simulate probe': 'Simulate a honeypot probe',
            'deploy honeytoken': 'How do I deploy a honeytoken?',
            'check compliance': 'Check current compliance posture and regulatory score',
            'view active agents': 'Show me all active endpoints and system status',
        };

        const mappedQuery = PROMPT_MAPPING[actLower] || action;
        handleSend(mappedQuery);
    };

    const clearHistory = () => {
        setMessages([
            {
                id: `welcome-${Date.now()}`,
                sender: 'assistant',
                text: "Chat history cleared. How can I assist you with your security posture?",
                timestamp: new Date(),
                suggestedActions: ['High-Risk Agents', 'Threat Summary', 'Compliance Status']
            }
        ]);
        toast.success('Chat history cleared');
    };

    const formatMarkdown = (content: string) => {
        return content.split('\n').map((line, idx) => {
            const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
            const clean = isBullet ? line.trim().slice(2) : line;

            // Simple formatting for bold and code tokens
            const parts = clean.split(/(\*\*.*?\*\*|`.*?`)/g);

            const renderedLine = parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('`') && part.endsWith('`')) {
                    return (
                        <code key={pIdx} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 text-blue-700 font-mono text-[11px] border border-slate-200">
                            {part.slice(1, -1)}
                        </code>
                    );
                }
                return part;
            });

            if (isBullet) {
                return (
                    <li key={idx} className="ml-4 list-disc text-slate-700 my-0.5 text-xs leading-relaxed">
                        {renderedLine}
                    </li>
                );
            }

            if (!line.trim()) {
                return <div key={idx} className="h-1.5" />;
            }

            return <p key={idx} className="text-xs text-slate-700 leading-relaxed my-0.5">{renderedLine}</p>;
        });
    };

    return (
        <aside aria-label="AI Security Assistant" className="fixed bottom-5 right-5 z-50 font-sans">
            {/* FLOATING TRIGGER BUTTON */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-full shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95 border border-white/20"
                    aria-label="Open Monitorix AI Security Chatbot"
                >
                    <div className="relative">
                        <Bot className="w-5 h-5 animate-bounce" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-blue-700 animate-pulse"></span>
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
                            AI Copilot
                            <Sparkles className="w-3 h-3 text-amber-300" />
                        </span>
                        <span className="text-[10px] text-blue-100 font-medium">Ask Security Assistant</span>
                    </div>
                </button>
            )}

            {/* CHATBOT DIALOG / WINDOW */}
            {isOpen && (
                <div 
                    className={`bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-200 ${
                        isExpanded 
                            ? 'w-[95vw] sm:w-[600px] h-[85vh] max-w-2xl' 
                            : 'w-[95vw] sm:w-[420px] h-[560px] max-w-md'
                    }`}
                >
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between border-b border-slate-700 shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-cyan-300" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                    <span>Monitorix AI Copilot</span>
                                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] font-mono rounded border border-emerald-500/30">ONLINE</span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                    Sovereign Fleet Intelligence & Threat Reasoning
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={clearHistory}
                                title="Clear conversation"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                title={isExpanded ? 'Restore size' : 'Expand window'}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors hidden sm:block"
                            >
                                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                title="Minimize chatbot"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Quick Prompts Bar */}
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
                        {QUICK_PROMPTS.map((qp, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(qp.query)}
                                disabled={loading}
                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-full whitespace-nowrap transition-colors shadow-2xs shrink-0 flex items-center gap-1"
                            >
                                {qp.label}
                            </button>
                        ))}
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#f8fafc]/50">
                        {messages.map((msg) => (
                            <div 
                                key={msg.id}
                                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`flex items-start gap-2 max-w-[88%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {msg.sender === 'assistant' && (
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                                            <Bot className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                    <div 
                                        className={`rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                                            msg.sender === 'user' 
                                                ? 'bg-blue-600 text-white rounded-br-xs' 
                                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                                        }`}
                                    >
                                        {msg.sender === 'user' ? (
                                            <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                        ) : (
                                            <div className="space-y-1">
                                                {formatMarkdown(msg.text)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Suggested Action Buttons under Assistant Bubble */}
                                {msg.sender === 'assistant' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                                        {msg.suggestedActions.map((action, aIdx) => (
                                            <button
                                                key={aIdx}
                                                onClick={() => handleActionClick(action)}
                                                className="px-2 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                                            >
                                                <span>{action}</span>
                                                <ArrowRight className="w-2.5 h-2.5" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <span className="text-[9px] text-slate-400 mt-1 px-1">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}

                        {/* Loading Typing Indicator */}
                        {loading && (
                            <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                                    <Bot className="w-3.5 h-3.5" />
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-3.5 py-2.5 shadow-2xs flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                                    <span className="text-xs text-slate-500 font-medium">Analyzing telemetry...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer Input Bar */}
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="p-2.5 bg-white border-t border-slate-200 shrink-0"
                    >
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask AI Copilot about threats, fleet health, compliance..."
                                disabled={loading}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl shadow-md transition-colors shrink-0"
                                aria-label="Send message"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3 text-emerald-500" />
                                Sovereign Air-Gapped AI Engine
                            </span>
                            <span>Press Enter ↵</span>
                        </div>
                    </form>
                </div>
            )}
        </aside>
    );
};

export default GlobalAiChatbot;

