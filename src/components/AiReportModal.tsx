import { useState, useEffect } from 'react';
import { X, Brain, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { API_URL } from '../config';

interface AiReport {
  Id: number;
  AlertId: number;
  ExecutiveSummary: string;
  TechnicalDetails: string;
  RemediationSteps: string;
  CreatedAt: string;
}

interface AiReportModalProps {
  alertId: number;
  onClose: () => void;
}

export function AiReportModal({ alertId, onClose }: AiReportModalProps) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<AiReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOrGenerateReport = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        // Try fetching first
        let res = await fetch(`${API_URL}/v2/copilot/reports/${alertId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 404) {
          // Trigger generation
          const genRes = await fetch(`${API_URL}/v2/copilot/summarize/${alertId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!genRes.ok) {
            throw new Error('Failed to generate AI report. Copilot engine may be offline.');
          }
          
          // Re-fetch after generation
          res = await fetch(`${API_URL}/v2/copilot/reports/${alertId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setReport(data);
        } else {
          throw new Error('Report could not be retrieved.');
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrGenerateReport();
    
    return () => { isMounted = false; };
  }, [alertId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Brain className="text-indigo-400 w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Monitorix AI Security Copilot</h2>
              <p className="text-xs text-indigo-400 uppercase tracking-widest mt-0.5">Automated Incident Analysis Report</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Brain className="w-16 h-16 text-indigo-500 animate-bounce" />
              <div className="text-lg text-slate-300 font-mono">Synthesizing threat intelligence...</div>
              <div className="text-sm text-slate-500">Querying Tier-A Model & performing context extraction</div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start gap-4 text-red-400">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-1">Inference Failure</h3>
                <p>{error}</p>
              </div>
            </div>
          ) : report ? (
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="flex items-center gap-2 text-white font-bold text-lg mb-3">
                  <FileText className="text-indigo-400" /> Executive Summary
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {report.ExecutiveSummary}
                </p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="flex items-center gap-2 text-white font-bold text-lg mb-3">
                  <AlertTriangle className="text-yellow-400" /> Technical Details
                </h3>
                <div className="prose prose-invert max-w-none text-slate-300 text-sm whitespace-pre-wrap">
                  {report.TechnicalDetails}
                </div>
              </div>

              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-6">
                <h3 className="flex items-center gap-2 text-indigo-300 font-bold text-lg mb-3">
                  <ShieldCheck className="text-emerald-400" /> Recommended Remediation
                </h3>
                <div className="prose prose-invert max-w-none text-slate-300 text-sm whitespace-pre-wrap">
                  {report.RemediationSteps}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl flex justify-between items-center">
          <div className="text-xs text-slate-500 font-mono">
            Generated: {report ? new Date(report.CreatedAt).toLocaleString() : 'N/A'}
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
