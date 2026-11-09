import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Check, ShieldCheck, Zap, ArrowRight, RefreshCw, 
  Sparkles, Layers, Shield, Bot, HardDrive, Clock, Sliders, X, Save
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminSubscriptions() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [catalog, setCatalog] = useState<any>(null);
  const [upgrading, setUpgrading] = useState(false);

  // Custom Quotas Modal State
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customEndpoints, setCustomEndpoints] = useState(1000);
  const [customStorage, setCustomStorage] = useState(250);
  const [customEps, setCustomEps] = useState(5000);
  const [customApiRpm, setCustomApiRpm] = useState(600);
  const [savingCustom, setSavingCustom] = useState(false);

  const activeTenantId = user?.tenantId || (user as any)?.tenant_id || (user as any)?.TenantId || 1;

  const fetchData = async () => {
    try {
      const [subRes, catRes] = await Promise.all([
        fetch(`${API_URL}/v2/saas/subscriptions?tenant_id=${activeTenantId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v2/saas/subscriptions/catalog`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (subRes.ok && catRes.ok) {
        const subJson = await subRes.json();
        const catJson = await catRes.json();
        const sub = subJson.subscription;
        setSubscription(sub);
        setCatalog(catJson.available_plans);
        if (sub?.quotas) {
          setCustomEndpoints(sub.quotas.endpoint_limit || 1000);
          setCustomStorage(sub.quotas.storage_quota_gb || 250);
          setCustomEps(sub.quotas.ingestion_limit_eps || 5000);
          setCustomApiRpm(sub.quotas.api_rate_limit_rpm || 600);
        }
      } else {
        toast.error('Failed to load subscription catalog');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error loading plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSelectPlan = async (tierName: string) => {
    if (subscription?.plan_tier === tierName) return;
    if (!window.confirm(`Switch subscription tier to ${tierName}?`)) return;

    setUpgrading(true);
    try {
      const res = await fetch(`${API_URL}/v2/saas/subscriptions/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tenant_id: activeTenantId,
          target_plan: tierName
        })
      });
      if (res.ok) {
        const json = await res.json();
        setSubscription(json.subscription);
        if (json.subscription?.quotas) {
          setCustomEndpoints(json.subscription.quotas.endpoint_limit);
          setCustomStorage(json.subscription.quotas.storage_quota_gb);
          setCustomEps(json.subscription.quotas.ingestion_limit_eps);
          setCustomApiRpm(json.subscription.quotas.api_rate_limit_rpm);
        }
        toast.success(`Subscription successfully updated to ${tierName}`);
      } else {
        toast.error('Failed to update subscription');
      }
    } catch (err) {
      toast.error('Network error during plan switch');
    } finally {
      setUpgrading(false);
    }
  };

  const handleSaveCustomQuotas = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCustom(true);
    try {
      const res = await fetch(`${API_URL}/v2/saas/subscriptions/quotas?tenant_id=${activeTenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint_limit: Number(customEndpoints),
          storage_quota_gb: Number(customStorage),
          ingestion_limit_eps: Number(customEps),
          api_rate_limit_rpm: Number(customApiRpm)
        })
      });

      if (res.ok) {
        const json = await res.json();
        setSubscription(json.subscription);
        setShowCustomizeModal(false);
        toast.success('Custom plan quotas saved successfully!');
      } else {
        toast.error('Failed to save customized quotas');
      }
    } catch (err) {
      toast.error('Error connecting to quota management service');
    } finally {
      setSavingCustom(false);
    }
  };

  if (loading || !catalog) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm">Loading SaaS Subscription Entitlements...</p>
      </div>
    );
  }

  const currentTier = subscription?.plan_tier || 'Enterprise';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2.5 sm:p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl shadow-md shrink-0">
            <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Enterprise Subscriptions & Entitlements</h1>
              <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Current: {currentTier}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Automated resource quota allocation, feature entitlement gates, and license scaling.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
          <button
            onClick={() => setShowCustomizeModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition shadow-xs"
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Customize Quotas</span>
          </button>
          <div className="text-left sm:text-right">
            <div className="text-xs text-slate-400 font-medium">Renewal Date:</div>
            <div className="text-sm font-semibold text-slate-800 font-mono">
              {subscription?.renew_at ? new Date(subscription.renew_at).toLocaleDateString() : 'Annual Continuous'}
            </div>
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Object.entries(catalog).map(([name, plan]: [string, any]) => {
          const isCurrent = currentTier === name;
          return (
            <div
              key={name}
              className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 border ${
                isCurrent 
                  ? 'bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 text-white border-indigo-500 shadow-xl scale-[1.02]' 
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className={`text-base font-bold ${isCurrent ? 'text-white' : 'text-slate-900'}`}>{name}</h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/30 text-indigo-300 rounded border border-indigo-400/40">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className={`flex justify-between py-1 border-b ${isCurrent ? 'border-slate-800' : 'border-slate-100'}`}>
                    <span className={isCurrent ? 'text-slate-400' : 'text-slate-500'}>Endpoints:</span>
                    <span className="font-mono font-bold">{plan.endpoints.toLocaleString()}</span>
                  </div>
                  <div className={`flex justify-between py-1 border-b ${isCurrent ? 'border-slate-800' : 'border-slate-100'}`}>
                    <span className={isCurrent ? 'text-slate-400' : 'text-slate-500'}>Storage:</span>
                    <span className="font-mono font-bold">{plan.storage_gb} GB</span>
                  </div>
                  <div className={`flex justify-between py-1 border-b ${isCurrent ? 'border-slate-800' : 'border-slate-100'}`}>
                    <span className={isCurrent ? 'text-slate-400' : 'text-slate-500'}>Ingestion EPS:</span>
                    <span className="font-mono font-bold">{plan.eps_limit.toLocaleString()}</span>
                  </div>
                  <div className={`flex justify-between py-1 border-b ${isCurrent ? 'border-slate-800' : 'border-slate-100'}`}>
                    <span className={isCurrent ? 'text-slate-400' : 'text-slate-500'}>API Rate:</span>
                    <span className="font-mono font-bold">{plan.api_rpm} RPM</span>
                  </div>
                  <div className={`flex justify-between py-1 border-b ${isCurrent ? 'border-slate-800' : 'border-slate-100'}`}>
                    <span className={isCurrent ? 'text-slate-400' : 'text-slate-500'}>Retention:</span>
                    <span className="font-mono font-bold">{plan.retention_days} Days</span>
                  </div>
                </div>

                <div className="mt-5 space-y-1.5 text-[11px]">
                  <div className="font-semibold text-xs mb-2 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Entitlements:</span>
                  </div>
                  {Object.entries(plan.entitlements).map(([k, v]: [string, any]) => (
                    <div key={k} className="flex items-center space-x-1.5">
                      {v === true ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : typeof v === 'string' ? (
                        <span className="w-3.5 h-3.5 text-blue-400 font-bold shrink-0 text-center">★</span>
                      ) : (
                        <span className="w-3.5 h-3.5 text-slate-500 font-bold shrink-0 text-center">✕</span>
                      )}
                      <span className={v ? (isCurrent ? 'text-slate-200' : 'text-slate-700') : 'text-slate-400 line-through'}>
                        {k.replace(/_/g, ' ')} {typeof v === 'string' ? `(${v})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3">
                <button
                  disabled={isCurrent || upgrading}
                  onClick={() => handleSelectPlan(name)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
                    isCurrent 
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                  }`}
                >
                  <span>{isCurrent ? 'Current Plan' : 'Select Plan'}</span>
                  {!isCurrent && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customize & Save Quotas Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Customize Resource Quotas & Save</h3>
              </div>
              <button onClick={() => setShowCustomizeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomQuotas} className="space-y-4 text-xs font-medium">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Endpoint License Allocation</label>
                  <span className="font-mono font-bold text-indigo-600">{Number(customEndpoints).toLocaleString()} Nodes</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={customEndpoints}
                  onChange={(e) => setCustomEndpoints(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Storage Quota (GB)</label>
                  <span className="font-mono font-bold text-indigo-600">{customStorage} GB</span>
                </div>
                <input
                  type="number"
                  min="5"
                  max="100000"
                  value={customStorage}
                  onChange={(e) => setCustomStorage(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Ingestion Limit (EPS)</label>
                  <span className="font-mono font-bold text-indigo-600">{Number(customEps).toLocaleString()} EPS</span>
                </div>
                <input
                  type="number"
                  min="100"
                  max="500000"
                  value={customEps}
                  onChange={(e) => setCustomEps(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-slate-700 font-semibold">API Rate Limit (Requests per Minute)</label>
                  <span className="font-mono font-bold text-indigo-600">{customApiRpm} RPM</span>
                </div>
                <input
                  type="number"
                  min="60"
                  max="50000"
                  value={customApiRpm}
                  onChange={(e) => setCustomApiRpm(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                  required
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-800 text-[11px] leading-relaxed">
                Saving updates will dynamically recalculate ClickHouse storage partitioning, Kafka rate limiters, and real-time fleet enforcement boundaries.
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCustomizeModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustom}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingCustom ? 'Saving Quotas...' : 'Save Plan Quotas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
