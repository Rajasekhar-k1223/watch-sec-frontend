import {
    FileText, Download, Calendar, Send, Clock, Mail, Plus, X,
    ToggleLeft, ToggleRight, RefreshCw, CheckCircle, AlertCircle,
    ChevronDown, Loader
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ReportSettings {
    auto_enabled: boolean;
    frequency: string;
    scheduled_time: string;
    emails: string[];
    last_sent: string | null;
}

interface ReportFile {
    filename: string;
    size_kb: number;
    generated_at: string;
    download_url: string;
}

const FREQUENCIES = [
    { value: 'daily', label: 'Daily', desc: 'Every 24 hours', days: 1 },
    { value: 'weekly', label: 'Weekly', desc: 'Every 7 days', days: 7 },
    { value: '15days', label: 'Every 15 Days', desc: 'Bi-monthly', days: 15 },
    { value: 'monthly', label: 'Monthly', desc: 'Every 30 days', days: 30 },
];

function nextSendTime(settings: ReportSettings): string {
    if (!settings.auto_enabled) return 'Auto-send is OFF';
    const [h, m] = settings.scheduled_time.split(':').map(Number);
    const freq = FREQUENCIES.find(f => f.value === settings.frequency);
    const days = freq?.days ?? 7;

    let base = settings.last_sent ? new Date(settings.last_sent) : new Date();
    base.setDate(base.getDate() + days);
    base.setUTCHours(h, m, 0, 0);
    return base.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
}

export default function Reports() {
    const { token } = useAuth();
    const [settings, setSettings] = useState<ReportSettings>({
        auto_enabled: false,
        frequency: 'weekly',
        scheduled_time: '08:00',
        emails: [],
        last_sent: null,
    });
    const [history, setHistory] = useState<ReportFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [manualFreq, setManualFreq] = useState('weekly');
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 20;
    const [newEmail, setNewEmail] = useState('');
    const emailInputRef = useRef<HTMLInputElement>(null);

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        fetch(`${API_URL}/reports/settings`, { headers })
            .then(r => r.json())
            .then(setSettings)
            .finally(() => setLoading(false));

        fetchHistory(0, true);
    }, [token]);

    const fetchHistory = async (newOffset: number, reset: boolean = false) => {
        try {
            const res = await fetch(`${API_URL}/reports/history?limit=${LIMIT}&offset=${newOffset}`, { headers });
            const data = await res.json();
            if (Array.isArray(data)) {
                setHistory(prev => reset ? data : [...prev, ...data]);
                setHasMore(data.length === LIMIT);
                setOffset(newOffset);
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to load history');
        }
    };

    const loadMore = () => {
        fetchHistory(offset + LIMIT);
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/reports/settings`, {
                method: 'PUT', headers,
                body: JSON.stringify(settings),
            });
            if (res.ok) toast.success('Report settings saved!');
            else toast.error('Failed to save settings');
        } catch { toast.error('Network error'); }
        finally { setSaving(false); }
    };

    const handleSendNow = async () => {
        if (settings.emails.length === 0) {
            toast.error('Add at least one email recipient first!');
            return;
        }
        setSending(true);
        try {
            const res = await fetch(`${API_URL}/reports/send-now`, {
                method: 'POST', headers,
                body: JSON.stringify({ frequency: manualFreq, emails: settings.emails }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Report is being sent!');
                // Refresh history after a delay
                setTimeout(() => {
                    fetch(`${API_URL}/reports/history`, { headers })
                        .then(r => r.json())
                        .then(h => setHistory(Array.isArray(h) ? h : []));
                }, 4000);
            } else {
                toast.error(data.detail || 'Failed to send report');
            }
        } catch { toast.error('Network error'); }
        finally { setSending(false); }
    };

    const addEmail = () => {
        const e = newEmail.trim().toLowerCase();
        if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
            toast.error('Enter a valid email address');
            return;
        }
        if (settings.emails.includes(e)) {
            toast.error('Email already added');
            return;
        }
        setSettings(s => ({ ...s, emails: [...s.emails, e] }));
        setNewEmail('');
        emailInputRef.current?.focus();
    };

    const removeEmail = (email: string) => {
        setSettings(s => ({ ...s, emails: s.emails.filter(x => x !== email) }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-10 space-y-10 max-w-6xl mx-auto animate-in fade-in duration-700 min-h-screen bg-slate-50 dark:bg-[#020617]">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                         <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-500 ring-1 ring-indigo-500/30">
                            <FileText size={18} />
                         </div>
                         <span className="text-[10px] font-black tracking-[0.2em] uppercase text-indigo-500/80">Compliance Orchestration</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter">
                        <span className="text-gradient">Intelligence Reports</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-4 text-xs font-medium max-w-xl leading-relaxed">
                        Automated forensic auditing and fleet-wide health summaries. Schedule encrypted PDF delivery to key stakeholders across the global organization.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* ───────── AUTO SCHEDULE SETTINGS ───────── */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="glass-card overflow-hidden">
                        {/* Card header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                                    <Clock size={20} />
                                </div>
                                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Autonomous Scheduler</h2>
                            </div>
                            {/* Auto-send toggle */}
                            <button
                                onClick={() => setSettings(s => ({ ...s, auto_enabled: !s.auto_enabled }))}
                                className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all ${settings.auto_enabled
                                    ? 'bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                                    }`}
                            >
                                {settings.auto_enabled
                                    ? <><ToggleRight size={18} /> Protocol Active</>
                                    : <><ToggleLeft size={18} /> Protocol Offline</>
                                }
                            </button>
                        </div>

                        <div className="p-8 space-y-10">
                            {/* Frequency selector */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">
                                    Pulse Frequency
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {FREQUENCIES.map(f => (
                                        <button
                                            key={f.value}
                                            onClick={() => setSettings(s => ({ ...s, frequency: f.value }))}
                                            className={`p-5 rounded-[2rem] border-2 text-left transition-all ${settings.frequency === f.value
                                                ? 'border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-500/5 scale-[1.02]'
                                                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-800'
                                                }`}
                                        >
                                            <div className="font-black text-xs uppercase tracking-widest">{f.label}</div>
                                            <div className="text-[9px] opacity-60 mt-1 font-black uppercase tracking-tight">{f.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Scheduled time & Preview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                                        Execution Window (UTC)
                                    </label>
                                    <div className="relative group">
                                        <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="time"
                                            value={settings.scheduled_time}
                                            onChange={e => setSettings(s => ({ ...s, scheduled_time: e.target.value }))}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-black uppercase text-[10px] tracking-widest"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                                        Next Synchronization
                                    </label>
                                    <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${settings.auto_enabled
                                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-400'
                                        }`}>
                                        <Calendar size={14} className={settings.auto_enabled ? 'animate-pulse' : ''} />
                                        {nextSendTime(settings)}
                                    </div>
                                    {settings.last_sent && (
                                        <p className="text-[9px] text-slate-400 mt-2 flex items-center gap-2 font-black uppercase tracking-widest ml-1">
                                            <CheckCircle size={10} className="text-emerald-500" />
                                            Last Pulse: {new Date(settings.last_sent).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Email recipients */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">
                                    Identity Delivery Targets
                                </label>
                                {/* Chips */}
                                <div className="flex flex-wrap gap-3 mb-6">
                                    {settings.emails.map(email => (
                                        <span
                                            key={email}
                                            className="flex items-center gap-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm group hover:border-red-500/30 transition-colors"
                                        >
                                            <Mail size={12} className="text-indigo-500" />
                                            {email}
                                            <button
                                                onClick={() => removeEmail(email)}
                                                className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                    {settings.emails.length === 0 && (
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 py-2">
                                            <AlertCircle size={14} className="text-amber-500" /> No Target Identities Defined
                                        </span>
                                    )}
                                </div>
                                {/* Add email */}
                                <div className="flex gap-3">
                                    <input
                                        ref={emailInputRef}
                                        type="email"
                                        placeholder="OPERATOR@ENTERPRISE.COM"
                                        value={newEmail}
                                        onChange={e => setNewEmail(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addEmail()}
                                        className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400"
                                    />
                                    <button
                                        onClick={addEmail}
                                        className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-slate-500/10"
                                    >
                                        <Plus size={16} /> Provision
                                    </button>
                                </div>
                            </div>

                            {/* Save button */}
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={saving}
                                    className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-500/20 hover:shadow-blue-400/40 active:scale-95"
                                >
                                    {saving ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    {saving ? 'Synchronizing...' : 'Commit Protocol'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ───────── MANUAL SEND ───────── */}
                    <div className="glass-card p-10 bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 ring-1 ring-indigo-500/20">
                                <Send size={24} />
                            </div>
                            <div>
                                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Manual Forensic Pulse</h2>
                                <p className="text-xs text-slate-400 mt-1">Execute immediate report generation across all active targets.</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">
                                    Forensic Timeframe
                                </label>
                                <div className="relative group">
                                    <select
                                        value={manualFreq}
                                        onChange={e => setManualFreq(e.target.value)}
                                        className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl px-6 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                                    >
                                        {FREQUENCIES.map(f => (
                                            <option key={f.value} value={f.value}>
                                                {f.label} — PREVIOUS {f.days} DAYS
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                            </div>
                            <button
                                onClick={handleSendNow}
                                disabled={sending || settings.emails.length === 0}
                                className="w-full md:w-auto flex items-center justify-center gap-4 px-12 py-5 bg-white dark:bg-slate-900 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-indigo-500 hover:text-white shadow-xl active:scale-95"
                            >
                                {sending
                                    ? <><Loader size={18} className="animate-spin" /> Transmitting...</>
                                    : <><Send size={18} /> Execute Now</>
                                }
                            </button>
                        </div>
                        {settings.emails.length === 0 && (
                            <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-6 flex items-center gap-3 ml-1">
                                <AlertCircle size={14} /> Provision targets above to enable manual transmission.
                            </p>
                        )}
                    </div>
                </div>

                {/* ───────── REPORT HISTORY ───────── */}
                <div className="lg:col-span-1">
                    <div className="glass-card h-full flex flex-col bg-white dark:bg-slate-950/40">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <FileText size={20} className="text-slate-400" />
                                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Archival Feed</h2>
                            </div>
                            <button
                                onClick={() => fetchHistory(0, true)}
                                className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                            >
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[800px] divide-y divide-slate-100 dark:divide-slate-800">
                            {history.length === 0 ? (
                                <div className="py-24 text-center px-8">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 opacity-40">
                                        <FileText size={28} className="text-slate-400" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">History Vacuum</p>
                                    <p className="text-[9px] text-slate-400 mt-2 font-medium">No intelligence reports have been committed to the archive yet.</p>
                                </div>
                            ) : (
                                history.map((file) => {
                                    const isWeekly = file.filename.includes('Weekly');
                                    const isMonthly = file.filename.includes('Monthly');
                                    const badgeColor = isWeekly
                                        ? 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                                        : isMonthly
                                            ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20'
                                            : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                                    const badgeLabel = isWeekly ? 'WEEKLY' : isMonthly ? 'MONTHLY' : 'DAILY';

                                    return (
                                        <div key={file.filename} className="p-6 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`text-[8px] font-black px-2.5 py-1 rounded-md border tracking-[0.1em] ${badgeColor}`}>
                                                    {badgeLabel}
                                                </span>
                                                <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{(file.size_kb / 1024).toFixed(1)} MB</p>
                                            </div>
                                            <p className="font-black text-xs text-slate-900 dark:text-white truncate mb-2 group-hover:text-indigo-500 transition-colors">{file.filename}</p>
                                            <div className="flex items-center justify-between gap-4 mt-4">
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                                                    <Calendar size={12} />
                                                    {new Date(file.generated_at).toLocaleDateString()}
                                                </p>
                                                <a
                                                    href={file.download_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download={file.filename}
                                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-all active:scale-95"
                                                >
                                                    <Download size={14} /> Access
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {hasMore && history.length > 0 && (
                            <div className="p-6 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={loadMore}
                                    className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400 shadow-sm"
                                >
                                    Deep Archive
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


