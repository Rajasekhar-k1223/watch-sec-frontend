import { Sparkles, Zap, Server, ShieldCheck, AlertTriangle } from 'lucide-react';

interface Agent {
    agentId: string;
    status: string;
}

interface Incident {
    Severity: string;
    Type: string;
}

interface AiInsightPanelProps {
    agents: Agent[];
    incidents: Incident[];
}

export default function AiInsightPanel({ agents = [], incidents = [] }: AiInsightPanelProps) {
    const onlineAgents = agents.filter(a => a.status?.toLowerCase() === 'online' || a.status?.toLowerCase() === 'running').length;
    const offlineAgents = agents.length - onlineAgents;
    
    // Dynamic insights based on real fleet data
    const insights = [
        {
            title: 'Monitored Fleet',
            description: `${onlineAgents} agents online, ${offlineAgents} offline.`,
            impact: offlineAgents > 0 ? 'Negative' : 'Positive',
            value: `${onlineAgents}/${agents.length}`,
            icon: Server
        },
        {
            title: 'Active Anomalies',
            description: incidents.length > 0 
                ? `Detected ${incidents.length} security alerts requiring review.` 
                : 'Zero active security threats detected.',
            impact: incidents.length > 0 ? 'Negative' : 'Positive',
            value: incidents.length > 0 ? `${incidents.length} ALERTS` : 'CLEAN',
            icon: incidents.length > 0 ? AlertTriangle : ShieldCheck
        }
    ];

    // Real dynamic tactical summary
    const getTacticalSummary = () => {
        if (incidents.length > 0) {
            return `Fleet health is degraded with ${incidents.length} active threat anomalies. Suspicious patterns detected on active hosts. Recommendation: Initiate containment protocol immediately.`;
        }
        if (agents.length === 0) {
            return "No agents registered in this tenant dashboard. Deploy the Monitorix agent binary to begin real-time telemetry scanning.";
        }
        return `All ${agents.length} monitored assets are currently healthy and reporting within normal parameters. Real-time EDR checks verify zero anomalies.`;
    };

    return (
        <div className="glass-card p-6 h-full border-blue-500/10 overflow-hidden relative group">
            {/* Background Sparkle Effect */}
            <div className="absolute top-[-10%] right-[-10%] opacity-20 group-hover:opacity-40 transition-opacity duration-1000 rotate-12">
                <Sparkles className="w-32 h-32 text-blue-500 blur-xl" />
            </div>

            <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                    <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-tight">Fleet Intel</h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black mt-1">Autonomous Analytics v2</p>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {/* TACTICAL NARRATIVE OVERLAY */}
                <div className="p-5 rounded-2xl bg-blue-600/5 border border-blue-500/20 mb-4">
                    <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Tactical Summary</h4>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                        "{getTacticalSummary()}"
                    </p>
                </div>

                {insights.map((insight, idx) => {
                    const Icon = insight.icon;
                    return (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/50 dark:border-slate-800/50 transition-all hover:bg-slate-50 dark:hover:bg-white/10 hover:translate-x-1 group/item">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">{insight.title}</h4>
                                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight line-clamp-1">{insight.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 ml-6">
                                <div className={`flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase ${insight.impact === 'Positive' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                    {insight.value}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button className="w-full mt-6 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl hover:scale-[1.02] active:scale-95">
                Execute Predictive Protocol
            </button>
        </div>
    );
}
