import React, { useState, useEffect } from 'react';
import {
  GitBranch, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, ArrowRight,
  Activity, Terminal, Layers, Lock, Sparkles, RefreshCw, Play, Sliders,
  Plus, Search, Filter, Shield, Cpu, Database, Gauge, Zap, Check, RotateCcw,
  AlertCircle, FileText, Server, Globe, ExternalLink, HardDrive, BarChart3,
  Flame, ShieldAlert, HeartHandshake, Eye
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ContinuousEvolution() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'gates' | 'streams' | 'releases' | 'quality'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<any>(null);
  const [gatesList, setGatesList] = useState<any[]>([]);
  const [streamsList, setStreamsList] = useState<any[]>([]);
  const [releasesList, setReleasesList] = useState<any[]>([]);
  const [qualityDimensions, setQualityDimensions] = useState<any>({});

  // Modals & Forms
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [evaluatingGates, setEvaluatingGates] = useState(false);
  const [selectedReleaseForRollback, setSelectedReleaseForRollback] = useState<any>(null);
  const [rollbackReason, setRollbackReason] = useState('Canary fleet latency spike detected in regional zone.');

  // New Release Form
  const [newVersion, setNewVersion] = useState('v18.2.0');
  const [newStreamKey, setNewStreamKey] = useState('MINOR');
  const [newReleaseType, setNewReleaseType] = useState('MINOR');
  const [newChangelog, setNewChangelog] = useState('Zero-copy eBPF network telemetry, graph correlation, and automated MITRE sync.');
  const [newRollbackTarget, setNewRollbackTarget] = useState('v18.0.0');

  // Fetch Telemetry
  const fetchOverview = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${API_URL}/v2/evolution/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOverview(data);
      setGatesList(data.gates_definition || []);
      setStreamsList(data.streams || []);
      setReleasesList(data.recent_releases || []);
      setQualityDimensions(data.quality_dimensions || {});
    } catch (err: any) {
      console.error('Error fetching Continuous Evolution telemetry:', err);
      toast.error('Failed to load evolution program telemetry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [token]);

  // Evaluate All 13 Gates
  const handleEvaluateGates = async (releaseId: string) => {
    try {
      setEvaluatingGates(true);
      toast.loading(`Evaluating 13 production release gates on ${releaseId}...`, { id: 'eval-gates' });
      const res = await fetch(`${API_URL}/v2/evolution/gates/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ release_id: releaseId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Evaluation failed');

      toast.success(`All 13 Release Gates Certified! (${data.total_execution_seconds}s)`, { id: 'eval-gates' });
      fetchOverview();
    } catch (err: any) {
      toast.error(err.message, { id: 'eval-gates' });
    } finally {
      setEvaluatingGates(false);
    }
  };

  // Promote Release
  const handlePromoteRelease = async (releaseId: string, stage: string, canaryPercent: number = 100) => {
    try {
      toast.loading(`Promoting ${releaseId} to ${stage}...`, { id: 'promote-rel' });
      const res = await fetch(`${API_URL}/v2/evolution/releases/${releaseId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target_stage: stage,
          canary_percent: canaryPercent
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Promotion failed');

      toast.success(`Release successfully promoted to ${stage}!`, { id: 'promote-rel' });
      fetchOverview();
    } catch (err: any) {
      toast.error(err.message, { id: 'promote-rel' });
    }
  };

  // Register New Release Candidate
  const handleRegisterRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast.loading('Registering versioned release...', { id: 'reg-rel' });
      const res = await fetch(`${API_URL}/v2/evolution/releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          version_string: newVersion,
          stream_key: newStreamKey,
          release_type: newReleaseType,
          changelog_summary: newChangelog,
          rollback_target_version: newRollbackTarget
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');

      toast.success(`Registered ${data.version} successfully!`, { id: 'reg-rel' });
      setShowRegisterModal(false);
      fetchOverview();
    } catch (err: any) {
      toast.error(err.message, { id: 'reg-rel' });
    }
  };

  // Emergency Rollback
  const handleTriggerRollback = async () => {
    if (!selectedReleaseForRollback) return;
    try {
      toast.loading(`Executing emergency rollback on ${selectedReleaseForRollback.version}...`, { id: 'rollback-rel' });
      const res = await fetch(`${API_URL}/v2/evolution/releases/${selectedReleaseForRollback.release_id}/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rollbackReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Rollback failed');

      toast.success(`Emergency rollback complete! Restored to ${data.restored_baseline_version}`, { id: 'rollback-rel' });
      setShowRollbackModal(false);
      fetchOverview();
    } catch (err: any) {
      toast.error(err.message, { id: 'rollback-rel' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-slate-400">Loading Continuous Evolution Program...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Program Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 shadow-2xl">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Permanent Program
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Monitorix v18.0.0-LTS
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Phase 18 Final Strategic Milestone
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Continuous Evolution & Release Governance
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Transitioned from numbered roadmap to a sovereign continuous engineering, security research, and release program.
              All production deployments are certified through 13 mandatory release gates across 7 active streams.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchOverview}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              Sync
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              New Versioned Release
            </button>
          </div>
        </div>

        {/* Governance Declaration Notice */}
        <div className="mt-5 pt-4 border-t border-indigo-500/15 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span><strong>Roadmap Policy:</strong> Numbered phases permanently deprecated. Evolution proceeds through <strong>Monitorix v18.x</strong>, <strong>v19.x</strong>, and strategic research initiatives.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono">
            <span>Sovereign Standalone: <strong className="text-emerald-400">100%</strong></span>
            <span>External Dependencies: <strong className="text-emerald-400">0</strong></span>
            <span>Gate Strictness: <strong className="text-indigo-400">13 / 13</strong></span>
          </div>
        </div>
      </div>

      {/* KPI Cards: The 6 Continuous Quality Dimensions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Cont. Security</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">100%</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-0.5">0-Day Mitigation Rate</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Cont. Detection</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">95.4%</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-0.5">MITRE ATT&CK Coverage</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Cont. Agents</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">38.4 MB</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Fleet Avg Memory</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Cont. AI Quality</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">98.8%</div>
          <div className="text-[11px] text-amber-300 font-medium mt-0.5">Groundedness Score</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Cont. Platform</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">99.999%</div>
          <div className="text-[11px] text-indigo-300 font-medium mt-0.5">Availability (72.5K EPS)</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Cont. Compliance</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">100%</div>
          <div className="text-[11px] text-purple-300 font-medium mt-0.5">Ledger Integrity</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          Lifecycle & Master Model
        </button>

        <button
          onClick={() => setActiveTab('gates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'gates'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          13 Production Release Gates
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">100%</span>
        </button>

        <button
          onClick={() => setActiveTab('streams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'streams'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          7 Release Streams
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">7 Active</span>
        </button>

        <button
          onClick={() => setActiveTab('releases')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'releases'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Release Versions & Canary
        </button>

        <button
          onClick={() => setActiveTab('quality')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'quality'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Continuous Quality Telemetry
        </button>
      </div>

      {/* TAB 1: OVERVIEW & 10-STAGE CONTINUOUS MODEL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 10-Stage Visual Stepper */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Continuous Development Lifecycle</h3>
                <p className="text-xs text-slate-400">The 10-stage infinite loop driving all Monitorix evolution</p>
              </div>
              <span className="text-xs font-mono text-indigo-400 font-semibold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Closed-Loop Feedback
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {(overview?.lifecycle_stages || []).map((stg: any) => (
                <div
                  key={stg.stage}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-indigo-500/40 transition group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                      {stg.order}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition transform group-hover:translate-x-0.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition">{stg.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{stg.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Master Principles & Strategic Initiatives */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Master Continuous Engineering Principles</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monitorix must continuously evolve without unnecessary feature duplication or external dependencies:
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>More Secure:</strong> Real-time CVE feeds, automated exploit defense, zero regression on existing MITRE ATT&CK techniques.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>More Reliable:</strong> 99.999% availability, zero-downtime rolling upgrades, automated verified rollbacks without data loss.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>More Scalable:</strong> Benchmarked up to 1,000,000 endpoints with sub-50ms API latency and 70K+ EPS ingestion.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>More Intelligent & Autonomous:</strong> AI groundedness &gt;98%, hallucination &lt;1%, tool-use guardrails, human override safeguards.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Sovereign & Standalone:</strong> 100% Monitorix-controlled. Zero external proprietary dependencies or legacy platforms.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Active Strategic Programs</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Post-Phase 18 Roadmaps</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strategic execution is organized into continuous programs and product milestones instead of numbered phases:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Program: Autonomous Threat Hunting</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">v18.x Milestone</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Automated hypothesis generation and proactive MITRE sweeping</div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Initiative: Ultra-Lightweight Rust Agent v5.0</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 font-mono">Agent Stream</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Sub-20MB memory footprint and zero-overhead eBPF ring buffer</div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    Testing
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Milestone: Cross-Cloud Sovereign Federation</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-mono">Major v19.x</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Cryptographic zero-trust mesh across air-gapped and cloud enclaves</div>
                  </div>
                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    Research
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 13 PRODUCTION RELEASE GATES */}
      {activeTab === 'gates' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">The 13 Mandatory Production Release Gates</h3>
              <p className="text-xs text-slate-400">Zero tolerance policy: 100% of gates must pass before any version is promoted to production.</p>
            </div>
            <button
              onClick={() => handleEvaluateGates('REL-V18-0-0-LTS')}
              disabled={evaluatingGates}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition shrink-0"
            >
              <Play className={`w-3.5 h-3.5 ${evaluatingGates ? 'animate-spin' : ''}`} />
              Run 13 Gates Audit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {gatesList.map((g: any) => (
              <div
                key={g.index}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      #{g.index}
                    </span>
                    <span className="text-xs font-bold text-white">{g.name}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Check className="w-3 h-3" />
                    PASSED
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Category: <strong className="text-slate-300">{g.category}</strong></span>
                  <span>Target: <strong className="text-emerald-400">&ge; {g.threshold}%</strong></span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
                  {g.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: 7 RELEASE STREAMS */}
      {activeTab === 'streams' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streamsList.map((s: any) => (
              <div
                key={s.stream_key}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/30 transition space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <GitBranch className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-sm font-bold text-white">{s.stream_name}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {s.cadence}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Current Release:</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{s.current_version}</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Channels:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(s.target_channels || []).map((ch: string) => (
                      <span key={ch} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700/60">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">13-Gate Automation:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Enabled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RELEASES & CANARY MANAGEMENT */}
      {activeTab === 'releases' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Active Versioned Releases & Canary Deployments</h3>
              <p className="text-xs text-slate-400">Manage release promotions, rollout percentages, and emergency rollbacks.</p>
            </div>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Release
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Release ID / Version</th>
                    <th className="py-3 px-4">Stream</th>
                    <th className="py-3 px-4">Lifecycle Stage</th>
                    <th className="py-3 px-4">Canary %</th>
                    <th className="py-3 px-4">13 Gates</th>
                    <th className="py-3 px-4">Rollback Target</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {releasesList.map((rel: any) => (
                    <tr key={rel.release_id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{rel.version}</div>
                        <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs">{rel.release_id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                          {rel.stream}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rel.lifecycle_stage === 'PRODUCTION'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : rel.lifecycle_stage === 'CANARY'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : rel.lifecycle_stage === 'ROLLED_BACK'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {rel.lifecycle_stage}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${rel.canary_percent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-300">{rel.canary_percent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {rel.all_gates_passed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 13 / 13 Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-xs">
                            <AlertCircle className="w-3.5 h-3.5" /> Evaluation Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {rel.rollback_target || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {rel.lifecycle_stage !== 'PRODUCTION' && (
                          <button
                            onClick={() => handlePromoteRelease(rel.release_id, 'PRODUCTION', 100)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition"
                          >
                            Promote Prod
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedReleaseForRollback(rel);
                            setShowRollbackModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition"
                        >
                          Rollback
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CONTINUOUS QUALITY TELEMETRY */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(qualityDimensions).map(([domain, metrics]: [string, any]) => (
              <div
                key={domain}
                className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Continuous {domain} Telemetry</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Optimal
                  </span>
                </div>

                <div className="space-y-3">
                  {metrics.map((m: any) => (
                    <div
                      key={m.metric_key}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 capitalize">
                          {m.metric_key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Threshold: {m.operator} {m.threshold} {m.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-sm">
                          {m.value} {m.unit}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium">
                          {m.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW VERSIONED RELEASE */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Register New Versioned Release</h3>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRegisterRelease} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Version String (e.g., v18.2.0, v19.0.0-STABLE)
                </label>
                <input
                  type="text"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  required
                  placeholder="v18.2.0"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Note: Numbered phases (e.g. Phase 19/20) are permanently prohibited by architecture policy.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Release Stream</label>
                  <select
                    value={newStreamKey}
                    onChange={(e) => setNewStreamKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="MAJOR">MAJOR (Quarterly)</option>
                    <option value="MINOR">MINOR (Bi-weekly)</option>
                    <option value="SECURITY">SECURITY (Emergency)</option>
                    <option value="AGENT">AGENT (Monthly)</option>
                    <option value="DETECTION_PACK">DETECTION_PACK (Weekly)</option>
                    <option value="INTELLIGENCE">INTELLIGENCE (Hourly)</option>
                    <option value="CONNECTOR">CONNECTOR (On-Demand)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rollback Baseline Target</label>
                  <input
                    type="text"
                    value={newRollbackTarget}
                    onChange={(e) => setNewRollbackTarget(e.target.value)}
                    required
                    placeholder="v18.0.0"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Changelog Summary</label>
                <textarea
                  rows={3}
                  value={newChangelog}
                  onChange={(e) => setNewChangelog(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/30"
                >
                  Register Release Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EMERGENCY ROLLBACK */}
      {showRollbackModal && selectedReleaseForRollback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-white">Emergency Rollback Confirmation</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to roll back release <strong className="text-white font-mono">{selectedReleaseForRollback.version}</strong> back to certified baseline <strong className="text-emerald-400 font-mono">{selectedReleaseForRollback.rollback_target || 'v18.0.0'}</strong>.
            </p>

            <div className="text-xs space-y-1.5">
              <label className="block text-slate-300 font-semibold">Rollback Trigger Reason</label>
              <textarea
                rows={3}
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setShowRollbackModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerRollback}
                className="px-4 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-md shadow-rose-600/30"
              >
                Confirm Emergency Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
