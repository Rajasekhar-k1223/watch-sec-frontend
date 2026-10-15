import React, { useState, useEffect } from 'react';
import { Shield, PlusCircle, Trash2, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface FimManagerProps {
    agentId: string;
    token: string | null;
    apiUrl: string;
    initialFimEnabled: boolean;
    initialFimPaths: string | string[];
    onUpdate: () => void;
}

export default function FimManager({ agentId, token, apiUrl, initialFimEnabled, initialFimPaths, onUpdate }: FimManagerProps) {
    const [paths, setPaths] = useState<string[]>([]);
    const [enabled, setEnabled] = useState(false);
    const [newPath, setNewPath] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setEnabled(initialFimEnabled);
        
        let initial: string[] = [];
        if (typeof initialFimPaths === 'string') {
            try { 
                const parsed = JSON.parse(initialFimPaths);
                if (Array.isArray(parsed)) initial = parsed;
            } catch { 
                initial = []; 
            }
        } else if (Array.isArray(initialFimPaths)) {
            initial = initialFimPaths;
        }
        setPaths(initial);
    }, [initialFimEnabled, initialFimPaths]);

    const handleAdd = () => {
        if (!newPath.trim()) return;
        const formatted = newPath.trim();
        if (paths.includes(formatted)) {
            setError('Path is already monitored.');
            return;
        }
        setPaths([...paths, formatted]);
        setNewPath('');
        setError(null);
    };

    const handleRemove = (pathToRemove: string) => {
        setPaths(paths.filter((p: string) => p !== pathToRemove));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${apiUrl}/agents/${agentId}/fim`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    FileIntegrityMonitoringEnabled: enabled,
                    FimPaths: paths
                })
            });

            if (!res.ok) throw new Error('Failed to save FIM config.');
            toast.success('File Integrity Monitoring configuration updated.');
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
                <div className="flex justify-between items-center mb-5 border-b border-gray-200 dark:border-gray-800 pb-4">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" /> File Integrity Monitoring (FIM)
                    </h3>
                    
                    <label className="flex items-center cursor-pointer relative">
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => setEnabled(!enabled)}
                            className="sr-only peer"
                            disabled={saving}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                    </label>
                </div>

                <div className="mb-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] md:text-xs text-gray-600 dark:text-gray-400">
                        <p className="font-bold text-blue-700 dark:text-blue-300 mb-1">Path Watcher</p>
                        <p>Receive alerts if the configured files or directories are modified, created, or deleted. Paths must be absolute.</p>
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={newPath}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPath(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAdd()}
                            placeholder="Absolute File Path..."
                            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl pl-4 pr-12 py-3 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                            disabled={!enabled}
                        />
                        <button onClick={handleAdd} disabled={!enabled} className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors ${enabled ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-500' : 'text-gray-400'}`}>
                            <PlusCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

                <div className="space-y-2 mb-6">
                    {paths.map((p, i) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${enabled ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800' : 'bg-gray-50 dark:bg-gray-800/50 border-transparent opacity-50'}`}>
                            <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate pr-4">{p}</span>
                            <button
                                onClick={() => handleRemove(p)}
                                disabled={!enabled}
                                className={`p-1.5 rounded-lg ${enabled ? 'text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400' : 'text-gray-500'}`}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {paths.length === 0 && (
                        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
                            No paths configured.
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
}
