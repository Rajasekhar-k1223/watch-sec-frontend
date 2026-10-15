import { useState, useEffect } from 'react';
import { ShieldAlert, Activity, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface ThreatAnalysis {
    Score: number;
    Level: string;
    TopRisks: string[];
    Recommendation: string;
    Explanation: string;
}

interface AgentRiskScorecardProps {
    agentId: string;
    apiUrl: string;
    token: string;
}

export default function AgentRiskScorecard({ agentId, apiUrl, token }: AgentRiskScorecardProps) {
    const [analysis, setAnalysis] = useState<ThreatAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    const triggerAnalysis = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/agents/${agentId}/threat-analysis`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAnalysis(data);
                toast.success("AI Threat Analysis completed.");
            } else {
                toast.error("Failed to fetch threat analysis.");
            }
        } catch (e) {
            console.error("AI Analysis error:", e);
            toast.error("Error connecting to AI backend.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        triggerAnalysis();
    }, [agentId, token]);

    if (loading && !analysis) {
        return (
            <div className="p-16 flex flex-col items-center justify-center gap-4 text-gray-500">
                <RefreshCw size={32} className="animate-spin text-blue-500" />
                <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Running AI Threat Assessment...</p>
            </div>
        );
    }

    if (!analysis) return null;

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-red-500';
        if (score >= 60) return 'text-orange-500';
        if (score >= 30) return 'text-yellow-500';
        return 'text-emerald-500';
    };

    const getBgColor = (score: number) => {
        if (score >= 90) return 'bg-red-500/10 border-red-500/20';
        if (score >= 60) return 'bg-orange-500/10 border-orange-500/20';
        if (score >= 30) return 'bg-yellow-500/10 border-yellow-500/20';
        return 'bg-emerald-500/10 border-emerald-500/20';
    };

    const scoreColor = getScoreColor(analysis.Score);
    const scoreBg = getBgColor(analysis.Score);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Activity className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-sm md:text-lg font-bold text-gray-900 dark:text-white tracking-tight">AI Risk Scorecard</h3>
                        <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Elsea Generative AI Telemetry Evaluation</p>
                    </div>
                </div>
                <button
                    onClick={triggerAnalysis}
                    disabled={loading}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Analyzing...' : 'Run New Analysis'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Gauge */}
                <div className={`col-span-1 rounded-xl border ${scoreBg} p-8 flex flex-col items-center justify-center shadow-xl`}>
                    <div className="relative flex items-center justify-center w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-gray-200 dark:text-gray-800 stroke-current"
                                strokeWidth="3"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className={`${scoreColor} stroke-current drop-shadow-md`}
                                strokeWidth="3"
                                strokeDasharray={`${analysis.Score}, 100`}
                                strokeLinecap="round"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className={`text-5xl font-black ${scoreColor}`}>{analysis.Score}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Risk Score</span>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                        {analysis.Score >= 60 ? (
                            <ShieldAlert className={`w-5 h-5 ${scoreColor}`} />
                        ) : (
                            <ShieldCheck className={`w-5 h-5 ${scoreColor}`} />
                        )}
                        <span className={`text-sm font-black uppercase ${scoreColor}`}>Level: {analysis.Level}</span>
                    </div>
                </div>

                {/* AI Explanation & Risks */}
                <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-xl flex-1">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Activity size={14} />
                            AI Analyst Explanation
                        </h4>
                        <div className="prose prose-sm dark:prose-invert">
                            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                {analysis.Explanation}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-red-500/5 rounded-xl border border-red-500/10 p-5">
                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <AlertTriangle size={14} />
                                Top Risks Detected
                            </h4>
                            {analysis.TopRisks.length > 0 ? (
                                <ul className="space-y-2">
                                    {analysis.TopRisks.map((risk, idx) => (
                                        <li key={idx} className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-500/10 p-2 rounded">
                                            • {risk}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-500 italic">No significant risks identified.</p>
                            )}
                        </div>
                        <div className="bg-blue-500/5 rounded-xl border border-blue-500/10 p-5">
                            <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ShieldCheck size={14} />
                                AI Recommendation
                            </h4>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                {analysis.Recommendation}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
