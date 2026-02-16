
import React, { useState, useEffect } from 'react';
import { Ban, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
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
        <div className="flex-1 overflow-y-auto p-8 bg-gray-900/50 font-sans">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-2xl mx-auto shadow-lg">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-700 pb-4">
                    <Ban className="w-5 h-5 text-red-500" /> Application Blocking
                </h3>

                <div className="mb-6 bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-300">
                        <p className="font-bold text-blue-400 mb-1">How it works</p>
                        <p>The agent will monitor running processes and immediately terminate any application matching the names in this list. Use strict process names (e.g., <code className="bg-black/30 px-1 rounded text-gray-200">spotify.exe</code>, <code className="bg-black/30 px-1 rounded text-gray-200">steam.exe</code>).</p>
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={newApp}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewApp(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAdd()}
                            placeholder="Enter process name (e.g., game.exe)..."
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-4 pr-10 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder-gray-500"
                        />
                        <button onClick={handleAdd} className="absolute right-2 top-2 p-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {error && <div className="mb-4 text-red-400 text-sm font-bold bg-red-900/20 p-2 rounded border border-red-900/50">{error}</div>}

                <div className="space-y-2 mb-8 max-h-64 overflow-y-auto pr-2">
                    {apps.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                            No applications are currently blocked.
                        </div>
                    ) : apps.map((app: string, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-700/30 p-3 rounded-lg border border-gray-700 hover:border-red-500/30 transition-colors group">
                            <span className="font-mono text-gray-200">{app}</span>
                            <button onClick={() => handleRemove(app)} className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="text-right">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-2 ml-auto transition-all ${saving ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-red-900/20'}`}
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
