import { Shield, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface Event {
    id: number;
    agentId: string;
    type: string;
    details: string;
    timestamp: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    status: string;
}

interface IncidentTimelineProps {
    events: Event[];
}

export default function IncidentTimeline({ events }: IncidentTimelineProps) {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
            case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]';
            case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
        }
    };

    const getIcon = (type: string) => {
        if (type.includes('Threat') || type.includes('Malware')) return <AlertTriangle className="w-4 h-4" />;
        if (type.includes('Policy') || type.includes('Access')) return <Shield className="w-4 h-4" />;
        if (type.includes('System') || type.includes('Update')) return <Info className="w-4 h-4" />;
        return <CheckCircle className="w-4 h-4" />;
    };

    return (
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[21px] before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-800 before:to-transparent">
            {events.map((event) => (
                <div key={event.id} className="relative flex items-start gap-8 group">
                    {/* Timeline Node */}
                    <div className={`mt-2 w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 z-10 border-2 transition-all duration-500 group-hover:scale-110 ${getSeverityColor(event.severity)}`}>
                        {getIcon(event.type)}
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 glass-card p-6 group-hover:border-blue-500/30 transition-all duration-500">
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">{event.type}</h4>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight mb-4 leading-relaxed line-clamp-2">
                            {event.details}
                        </p>
                        <div className="flex items-center gap-4">
                            <span className="text-[8px] font-black px-3 py-1 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 uppercase tracking-widest">
                                NODE // {event.agentId}
                            </span>
                            <span className={`text-[8px] font-black px-3 py-1 rounded-md border uppercase tracking-widest ${event.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                {event.status}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
