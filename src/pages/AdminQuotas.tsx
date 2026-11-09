import React, { useState, useEffect } from 'react';
import { 
  Gauge, Bell, Plus, Shield, Send, CheckCircle2, AlertTriangle, 
  RefreshCw, Mail, Globe, Smartphone, MessageSquare, X, Sliders, Trash2, Edit, Save
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminQuotas() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quotas, setQuotas] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // New notification channel modal
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelType, setChannelType] = useState('Webhook');
  const [channelName, setChannelName] = useState('');
  const [destination, setDestination] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('High');
  const [savingChannel, setSavingChannel] = useState(false);

  // Edit notification channel modal
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [savingEditChannel, setSavingEditChannel] = useState(false);

  // Quota Adjustment Modal
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [endpointQuota, setEndpointQuota] = useState(1000);
  const [storageQuota, setStorageQuota] = useState(250);
  const [epsQuota, setEpsQuota] = useState(5000);
  const [apiRpmQuota, setApiRpmQuota] = useState(600);
  const [savingQuotas, setSavingQuotas] = useState(false);

  const fetchData = async () => {
    try {
      const [qRes, cRes] = await Promise.all([
        fetch(`${API_URL}/v2/saas/admin/quotas`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v2/saas/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (qRes.ok && cRes.ok) {
        const qJson = await qRes.json();
        const cJson = await cRes.json();
        const qList = qJson.quota_metrics || [];
        setQuotas(qList);
        setChannels(cJson.channels || []);

        // Initialize quota fields from current allocations
        qList.forEach((q: any) => {
          if (q.resource === 'Endpoints') setEndpointQuota(q.allocated);
          if (q.resource === 'Storage (GB)') setStorageQuota(q.allocated);
          if (q.resource === 'Ingestion EPS') setEpsQuota(q.allocated);
          if (q.resource.includes('API Rate')) setApiRpmQuota(q.allocated);
        });
      } else {
        toast.error('Failed to load quotas and notifications');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error loading quotas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || !channelName.trim()) {
      toast.error('Name and Destination are required');
      return;
    }
    setSavingChannel(true);
    try {
      const res = await fetch(`${API_URL}/v2/saas/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          channel_type: channelType,
          destination: destination.trim(),
          channel_name: channelName.trim(),
          filter_severity: filterSeverity
        })
      });
      if (res.ok) {
        toast.success('Notification channel created');
        setShowChannelModal(false);
        setChannelName('');
        setDestination('');
        fetchData();
      } else {
        toast.error('Failed to create channel');
      }
    } catch (err) {
      toast.error('Network error creating channel');
    } finally {
      setSavingChannel(false);
    }
  };

  const handleUpdateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    setSavingEditChannel(true);
    try {
      const res = await fetch(`${API_URL}/v2/saas/notifications/${editingChannel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          channel_type: editingChannel.channel_type,
          channel_name: editingChannel.channel_name,
          destination: editingChannel.destination,
          filter_severity: editingChannel.filter_severity
        })
      });
      if (res.ok) {
        toast.success(`Channel '${editingChannel.channel_name}' updated`);
        setEditingChannel(null);
        fetchData();
      } else {
        toast.error('Failed to update channel');
      }
    } catch (err) {
      toast.error('Network error updating channel');
    } finally {
      setSavingEditChannel(false);
    }
  };

  const handleDeleteChannel = async (channelId: number, name: string) => {
    if (!window.confirm(`Permanently remove notification channel '${name}'?`)) return;
    try {
      const res = await fetch(`${API_URL}/v2/saas/notifications/${channelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Notification channel deleted');
        fetchData();
      } else {
        toast.error('Failed to delete channel');
      }
    } catch (err) {
      toast.error('Network error during channel deletion');
    }
  };

  const handleSaveQuotas = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuotas(true);
    try {
      const res = await fetch(`${API_URL}/v2/saas/admin/quotas`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint_limit: Number(endpointQuota),
          storage_quota_gb: Number(storageQuota),
          ingestion_limit_eps: Number(epsQuota),
          api_rate_limit_rpm: Number(apiRpmQuota)
        })
      });
      if (res.ok) {
        toast.success('Resource quotas updated and saved successfully!');
        setShowQuotaModal(false);
        fetchData();
      } else {
        toast.error('Failed to update quotas');
      }
    } catch (err) {
      toast.error('Network error saving quotas');
    } finally {
      setSavingQuotas(false);
    }
  };

  const handleTestDispatch = async (ch: any) => {
    try {
      const res = await fetch(`${API_URL}/v2/saas/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          channel_id: ch.id,
          channel_type: ch.channel_type,
          destination: ch.destination
        })
      });
      if (res.ok) {
        toast.success(`Test alert dispatched to ${ch.channel_name}`);
      } else {
        toast.error('Test dispatch failed');
      }
    } catch (err) {
      toast.error('Error dispatching test alert');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm">Loading Quotas & Global Notification System...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-amber-600 to-rose-600 text-white rounded-xl shadow-md">
            <Gauge className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resource Quotas & Multi-Channel Notifications</h1>
            <p className="text-sm text-slate-500 mt-1">
              Organization resource entitlement limits, quota thresholds, and global multi-channel alert routing.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => { setRefreshing(true); fetchData(); }}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowQuotaModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Adjust Quotas</span>
          </button>

          <button
            onClick={() => setShowChannelModal(true)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Notification Channel</span>
          </button>
        </div>
      </div>

      {/* Quotas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quotas.map((q) => (
          <div key={q.resource} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">{q.resource}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {q.status}
              </span>
            </div>

            <div className="flex items-baseline space-x-1 font-mono">
              <span className="text-2xl font-bold text-slate-900">{q.consumed}</span>
              <span className="text-xs text-slate-500">/ {q.allocated}</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-2 rounded-full"
                style={{ width: `${Math.max(2, q.utilization_pct)}%` }}
              />
            </div>

            <div className="text-right text-xs text-slate-500 font-mono">
              {q.utilization_pct}% consumed
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Channel Notification Router */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Multi-Channel Enterprise Notification Router</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {channels.length} Configured Channels
          </span>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {channels.map((ch) => (
            <div key={ch.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                  {ch.channel_type === 'Email' ? <Mail className="w-4 h-4" /> :
                   ch.channel_type === 'Webhook' ? <Globe className="w-4 h-4" /> :
                   <Smartphone className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{ch.channel_name}</div>
                  <div className="text-xs text-slate-500 font-mono">{ch.destination}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {ch.filter_severity}+
                </span>
                <button
                  onClick={() => handleTestDispatch(ch)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test</span>
                </button>
                <button
                  onClick={() => setEditingChannel({ ...ch })}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  title="Edit Notification Channel"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteChannel(ch.id, ch.channel_name)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete Channel"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {channels.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No active notification channels configured. Add one above.
            </div>
          )}
        </div>
      </div>

      {/* Quota Adjustment Modal */}
      {showQuotaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Adjust Fleet Quota Allocations</h3>
              </div>
              <button onClick={() => setShowQuotaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuotas} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1">Max Fleet Endpoint Licenses</label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  required
                  value={endpointQuota}
                  onChange={(e) => setEndpointQuota(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Storage Quota Allocation (GB)</label>
                <input
                  type="number"
                  min="5"
                  max="500000"
                  required
                  value={storageQuota}
                  onChange={(e) => setStorageQuota(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Ingestion Peak EPS Limit</label>
                <input
                  type="number"
                  min="100"
                  max="1000000"
                  required
                  value={epsQuota}
                  onChange={(e) => setEpsQuota(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">API Rate Limit (RPM)</label>
                <input
                  type="number"
                  min="60"
                  max="100000"
                  required
                  value={apiRpmQuota}
                  onChange={(e) => setApiRpmQuota(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowQuotaModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuotas}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingQuotas ? 'Saving...' : 'Save Quotas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Channel Creation Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add Notification Channel</h3>
              <button onClick={() => setShowChannelModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1">Channel Type</label>
                <select
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="Webhook">Webhook (HTTP POST)</option>
                  <option value="Email">Email Distribution Group</option>
                  <option value="Push">Push Notification</option>
                  <option value="InApp">In-App Banner</option>
                  <option value="MobilePush">Mobile Push</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Channel Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOC Escalation Webhook"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Destination (URL, Email, or Token)</label>
                <input
                  type="text"
                  required
                  placeholder="https://... or email@..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Minimum Severity Filter</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="Critical">Critical Only</option>
                  <option value="High">High and Critical</option>
                  <option value="Medium">Medium and Above</option>
                  <option value="All">All Events</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowChannelModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingChannel}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-sm"
                >
                  {savingChannel ? 'Saving...' : 'Save Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Channel Edit Modal */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Edit Notification Channel</h3>
              <button onClick={() => setEditingChannel(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateChannel} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1">Channel Type</label>
                <select
                  value={editingChannel.channel_type}
                  onChange={(e) => setEditingChannel({ ...editingChannel, channel_type: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="Webhook">Webhook (HTTP POST)</option>
                  <option value="Email">Email Distribution Group</option>
                  <option value="Push">Push Notification</option>
                  <option value="InApp">In-App Banner</option>
                  <option value="MobilePush">Mobile Push</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Channel Label</label>
                <input
                  type="text"
                  required
                  value={editingChannel.channel_name}
                  onChange={(e) => setEditingChannel({ ...editingChannel, channel_name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Destination (URL or Email)</label>
                <input
                  type="text"
                  required
                  value={editingChannel.destination}
                  onChange={(e) => setEditingChannel({ ...editingChannel, destination: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Minimum Severity Filter</label>
                <select
                  value={editingChannel.filter_severity}
                  onChange={(e) => setEditingChannel({ ...editingChannel, filter_severity: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="Critical">Critical Only</option>
                  <option value="High">High and Critical</option>
                  <option value="Medium">Medium and Above</option>
                  <option value="All">All Events</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditChannel}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-sm flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingEditChannel ? 'Updating...' : 'Update Channel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
