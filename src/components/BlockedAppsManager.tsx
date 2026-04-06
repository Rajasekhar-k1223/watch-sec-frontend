import React, { useState, useEffect } from 'react';
import { Ban, PlusCircle, Trash2, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface BlockedAppsManagerProps {
    agentId: string;
    token: string | null;
    apiUrl: string;
    currentBlockedApps: string[]; // Pass initial state if available
    onUpdate: () => void; // Callback to refresh agent list
}

export default function BlockedAppsManager({ agentId, token, apiUrl, currentBlockedApps, onUpdate }: BlockedAppsManagerProps) {
    const [apps, setApps] = useState<string[]>([]);
    const [newApp, setNewApp] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Parse if it's a JSON string, otherwise use as array
        let initial = currentBlockedApps || [];
        if (typeof initial === 'string') {
            try { initial = JSON.parse(initial); } catch { initial = []; }
        }
        setApps(initial);
    }, [currentBlockedApps]);

    const handleAdd = () => {
        if (!newApp.trim()) return;
        const formatted = newApp.trim().toLowerCase();
        if (apps.includes(formatted)) {
            setError('Application is already blocked.');
            return;
        }
        if (!formatted.endsWith('.exe') && !formatted.includes('.')) {
            // Optional warning or auto-append
        }
        setApps([...apps, formatted]);
        setNewApp('');
        setError(null);
    };

    const handleRemove = (appToRemove: string) => {
        setApps(apps.filter((a: string) => a !== appToRemove));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${apiUrl}/agents/${agentId}/blocked-apps`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apps)
            });

            if (!res.ok) throw new Error('Failed to save blocked apps.');
            toast.success('Blocked applications list updated successfully.');
            if (onUpdate) onUpdate();
        } catch (err: any) {
            setError(err.message || 'Error saving changes.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-950 font-sans transition-colors">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 max-w-2xl mx-auto shadow-sm">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
                    <Ban className="w-5 h-5 text-red-500" /> Application Blocking
                </h3>

                <div className="mb-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] md:text-xs text-gray-600 dark:text-gray-400">
                        <p className="font-bold text-blue-700 dark:text-blue-300 mb-1">Execution Guard</p>
                        <p>Terminate any process matching the names below. Use strict binary names (e.g., <code className="bg-gray-100 dark:bg-black/50 px-1 rounded text-red-600 dark:text-red-400 font-mono">spotify.exe</code>).</p>
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={newApp}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewApp(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAdd()}
                            placeholder="Process name..."
                            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl pl-4 pr-12 py-3 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500/20 outline-none transition-all placeholder-gray-400"
                        />
                        <button onClick={handleAdd} className="absolute right-2 top-2 p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-red-500 transition-colors">
                            <PlusCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {error && <div className="mb-4 text-[10px] text-red-500 font-black uppercase bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-200 dark:border-red-900/20">{error}</div>}

                <div className="space-y-2 mb-8 max-h-80 overflow-y-auto pr-1 no-scrollbar">
                    {apps.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 dark:text-gray-600 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-xs">
                            No active execution blocks.
                        </div>
                    ) : apps.map((app: string, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-950 p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-red-500/30 transition-all group shadow-sm">
                            <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{app}</span>
                            <button onClick={() => handleRemove(app)} className="p-2 text-gray-400 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 ml-auto transition-all ${saving ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-red-600/20 active:scale-95'}`}
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={16} />}
                        Sync with Agent
                    </button>
                </div>
            </div>
        </div>
    );
}
