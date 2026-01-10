
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AgentCapabilitiesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AgentCapabilitiesModal({ isOpen, onClose }: AgentCapabilitiesModalProps) {
    if (!isOpen) return null;

    const features = [
        { name: "Core Monitoring (CPU/RAM)", win: true, linux: true, mac: true },
        { name: "Live Screen Streaming", win: true, linux: true, mac: true },
        { name: "Activity/Idle Tracking", win: true, linux: true, mac: true },
        { name: "Remote Control (Input)", win: true, linux: true, mac: true },
        { name: "Screenshots", win: true, linux: true, mac: true },
        { name: "Network Traffic Analysis", win: true, linux: true, mac: true },
        { name: "File Integrity Monitoring", win: true, linux: true, mac: true },
        { name: "Remote Uninstall", win: true, linux: true, mac: true },
        { name: "USB Device Blocking", win: true, linux: true, mac: false, note: "Mac requires System Ext" },
        { name: "Browser Policy Enforcement", win: true, linux: "partial", mac: "partial", note: "LNK Patching on Win" },
    ];

    const StatusIcon = ({ status }: { status: boolean | string }) => {
        if (status === true) return <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />;
        if (status === false) return <XCircle className="w-5 h-5 text-red-500 mx-auto" />;
        return <div title="Partial / Limited Support"><AlertTriangle className="w-5 h-5 text-yellow-500 mx-auto" /></div>;
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden transition-colors max-h-[90vh]">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Agent Capabilities Matrix
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cross-platform feature support overview</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-center">
                            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-4 text-left">Feature</th>
                                    <th className="p-4 w-32 border-l border-gray-200 dark:border-gray-700">Windows</th>
                                    <th className="p-4 w-32 border-l border-gray-200 dark:border-gray-700">Linux</th>
                                    <th className="p-4 w-32 border-l border-gray-200 dark:border-gray-700">macOS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                {features.map((feat, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4 text-left font-medium text-gray-900 dark:text-white">
                                            {feat.name}
                                            {feat.note && <span className="block text-xs text-gray-400 font-normal mt-1">{feat.note}</span>}
                                        </td>
                                        <td className="p-4 border-l border-gray-200 dark:border-gray-700"><StatusIcon status={feat.win} /></td>
                                        <td className="p-4 border-l border-gray-200 dark:border-gray-700"><StatusIcon status={feat.linux} /></td>
                                        <td className="p-4 border-l border-gray-200 dark:border-gray-700"><StatusIcon status={feat.mac} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">Windows</h3>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li><strong>Install:</strong> PowerShell Script or .exe</li>
                                <li><strong>Persist:</strong> Scheduled Task (Hidden)</li>
                                <li>Full Feature Parity</li>
                            </ul>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">Linux</h3>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li><strong>Install:</strong> Curl | Bash</li>
                                <li><strong>Persist:</strong> Systemd Service</li>
                                <li>Requires <code>xprintidle</code> for idle detection</li>
                            </ul>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">macOS</h3>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li><strong>Install:</strong> Curl | Bash</li>
                                <li><strong>Persist:</strong> LaunchAgent</li>
                                <li>USB Blocking limited due to Apple SIP</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
