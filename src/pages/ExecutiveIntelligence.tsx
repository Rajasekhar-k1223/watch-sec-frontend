import React, { useState } from 'react';
import { 
  Briefcase, ShieldCheck, TrendingUp, DollarSign, Clock, Award, 
  Download, ArrowUpRight, CheckCircle2, ShieldAlert, BarChart3, FileText 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExecutiveIntelligence() {
  const [downloading, setDownloading] = useState(false);

  const complianceFrameworks = [
    { name: 'SOC 2 Type II', score: 98, status: 'Fully Compliant', controlsPassed: '118/120' },
    { name: 'ISO/IEC 27001:2022', score: 94, status: 'Audited & Verified', controlsPassed: '88/93' },
    { name: 'HIPAA Security Rule', score: 100, status: 'Zero Findings', controlsPassed: '42/42' },
    { name: 'PCI-DSS v4.0', score: 96, status: 'Egress Guard Active', controlsPassed: '62/64' },
    { name: 'NIST CSF 2.0', score: 92, status: 'Tier 4 Adaptive', controlsPassed: '102/108' },
  ];

  const handleExportBoardReport = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      toast.success('Executive Board Summary Report generated & downloaded');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Executive Security Intelligence</h1>
              <p className="text-sm text-slate-400">
                Board-ready cyber posture: Compliance readiness, financial breach loss avoidance & SOC operational velocity
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportBoardReport}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-600/20"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Compiling Report...' : 'Download Board Briefing (PDF)'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Breach Loss Avoidance</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2">$4.85M</div>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> +28% ROI on Cyber Defense
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Mean Time to Detect (MTTD)</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-cyan-400 mt-2">1.2 min</div>
          <p className="text-xs text-slate-400 mt-1 font-mono">Industry Benchmark: 198 days</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Mean Time to Contain (MTTR)</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-400 mt-2">3.4 min</div>
          <p className="text-xs text-slate-400 mt-1 font-mono">Autonomous SOAR Playbooks</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Cyber Insurance Rating</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2">AAA Tier</div>
          <p className="text-xs text-emerald-400 mt-1 font-semibold">Premium Discount Qualified</p>
        </div>
      </div>

      {/* Compliance Frameworks Scorecard */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Regulatory & Compliance Framework Posture</h2>
            <p className="text-xs text-slate-400">Continuous automated audit evidence collection & control validation</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Audit Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {complianceFrameworks.map((fw, i) => (
            <div key={i} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{fw.name}</span>
                <span className="text-xs font-bold text-emerald-400">{fw.score}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full" 
                  style={{ width: `${fw.score}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{fw.status}</span>
                <span>Controls: {fw.controlsPassed}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Executive Strategic Narrative */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">CISO Tactical Briefing</h3>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          Over the trailing 30 days, Monitorix EDR fleet protection combined with RedRainbow continuous attack surface intelligence has neutralized 100% of perimeter intrusion attempts prior to lateral expansion. Autonomous containment playbooks reduced operational downtime by an estimated 94.2 hours, maintaining enterprise SLA uptime at 99.99%.
        </p>
      </div>
    </div>
  );
}
