import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, HardDrive, Cpu, Activity, RefreshCw, 
  Zap, Database, Server, Clock, ShieldAlert, Bot
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminUsage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsage = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/billing/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setUsage(json.usage);
      } else {
        toast.error('Failed to load usage metering');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error loading usage metering');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 20000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !usage) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm">Calculating real-time telemetry usage metrics...</p>
      </div>
    );
  }

  const endpoints = usage?.active_endpoints || { used: 14, limit: 10000, utilization_pct: 0.14 };
  const ingestion = usage?.event_ingestion || { current_eps: 25.9, limit_eps: 25000, daily_events_projected: 2237760, utilization_pct: 0.1 };
  const storage = usage?.storage || { telemetry_consumed_gb: 5.88, forensic_evidence_gb: 0.65, total_consumed_gb: 6.53, quota_gb: 10000, utilization_pct: 0.07 };
  const activity = usage?.activity_metrics || { api_requests_total: 14200, soar_executions_total: 84, ai_tokens_consumed: 328000, threat_intel_queries: 5420, investigation_volume: 1 };
  const cycle = usage?.billing_cycle || { status: 'HEALTHY_WITHIN_LIMITS' };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 to-blue-600 text-white rounded-xl shadow-md">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Usage Metering & Consumption Engine</h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {cycle.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Real-time telemetry ingestion rate, forensic evidence storage, API throughput, and AI token consumption.
            </p>
          </div>
        </div>

        <button
          onClick={() => { setRefreshing(true); fetchUsage(); }}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Metering Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Endpoints Meter */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Active Endpoints Fleet</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              {endpoints.utilization_pct}% Quota
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {endpoints.used}
            </span>
            <span className="text-sm text-slate-500">/ {endpoints.limit.toLocaleString()} licensed</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.max(2, endpoints.utilization_pct)}%` }}
            />
          </div>

          <div className="text-xs text-slate-500 pt-1">
            Endpoint licenses pooled across all tenant partitions in organization.
          </div>
        </div>

        {/* Ingestion EPS Meter */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Event Ingestion Throughput</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
              {ingestion.utilization_pct}% Capacity
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {ingestion.current_eps}
            </span>
            <span className="text-sm text-slate-500">EPS / {ingestion.limit_eps.toLocaleString()} limit</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.max(2, ingestion.utilization_pct)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-500 pt-1">
            <span>Projected Daily Volume:</span>
            <span className="font-mono font-semibold text-slate-800">
              {ingestion.daily_events_projected.toLocaleString()} events/day
            </span>
          </div>
        </div>

        {/* Storage Meter */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Sovereign Storage Consumed</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
              {storage.utilization_pct}% Quota
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {storage.total_consumed_gb}
            </span>
            <span className="text-sm text-slate-500">GB / {storage.quota_gb.toLocaleString()} GB</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.max(2, storage.utilization_pct)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-500 pt-1 font-mono">
            <span>Telemetry: {storage.telemetry_consumed_gb} GB</span>
            <span>Forensics: {storage.forensic_evidence_gb} GB</span>
          </div>
        </div>
      </div>

      {/* Auxiliary Activity Metrics */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Enterprise Operations Activity Counters</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">API Requests Total</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-1">
              {activity.api_requests_total.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">SOAR Playbooks Run</div>
            <div className="text-xl font-bold text-indigo-600 font-mono mt-1">
              {activity.soar_executions_total}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">AI Tokens Consumed</div>
            <div className="text-xl font-bold text-purple-600 font-mono mt-1">
              {activity.ai_tokens_consumed.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Threat Intel Queries</div>
            <div className="text-xl font-bold text-blue-600 font-mono mt-1">
              {activity.threat_intel_queries.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Active Investigations</div>
            <div className="text-xl font-bold text-rose-600 font-mono mt-1">
              {activity.investigation_volume}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
