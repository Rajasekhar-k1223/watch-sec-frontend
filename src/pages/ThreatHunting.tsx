import { useState } from 'react';
import { Search, Save, FolderPlus, Database, Server, FileText, Globe, Bot, Send, Sparkles } from 'lucide-react';
import { API_URL } from '../config';

export default function ThreatHunting() {
  const [query, setQuery] = useState('process.name:"powershell.exe" AND network.dest_port:4444');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // AI Copilot State
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotResponse, setCopilotResponse] = useState<{translated_kql?: string, analysis?: string} | null>(null);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  const handleCopilotSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!copilotQuery.trim()) return;
    setIsCopilotThinking(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/ai/hunting/copilot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: copilotQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setCopilotResponse(data);
        if (data.translated_kql) {
          setQuery(data.translated_kql);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCopilotThinking(false);
      setCopilotQuery('');
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/hunting/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: query, time_range: '24h' })
      });
      if (res.ok) {
        const data = await res.json();
        const baseResults = data.results || [];
        
        // Enhance results with Threat Intel lookup for IPs or Hashes
        const enhancedResults = await Promise.all(baseResults.map(async (row: any) => {
            let malicious = false;
            let intelMatches = [];
            // Extract potential IOCs (very basic regex for IP and Hash)
            const ips = row.data.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) || [];
            const hashes = row.data.match(/\b[a-fA-F0-9]{64}\b/g) || [];
            
            for (const ip of ips) {
                try {
                    const tiRes = await fetch(`${API_URL}/v2/threat-intel/ioc/lookup?value=${ip}&type=IPv4`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (tiRes.ok) {
                        const tiData = await tiRes.json();
                        if (tiData.is_malicious) { malicious = true; intelMatches.push(ip); }
                    }
                } catch (e) {}
            }
            
            for (const hash of hashes) {
                try {
                    const tiRes = await fetch(`${API_URL}/v2/threat-intel/ioc/lookup?value=${hash}&type=SHA256`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (tiRes.ok) {
                        const tiData = await tiRes.json();
                        if (tiData.is_malicious) { malicious = true; intelMatches.push(hash); }
                    }
                } catch (e) {}
            }
            
            return { ...row, isMalicious: malicious, intelMatches };
        }));
        
        setResults(enhancedResults);
      } else {
        setResults([]);
      }
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
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
    <div className="p-4 md:p-6 space-y-6 bg-[#0a0a0a] min-h-screen text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#00ff8e]">Threat Hunting Workspace</h1>
          <p className="text-gray-400">Proactive Telemetry Search & Incident Timeline Reconstruction</p>
        </div>
        <div className="flex flex-wrap gap-3">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:space-x-4">
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
                      <tr key={idx} className={`border-b border-gray-800 hover:bg-[#2a2a2a] ${row.isMalicious ? 'bg-red-900/20' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{row.timestamp}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {getIconForType(row.type)}
                            <span>{row.type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#00ff8e]">{row.agent}</td>
                        <td className="px-4 py-3 font-mono text-xs truncate max-w-md" title={row.data}>
                          {row.data}
                          {row.isMalicious && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-red-600/30 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-500/50">
                                Malicious IOC Detected
                            </span>
                          )}
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

        {/* AI Copilot Panel */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1a1a] border-gray-800 h-[600px] flex flex-col">
            <div className="border-b border-gray-800 pb-3 p-4">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-[#00ff8e]" />
                <h3 className="text-lg font-bold">AI Threat Hunter Copilot</h3>
              </div>
            </div>
            
            <div className="p-4 flex-1 overflow-auto space-y-4 text-sm text-gray-300">
              <div className="bg-[#2a2a2a] p-3 rounded-lg rounded-tl-none inline-block">
                Hello! I can translate your natural language requests into complex KQL queries to hunt through our telemetry. Try asking: <br/><br/>
                <span className="italic">"Find all powershell executions making network connections to port 4444"</span>
              </div>

              {copilotResponse && (
                <div className="bg-[#00331c] border border-[#00ff8e]/30 p-3 rounded-lg text-[#00ff8e] mt-4">
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>Analysis Complete</span>
                  </div>
                  <p>{copilotResponse.analysis}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800">
              <form onSubmit={handleCopilotSubmit} className="relative">
                <input
                  type="text"
                  value={copilotQuery}
                  onChange={(e) => setCopilotQuery(e.target.value)}
                  placeholder="Ask Copilot to hunt..."
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg py-2 pl-3 pr-10 focus:border-[#00ff8e] focus:outline-none"
                  disabled={isCopilotThinking}
                />
                <button 
                  type="submit" 
                  disabled={isCopilotThinking}
                  className="absolute right-2 top-2 text-[#00ff8e] hover:text-[#00cc7a] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
