import { Server } from 'lucide-react';
import { useState } from 'react';

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

                {activeTab === 'General' ? (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
                        <p className="text-gray-400">Data Storages and Rules Configuration (Coming Soon)</p>
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center border-dashed">
                        <p className="text-gray-500">Placeholder for {activeTab} settings</p>
                    </div>
                )}
            </div>
        </div>
    );
}
