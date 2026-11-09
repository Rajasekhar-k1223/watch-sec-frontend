import React, { useState, useEffect } from 'react';
import { 
  Globe, Shield, Database, Server, RefreshCw, CheckCircle2, 
  Lock, ArrowRight, Zap, Radio, Search, Terminal, AlertTriangle
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminRegions() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<any[]>([]);
  const [residency, setResidency] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Gateway Discovery Sandbox state
  const [testRegion, setTestRegion] = useState('eu-central-1');
  const [testIp, setTestIp] = useState('185.220.101.5');
  const [discoveryResult, setDiscoveryResult] = useState<any>(null);
  const [resolving, setResolving] = useState(false);

  const fetchData = async () => {
    try {
      const [regRes, resRes] = await Promise.all([
        fetch(`${API_URL}/v2/saas/regions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v2/saas/data-residency`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (regRes.ok && resRes.ok) {
        const regJson = await regRes.json();
        const resJson = await resRes.json();
        setRegions(regJson.regions || []);
        setResidency(resJson.data_residency);
      } else {
        toast.error('Failed to load regional topology');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error loading regions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTestDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setResolving(true);
    setDiscoveryResult(null);
    try {
      const res = await fetch(`${API_URL}/v2/saas/routing/gateway-discovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          preferred_region: testRegion,
          client_ip: testIp,
          agent_version: '3.4.0-standalone'
        })
      });
      if (res.ok) {
        const json = await res.json();
        setDiscoveryResult(json);
        toast.success(`Gateway resolved: ${json.assigned_gateway.region_code}`);
      } else {
        toast.error('Gateway resolution failed');
      }
    } catch (err) {
      toast.error('Network error during gateway resolution');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm">Mapping Multi-Region Gateway Mesh...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-blue-700 to-indigo-800 text-white rounded-xl shadow-md">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Multi-Region Topology & Data Residency</h1>
            <p className="text-sm text-slate-500 mt-1">
              Regional agent gateway mesh, sovereign storage boundaries, and GDPR zero cross-border replication.
            </p>
          </div>
        </div>

        <button
          onClick={() => { setRefreshing(true); fetchData(); }}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Mesh</span>
        </button>
      </div>

      {/* Regional Topology Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {regions.map((reg) => (
          <div key={reg.region_code} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{reg.region_name}</h3>
                <span className="font-mono text-xs text-slate-500">{reg.region_code}</span>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                {reg.status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Gateway URL:</span>
                <span className="font-mono text-slate-800 truncate max-w-[200px]">{reg.gateway_url}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Latency:</span>
                <span className="font-mono font-bold text-emerald-600">{reg.latency_ms} ms</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Residency Zone:</span>
                <span className="font-semibold text-indigo-700">{reg.data_residency_zone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">ClickHouse Cluster:</span>
                <span className="font-mono text-slate-700 truncate max-w-[190px]">{reg.clickhouse_cluster}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Failover Destination:</span>
                <span className="font-mono font-semibold text-amber-700">{reg.failover_region}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">EPS Ingestion Load:</span>
                <span className="font-mono font-bold text-slate-800">
                  {reg.current_eps.toLocaleString()} / {reg.eps_capacity.toLocaleString()} EPS
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ width: `${reg.utilization_pct || 15}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Residency Policies & Sovereign Storage */}
      {residency && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Data Residency & Sovereign Storage Governance</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Active Residency</span>
              <div className="text-base font-bold text-slate-900">{residency.configured_data_residency}</div>
              <div className="text-indigo-600 font-medium">{residency.sovereignty_enforcement}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Telemetry & Forensics Storage</span>
              <div className="text-slate-900 font-semibold">{residency.telemetry_storage_location}</div>
              <div className="text-slate-600">{residency.forensics_vault_location}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">GDPR Compliance Controls</span>
              <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Right to Erasure & Shredding Active</span>
              </div>
              <div className="text-slate-600">Cross-region data export: <span className="font-bold text-rose-700">STRICTLY BLOCKED</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Intelligent Gateway Discovery Sandbox Tool */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <Radio className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Agent Gateway Anycast Discovery Simulator</h2>
        </div>

        <form onSubmit={handleTestDiscovery} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1">Simulated Client IP</label>
            <input
              type="text"
              value={testIp}
              onChange={(e) => setTestIp(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Preferred Region</label>
            <select
              value={testRegion}
              onChange={(e) => setTestRegion(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
            >
              <option value="us-east-1">us-east-1 (US East)</option>
              <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
              <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={resolving}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg shadow transition"
            >
              {resolving ? 'Resolving...' : 'Test Gateway Resolution'}
            </button>
          </div>
        </form>

        {discoveryResult && (
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-xs font-mono space-y-2 mt-4">
            <div className="text-emerald-400 font-bold">
              ✓ Resolved Gateway: {discoveryResult.assigned_gateway.region_name} ({discoveryResult.assigned_gateway.region_code})
            </div>
            <div className="text-slate-300">
              Gateway Endpoint: <span className="text-white">{discoveryResult.assigned_gateway.gateway_url}</span>
            </div>
            <div className="text-slate-300">
              Current Latency: <span className="text-emerald-400">{discoveryResult.assigned_gateway.current_latency_ms} ms</span> | Failover: <span className="text-amber-400">{discoveryResult.failover_gateway.gateway_url}</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Certificate SHA256: {discoveryResult.agent_transport.certificate_fingerprint_sha256}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
