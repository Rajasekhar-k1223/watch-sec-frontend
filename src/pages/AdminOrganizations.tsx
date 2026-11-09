import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Shield, Globe, Users, Trash2, PauseCircle, 
  PlayCircle, RefreshCw, CheckCircle2, AlertCircle, X, Search, Tag, Edit, Save
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminOrganizations() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // New Org Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [residency, setResidency] = useState('US-East');
  const [creating, setCreating] = useState(false);

  // Edit Org Modal
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [savingEditOrg, setSavingEditOrg] = useState(false);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/saas/organizations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setOrgs(json.organizations || []);
      } else {
        toast.error('Failed to load organizations');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error fetching organizations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Name and Contact Email are required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/v2/saas/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          primary_contact_email: email.trim(),
          assigned_region: region,
          data_residency: residency,
          metadata: { compliance: 'SOC2 / ISO27001' }
        })
      });
      if (res.ok) {
        toast.success(`Organization '${name}' successfully provisioned`);
        setShowModal(false);
        setName('');
        setEmail('');
        fetchOrganizations();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to create organization');
      }
    } catch (err) {
      toast.error('Network error during provisioning');
    } finally {
      setCreating(false);
    }
  };

  const handleSuspend = async (orgId: number) => {
    try {
      const res = await fetch(`${API_URL}/v2/saas/organizations/${orgId}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Organization suspended');
        fetchOrganizations();
      }
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleReactivate = async (orgId: number) => {
    try {
      const res = await fetch(`${API_URL}/v2/saas/organizations/${orgId}/reactivate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Organization reactivated');
        fetchOrganizations();
      }
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (orgId: number) => {
    if (!window.confirm('Are you sure you want to deprovision this organization?')) return;
    try {
      const res = await fetch(`${API_URL}/v2/saas/organizations/${orgId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Organization deprovisioned');
        fetchOrganizations();
      }
    } catch (err) {
      toast.error('Delete action failed');
    }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    setSavingEditOrg(true);
    try {
      const res = await fetch(`${API_URL}/v2/saas/organizations/${editingOrg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingOrg.name,
          primary_contact_email: editingOrg.primary_contact_email,
          assigned_region: editingOrg.assigned_region,
          data_residency: editingOrg.data_residency
        })
      });
      if (res.ok) {
        toast.success(`Organization '${editingOrg.name}' updated successfully!`);
        setEditingOrg(null);
        fetchOrganizations();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to update organization');
      }
    } catch (err) {
      toast.error('Network error during organization update');
    } finally {
      setSavingEditOrg(false);
    }
  };

  const filtered = orgs.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.org_code.toLowerCase().includes(search.toLowerCase()) ||
    o.primary_contact_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2.5 sm:p-3 bg-gradient-to-tr from-slate-900 to-indigo-900 text-white rounded-xl shadow-md shrink-0">
            <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Global Organization Fleet</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
              Multi-tenant customer isolation, regional deployment assignment, and lifecycle controls.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => { setRefreshing(true); fetchOrganizations(); }}
            className="flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Organization</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by organization name, code or email..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Total Organizations: <span className="font-bold text-slate-800">{orgs.length}</span>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[620px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4">Org Code & Name</th>
              <th className="py-3.5 px-4">Contact</th>
              <th className="py-3.5 px-4">Region / Residency</th>
              <th className="py-3.5 px-4">Tenants</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900 text-sm">{o.name}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{o.org_code}</div>
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  {o.primary_contact_email}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-mono text-slate-700">{o.assigned_region}</span>
                  </div>
                  <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 mt-0.5 inline-block">
                    {o.data_residency}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                    {Array.isArray(o.tenants) ? o.tenants.length : 1} Partitioned
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                    o.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    o.status === 'Suspended' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {o.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right space-x-2">
                  <button
                    onClick={() => setEditingOrg({ ...o })}
                    title="Edit Organization Details"
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {o.status === 'Active' ? (
                    <button
                      onClick={() => handleSuspend(o.id)}
                      title="Suspend Organization"
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition"
                    >
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivate(o.id)}
                      title="Reactivate Organization"
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(o.id)}
                    title="Deprovision Organization"
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  No organizations found matching search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Provisioning Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Provision Global Organization</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1">Organization Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Financial Services"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Security Contact Email</label>
                <input
                  type="email"
                  required
                  placeholder="soc-lead@apexglobal.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Assigned Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="eu-central-1">EU Central (Frankfurt)</option>
                    <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Data Residency Zone</label>
                  <select
                    value={residency}
                    onChange={(e) => setResidency(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="US-East">US-East (FedRAMP)</option>
                    <option value="EU-GDPR">EU-GDPR (Frankfurt)</option>
                    <option value="APAC-Sovereign">APAC-Sovereign</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-800 text-[11px] leading-relaxed">
                Automated provisioning assigns tenant partition boundaries, provisions encrypted ClickHouse telemetry storage, initializes Kafka topics, and creates default admin credentials.
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-sm"
                >
                  {creating ? 'Provisioning...' : 'Provision Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <div className="flex items-center space-x-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Edit Organization Profile</h3>
              </div>
              <button onClick={() => setEditingOrg(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrg} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1">Organization Legal Name</label>
                <input
                  type="text"
                  required
                  value={editingOrg.name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Security Contact Email</label>
                <input
                  type="email"
                  required
                  value={editingOrg.primary_contact_email}
                  onChange={(e) => setEditingOrg({ ...editingOrg, primary_contact_email: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Assigned Region</label>
                  <select
                    value={editingOrg.assigned_region}
                    onChange={(e) => setEditingOrg({ ...editingOrg, assigned_region: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="eu-central-1">EU Central (Frankfurt)</option>
                    <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Data Residency Zone</label>
                  <select
                    value={editingOrg.data_residency}
                    onChange={(e) => setEditingOrg({ ...editingOrg, data_residency: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="US-East">US-East (FedRAMP)</option>
                    <option value="EU-GDPR">EU-GDPR (Frankfurt)</option>
                    <option value="APAC-Sovereign">APAC-Sovereign</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingOrg(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditOrg}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-sm flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingEditOrg ? 'Saving...' : 'Save Organization'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
