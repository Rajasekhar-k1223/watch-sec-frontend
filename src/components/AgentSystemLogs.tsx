import { useState, useMemo } from 'react';
import { 
    List, Search, Filter, LayoutGrid, Table, BarChart2, 
    AlertCircle, Activity, Clock, Trash2, ArrowRight, Zap
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';

interface LogEvent {
    type: string;
    details: string;
    timestamp: string;
}

interface AgentSystemLogsProps {
    data: LogEvent[];
    onClear: () => void;
}

export default function AgentSystemLogs({ data, onClear }: AgentSystemLogsProps) {
    const [viewMode, setViewMode] = useState<'best' | 'table'>('best');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string>('All');
    const [activeRange, setActiveRange] = useState<string>('24h');

    // Extract unique types for filter dropdown
    const eventTypes = useMemo(() => {
        const types = new Set(data.map(d => d.type));
        return ['All', ...Array.from(types)].sort();
    }, [data]);

    // Filtering logic (including time ranges based on the 'data' passed)
    const filteredData = useMemo(() => {
        const now = new Date();
        return data.filter(evt => {
            const evtDate = new Date(evt.timestamp);
            const diffHours = (now.getTime() - evtDate.getTime()) / (1000 * 60 * 60);
            
            // Time filtering
            let matchesRange = true;
            if (activeRange === '24h') matchesRange = diffHours <= 24;
            else if (activeRange === '1w') matchesRange = diffHours <= 168; 
            else if (activeRange === '30d') matchesRange = diffHours <= 720; 

            const matchesSearch = evt.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 evt.type.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = selectedType === 'All' || evt.type === selectedType;
            
            return matchesRange && matchesSearch && matchesType;
        });
    }, [data, searchTerm, selectedType, activeRange]);

    // Chart Data: Frequency by Minute
    const frequencyData = useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach(evt => {
            const date = new Date(evt.timestamp);
            const key = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([time, count]) => ({ time, count }))
            .slice(-15);
    }, [data]);

    const distributionData = useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach(evt => {
            counts[evt.type] = (counts[evt.type] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [data]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

    return (
        <div className="flex flex-col gap-6 font-sans text-gray-600 p-2 sm:p-4">
            {/* Minimal Control Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                        <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Intelligence Stream</span>
                        <div className="flex gap-4">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1.5">
                                <List size={12} className="text-blue-500" /> {filteredData.length} Packets Intercepted
                            </span>
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight flex items-center gap-1.5">
                                <AlertCircle size={12} /> {filteredData.filter(d => d.type.toLowerCase().includes('error')).length} Anomalies detected
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-1 flex items-center">
                        {['24h', '1w', '30d'].map(r => (
                            <button
                                key={r}
                                onClick={() => setActiveRange(r)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeRange === r ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-1 flex items-center">
                        <button onClick={() => setViewMode('best')} className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase transition-all ${viewMode === 'best' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
                            <LayoutGrid size={12} />
                        </button>
                        <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
                            <Table size={12} />
                        </button>
                    </div>
                    <button onClick={onClear} className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-100 transition-all shadow-sm">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Visualizations Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Frequency Chart */}
                    <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-xl shadow-gray-200/30">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                <BarChart2 size={16} className="text-blue-600" /> Telemetry Frequency
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">Real-time Stream</span>
                            </div>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={frequencyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                    <XAxis 
                                        dataKey="time" 
                                        stroke="#9ca3af" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <YAxis 
                                        stroke="#9ca3af" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Distribution Chart */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl shadow-gray-200/30">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Filter size={16} className="text-blue-600" /> Type Distribution
                        </h3>
                        <div className="h-[200px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {distributionData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search intelligence cache..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-2xl pl-14 pr-6 py-4 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-gray-400 outline-none shadow-xl shadow-gray-200/20"
                        />
                    </div>
                    <div className="relative w-full md:w-72">
                         <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                         <select 
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-2xl pl-14 pr-12 py-4 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-900 outline-none appearance-none cursor-pointer shadow-xl shadow-gray-200/20 font-bold uppercase tracking-tight"
                         >
                            {eventTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                         </select>
                         <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                             <Clock size={16} />
                         </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/40 min-h-[500px]">
                    {viewMode === 'best' ? (
                        /* BEST VIEW: Cards */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                            {filteredData.length === 0 ? (
                                <div className="col-span-full py-32 text-center flex flex-col items-center justify-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-xl border border-gray-50 scale-110">
                                        <Search size={40} className="text-gray-200" />
                                    </div>
                                    <h4 className="text-gray-900 font-black uppercase tracking-tight text-xl mb-2">Cache Empty</h4>
                                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest max-w-xs">No intelligence matches your criteria.</p>
                                </div>
                            ) : (
                                filteredData.map((evt, idx) => {
                                    const isError = evt.type.toLowerCase().includes('error') || evt.type.toLowerCase().includes('block');
                                    const isSystem = evt.type.toLowerCase().includes('system') || evt.type.toLowerCase().includes('heartbeat');

                                    return (
                                        <div key={idx} className="group bg-white border border-gray-50 p-8 rounded-[2rem] hover:border-blue-600/20 transition-all hover:shadow-2xl hover:shadow-blue-500/10 relative overflow-hidden">
                                            <div className={`absolute -top-16 -right-16 w-40 h-40 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700 ${isError ? 'bg-red-500' : isSystem ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                            
                                            <div className="flex justify-between items-start mb-8 relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl border ${isError ? 'bg-red-50 text-red-500 border-red-100' : isSystem ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                        {isError ? <AlertCircle size={18} /> : isSystem ? <Zap size={18} /> : <Activity size={18} />}
                                                    </div>
                                                    <div>
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-4 py-1.5 rounded-xl border ${isError ? 'bg-red-50/50 border-red-100 text-red-600' : isSystem ? 'bg-amber-50/50 border-amber-100 text-amber-600' : 'bg-blue-50/50 border-blue-100 text-blue-600'}`}>
                                                            {evt.type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-gray-900 font-black text-xs font-mono leading-none">
                                                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{new Date(evt.timestamp).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-6 relative z-10">
                                                <p className="text-sm border-l-4 border-gray-100 pl-4 py-1 text-gray-600 leading-relaxed font-bold group-hover:text-gray-900 transition-colors">
                                                    {evt.details}
                                                </p>
                                                
                                                <div className="pt-6 border-t border-gray-50 flex justify-between items-center group/btn">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500/20" />
                                                        <div className="w-2 h-2 rounded-full bg-blue-500/10" />
                                                        <div className="w-2 h-2 rounded-full bg-blue-500/5" />
                                                    </div>
                                                    <button className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 group-hover:text-blue-600 transition-all flex items-center gap-2">
                                                        Inspect Payload <ArrowRight size={12} className="group-hover/btn:translate-x-2 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        /* TABLE VIEW: Structured */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-bold uppercase tracking-widest">
                                <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-black">
                                    <tr>
                                        <th className="px-8 py-5">Protocol Timestamp</th>
                                        <th className="px-8 py-5">Packet Type</th>
                                        <th className="px-8 py-5">Intel Payload</th>
                                        <th className="px-8 py-5 text-right">Security Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredData.map((evt, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 group transition-colors">
                                            <td className="px-8 py-5 text-gray-400 whitespace-nowrap">{new Date(evt.timestamp).toLocaleString()}</td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${evt.type.toLowerCase().includes('error') ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'}`}>
                                                    {evt.type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-gray-600 max-w-lg truncate lowercase tracking-tight">{evt.details}</td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="p-2 hover:bg-white rounded-xl text-gray-300 hover:text-blue-600 transition-all border border-transparent hover:border-gray-100 hover:shadow-sm">
                                                    <List size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredData.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-32 text-center text-gray-300 italic font-medium uppercase tracking-widest">Zero intelligence packets extracted.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
