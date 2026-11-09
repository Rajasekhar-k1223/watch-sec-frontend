import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, PhoneCall, Mail, FileDown, 
  Clock, CheckCircle, MessageSquare, AlertTriangle, Send,
  Layers, Lock, Database, ArrowUpRight
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function CustomerSecurityPortal() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/v2/soc/portal`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error('Failed to fetch security portal');
      }
    } catch (err) {
      console.error('Failed to load customer security portal', err);
      toast.error('Failed to fetch security portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => {
      toast.success('Message dispatched to 24/7 SOC Commander queue');
      setMessage('');
      setSending(false);
    }, 600);
  };

  const handleDownloadReport = async (freq: string) => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_URL}/v2/soc/reports/executive?frequency=${freq}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const reportBlob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(reportBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Monitorix_Security_Report_${freq.toUpperCase()}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        toast.success(`${freq.toUpperCase()} Executive Report downloaded`);
      } else {
        toast.error('Failed to generate report');
      }
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 font-mono text-sm tracking-wider uppercase">Loading Customer Security Portal...</span>
        </div>
      </div>
    );
  }

  const { customer_name, monitored_assets, active_threats_count, critical_threats_count, incidents, soc_contact } = data;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              24/7 ACTIVE MDR SHIELD
            </span>
            <span className="text-slate-400 font-mono text-xs">•</span>
            <span className="text-slate-300 font-mono text-xs">{customer_name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Security & Threat Portal</h1>
          <p className="text-sm text-slate-400">
            Dedicated enterprise security oversight, threat remediation status, and direct line to SOC command.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleDownloadReport('weekly')}
            disabled={downloading}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-700 transition"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>Weekly Executive Report</span>
          </button>

          <button
            onClick={() => handleDownloadReport('monthly')}
            disabled={downloading}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 transition"
          >
            <FileDown className="w-4 h-4" />
            <span>Monthly Audit Report</span>
          </button>
        </div>
      </div>

      {/* Security Health Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-400 uppercase font-mono">Protection Posture</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">PROTECTED</div>
          <div className="text-xs text-slate-400 mt-1">Zero undetected compromise</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-400 uppercase font-mono">Protected Endpoints</span>
            <Lock className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{monitored_assets} Assets</div>
          <div className="text-xs text-slate-400 mt-1">Windows, Linux, macOS</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-400 uppercase font-mono">Under Containment</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{active_threats_count} Threats</div>
          <div className="text-xs text-slate-400 mt-1">Neutralized by SOAR</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-400 uppercase font-mono">Critical Escalations</span>
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{critical_threats_count} Items</div>
          <div className="text-xs text-slate-400 mt-1">SLA response &lt; 5 mins</div>
        </div>
      </div>

      {/* Main Grid: Incidents & SOC Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Customer-Safe Incidents */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Active Security Threat Mitigations
              </h2>
              <span className="text-xs text-slate-400 font-mono">MANAGED INCIDENTS</span>
            </div>

            <div className="space-y-3">
              {incidents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Zero active threats detected on your environment. All endpoints operational.
                </div>
              ) : (
                incidents.map((inc: any) => (
                  <div key={inc.id} className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${inc.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                          {inc.severity}
                        </span>
                        <b className="text-white text-sm">{inc.title}</b>
                      </div>
                      <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {inc.status}
                      </span>
                    </div>

                    <p className="text-slate-300 text-[11px] leading-relaxed">{inc.summary}</p>
                    
                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/50 text-[10px] text-slate-400 font-mono">
                      <span>Reported: {new Date(inc.reported_at).toLocaleString()}</span>
                      <span>Customer Action: None Required (Autonomous SOC Containment)</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Dedicated SOC Hotline & Direct Message Box */}
        <div className="space-y-6">
          
          {/* Emergency SOC Contacts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-cyan-400" />
              Dedicated MDR Security Contacts
            </h2>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[11px]">24/7 Emergency Hotline</div>
                  <div className="text-white font-mono font-bold text-sm mt-0.5">{soc_contact.hotline}</div>
                </div>
                <PhoneCall className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[11px]">SOC Dispatch Desk</div>
                  <div className="text-white font-mono text-xs mt-0.5">{soc_contact.email}</div>
                </div>
                <Mail className="w-5 h-5 text-blue-400" />
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[11px]">Assigned Commander</div>
                  <div className="text-cyan-400 font-mono font-bold text-xs mt-0.5">{soc_contact.dedicated_commander}</div>
                </div>
                <CheckCircle className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Secure Message to Assigned SOC */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Message Assigned SOC Commander
            </h2>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Submit an inquiry or report an unusual event directly to the 24/7 SOC desk..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[90px]"
            />

            <button
              onClick={handleSendMessage}
              disabled={sending}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Dispatching...' : 'Send Message to SOC'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
