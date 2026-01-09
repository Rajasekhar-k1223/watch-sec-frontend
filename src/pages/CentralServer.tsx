import { Server, Plus, Trash, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

export default function CentralServer() {
    const tabs = [
        "General", "Server Authorization", "Search thesauruses",
        "Digital Fingerprints", "Hash banks", "License information",
        "Recognition", "Searches"
    ];
    const [activeTab, setActiveTab] = useState("General");

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white">
            {/* Top Tabs Bar */}
            <div className="flex items-center gap-1 px-4 border-b border-gray-700 bg-gray-800/50">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                            ? 'border-blue-500 text-white bg-gray-800'
                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 overflow-y-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Server className="text-blue-500" />
                        {activeTab}
                    </h1>
                </div>

                {activeTab === 'General' && (
                    <GeneralSettingsTab />
                )}

                {activeTab === 'Server Authorization' && (
                    <AuthSettingsTab />
                )}
                {activeTab === 'Search thesauruses' && (
                    <ThesaurusSettingsTab />
                )}

                {activeTab === 'Recognition' && (
                    <RecognitionSettingsTab />
                )}

                {activeTab === 'Hash banks' && (
                    <HashBanksTab />
                )}

                {activeTab === 'Digital Fingerprints' && (
                    <DigitalFingerprintsTab />
                )}

                {activeTab === 'License information' && (
                    <LicenseInfoTab />
                )}
                {activeTab === 'Searches' && (
                    <SearchesTab />
                )}

                {!['General', 'Server Authorization', 'Search thesauruses', 'Recognition', 'Hash banks', 'Digital Fingerprints', 'License information', 'Searches'].includes(activeTab) && (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center border-dashed">
                        <p className="text-gray-500">Placeholder for {activeTab} settings</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function GeneralSettingsTab() {
    const [settings, setSettings] = useState({
        DataRetentionDays: "90",
        LogLevel: "INFO",
        StoragePath: "/var/lib/monitorix/data"
    });

    // Mock Load
    // useEffect(() => { fetch('/api/system/settings')... }, [])

    const handleSave = () => {
        // fetch('/api/system/settings', { method: 'POST', body: JSON.stringify(...) })
        alert("Settings Saved!");
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Data Retention & Storage</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Activity Log Retention (Days)</label>
                        <input type="number" value={settings.DataRetentionDays} onChange={e => setSettings({ ...settings, DataRetentionDays: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-blue-500 outline-none" />
                        <p className="text-xs text-gray-500 mt-1">Logs older than this will be automatically archived/deleted.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Storage Path</label>
                        <input type="text" value={settings.StoragePath} readOnly className="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-gray-400 cursor-not-allowed" />
                        <p className="text-xs text-gray-500 mt-1">Physical path where recordings and screenshots are stored.</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">System Logging</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Log Level</label>
                    <select value={settings.LogLevel} onChange={e => setSettings({ ...settings, LogLevel: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-blue-500 outline-none">
                        <option value="DEBUG">DEBUG (Verbose)</option>
                        <option value="INFO">INFO (Standard)</option>
                        <option value="WARN">WARN (Issues Only)</option>
                        <option value="ERROR">ERROR (Critical Only)</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all">Save Changes</button>
            </div>
        </div>
    );
}

function AuthSettingsTab() {
    const [settings, setSettings] = useState({
        EnableGlobalLockdown: false,
        TrustedIps: "127.0.0.1\n192.168.1.0/24",
        Require2FA: true
    });

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Critical Security Controls</h3>

                <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
                    <div>
                        <h4 className="font-bold text-red-400">System Lockdown</h4>
                        <p className="text-sm text-gray-400">Prevents ANY new agent registrations or connections. Existing sessions maintained.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.EnableGlobalLockdown} onChange={e => setSettings({ ...settings, EnableGlobalLockdown: e.target.checked })} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div>
                        <h4 className="font-bold text-white">Enforce 2FA for Admin Access</h4>
                        <p className="text-sm text-gray-400">Require Two-Factor Authentication for all Tenant Admins.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.Require2FA} onChange={e => setSettings({ ...settings, Require2FA: e.target.checked })} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Network Access Control (NAC)</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Trusted IP Whitelist (One per line)</label>
                    <textarea rows={5} value={settings.TrustedIps} onChange={e => setSettings({ ...settings, TrustedIps: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-blue-500 outline-none" />
                    <p className="text-xs text-gray-500 mt-1">Only APIs requests from these IPs/Subnets will be allowed administrative privileges.</p>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={() => alert("Auth Settings Saved")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all">Save Security Settings</button>
            </div>
        </div>
    );
}

function ThesaurusSettingsTab() {
    const { token } = useAuth();
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // New Entry Form
    const [newKeyword, setNewKeyword] = useState("");
    const [newSynonyms, setNewSynonyms] = useState("");
    const [newCategory, setNewCategory] = useState("General");

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/thesaurus`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setEntries(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchEntries();
    }, [token]);

    const handleAdd = async () => {
        if (!newKeyword) return;

        try {
            const res = await fetch(`${API_URL}/api/thesaurus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    keyword: newKeyword,
                    synonyms: newSynonyms.split(',').map(s => s.trim()).filter(Boolean),
                    category: newCategory
                })
            });

            if (res.ok) {
                setNewKeyword("");
                setNewSynonyms("");
                fetchEntries();
            } else {
                alert("Failed to save entry");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this entry?")) return;
        try {
            await fetch(`${API_URL}/api/thesaurus/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchEntries();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Add New Section */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                    <Plus size={18} className="text-green-500" /> Add Thesaurus Entry
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Keyword</label>
                        <input
                            type="text"
                            placeholder="e.g. 'Money'"
                            value={newKeyword}
                            onChange={e => setNewKeyword(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Synonyms (Comma separated)</label>
                        <input
                            type="text"
                            placeholder="e.g. Cash, Funds, Capital, Currency"
                            value={newSynonyms}
                            onChange={e => setNewSynonyms(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                        <select
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                        >
                            <option value="General">General</option>
                            <option value="Finance">Finance</option>
                            <option value="Legal">Legal</option>
                            <option value="HR">HR</option>
                            <option value="Technical">Technical</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                        <Save size={18} /> Save Entry
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-white">Active Thesauruses</h3>
                    <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-700">{entries.length} Entries</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4 w-1/4">Keyword</th>
                                <th className="p-4 w-1/2">Synonyms / Expansion</th>
                                <th className="p-4 w-1/6">Category</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-gray-300">
                            {loading && <tr><td colSpan={4} className="p-8 text-center">Loading...</td></tr>}
                            {!loading && entries.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No entries found. Add one above.</td></tr>
                            )}
                            {entries.map(entry => (
                                <tr key={entry.id} className="hover:bg-gray-700/50">
                                    <td className="p-4 font-bold text-white">{entry.keyword}</td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {entry.synonyms.map((s: string) => (
                                                <span key={s} className="bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded text-xs border border-blue-800/50">{s}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">{entry.category}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-colors">
                                            <Trash size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function RecognitionSettingsTab() {
    // In a real app, these would come from an API
    const [settings, setSettings] = useState({
        EnableOCR: true,
        OCRInterval: 60, // seconds
        EnableSpeech: true,
        SpeechConfidenceThreshold: 0.8
    });

    useEffect(() => {
        // Fetch Settings (simulated)
    }, []);

    const handleSave = () => {
        alert("Recognition Settings Saved (Simulated)");
    };

    return (
        <div className="space-y-6 max-w-4xl">
            {/* OCR Settings */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> OCR Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div>
                            <h4 className="font-bold text-gray-300">Enable OCR</h4>
                            <p className="text-xs text-gray-500">Extract text from screenshots.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={settings.EnableOCR} onChange={e => setSettings({ ...settings, EnableOCR: e.target.checked })} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Processing Interval (Seconds)</label>
                        <input type="number" value={settings.OCRInterval} onChange={e => setSettings({ ...settings, OCRInterval: parseInt(e.target.value) })} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500" />
                    </div>
                </div>
            </div>

            {/* Speech Settings */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div> Speech Recognition
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div>
                            <h4 className="font-bold text-gray-300">Enable Audio Analysis</h4>
                            <p className="text-xs text-gray-500">Transcribe and analyze microphone input.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={settings.EnableSpeech} onChange={e => setSettings({ ...settings, EnableSpeech: e.target.checked })} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Confidence Threshold (0.0 - 1.0)</label>
                        <input type="number" step="0.1" max="1" min="0" value={settings.SpeechConfidenceThreshold} onChange={e => setSettings({ ...settings, SpeechConfidenceThreshold: parseFloat(e.target.value) })} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500" />
                        <p className="text-xs text-gray-500 mt-1">Ignore transcriptions below this confidence score.</p>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <h4 className="font-bold text-blue-400 text-sm mb-2">Integration Note</h4>
                    <p className="text-xs text-gray-400">
                        Speech recognition relies on the <strong>Thesaurus</strong> for keyword flagging. Ensure you have defined 'High Risk' categories in the search thesauruses tab.
                    </p>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all">Save Recognition Settings</button>
            </div>
        </div>
    );
}

function HashBanksTab() {
    const { token } = useAuth();
    const [hashes, setHashes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({ hash: '', reputation: 'Malicious', description: '' });

    const fetchHashes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/hashbank`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setHashes(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { if (token) fetchHashes(); }, [token]);

    const handleAdd = async () => {
        if (!form.hash) return;
        try {
            const res = await fetch(`${API_URL}/api/hashbank`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ Hash: form.hash, Reputation: form.reputation, Description: form.description })
            });
            if (res.ok) {
                setForm({ hash: '', reputation: 'Malicious', description: '' });
                fetchHashes();
            } else {
                alert("Failed to add hash (might be duplicate)");
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this hash?")) return;
        try {
            await fetch(`${API_URL}/api/hashbank/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            fetchHashes();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Add New */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> Add IOC Hash
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">File Hash (MD5/SHA256)</label>
                        <input type="text" value={form.hash} onChange={e => setForm({ ...form, hash: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500 font-mono text-sm" placeholder="e.g. 5e884898da28047151d0e56f8dc62927..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Reputation</label>
                        <select value={form.reputation} onChange={e => setForm({ ...form, reputation: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500">
                            <option value="Malicious">Malicious</option>
                            <option value="Suspicious">Suspicious</option>
                            <option value="Safe">Safe (Whitelist)</option>
                        </select>
                    </div>
                    <div>
                        <button onClick={handleAdd} className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">Add Hash</button>
                    </div>
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Description / Notes</label>
                    <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500" placeholder="e.g. Known Ransomware variant" />
                </div>
            </div>

            {/* List */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-white">Hash Database</h3>
                    <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-700">{hashes.length} Entries</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs">
                            <tr><th className="p-4">Hash</th><th className="p-4">Reputation</th><th className="p-4">Description</th><th className="p-4 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-gray-300">
                            {hashes.map(h => (
                                <tr key={h.id} className="hover:bg-gray-700/50">
                                    <td className="p-4 font-mono text-xs text-blue-300">{h.hash}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${h.reputation === 'Safe' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{h.reputation}</span></td>
                                    <td className="p-4 text-gray-400">{h.description || '-'}</td>
                                    <td className="p-4 text-right"><button onClick={() => handleDelete(h.id)} className="text-red-400 hover:text-red-300"><Trash size={16} /></button></td>
                                </tr>
                            ))}
                            {hashes.length === 0 && !loading && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hashes found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function LicenseInfoTab() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Subscription & License</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">License Key</label>
                        <input type="text" readOnly value="XXXX-XXXX-XXXX-XXXX" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-500 font-mono" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Plan</label>
                        <div className="text-white font-bold text-lg">Enterprise (Unlimited)</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Expiry Date</label>
                        <div className="text-white font-bold">December 31, 2025</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Support Status</label>
                        <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SearchesTab() {
    const { token } = useAuth();
    const [searches, setSearches] = useState<any[]>([]);
    const [newSearch, setNewSearch] = useState({ name: '', query: '{ }', category: 'General' });

    const fetchSearches = async () => {
        try {
            const res = await fetch(`${API_URL}/api/searches`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setSearches(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => { if (token) fetchSearches(); }, [token]);

    const handleSave = async () => {
        if (!newSearch.name) return;
        try {
            await fetch(`${API_URL}/api/searches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ Name: newSearch.name, QueryJson: newSearch.query, Category: newSearch.category })
            });
            fetchSearches();
            setNewSearch({ name: '', query: '{ }', category: 'General' });
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete search?")) return;
        try {
            await fetch(`${API_URL}/api/searches/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            fetchSearches();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-8 max-w-5xl">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Save New Search</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Search Name</label>
                        <input type="text" value={newSearch.name} onChange={e => setNewSearch({ ...newSearch, name: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500" placeholder="e.g. High Risk Web Access" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                        <input type="text" value={newSearch.category} onChange={e => setNewSearch({ ...newSearch, category: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold">Save Search</button>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-white">Saved Searches</h3>
                    <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-700">{searches.length} Entries</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs">
                            <tr><th className="p-4">Name</th><th className="p-4">Category</th><th className="p-4">Created</th><th className="p-4 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-gray-300">
                            {searches.map(s => (
                                <tr key={s.id} className="hover:bg-gray-700/50">
                                    <td className="p-4 font-bold text-white">{s.name}</td>
                                    <td className="p-4"><span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-xs">{s.category}</span></td>
                                    <td className="p-4 text-gray-500 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 text-right"><button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300"><Trash size={16} /></button></td>
                                </tr>
                            ))}
                            {searches.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No saved searches.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function DigitalFingerprintsTab() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
                <div className="p-8">
                    <h3 className="text-xl font-bold text-white mb-2">Digital Fingerprints</h3>
                    <p className="text-gray-400">Manage device fingerprints and identity tracking here.</p>
                </div>
            </div>
        </div>
    );
}
