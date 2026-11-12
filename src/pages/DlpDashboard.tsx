import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Lock, FileText, Usb, Mail, HardDrive, AlertTriangle, 
  CheckCircle2, Plus, RefreshCw, Filter, Search, Eye, ArrowUpRight, Zap 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

interface DlpViolation {
  Id: number;
  AgentId: string;
  PolicyId: number;
  RuleId: number;
  Channel: string;
  MatchedPattern: string;
  Snippet: string;
  Timestamp: string;
}

interface DlpRule {
  Id: number;
  Name: string;
  Category: string;
  Pattern: string;
}

export default function DlpDashboard() {
  const [violations, setViolations] = useState<DlpViolation[]>([]);
  const [rules, setRules] = useState<DlpRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [testContent, setTestContent] = useState('');
  const [testChannel, setTestChannel] = useState('USB');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resV, resR] = await Promise.all([
        fetch(`${API_URL}/v2/dlp/violations`, { headers }),
        fetch(`${API_URL}/v2/dlp/rules`, { headers })
      ]);

      if (resV.ok) {
        const vData = await resV.json();
        setViolations(Array.isArray(vData) ? vData : []);
      }

      if (resR.ok) {
        const rData = await resR.json();
        setRules(Array.isArray(rData) ? rData : []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load DLP telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTestEvaluate = async () => {
    if (!testContent.trim()) return toast.error('Enter text content to evaluate');
    try {
      setTesting(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
      const res = await fetch(`${API_URL}/v2/dlp/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agent_id: 'SOC-CONSOLE-LIVE',
          channel: testChannel,
          content: testContent
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
        toast.success(`Live DataGuard Action: ${data.enforcement_action || 'Allow'}`);
        // Refresh live violations immediately from backend
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(`Evaluation failed: ${err.detail || res.statusText}`);
      }
    } catch (e) {
      toast.error('Evaluation failed: Network error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Loss Prevention (DLP)</h1>
              <p className="text-sm text-slate-500">
                Continuous surveillance over USB storage, webmail, clipboard, network egress & sensitive data leaks
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all border border-slate-200 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Violations
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Blocked Egress</div>
            <div className="text-2xl font-bold text-rose-600 mt-1">{violations.length} Incidents</div>
            <div className="text-xs text-rose-600 flex items-center gap-1 mt-0.5 font-medium">
              <ShieldAlert className="w-3 h-3" /> Exfiltration Prevented
            </div>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600">
            <Lock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Regex Rules</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{rules.length} Signatures</div>
            <div className="text-xs text-slate-500 mt-0.5">PII, PCI, HIPAA, API Keys</div>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Monitored Channels</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">5 Endpoints</div>
            <div className="text-xs text-emerald-600 mt-0.5 font-medium">USB, Mail, Web, Clip, Network</div>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
            <Usb className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Enforcement Mode</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">Autonomous Block</div>
            <div className="text-xs text-amber-600 mt-0.5 font-medium">Zero-Tolerance Leak Policy</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-600">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Violations Log + Live Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Violations Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent DLP Interceptions</h2>
              <p className="text-xs text-slate-500">Blocked outbound transfers across internal agent fleet</p>
            </div>
            <span className="text-xs font-mono text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 font-semibold">
              Live Intercept Active
            </span>
          </div>

          <div className="space-y-3">
            {violations.map((v) => (
              <div key={v.Id} className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-bold">
                      BLOCKED
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800">{v.Channel}</span>
                    <span className="text-xs text-slate-500">· Target: <strong className="text-slate-900">{v.AgentId}</strong></span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(v.Timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs font-bold text-rose-700">Rule Trigger: {v.MatchedPattern}</div>
                <div className="text-xs font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {v.Snippet}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Payload Inspector & Tester */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">DLP Pattern Evaluator</h2>
            <p className="text-xs text-slate-500">
              Simulate sensitive data payloads against active DLP regex patterns to test enforcement
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Target Channel</label>
                <select
                  value={testChannel}
                  onChange={(e) => setTestChannel(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="USB">USB Mass Storage Device</option>
                  <option value="WEBMAIL">Webmail Attachment / Egress</option>
                  <option value="CLIPBOARD">System Clipboard Copy/Paste</option>
                  <option value="NETWORK_TLS">Network Outbound TLS Stream</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Test Content / Snippet</label>
                <textarea
                  rows={4}
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  placeholder="Paste sample text containing CC number (4111...), SSN (123-45-6789), or AWS key..."
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <button
                onClick={handleTestEvaluate}
                disabled={testing}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {testing ? 'Evaluating Pattern...' : 'Evaluate Payload'}
              </button>

              {testResult && (
                <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                  testResult.enforcement_action?.includes('BLOCK')
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <div className="font-bold">Verdict: {testResult.enforcement_action}</div>
                  <div>Violations Logged: {testResult.violations_logged}</div>
                </div>
              )}
            </div>
          </div>

          {/* Active Rules List */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Active Classification Signatures</h3>
            <div className="space-y-2">
              {rules.map((r) => (
                <div key={r.Id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{r.Name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-mono">{r.Category}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 truncate">{r.Pattern}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
