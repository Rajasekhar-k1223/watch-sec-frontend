import { useState, useRef, useEffect } from 'react';
import { Brain, Sparkles, Send, Bot, User, Zap, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';
import { apiPost } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Message {
    sender: 'user' | 'copilot';
    text: string;
    timestamp: Date;
    suggestedActions?: string[];
}

export default function AiCopilot() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>(() => {
        try {
            const cached = localStorage.getItem('monitorix_copilot_chats');
            if (cached) {
                const parsed = JSON.parse(cached);
                return parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }));
            }
        } catch (e) {
            console.error("Failed to load cached copilot chats:", e);
        }
        return [
            {
                sender: 'copilot',
                text: "Hello! I am the Monitorix AI Security Copilot. I analyze real-time fleet telemetry, identify anomalous execution signatures, correlate compliance posture, and suggest active remediation steps. How can I help you coordinate fleet defense today?",
                timestamp: new Date(),
                suggestedActions: ["Show me high-risk agents", "Any new DLP alerts?", "Run a threat summary"]
            }
        ];
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Persist chats in LocalStorage
    useEffect(() => {
        try {
            localStorage.setItem('monitorix_copilot_chats', JSON.stringify(messages));
        } catch (e) {
            console.error("Failed to save copilot chats:", e);
        }
    }, [messages]);

    const handleSend = async (queryText: string) => {
        if (!queryText.trim() || loading) return;

        const userMsgText = queryText;
        setInput('');
        
        // Append user message
        setMessages(prev => [...prev, {
            sender: 'user',
            text: userMsgText,
            timestamp: new Date()
        }]);

        setLoading(true);

        try {
            // Call backend assistant chatbot
            const response = await apiPost<{ Response: string; SuggestedActions?: string[] }>(
                `${API_URL}/ai/assistant/chat`,
                { query: userMsgText }
            );

            setMessages(prev => [...prev, {
                sender: 'copilot',
                text: response.Response || "I've processed the telemetry but got an empty assessment.",
                timestamp: new Date(),
                suggestedActions: response.SuggestedActions || []
            }]);
        } catch (err: any) {
            console.error(err);
            toast.error("AI Analysis connection failed.");
            setMessages(prev => [...prev, {
                sender: 'copilot',
                text: "My neural reasoning cluster is temporarily unreachable. Please verify backend container runtime connectivity.",
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (action: string) => {
        toast.success(`Executing: ${action}`);
        if (action.toLowerCase().includes("agent") || action.toLowerCase().includes("view")) {
            navigate('/agents');
        } else if (action.toLowerCase().includes("dlp") || action.toLowerCase().includes("policy")) {
            navigate('/policies');
        } else if (action.toLowerCase().includes("threat") || action.toLowerCase().includes("vulnerabilit")) {
            navigate('/vulnerabilities');
        } else {
            handleSend(action);
        }
    };

    const renderMarkdown = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, lIdx) => {
            const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
            let cleanLine = isBullet ? line.trim().substring(2) : line;

            let sanitized = cleanLine
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // Replace **bold**
            sanitized = sanitized.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Replace `code`
            sanitized = sanitized.replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 font-mono text-[10px] text-blue-500 border border-slate-200/40 dark:border-slate-800/40">$1</code>');

            if (isBullet) {
                return (
                    <li key={lIdx} className="ml-4 list-disc pl-1 text-[11px] leading-relaxed text-slate-700 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: sanitized }} />
                );
            }

            return (
                <p key={lIdx} className="min-h-[1.25em] text-[11px] leading-relaxed text-slate-700 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: sanitized }} />
            );
        });
    };

    return (
        <div className="min-h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 p-4 md:p-6 bg-slate-50/50 dark:bg-black/10">
            {/* Left Column: Copilot Interface */}
            <div className="flex-1 glass-card border border-blue-500/10 flex flex-col h-[75vh] md:h-[80vh] relative overflow-hidden group">
                {/* Background Ambient Glow */}
                <div className="absolute top-[-20%] left-[-20%] w-72 h-72 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>

                {/* Copilot Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between relative z-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20 shadow-2xl relative">
                            <Brain className="w-6 h-6 animate-pulse" />
                            <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 animate-pulse"></div>
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-tight">AI Security Copilot</h2>
                            <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black mt-1">Autonomous Orchestrator v2.1</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure you want to clear your conversation history?")) {
                                    localStorage.removeItem('monitorix_copilot_chats');
                                    setMessages([
                                        {
                                            sender: 'copilot',
                                            text: "Hello! I am the Monitorix AI Security Copilot. I analyze real-time fleet telemetry, identify anomalous execution signatures, correlate compliance posture, and suggest active remediation steps. How can I help you coordinate fleet defense today?",
                                            timestamp: new Date(),
                                            suggestedActions: ["Show me high-risk agents", "Any new DLP alerts?", "Run a threat summary"]
                                        }
                                    ]);
                                    toast.success("Conversation history cleared.");
                                }
                            }}
                            className="text-[9px] font-black bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-500 px-2.5 py-1.5 rounded-xl border border-rose-500/20 uppercase tracking-widest transition-all cursor-pointer mr-2"
                        >
                            Clear History
                        </button>
                        <span className="text-[8px] font-black bg-blue-500/10 text-blue-500 px-2 py-1 rounded border border-blue-500/20 uppercase tracking-widest">
                            LLM Engine Online
                        </span>
                    </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10 bg-white/10 dark:bg-black/10">
                    {messages.map((msg, index) => {
                        const isCopilot = msg.sender === 'copilot';
                        return (
                            <div
                                key={index}
                                className={`flex gap-4 max-w-[85%] ${
                                    isCopilot ? 'mr-auto' : 'ml-auto flex-row-reverse'
                                }`}
                            >
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-lg ${
                                    isCopilot 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                                }`}>
                                    {isCopilot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                </div>

                                {/* Bubble */}
                                <div className="space-y-3">
                                    <div className={`p-4 rounded-3xl text-xs leading-relaxed font-medium ${
                                        isCopilot
                                            ? 'bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-200 shadow-xl shadow-slate-100/10'
                                            : 'bg-blue-600 text-white shadow-xl shadow-blue-500/10'
                                    }`}>
                                        {isCopilot ? (
                                            <div className="space-y-1.5">
                                                {renderMarkdown(msg.text)}
                                            </div>
                                        ) : (
                                            msg.text
                                        )}
                                    </div>

                                    {/* Suggested Actions inside message bubble (Copilot only) */}
                                    {isCopilot && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {msg.suggestedActions.map((action, aIdx) => (
                                                <button
                                                    key={aIdx}
                                                    onClick={() => handleActionClick(action)}
                                                    className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-500 border border-blue-500/20 hover:border-blue-500 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                                                >
                                                    {action}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {loading && (
                        <div className="flex gap-4 max-w-[80%] mr-auto items-center">
                            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-lg animate-pulse">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="flex items-center gap-1.5 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-100"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-200"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800/50 relative z-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend(input);
                        }}
                        className="flex gap-3 bg-white dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me about fleet risk, anomalies, or exfiltration vulnerability..."
                            className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-medium placeholder-slate-400 focus:outline-none"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl active:scale-95 disabled:scale-100 disabled:opacity-40 transition-all shrink-0 flex items-center justify-center"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Right Column: AI Model Stats / Capabilities Panel */}
            <div className="w-full md:w-80 flex flex-col gap-6 shrink-0">
                {/* Tactical Directives Card */}
                <div className="glass-card p-6 border border-blue-500/10 relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-20%] w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Neural Directives</h3>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Scikit-Learn Classifier v1.8</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div className="p-4 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-200/50 dark:border-slate-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Classification Engine</span>
                                <span className="text-[8px] font-black uppercase bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Active</span>
                            </div>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                Evaluates raw terminal log text in real time using a Multinomial Naive Bayes classifier to instantly identify Privilege Escalation, Brute-Force Authentication, and DLP exfiltration leaks.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-200/50 dark:border-slate-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Tactical Remediation</span>
                                <span className="text-[8px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Ready</span>
                            </div>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                Seamlessly correlates risk alerts against global policy rules to suggest immediate containment containment commands, such as network interface isolation.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Active Threat Posture Card */}
                <div className="glass-card p-6 border border-blue-500/10 relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-20%] w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <Zap className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Suggested Queries</h3>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Interactive Prompts</p>
                        </div>
                    </div>

                    <div className="space-y-2 relative z-10">
                        {[
                            "Are there any suspicious threat patterns?",
                            "What critical vulnerabilities are currently active?",
                            "Show high-risk agents",
                            "Any new DLP alerts?"
                        ].map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(prompt)}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-900/5 dark:hover:bg-white/5 hover:translate-x-1 transition-all group/item text-left"
                            >
                                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">{prompt}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-blue-500 transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat History Panel */}
                <div className="glass-card p-6 border border-blue-500/10 relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-20%] w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            <Brain className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Chat History</h3>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Prompt Audit Ledger</p>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar relative z-10 pr-1">
                        {messages.filter(m => m.sender === 'user').length > 0 ? (
                            messages
                                .filter(m => m.sender === 'user')
                                .map((msg, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            toast.success("Recalling prompt...");
                                            handleSend(msg.text);
                                        }}
                                        className="w-full flex flex-col p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-900/5 dark:hover:bg-white/5 hover:-translate-y-0.5 active:translate-y-0 transition-all text-left cursor-pointer"
                                    >
                                        <span className="text-[10px] text-slate-700 dark:text-slate-200 font-semibold line-clamp-2 leading-relaxed">
                                            {msg.text}
                                        </span>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </button>
                                ))
                        ) : (
                            <p className="text-[10px] text-slate-400 font-medium italic text-center py-4">
                                No prompts logged in this session yet.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
