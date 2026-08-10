import { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { Cloud, Plus, Shield } from 'lucide-react';

interface CloudCredential {
  Id: number;
  Provider: string;
  AccountId: string;
  IsActive: boolean;
  CreatedAt: string;
}

export function CspmPanel() {
  const [credentials, setCredentials] = useState<CloudCredential[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [provider, setProvider] = useState('AWS');
  const [accountId, setAccountId] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCredentials = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/cloud/cspm/credentials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
      }
    } catch (e) {
      console.error('Failed to fetch CSPM credentials', e);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleAddCredential = async () => {
    if (!accountId || !accessKey || !secretKey) return alert('Fill all fields');
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/cloud/cspm/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          Provider: provider,
          AccountId: accountId,
          AccessKey: accessKey,
          SecretKey: secretKey
        })
      });

      if (res.ok) {
        setIsAdding(false);
        setAccountId('');
        setAccessKey('');
        setSecretKey('');
        fetchCredentials();
      } else {
        const error = await res.json();
        alert(`Failed to add credential: ${error.detail || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="mt-8">
      <div className="border-b border-indigo-300 dark:border-indigo-900 pb-4 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <Cloud className="w-6 h-6" />
              Cloud Security Posture (CSPM)
            </h2>
            <p className="text-xs text-slate-500 mt-1">Agentless ingestion of AWS CloudTrail and Azure Activity Logs.</p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition"
          >
            {isAdding ? 'CANCEL_SETUP' : <><Plus size={16} /> NEW_INTEGRATION</>}
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-indigo-200 dark:border-indigo-900/50 rounded p-5 mb-6 animate-fade-in shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">CLOUD_PROVIDER</label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-indigo-700 dark:text-indigo-400 font-mono text-sm p-2.5 outline-none focus:border-indigo-500"
              >
                <option value="AWS">Amazon Web Services</option>
                <option value="AZURE">Microsoft Azure</option>
                <option value="GCP">Google Cloud Platform</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">ACCOUNT_ID</label>
              <input
                type="text"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                placeholder="123456789012"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-sm p-2.5 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">ACCESS_KEY</label>
              <input
                type="text"
                value={accessKey}
                onChange={e => setAccessKey(e.target.value)}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-sm p-2.5 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">SECRET_KEY</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={secretKey}
                  onChange={e => setSecretKey(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-sm p-2.5 outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleAddCredential}
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm disabled:opacity-50 min-w-[100px]"
                >
                  {loading ? 'BINDING...' : 'AUTHORIZE'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-black border border-slate-200 dark:border-gray-800 rounded overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0f1722] text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-gray-800">
              <tr>
                <th className="p-4 font-normal tracking-widest">PROVIDER</th>
                <th className="p-4 font-normal tracking-widest">ACCOUNT_ID</th>
                <th className="p-4 font-normal tracking-widest">STATUS</th>
                <th className="p-4 font-normal tracking-widest">ADDED_ON</th>
                <th className="p-4 font-normal tracking-widest text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {credentials.map((cred) => (
                <tr key={cred.Id} className="hover:bg-slate-50 dark:hover:bg-[#0f1722] transition group">
                  <td className="p-4 text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2">
                    <Cloud size={16} /> {cred.Provider}
                  </td>
                  <td className="p-4 font-mono text-slate-800 dark:text-gray-300">{cred.AccountId}</td>
                  <td className="p-4">
                    {cred.IsActive ? (
                      <span className="px-2 py-1 text-xs rounded font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 w-max">
                        <Shield size={12} /> SECURED
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800">
                        PENDING
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500 dark:text-gray-500">
                    {new Date(cred.CreatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs hover:bg-red-200 dark:hover:bg-red-800 border border-red-300 dark:border-red-800 transition">
                      REVOKE
                    </button>
                  </td>
                </tr>
              ))}
              {credentials.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-gray-600">
                    No cloud integrations configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
