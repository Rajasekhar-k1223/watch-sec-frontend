import React, { useState, useEffect } from 'react';
import { Shield, Download, FileText, Calendar, Search, Lock as LockIcon } from 'lucide-react';

interface ShadowFile {
    Id: number;
    AgentId: string;
    OriginalPath: string;
    FileName: string;
    StoragePath: string;
    FileSize: number;
    Timestamp: string;
}

interface ShadowVaultProps {
    agentId: string;
    token: string;
    apiUrl: string;
}

export default function ShadowVault({ agentId, token, apiUrl }: ShadowVaultProps) {
    const [files, setFiles] = useState<ShadowFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchFiles();
    }, [agentId]);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/agents/${agentId}/shadow-vault`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFiles(data);
            } else {
                setError('Failed to fetch forensic data');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (fileId: number) => {
        try {
            const response = await fetch(`${apiUrl}/agents/${agentId}/shadow-vault/${fileId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                // Backend returns a temporary download URL or the blob.
                // For now, let's assume it's a redirect to a download link.
                window.open(`${apiUrl}/agents/${agentId}/shadow-vault/${fileId}/download?token=${token}`, '_blank');
            }
        } catch (err) {
            console.error('Download failed', err);
        }
    };

    const filteredFiles = files.filter((f: ShadowFile) =>
        f.FileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.OriginalPath.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white dark:bg-gray-900/50 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
                    <div>
                        <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
                            <Shield className="w-5 h-5 md:w-6 md:h-6 text-red-500" /> Forensic Shadow Vault
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">Intercepted file copies from USB storage devices.</p>
                    </div>

                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search Vault..."
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 w-full md:w-64 transition-all"
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded-lg text-center text-sm">
                        {error}
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center transition-colors">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-gray-700">
                            <LockIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-bold text-lg">Vault is Empty</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-sm mx-auto">No shadowing events have been captured for this agent yet. All file manipulations will be automatically indexed here.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl">
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 uppercase font-bold text-[10px] tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">File Details</th>
                                        <th className="px-6 py-4">Source Path</th>
                                        <th className="px-6 py-4">Size</th>
                                        <th className="px-6 py-4">Intercepted</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredFiles.map((file) => (
                                        <tr key={file.Id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors text-xs">
                                                        <FileText size={16} />
                                                    </div>
                                                    <span className="text-gray-900 dark:text-white font-medium text-xs">{file.FileName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-500 dark:text-gray-400 text-[10px] font-mono break-all max-w-xs">{file.OriginalPath}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">{(file.FileSize / 1024).toFixed(1)} KB</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={12} />
                                                    {new Date(file.Timestamp).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleDownload(file.Id)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all" title="Download">
                                                    <Download size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List */}
                        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredFiles.map((file) => (
                                <div key={file.Id} className="p-4 space-y-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400">
                                            <FileText size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-gray-900 dark:text-white font-bold text-sm truncate">{file.FileName}</div>
                                            <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-1">
                                                <Calendar size={10} /> {new Date(file.Timestamp).toLocaleDateString()}
                                                <span className="mx-1">•</span>
                                                {(file.FileSize / 1024).toFixed(1)} KB
                                            </div>
                                        </div>
                                        <button onClick={() => handleDownload(file.Id)} className="p-2 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                            <Download size={14} />
                                        </button>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-black/30 p-2 rounded border border-gray-200 dark:border-gray-700/50">
                                        <div className="text-[9px] text-gray-400 dark:text-gray-600 uppercase font-black mb-1">Source Path</div>
                                        <div className="text-[10px] text-gray-600 dark:text-gray-400 font-mono break-all leading-tight">
                                            {file.OriginalPath}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
