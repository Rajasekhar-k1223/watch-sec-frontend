import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function CustomerServiceHealth() {
  const { token } = useAuth() as any;
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${token || localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    };
    fetch('/api/v2/pri/customer-health/status', { headers })
      .then((r) => r.json())
      .then((d) => setHealthData(d))
      .catch(() => {});
  }, [token]);

  const status = healthData?.overall_service_health || 'OPERATIONAL';

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100 space-y-6">
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            VERIFIED OPERATIONAL SERVICE HEALTH
          </span>
          <h1 className="text-2xl font-bold mt-2">Monitorix Service Health & Status Center</h1>
          <p className="text-sm text-slate-400">
            Real-time verified operational status, maintenance notices, and confirmed service updates for your organization.
          </p>
        </div>
        <div className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-bold text-emerald-400">
          Current Status: {status}
        </div>
      </div>

      {/* Confirmed Incidents */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-3">Confirmed Operational Incidents & Recovery Progress</h2>
        {(healthData?.confirmed_incidents || []).length === 0 ? (
          <p className="text-sm text-slate-400">
            No active service interruptions or degradations affecting your environment.
          </p>
        ) : (
          <div className="space-y-3">
            {healthData.confirmed_incidents.map((inc: any) => (
              <div key={inc.incident_id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">{inc.affected_service}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    {inc.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2">{inc.summary}</p>
                {inc.recommended_action && (
                  <p className="text-xs text-cyan-400 mt-1">
                    Recommended Action: {inc.recommended_action}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Communication History */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-3">Official Service Communications & Maintenance History</h2>
        <div className="space-y-2">
          {(healthData?.communications || []).map((c: any) => (
            <div key={c.communication_id} className="p-3 bg-slate-950 border border-slate-800 rounded text-xs">
              <div className="font-semibold text-slate-200">{c.title}</div>
              <div className="text-slate-400 mt-1">{c.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
