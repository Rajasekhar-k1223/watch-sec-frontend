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
    const [newEmail, setNewEmail] = useState('');
    const emailInputRef = useRef<HTMLInputElement>(null);

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => {
        if (!token) return;
        Promise.all([
            fetch(`${API_URL}/reports/settings`, { headers }).then(r => r.json()),
            fetch(`${API_URL}/reports/history`, { headers }).then(r => r.json()),
        ]).then(([s, h]) => {
            setSettings(s);
            setHistory(Array.isArray(h) ? h : []);
        }).catch(() => toast.error('Failed to load report data'))
            .finally(() => setLoading(false));
    }, [token]);

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
        <div className="p-8 space-y-8 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                            <FileText className="text-indigo-500" size={26} />
                        </div>
                        Reports &amp; Scheduling
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        Configure automatic report delivery and send reports on demand.
                    </p>
                </div>
            </div>

            {/* ───────── AUTO SCHEDULE SETTINGS ───────── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                {/* Card header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2">
                        <Clock size={18} className="text-indigo-500" />
                        <h2 className="font-bold text-gray-900 dark:text-white">Automatic Schedule</h2>
                    </div>
                    {/* Auto-send toggle */}
                    <button
                        onClick={() => setSettings(s => ({ ...s, auto_enabled: !s.auto_enabled }))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${settings.auto_enabled
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                            }`}
                    >
                        {settings.auto_enabled
                            ? <><ToggleRight size={20} /> Auto-Send ON</>
                            : <><ToggleLeft size={20} /> Auto-Send OFF</>
                        }
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Frequency selector */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            Report Frequency
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {FREQUENCIES.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setSettings(s => ({ ...s, frequency: f.value }))}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${settings.frequency === f.value
                                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                        : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-600'
                                        }`}
                                >
                                    <div className="font-bold text-sm">{f.label}</div>
                                    <div className="text-xs opacity-60 mt-0.5">{f.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scheduled time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Send Time (UTC)
                            </label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="time"
                                    value={settings.scheduled_time}
                                    onChange={e => setSettings(s => ({ ...s, scheduled_time: e.target.value }))}
                                    className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Next send preview */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Next Auto Send
                            </label>
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${settings.auto_enabled
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'
                                }`}>
                                <Calendar size={14} />
                                {nextSendTime(settings)}
                            </div>
                            {settings.last_sent && (
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                    <CheckCircle size={11} className="text-green-400" />
                                    Last sent: {new Date(settings.last_sent).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Email recipients */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            Email Recipients
                        </label>
                        {/* Chips */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {settings.emails.map(email => (
                                <span
                                    key={email}
                                    className="flex items-center gap-2 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 px-3 py-1.5 rounded-full text-sm"
                                >
                                    <Mail size={12} />
                                    {email}
                                    <button
                                        onClick={() => removeEmail(email)}
                                        className="text-indigo-400 hover:text-red-500 transition-colors ml-1"
                                    >
                                        <X size={13} />
                                    </button>
                                </span>
                            ))}
                            {settings.emails.length === 0 && (
                                <span className="text-gray-400 text-sm italic flex items-center gap-1">
                                    <AlertCircle size={13} /> No recipients configured — add at least one email
                                </span>
                            )}
                        </div>
                        {/* Add email */}
                        <div className="flex gap-2">
                            <input
                                ref={emailInputRef}
                                type="email"
                                placeholder="add@email.com"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addEmail()}
                                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder-gray-400"
                            />
                            <button
                                onClick={addEmail}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-xl text-sm font-semibold transition-all"
                            >
                                <Plus size={15} /> Add
                            </button>
                        </div>
                    </div>

                    {/* Save button */}
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-semibold transition-all shadow-sm"
                        >
                            {saving ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ───────── MANUAL SEND ───────── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <Send size={18} className="text-indigo-500" />
                    <h2 className="font-bold text-gray-900 dark:text-white">Send Report Now</h2>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">Manual</span>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                        Instantly generate and send a report to all configured recipients ({settings.emails.length} email{settings.emails.length !== 1 ? 's' : ''}).
                    </p>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Report Period
                            </label>
                            <div className="relative">
                                <select
                                    value={manualFreq}
                                    onChange={e => setManualFreq(e.target.value)}
                                    className="w-full appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 pr-9 focus:outline-none focus:border-indigo-500 text-sm"
                                >
                                    {FREQUENCIES.map(f => (
                                        <option key={f.value} value={f.value}>
                                            {f.label} — past {f.days} day{f.days > 1 ? 's' : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <button
                            onClick={handleSendNow}
                            disabled={sending || settings.emails.length === 0}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-sm"
                        >
                            {sending
                                ? <><Loader size={16} className="animate-spin" /> Sending...</>
                                : <><Send size={16} /> Send Report Now</>
                            }
                        </button>
                    </div>
                    {settings.emails.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                            <AlertCircle size={12} /> Add recipient emails in the schedule settings above before sending.
                        </p>
                    )}
                </div>
            </div>

            {/* ───────── REPORT HISTORY ───────── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2">
                        <FileText size={18} className="text-indigo-500" />
                        <h2 className="font-bold text-gray-900 dark:text-white">Report History</h2>
                        <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">
                            {history.length}
                        </span>
                    </div>
                    <button
                        onClick={() => fetch(`${API_URL}/reports/history`, { headers }).then(r => r.json()).then(h => setHistory(Array.isArray(h) ? h : []))}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-500 transition-colors"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                {history.length === 0 ? (
                    <div className="py-16 text-center">
                        <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-400 dark:text-gray-500">No reports generated yet.</p>
                        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Send a report above to see it here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {history.map((file) => {
                            const isWeekly = file.filename.includes('Weekly');
                            const isMonthly = file.filename.includes('Monthly');
                            const isDaily = file.filename.includes('Daily');
                            const badgeColor = isWeekly
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : isMonthly
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
                            const badgeLabel = isWeekly ? 'Weekly' : isMonthly ? 'Monthly' : isDaily ? 'Daily' : 'Report';

                            return (
                                <div key={file.filename} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                        <FileText size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{file.filename}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                            <Calendar size={11} />
                                            {new Date(file.generated_at).toLocaleString()}
                                            <span className="text-gray-300 dark:text-gray-600">·</span>
                                            {file.size_kb} KB
                                        </p>
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>
                                        {badgeLabel}
                                    </span>
                                    <a
                                        href={file.download_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={file.filename}
                                        className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex-shrink-0"
                                    >
                                        <Download size={15} /> Download
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}


