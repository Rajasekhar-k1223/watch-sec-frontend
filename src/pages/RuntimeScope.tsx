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
    <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-lime-50 border border-lime-200 rounded-xl text-lime-600">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Runtime Security Scope (eBPF)</h1>
              <p className="text-sm text-slate-500">
                Kernel-level execution tracing, container namespace isolation & binary drift detection from golden baseline
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => toast.success('eBPF kernel telemetry refreshed')}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all border border-slate-200 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Poll Kernel Traces
        </button>
      </div>

      {/* Interactive Demonstration Banner */}
      <div className="bg-lime-50 dark:bg-lime-950/40 border border-lime-200 dark:border-lime-800 rounded-xl p-4 flex items-start sm:items-center gap-3 text-xs text-lime-900 dark:text-lime-200">
        <Activity className="w-5 h-5 text-lime-600 shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <span className="font-bold">Runtime Scope Demonstration Environment:</span> Displays sovereign container isolation topologies and simulated eBPF namespace probes. In production worker nodes, probes bind directly to the host kernel ring-buffer.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active eBPF Hooks</div>
            <div className="text-2xl font-bold text-lime-700 mt-1">88 Probes</div>
            <div className="text-xs text-lime-600 mt-0.5">Syscall & kprobe active</div>
          </div>
          <div className="p-3 bg-lime-50 border border-lime-200 rounded-xl text-lime-600">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Protected Workloads</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{containers.length} Containers</div>
            <div className="text-xs text-slate-500 mt-0.5">Microservice Daemonsets</div>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
            <Box className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Image Drift Alerts</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">1 Detected</div>
            <div className="text-xs text-amber-600 mt-0.5">Unsigned binary write</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Namespace Isolation</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">100% Secure</div>
            <div className="text-xs text-emerald-600 mt-0.5">Zero Host Root Escapes</div>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Containers Runtime Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Kernel-Monitored Workloads & Containers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-mono border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100 font-mono">
              {containers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">
                    {c.name}
                    <div className="text-[10px] text-slate-500 font-normal">{c.image}</div>
                  </td>
                  <td className="p-3.5 text-slate-700 font-sans">{c.node}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {c.privilege_mode}
                    </span>
                  </td>
                  <td className="p-3.5 text-indigo-600 font-semibold">
                    {c.namespaces.join(', ')}
                  </td>
                  <td className="p-3.5 text-lime-700 font-semibold">{c.ebpf_probes} hooks</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'Protected'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleAuditDrift(c)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-200 shadow-sm"
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
