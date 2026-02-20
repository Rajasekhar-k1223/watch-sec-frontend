import React, { useState, useEffect } from 'react';
import { Shield, Download, FileText, Calendar, HardDrive, Search } from 'lucide-react';

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
        <div className="flex-1 overflow-y-auto p-8 bg-gray-900/50 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <Shield className="w-6 h-6 text-red-500" /> Forensic Shadow Vault
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">Intercepted file copies from USB storage devices.</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search files..."
                            className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64"
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
                    <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded-lg text-center">
                        {error}
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="bg-gray-800/50 border border-gray-800 rounded-xl p-12 text-center">
                        <HardDrive className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-500">No shadowed files found for this agent.</p>
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/80 border-b border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">File Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Source Path</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Size</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Intercepted</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredFiles.map((file) => (
                                    <tr key={file.Id} className="hover:bg-gray-700/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-700 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                    <FileText size={18} />
                                                </div>
                                                <span className="text-white font-medium">{file.FileName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-400 text-xs font-mono break-all max-w-xs">{file.OriginalPath}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">
                                            {(file.FileSize / 1024).toFixed(1)} KB
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <Calendar size={14} />
                                                {new Date(file.Timestamp).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDownload(file.Id)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                                                title="Download for Analysis"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
