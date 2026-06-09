import { useState } from 'react';
import { Search, Save, FolderPlus, Clock, Database, Server, FileText, Globe } from 'lucide-react';

export default function ThreatHunting() {
  const [query, setQuery] = useState('process.name:"powershell.exe" AND network.dest_port:4444');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    // Mock API call to /api/v2/hunting/search
    setTimeout(() => {
      setResults([
        { id: 101, type: 'Process', agent: 'WIN-DESK-01', data: 'powershell.exe -w hidden -enc JAB...', time: '10:42:01 AM' },
        { id: 102, type: 'Network', agent: 'WIN-DESK-01', data: 'TCP 4444 -> 192.168.1.100', time: '10:42:05 AM' },
        { id: 103, type: 'DNS', agent: 'WIN-DESK-01', data: 'Query: malicious-c2.internal', time: '10:42:06 AM' },
      ]);
      setIsSearching(false);
    }, 800);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'Process': return <Server className="w-4 h-4 text-blue-400" />;
      case 'Network': return <Globe className="w-4 h-4 text-green-400" />;
      case 'DNS': return <Database className="w-4 h-4 text-purple-400" />;
      case 'File': return <FileText className="w-4 h-4 text-yellow-400" />;
      default: return <Server className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#0a0a0a] min-h-screen text-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#00ff8e]">Threat Hunting Workspace</h1>
          <p className="text-gray-400">Proactive Telemetry Search & Incident Timeline Reconstruction</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-[#1a1a1a] border border-gray-700 px-4 py-2 rounded flex items-center hover:bg-[#2a2a2a]">
            <FolderPlus className="w-4 h-4 mr-2" /> New Workspace
          </button>
          <button className="bg-[#1a1a1a] border border-gray-700 px-4 py-2 rounded flex items-center hover:bg-[#2a2a2a]">
            <Save className="w-4 h-4 mr-2" /> Saved Hunts
          </button>
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-[#1a1a1a] border-gray-800">
        <div className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded p-2 pl-10 text-white font-mono text-sm focus:border-[#00ff8e] focus:outline-none"
                placeholder="Enter KQL/Lucene query (e.g., process.name: 'cmd.exe')"
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-[#00ff8e] text-black px-6 py-2 rounded font-bold hover:bg-[#00cc7a] transition-colors disabled:opacity-50">
              {isSearching ? 'Searching...' : 'Hunt'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Results Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#1a1a1a] border-gray-800 h-[600px] flex flex-col">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold">Telemetry Results {results.length > 0 && `(${results.length} hits)`}</h3>
            </div>
            <div className="p-0 flex-1 overflow-auto">
              {results.length === 0 && !isSearching ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Run a query to view telemetry data.
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase bg-[#0a0a0a] sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Agent</th>
                      <th className="px-4 py-3">Raw Data</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-[#2a2a2a]">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{row.time}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {getIconForType(row.type)}
                            <span>{row.type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#00ff8e]">{row.agent}</td>
                        <td className="px-4 py-3 font-mono text-xs truncate max-w-md" title={row.data}>
                          {row.data}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-xs border border-gray-600 px-2 py-1 rounded hover:bg-gray-700">
                            + Workspace
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Workspace Timeline Panel */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1a1a] border-gray-800 h-[600px] flex flex-col">
            <div className="border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-[#00ff8e]" />
                <h3 className="text-lg font-bold">Active Case Timeline</h3>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <div className="space-y-6">
                <div className="border-l-2 border-gray-700 pl-4 relative">
                  <div className="absolute w-3 h-3 bg-[#00ff8e] rounded-full -left-[7px] top-1"></div>
                  <p className="text-xs text-gray-500 font-mono">10:42:01 AM</p>
                  <p className="text-sm font-medium">Suspicious Process</p>
                  <p className="text-xs text-gray-400 mt-1">powershell.exe -w hidden execution detected by analyst.</p>
                </div>
                
                <div className="border-l-2 border-gray-700 pl-4 relative">
                  <div className="absolute w-3 h-3 bg-red-500 rounded-full -left-[7px] top-1"></div>
                  <p className="text-xs text-gray-500 font-mono">10:42:05 AM</p>
                  <p className="text-sm font-medium">C2 Beacon</p>
                  <p className="text-xs text-gray-400 mt-1">TCP connection established to known malicious IP via port 4444.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
