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
    <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 shadow-sm p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-600">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Security Intelligence</h1>
              <p className="text-sm text-slate-500">
                Board-ready cyber posture: Compliance readiness, financial breach loss avoidance & SOC operational velocity
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportBoardReport}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Compiling Report...' : 'Download Board Briefing (PDF)'}
        </button>
      </div>

      {/* Interactive Simulation & Demonstration Banner */}
      <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-4 flex items-start sm:items-center gap-3 text-xs text-purple-900 dark:text-purple-200">
        <Award className="w-5 h-5 text-purple-600 shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <span className="font-bold">Executive Boardroom Simulation Mode:</span> The metrics below illustrate projected breach loss avoidance ($4.2M) and compliance indices based on enterprise telemetry baselines. Report generation reflects sandbox demonstration data.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Breach Loss Avoidance</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">$4.85M</div>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> +28% ROI on Cyber Defense
          </p>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Mean Time to Detect (MTTD)</span>
            <Clock className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-black text-cyan-600 mt-2">1.2 min</div>
          <p className="text-xs text-slate-500 mt-1 font-mono">Industry Benchmark: 198 days</p>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Mean Time to Contain (MTTR)</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-600 mt-2">3.4 min</div>
          <p className="text-xs text-slate-500 mt-1 font-mono">Autonomous SOAR Playbooks</p>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Cyber Insurance Rating</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">AAA Tier</div>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">Premium Discount Qualified</p>
        </div>
      </div>

      {/* Compliance Frameworks Scorecard */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Regulatory & Compliance Framework Posture</h2>
            <p className="text-xs text-slate-500">Continuous automated audit evidence collection & control validation</p>
          </div>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Audit Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {complianceFrameworks.map((fw, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{fw.name}</span>
                <span className="text-xs font-bold text-emerald-600">{fw.score}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full" 
                  style={{ width: `${fw.score}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>{fw.status}</span>
                <span>Controls: {fw.controlsPassed}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Executive Strategic Narrative */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">CISO Tactical Briefing</h3>
        <p className="text-xs text-slate-700 leading-relaxed font-sans">
          Over the trailing 30 days, Monitorix EDR fleet protection combined with continuous attack surface intelligence has neutralized 100% of perimeter intrusion attempts prior to lateral expansion. Autonomous containment playbooks reduced operational downtime by an estimated 94.2 hours, maintaining enterprise SLA uptime at 99.99%.
        </p>
      </div>
    </div>
  );
}
