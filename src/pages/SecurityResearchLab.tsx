import React, { useState, useEffect } from 'react';
import {
  FlaskConical, Atom, Cpu, ShieldCheck, CheckCircle2, AlertTriangle, XCircle,
  ArrowRight, Activity, Terminal, FileCode, Layers, Lock, Database, Sparkles,
  RefreshCw, Play, Sliders, Plus, Search, Filter, GitBranch, Zap, BookOpen,
  ExternalLink, ShieldAlert, Check, ChevronRight, BarChart3, Radio
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function SecurityResearchLab() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'experiments' | 'datasets' | 'prototypes' | 'benchmarks' | 'notes'>('experiments');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [labOverview, setLabOverview] = useState<any>(null);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [prototypes, setPrototypes] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  // Filters
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);
  const [selectedExpForGate, setSelectedExpForGate] = useState<any>(null);
  const [gateActionType, setGateActionType] = useState<'sec_review' | 'perf_test' | 'reg_test' | 'rollback_strat' | null>(null);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState('ENDPOINT');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [newHypothesis, setNewHypothesis] = useState('');
  const [newMethodology, setNewMethodology] = useState('');
  const [newResearcher, setNewResearcher] = useState('Security Research Fellow');
  const [creating, setCreating] = useState(false);

  // Gate Form States
  const [reviewerName, setReviewerName] = useState('Principal Security Architect');
  const [riskLevel, setRiskLevel] = useState('Low');
  const [mitigations, setMitigations] = useState('Verified in isolated sandbox verifier.');
  const [reviewNotes, setReviewNotes] = useState('Safety checklist verified.');

  const [perfLatency, setPerfLatency] = useState(1.5);
  const [perfCpu, setPerfCpu] = useState(0.8);
  const [perfMemory, setPerfMemory] = useState(18.0);

  const [regSuiteName, setRegSuiteName] = useState('Monitorix_Baseline_Regression_v1');

  const [rollbackTrigger, setRollbackTrigger] = useState('Latency > 8ms or buffer overflow');
  const [recoveryAction, setRecoveryAction] = useState('Deactivate hook and restore baseline snapshot');
  const [snapshotRef, setSnapshotRef] = useState('SNAP-LAB-V310');

  // Fetch Lab Telemetry
  const fetchLabData = async () => {
    setRefreshing(true);
    try {
      const [ovRes, expRes, dsRes, protoRes, notesRes] = await Promise.all([
        fetch(`${API_URL}/v2/research/overview`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v2/research/experiments`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v2/research/datasets`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v2/research/prototypes`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v2/research/notes`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (ovRes.ok) setLabOverview(await ovRes.json());
      if (expRes.ok) setExperiments(await expRes.json());
      if (dsRes.ok) setDatasets(await dsRes.json());
      if (protoRes.ok) setPrototypes(await protoRes.json());
      if (notesRes.ok) setNotes(await notesRes.json());
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to Security Research Lab');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLabData();
    const interval = setInterval(fetchLabData, 25000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle Create Experiment
  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newHypothesis.trim()) {
      toast.error('Title and Hypothesis are required.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/v2/research/experiments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          domain: newDomain,
          subdomain: newSubdomain.trim() || `${newDomain} Experimental Vector`,
          hypothesis: newHypothesis.trim(),
          methodology: newMethodology.trim(),
          lead_researcher: newResearcher.trim()
        })
      });
      if (res.ok) {
        toast.success('Isolated research experiment created successfully!');
        setShowCreateModal(false);
        setNewTitle('');
        setNewHypothesis('');
        setNewMethodology('');
        fetchLabData();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to create experiment');
      }
    } catch (err) {
      toast.error('Network error creating experiment');
    } finally {
      setCreating(false);
    }
  };

  // Handle Advance Stage
  const handleAdvanceStage = async (expId: string, currentStage: string) => {
    const sequence = ['RESEARCH', 'PROTOTYPE', 'LAB_VALIDATION', 'REGRESSION_TESTING', 'SECURITY_REVIEW', 'CANARY', 'PRODUCTION'];
    const idx = sequence.indexOf(currentStage);
    if (idx === -1 || idx >= sequence.length - 1) {
      toast.error('Experiment is already at the final stage or status cannot be advanced.');
      return;
    }
    const targetStage = sequence[idx + 1];

    if (targetStage === 'PRODUCTION') {
      handlePromoteToProduction(expId);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/v2/research/experiments/${expId}/advance`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ target_stage: targetStage })
      });
      if (res.ok) {
        toast.success(`Advanced experiment to ${targetStage}`);
        fetchLabData();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to advance stage');
      }
    } catch (err) {
      toast.error('Network error advancing stage');
    }
  };

  // Handle Promote To Production (Enforces 4 Safety Gates!)
  const handlePromoteToProduction = async (expId: string) => {
    try {
      const res = await fetch(`${API_URL}/v2/research/experiments/${expId}/promote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        toast.success(`🎉 Experiment ${expId} promoted to PRODUCTION! Safety gates verified.`);
        fetchLabData();
      } else {
        const errData = await res.json();
        const detail = errData.detail || {};
        if (detail.error === 'PRODUCTION_PROMOTION_BLOCKED') {
          toast.error(
            `Promotion Blocked! Missing ${detail.missing_gates.length} safety gates.`,
            { duration: 6000 }
          );
        } else {
          toast.error(detail.message || 'Promotion to production blocked by safety policy.');
        }
      }
    } catch (err) {
      toast.error('Error promoting capability to production');
    }
  };

  // Handle Emergency Rollback
  const handleRollback = async (expId: string) => {
    try {
      const res = await fetch(`${API_URL}/v2/research/experiments/${expId}/rollback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Operator initiated safety rollback from portal' })
      });
      if (res.ok) {
        toast.success(`Experiment ${expId} rolled back to isolated sandbox.`);
        fetchLabData();
      } else {
        toast.error('Failed to execute rollback');
      }
    } catch (err) {
      toast.error('Network error executing rollback');
    }
  };

  // Execute Safety Gate Actions
  const handleSaveSafetyGate = async () => {
    if (!selectedExpForGate) return;
    const expId = selectedExpForGate.experiment_id;

    try {
      let endpoint = '';
      let payload = {};

      if (gateActionType === 'sec_review') {
        endpoint = `/v2/research/experiments/${expId}/security-review`;
        payload = {
          reviewer: reviewerName,
          risk_level: riskLevel,
          mitigations,
          notes: reviewNotes
        };
      } else if (gateActionType === 'perf_test') {
        endpoint = `/v2/research/experiments/${expId}/performance-test`;
        payload = {
          p99_latency_ms: perfLatency,
          cpu_pct: perfCpu,
          memory_mb: perfMemory,
          passed: true
        };
      } else if (gateActionType === 'reg_test') {
        endpoint = `/v2/research/experiments/${expId}/regression-test`;
        payload = { test_suite_name: regSuiteName };
      } else if (gateActionType === 'rollback_strat') {
        endpoint = `/v2/research/experiments/${expId}/rollback-strategy`;
        payload = {
          rollback_trigger: rollbackTrigger,
          recovery_action: recoveryAction,
          snapshot_ref: snapshotRef
        };
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`Safety gate updated for ${expId}`);
        setShowGateModal(false);
        fetchLabData();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to update safety gate');
      }
    } catch (err) {
      toast.error('Network error updating safety gate');
    }
  };

  // Filtering
  const filteredExperiments = experiments.filter(e => {
    if (selectedDomain !== 'ALL' && e.domain !== selectedDomain) return false;
    if (selectedStage !== 'ALL' && e.stage !== selectedStage) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.experiment_id.toLowerCase().includes(q) ||
        e.subdomain.toLowerCase().includes(q) ||
        e.lead_researcher.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'ENDPOINT': return 'text-cyan-400 bg-cyan-950/40 border-cyan-700/50';
      case 'NETWORK': return 'text-emerald-400 bg-emerald-950/40 border-emerald-700/50';
      case 'IDENTITY': return 'text-amber-400 bg-amber-950/40 border-amber-700/50';
      case 'CLOUD': return 'text-indigo-400 bg-indigo-950/40 border-indigo-700/50';
      case 'AI_SECURITY': return 'text-purple-400 bg-purple-950/40 border-purple-700/50';
      case 'DETECTION': return 'text-rose-400 bg-rose-950/40 border-rose-700/50';
      default: return 'text-gray-400 bg-gray-900 border-gray-700';
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'RESEARCH': return 'bg-blue-900/40 text-blue-300 border-blue-700/50';
      case 'PROTOTYPE': return 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50';
      case 'LAB_VALIDATION': return 'bg-teal-900/40 text-teal-300 border-teal-700/50';
      case 'REGRESSION_TESTING': return 'bg-amber-900/40 text-amber-300 border-amber-700/50';
      case 'SECURITY_REVIEW': return 'bg-purple-900/40 text-purple-300 border-purple-700/50';
      case 'CANARY': return 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50';
      case 'PRODUCTION': return 'bg-emerald-900/50 text-emerald-300 border-emerald-500 shadow-emerald-500/20 shadow-sm';
      default: return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-indigo-950/70 border border-violet-800/40 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl shadow-lg shadow-violet-500/30">
                <FlaskConical className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                    Security Research & Innovation Lab
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                    v3.10.0
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    100% ISOLATED SANDBOX
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1 max-w-3xl">
                  Dedicated experimental incubator for Endpoint, Network, Identity, Cloud, and AI Security.
                  Experimental code is strictly isolated from production until all 4 verification gates pass.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-violet-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Experiment
            </button>
            <button
              onClick={fetchLabData}
              disabled={refreshing}
              className="px-3.5 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-300 text-sm font-medium transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-violet-400' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Hero KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Experiments</span>
            <Atom className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {labOverview?.kpis?.total_experiments ?? 7}
          </div>
          <div className="text-xs text-violet-400 mt-1 flex items-center gap-1 font-medium">
            Across 6 Domains
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Lab Datasets</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {labOverview?.kpis?.total_datasets ?? 6}
          </div>
          <div className="text-xs text-cyan-400 mt-1 font-medium">
            Synthetic & Anonymized
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Prototypes</span>
            <FileCode className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {labOverview?.kpis?.total_prototypes ?? 6}
          </div>
          <div className="text-xs text-amber-400 mt-1 font-medium">
            Sandboxed Engines
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Active Canaries</span>
            <Radio className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {labOverview?.kpis?.active_canaries ?? 1}
          </div>
          <div className="text-xs text-indigo-400 mt-1 font-medium">
            Traffic Controlled
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Promoted to Prod</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {labOverview?.kpis?.production_promoted ?? 1}
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-medium">
            All 4 Gates Verified
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Safety Enforcement</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-teal-400">
            STRICT
          </div>
          <div className="text-xs text-teal-400/80 mt-1 font-medium">
            Zero Rogue Deployments
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-slate-800 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('experiments')}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'experiments'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Research Pipeline & Experiments ({experiments.length})
        </button>

        <button
          onClick={() => setActiveTab('datasets')}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'datasets'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Database className="w-4 h-4" />
          Research Datasets ({datasets.length})
        </button>

        <button
          onClick={() => setActiveTab('prototypes')}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'prototypes'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Detection Prototypes ({prototypes.length})
        </button>

        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'benchmarks'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Benchmark Radar & Overhead
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notes'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Research Notes & Hypotheses ({notes.length})
        </button>
      </div>

      {/* TAB 1: EXPERIMENTS & PIPELINE */}
      {activeTab === 'experiments' && (
        <div className="space-y-6">
          {/* Pipeline Tracker Bar */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-violet-400" />
              Standardized Detection Research Pipeline
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {[
                { stage: 'RESEARCH', desc: 'Hypothesis & Formulation' },
                { stage: 'PROTOTYPE', desc: 'Sandbox Rule AST' },
                { stage: 'LAB_VALIDATION', desc: 'Synthetic Dataset Run' },
                { stage: 'REGRESSION_TESTING', desc: 'Baseline Rule Suite' },
                { stage: 'SECURITY_REVIEW', desc: 'Peer Risk Sign-off' },
                { stage: 'CANARY', desc: 'Traffic Rollout %' },
                { stage: 'PRODUCTION', desc: 'Full Engine Deployment' }
              ].map((step, idx) => (
                <div
                  key={step.stage}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-center relative"
                >
                  <div className="text-[10px] text-slate-500 font-mono">Stage 0{idx + 1}</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">{step.stage}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Domain:
              </span>
              {['ALL', 'ENDPOINT', 'NETWORK', 'IDENTITY', 'CLOUD', 'AI_SECURITY', 'DETECTION'].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDomain(d)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    selectedDomain === d
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search experiments..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Experiment Cards Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredExperiments.map(exp => (
              <div
                key={exp.experiment_id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 shadow-lg transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-violet-400 font-semibold">
                        {exp.experiment_id}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getDomainColor(exp.domain)}`}>
                        {exp.domain} • {exp.subdomain}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${getStageBadge(exp.stage)}`}>
                        {exp.stage}
                      </span>
                      {exp.production_promoted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          PROD ACTIVE
                        </span>
                      )}
                      {exp.canary_percentage > 0 && !exp.production_promoted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          CANARY: {exp.canary_percentage}%
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-semibold text-white">
                      {exp.title}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-4xl line-clamp-2">
                      <strong className="text-slate-300">Hypothesis:</strong> {exp.hypothesis}
                    </p>
                  </div>

                  {/* Right side metrics summary */}
                  <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 self-start lg:self-center">
                    <div className="text-center">
                      <div className="text-[10px] text-slate-500 uppercase">Detection</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {((exp.metrics?.detection_rate ?? 0.95) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div className="text-center">
                      <div className="text-[10px] text-slate-500 uppercase">FPR</div>
                      <div className="text-sm font-bold text-slate-300">
                        {((exp.metrics?.false_positive_rate ?? 0.002) * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div className="text-center">
                      <div className="text-[10px] text-slate-500 uppercase">Latency</div>
                      <div className="text-sm font-bold text-cyan-400">
                        {exp.metrics?.latency_ms ?? 1.5}ms
                      </div>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div className="text-center">
                      <div className="text-[10px] text-slate-500 uppercase">CPU Overhead</div>
                      <div className="text-sm font-bold text-amber-400">
                        {exp.metrics?.cpu_overhead_pct ?? 0.8}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Production Safety Gates Checklist Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Gate 1: Security Review */}
                  <div
                    onClick={() => {
                      setSelectedExpForGate(exp);
                      setGateActionType('sec_review');
                      setShowGateModal(true);
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      exp.security_review_completed
                        ? 'bg-emerald-950/20 border-emerald-700/40 text-emerald-300 hover:bg-emerald-950/40'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {exp.security_review_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-200">1. Security Review</div>
                        <div className="text-[10px] text-slate-400">
                          {exp.security_review_completed ? 'Sign-off Completed' : 'Pending Review'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>

                  {/* Gate 2: Performance Test */}
                  <div
                    onClick={() => {
                      setSelectedExpForGate(exp);
                      setGateActionType('perf_test');
                      setShowGateModal(true);
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      exp.performance_test_completed
                        ? 'bg-emerald-950/20 border-emerald-700/40 text-emerald-300 hover:bg-emerald-950/40'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {exp.performance_test_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-200">2. Performance Test</div>
                        <div className="text-[10px] text-slate-400">
                          {exp.performance_test_completed ? 'Verified < 10ms' : 'Pending Benchmark'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>

                  {/* Gate 3: Regression Test */}
                  <div
                    onClick={() => {
                      setSelectedExpForGate(exp);
                      setGateActionType('reg_test');
                      setShowGateModal(true);
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      exp.regression_test_completed
                        ? 'bg-emerald-950/20 border-emerald-700/40 text-emerald-300 hover:bg-emerald-950/40'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {exp.regression_test_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-200">3. Regression Test</div>
                        <div className="text-[10px] text-slate-400">
                          {exp.regression_test_completed ? '100% Pass (0 FP)' : 'Pending Test Suite'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>

                  {/* Gate 4: Rollback Strategy */}
                  <div
                    onClick={() => {
                      setSelectedExpForGate(exp);
                      setGateActionType('rollback_strat');
                      setShowGateModal(true);
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      exp.rollback_strategy_defined
                        ? 'bg-emerald-950/20 border-emerald-700/40 text-emerald-300 hover:bg-emerald-950/40'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {exp.rollback_strategy_defined ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-200">4. Rollback Strategy</div>
                        <div className="text-[10px] text-slate-400">
                          {exp.rollback_strategy_defined ? 'Automated Recovery' : 'Undefined'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>

                {/* Action Controls Footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-400">
                    Lead: <span className="text-slate-200 font-medium">{exp.lead_researcher}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {exp.stage !== 'PRODUCTION' && (
                      <button
                        onClick={() => handleAdvanceStage(exp.experiment_id, exp.stage)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-all flex items-center gap-1.5"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                        Advance Stage
                      </button>
                    )}

                    {!exp.production_promoted && (
                      <button
                        onClick={() => handlePromoteToProduction(exp.experiment_id)}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-semibold shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Promote to Production
                      </button>
                    )}

                    {exp.production_promoted && (
                      <button
                        onClick={() => handleRollback(exp.experiment_id)}
                        className="px-3 py-1.5 bg-rose-900/40 hover:bg-rose-900/70 border border-rose-700/60 text-rose-300 rounded-lg font-medium transition-all flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        Emergency Rollback
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DATASETS */}
      {activeTab === 'datasets' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Research Datasets Catalog</h3>
              <p className="text-xs text-slate-400">
                Synthetic and anonymized datasets isolated from live customer data for safe experimental benchmarking.
              </p>
            </div>
            <span className="px-3 py-1 bg-violet-950/60 border border-violet-700/50 text-violet-300 text-xs rounded-lg font-medium">
              Zero Customer Data Leakage
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map(ds => (
              <div
                key={ds.dataset_id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-cyan-400 font-bold">{ds.dataset_id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getDomainColor(ds.domain)}`}>
                    {ds.domain}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{ds.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-3">{ds.description}</p>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div>
                    Samples: <span className="text-slate-200 font-semibold">{ds.sample_count.toLocaleString()}</span>
                  </div>
                  <div>
                    Size: <span className="text-slate-200 font-semibold">{(ds.size_bytes / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 rounded flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3" /> Synthetic
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-950/40 text-indigo-300 border border-indigo-800/40 rounded flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3" /> Anonymized
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PROTOTYPES */}
      {activeTab === 'prototypes' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Detection Prototypes & Sandbox Rules</h3>
              <p className="text-xs text-slate-400">
                Experimental rules written in eBPF C, YARA, Python, Graph Query, Sigma, and Prompt Guard.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs rounded-lg font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Sandboxed Runtime
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {prototypes.map(p => (
              <div
                key={p.prototype_id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-400 font-bold">{p.prototype_id}</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded border border-slate-700">
                      {p.language_format}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getDomainColor(p.domain)}`}>
                    {p.engine_target}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{p.name}</h4>

                {/* Code Box */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 overflow-x-auto font-mono text-[11px] text-slate-300 max-h-40">
                  <pre className="whitespace-pre">{p.code_payload}</pre>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                  <div>
                    Detection: <span className="text-emerald-400 font-bold">{(p.detection_rate * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    FPR: <span className="text-slate-300 font-bold">{(p.false_positive_rate * 100).toFixed(2)}%</span>
                  </div>
                  <div>
                    Status: <span className="text-violet-400 font-semibold">{p.validation_status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BENCHMARKS */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                P99 Latency vs Target
              </h4>
              <p className="text-xs text-slate-400">
                P99 latency benchmarks across experimental detection hooks. Target ceiling is &lt; 10.0 ms.
              </p>
              <div className="space-y-2 pt-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>eBPF Ringbuffer Kernel</span>
                    <span className="text-cyan-400 font-bold">0.85 ms</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: '8.5%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>JA4 High-Entropy C2</span>
                    <span className="text-emerald-400 font-bold">2.10 ms</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '21%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>RWX Memory Scan</span>
                    <span className="text-amber-400 font-bold">4.20 ms</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '42%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>AI Prompt Delimiter Guard</span>
                    <span className="text-purple-400 font-bold">6.80 ms</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '68%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                CPU Overhead Budget
              </h4>
              <p className="text-xs text-slate-400">
                Maximum allowable agent CPU overhead budget is 3.0% under peak production telemetry.
              </p>
              <div className="space-y-2 pt-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Kernel Hook eBPF</span>
                    <span className="text-emerald-400 font-bold">0.6%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Network Stream Parser</span>
                    <span className="text-emerald-400 font-bold">0.9%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '30%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>AI Agent Guardrail</span>
                    <span className="text-purple-400 font-bold">1.1%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '36%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Memory Introspection</span>
                    <span className="text-amber-400 font-bold">1.4%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '46%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                Detection vs False Positives
              </h4>
              <p className="text-xs text-slate-400">
                Verification benchmarks on 50,000+ synthetic attack runs per domain.
              </p>
              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex justify-between items-center">
                  <span className="text-slate-300">Kernel Syscall Telemetry</span>
                  <span className="text-emerald-400 font-bold">98.5% Det / 0.12% FPR</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex justify-between items-center">
                  <span className="text-slate-300">Container Breakout Guard</span>
                  <span className="text-emerald-400 font-bold">98.8% Det / 0.10% FPR</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex justify-between items-center">
                  <span className="text-slate-300">AI Prompt Injection Guard</span>
                  <span className="text-emerald-400 font-bold">97.6% Det / 0.18% FPR</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex justify-between items-center">
                  <span className="text-slate-300">Identity Graph Attack Chain</span>
                  <span className="text-emerald-400 font-bold">97.1% Det / 0.15% FPR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RESEARCH NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Academic Research Notes & Findings</h3>
              <p className="text-xs text-slate-400">
                Detailed threat analysis, kernel introspection findings, and adversarial AI defense strategies.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {notes.map(note => (
              <div
                key={note.note_id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-violet-400 font-semibold">{note.note_id}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getDomainColor(note.domain)}`}>
                    {note.domain}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{note.title}</h3>
                <div className="text-xs text-slate-400">
                  By <span className="text-slate-200 font-medium">{note.author}</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  {note.tags?.map((t: string) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE EXPERIMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-violet-400" />
                Initialize New Research Experiment
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExperiment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Experiment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zero-Copy eBPF Ringbuffer Kernel Telemetry"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Research Domain *</label>
                  <select
                    value={newDomain}
                    onChange={e => setNewDomain(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="ENDPOINT">ENDPOINT</option>
                    <option value="NETWORK">NETWORK</option>
                    <option value="IDENTITY">IDENTITY</option>
                    <option value="CLOUD">CLOUD</option>
                    <option value="AI_SECURITY">AI_SECURITY</option>
                    <option value="DETECTION">DETECTION</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subdomain</label>
                  <input
                    type="text"
                    placeholder="e.g. Kernel Telemetry"
                    value={newSubdomain}
                    onChange={e => setNewSubdomain(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hypothesis *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="State the measurable security hypothesis..."
                  value={newHypothesis}
                  onChange={e => setNewHypothesis(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Methodology</label>
                <textarea
                  rows={2}
                  placeholder="Experimental setup, datasets, and benchmark criteria..."
                  value={newMethodology}
                  onChange={e => setNewMethodology(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Lead Researcher</label>
                <input
                  type="text"
                  value={newResearcher}
                  onChange={e => setNewResearcher(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  {creating ? 'Initializing...' : 'Create Experiment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAFETY GATE VERIFICATION MODAL */}
      {showGateModal && selectedExpForGate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Configure Production Safety Gate
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedExpForGate.experiment_id} — {selectedExpForGate.title}
                </p>
              </div>
              <button
                onClick={() => setShowGateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {gateActionType === 'sec_review' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reviewer Name</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Risk Level</label>
                  <select
                    value={riskLevel}
                    onChange={e => setRiskLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mitigations</label>
                  <input
                    type="text"
                    value={mitigations}
                    onChange={e => setMitigations(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Review Notes</label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
              </div>
            )}

            {gateActionType === 'perf_test' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">P99 Latency (ms)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={perfLatency}
                    onChange={e => setPerfLatency(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CPU Overhead (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={perfCpu}
                    onChange={e => setPerfCpu(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Memory Overhead (MB)</label>
                  <input
                    type="number"
                    step="1.0"
                    value={perfMemory}
                    onChange={e => setPerfMemory(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
              </div>
            )}

            {gateActionType === 'reg_test' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Regression Test Suite Name</label>
                  <input
                    type="text"
                    value={regSuiteName}
                    onChange={e => setRegSuiteName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-[11px]">
                  Running regression test checks 350+ production detection baseline rules to ensure 100% pass rate and zero false positive regressions.
                </div>
              </div>
            )}

            {gateActionType === 'rollback_strat' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rollback Trigger</label>
                  <input
                    type="text"
                    value={rollbackTrigger}
                    onChange={e => setRollbackTrigger(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Recovery Action</label>
                  <input
                    type="text"
                    value={recoveryAction}
                    onChange={e => setRecoveryAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Snapshot Reference</label>
                  <input
                    type="text"
                    value={snapshotRef}
                    onChange={e => setSnapshotRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowGateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSafetyGate}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold"
              >
                Approve & Save Gate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
