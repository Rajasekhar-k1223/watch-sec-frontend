import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { ShieldAlert, Plus, Trash2, Crosshair } from 'lucide-react';
import toast from 'react-hot-toast';

interface YaraRule {
    id: number;
    name: string;
    rule_content: string;
    created_at: string;
}

export default function YaraScanner() {
    const { token } = useAuth();
    const [rules, setRules] = useState<YaraRule[]>([]);
    const [newRuleName, setNewRuleName] = useState('');
    const [newRuleContent, setNewRuleContent] = useState('');
    const [targetAgentId, setTargetAgentId] = useState('');

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const res = await fetch(`${API_URL}/yara/rules`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setRules(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch YARA rules", e);
        }
    };

    const handleCreateRule = async () => {
        if (!newRuleName || !newRuleContent) return;
        try {
            const res = await fetch(`${API_URL}/yara/rules`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newRuleName, rule_content: newRuleContent })
            });
            if (res.ok) {
                toast.success('YARA Rule created successfully');
                setNewRuleName('');
                setNewRuleContent('');
                fetchRules();
            } else {
                toast.error('Failed to create YARA rule');
            }
        } catch (e) {
            toast.error('Error creating YARA rule');
        }
    };

    const handleDeleteRule = async (id: number) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            const res = await fetch(`${API_URL}/yara/rules/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Rule deleted');
                fetchRules();
            }
        } catch (e) {
            toast.error('Error deleting rule');
        }
    };

    const handleScanAgent = async () => {
        if (!targetAgentId) {
            toast.error('Please enter a target Agent ID');
            return;
        }
        if (rules.length === 0) {
            toast.error('No YARA rules to scan with');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/yara/scan/${targetAgentId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success(`YARA Scan triggered for ${targetAgentId}. Watch Security Logs for matches.`);
                setTargetAgentId('');
            } else {
                const data = await res.json();
                toast.error(data.detail || 'Failed to trigger scan');
            }
        } catch (e) {
            toast.error('Network error triggering scan');
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <ShieldAlert className="text-red-500" size={32} />
                        YARA Malware Scanner
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-2">
                        Upload custom YARA rules and trigger live forensic scans on remote endpoints.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rule Creation */}
                <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add New Rule</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rule Name</label>
                            <input 
                                type="text"
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                                value={newRuleName}
                                onChange={e => setNewRuleName(e.target.value)}
                                placeholder="e.g., Detect_Mimikatz"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rule Definition</label>
                            <textarea 
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 font-mono h-48"
                                value={newRuleContent}
                                onChange={e => setNewRuleContent(e.target.value)}
                                placeholder="rule Example {&#10;  strings:&#10;    $a = &#34;malicious string&#34;&#10;  condition:&#10;    $a&#10;}"
                            />
                        </div>
                        <button 
                            onClick={handleCreateRule}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> Save Rule
                        </button>
                    </div>
                </div>

                {/* Target Scanner */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-gradient-to-br from-slate-900/5 to-red-500/5">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Crosshair size={20} className="text-red-500" /> Target Execution
                        </h2>
                        <div className="flex gap-4">
                            <input 
                                type="text"
                                className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold focus:border-red-500 outline-none transition-colors"
                                value={targetAgentId}
                                onChange={e => setTargetAgentId(e.target.value)}
                                placeholder="Enter Target Agent ID (e.g., AGT-12345)"
                            />
                            <button 
                                onClick={handleScanAgent}
                                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-red-500/30"
                            >
                                Trigger Scan
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-4">
                            The agent will download all active rules and recursively scan its home directory. High severity alerts will be generated for any matches.
                        </p>
                    </div>

                    {/* Rule List */}
                    <div className="glass-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active YARA Rules ({rules.length})</h2>
                        </div>
                        <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {rules.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">No YARA rules configured.</div>
                            ) : rules.map(rule => (
                                <div key={rule.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex justify-between items-start group">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{rule.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1 font-mono">Added: {new Date(rule.created_at).toLocaleString()}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteRule(rule.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Rule"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
