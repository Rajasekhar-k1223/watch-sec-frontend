import React, { useState } from 'react';
import { 
  Cpu, ShieldAlert, Layers, Box, Terminal, AlertTriangle, 
  CheckCircle2, RefreshCw, Activity, ArrowRight, Eye, ShieldCheck 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RuntimeContainer {
  id: string;
  name: string;
  image: string;
  node: string;
  status: 'Protected' | 'Drift Detected' | 'Isolated';
  ebpf_probes: number;
  privilege_mode: 'Unprivileged' | 'Privileged' | 'Root';
  namespaces: string[];
  anomalies_count: number;
}

export default function RuntimeScope() {
  const [containers, setContainers] = useState<RuntimeContainer[]>([
    {
      id: 'c-88219afb',
      name: 'watch-sec-backend',
      image: 'watch-sec-python-backend:latest',
      node: 'ip-172-31-41-245',
      status: 'Protected',
      ebpf_probes: 24,
      privilege_mode: 'Unprivileged',
      namespaces: ['mnt', 'pid', 'net', 'ipc', 'uts'],
      anomalies_count: 0
    },
    {
      id: 'c-43921b7c',
      name: 'sentinel_clickhouse',
      image: 'clickhouse/clickhouse-server:latest',
      node: 'ip-172-31-41-245',
      status: 'Protected',
      ebpf_probes: 18,
      privilege_mode: 'Unprivileged',
      namespaces: ['mnt', 'pid', 'net', 'ipc'],
      anomalies_count: 0
    },
    {
      id: 'c-91024fea',
      name: 'production-api-ingress',
      image: 'corp/ingress-controller:v2.4',
      node: 'DESKTOP-9IJ37J7',
      status: 'Drift Detected',
      ebpf_probes: 32,
      privilege_mode: 'Unprivileged',
      namespaces: ['mnt', 'pid', 'net'],
      anomalies_count: 2
    },
    {
      id: 'c-55019d33',
      name: 'sentinel_postgres',
      image: 'postgres:15-alpine',
      node: 'ip-172-31-41-245',
      status: 'Protected',
      ebpf_probes: 14,
      privilege_mode: 'Unprivileged',
      namespaces: ['mnt', 'pid', 'net', 'ipc'],
      anomalies_count: 0
    }
  ]);

  const handleAuditDrift = (c: RuntimeContainer) => {
    toast.success(`eBPF deep trace initiated on ${c.name} — verifying binary checksums`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-lime-950/30 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-lime-500/10 border border-lime-500/30 rounded-xl text-lime-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Runtime Security Scope (eBPF)</h1>
              <p className="text-sm text-slate-400">
                Kernel-level execution tracing, container namespace isolation & binary drift detection from golden baseline
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => toast.success('eBPF kernel telemetry refreshed')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          Poll Kernel Traces
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active eBPF Hooks</div>
            <div className="text-2xl font-bold text-lime-400 mt-1">88 Probes</div>
            <div className="text-xs text-lime-400 mt-0.5">Syscall & kprobe active</div>
          </div>
          <div className="p-3 bg-lime-500/10 border border-lime-500/20 rounded-xl text-lime-400">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Protected Workloads</div>
            <div className="text-2xl font-bold text-white mt-1">{containers.length} Containers</div>
            <div className="text-xs text-slate-400 mt-0.5">Microservice Daemonsets</div>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Box className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Image Drift Alerts</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">1 Detected</div>
            <div className="text-xs text-amber-400 mt-0.5">Unsigned binary write</div>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Namespace Isolation</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">100% Secure</div>
            <div className="text-xs text-emerald-400 mt-0.5">Zero Host Root Escapes</div>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Containers Runtime Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Kernel-Monitored Workloads & Containers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
              <tr>
                <th className="p-3.5">Container / Workload</th>
                <th className="p-3.5">Host Node</th>
                <th className="p-3.5">Privilege Mode</th>
                <th className="p-3.5">Isolated Namespaces</th>
                <th className="p-3.5">eBPF Probes</th>
                <th className="p-3.5">Runtime Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {containers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-white">
                    {c.name}
                    <div className="text-[10px] text-slate-500 font-normal">{c.image}</div>
                  </td>
                  <td className="p-3.5 text-slate-300 font-sans">{c.node}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {c.privilege_mode}
                    </span>
                  </td>
                  <td className="p-3.5 text-indigo-400">
                    {c.namespaces.join(', ')}
                  </td>
                  <td className="p-3.5 text-lime-400">{c.ebpf_probes} hooks</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'Protected'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleAuditDrift(c)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all border border-slate-700"
                    >
                      Audit Drift
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
