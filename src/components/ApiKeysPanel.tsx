import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

interface ApiKey {
    id: number;
    name: string;
    prefix: string;
    raw_key: string | null;
    created_at: string;
    expires_at: string | null;
    last_used_at: string | null;
}

export default function ApiKeysPanel() {
    const { token } = useAuth();
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Generate Modal State
    const [showModal, setShowModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [expiresInDays, setExpiresInDays] = useState<string>(''); // empty string means never
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [copiedPrefixId, setCopiedPrefixId] = useState<number | null>(null);
    const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            const res = await fetch(`${API_URL}/apikeys/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setKeys(data);
            }
        } catch (err) {
            console.error('Failed to fetch API keys', err);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        const payload = {
            name: newKeyName,
            expires_in_days: expiresInDays ? parseInt(expiresInDays) : null
        };

        try {
            const res = await fetch(`${API_URL}/apikeys/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setGeneratedKey(data.raw_key);
                fetchKeys(); // Refresh the list
            } else {
                const errData = await res.json();
                setError(errData.detail || 'Failed to generate key');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevoke = async (id: number) => {
        if (!confirm('Are you sure you want to permanently revoke this API Key? Any SDKs using it will immediately lose access.')) return;
        
        try {
            const res = await fetch(`${API_URL}/apikeys/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchKeys();
            }
        } catch (err) {
            console.error('Failed to revoke key', err);
        }
    };

    const copyToClipboard = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey).catch(() => {
                // Fallback for non-https
                const el = document.createElement('textarea');
                el.value = generatedKey;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
            });
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const copyPrefixToClipboard = (key: ApiKey) => {
        // Fallback to prefix if raw_key doesn't exist for legacy keys
        const textToCopy = key.raw_key || key.prefix;
        navigator.clipboard.writeText(textToCopy).catch(() => {
            const el = document.createElement('textarea');
            el.value = textToCopy;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        });
        setCopiedPrefixId(key.id);
        setTimeout(() => setCopiedPrefixId(null), 2000);
    };

    const toggleVisibility = (id: number) => {
        const newVisible = new Set(visibleKeys);
        if (newVisible.has(id)) {
            newVisible.delete(id);
        } else {
            newVisible.add(id);
        }
        setVisibleKeys(newVisible);
    };

    const closeAndResetModal = () => {
        setShowModal(false);
        setGeneratedKey(null);
        setNewKeyName('');
        setExpiresInDays('');
        setError('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage developer API keys for programmatic SDK access to your tenant data.</p>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                >
                    <Plus size={14} /> Generate New Key
                </button>
            </div>

            {/* Keys List */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/50">
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Prefix</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Created</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Expires</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Last Used</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {keys.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">No active API keys found.</td>
                                </tr>
                            ) : (
                                keys.map(key => (
                                    <tr key={key.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Key size={14} className="text-blue-500" /> {key.name}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                {visibleKeys.has(key.id) ? (key.raw_key || key.prefix + ' (Legacy)') : (key.prefix + '••••••••')}
                                                <button 
                                                    onClick={() => toggleVisibility(key.id)}
                                                    className="text-slate-400 hover:text-blue-500 transition-colors ml-2"
                                                    title={visibleKeys.has(key.id) ? "Hide Key" : "Show Key"}
                                                >
                                                    {visibleKeys.has(key.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button 
                                                    onClick={() => copyPrefixToClipboard(key)}
                                                    className="text-slate-400 hover:text-blue-500 transition-colors"
                                                    title={key.raw_key ? "Copy Full Key" : "Copy Prefix"}
                                                >
                                                    {copiedPrefixId === key.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">{new Date(key.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">
                                            {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : <span className="text-emerald-500">Never</span>}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">
                                            {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="p-4">
                                            <button 
                                                onClick={() => handleRevoke(key.id)}
                                                className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                                title="Revoke Key"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Generation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Key className="text-blue-500" /> Generate API Key
                            </h3>
                            {generatedKey && <button onClick={closeAndResetModal} className="text-slate-500 hover:text-slate-700 dark:hover:text-white">Close</button>}
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {!generatedKey ? (
                                <form onSubmit={handleGenerate} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Key Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Jenkins CI/CD Pipeline"
                                            required
                                            value={newKeyName}
                                            onChange={e => setNewKeyName(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Expiration</label>
                                        <select 
                                            value={expiresInDays}
                                            onChange={e => setExpiresInDays(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white outline-none"
                                        >
                                            <option value="">Never Expires</option>
                                            <option value="7">7 Days</option>
                                            <option value="30">30 Days</option>
                                            <option value="90">90 Days</option>
                                            <option value="365">1 Year</option>
                                        </select>
                                    </div>
                                    <div className="pt-4 flex justify-end gap-3">
                                        <button 
                                            type="button" 
                                            onClick={closeAndResetModal}
                                            className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={isLoading}
                                            className="px-6 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2"
                                        >
                                            {isLoading ? 'Generating...' : 'Generate Key'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                        <h4 className="text-amber-600 dark:text-amber-400 font-bold mb-2 flex items-center gap-2">
                                            <AlertCircle size={16} /> Important
                                        </h4>
                                        <p className="text-amber-600/80 dark:text-amber-400/80 text-sm">
                                            Please copy this key and store it securely. For your protection, it will never be displayed again.
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Your New API Key</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                readOnly 
                                                value={generatedKey}
                                                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono text-sm outline-none"
                                            />
                                            <button 
                                                onClick={copyToClipboard}
                                                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors shrink-0"
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            onClick={closeAndResetModal}
                                            className="px-6 py-3 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-transform"
                                        >
                                            I have saved it
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
