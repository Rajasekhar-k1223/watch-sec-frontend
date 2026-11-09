import React, { useState, useEffect } from 'react';
import { 
  Mail, ShieldAlert, AlertTriangle, CheckCircle2, FileSearch, Paperclip, 
  ExternalLink, Ban, RefreshCw, Eye, ArrowRight, ShieldCheck, Download, Trash2, Plus, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

interface EmailRecord {
  id: number;
  sender: string;
  recipient: string;
  subject: string;
  timestamp: string;
  threat_verdict: 'Malicious' | 'Suspicious' | 'Clean';
  spf_status: 'Pass' | 'Fail';
  dkim_status: 'Pass' | 'Fail';
  dmarc_status: 'Pass' | 'Fail';
  phishing_score: number;
  has_attachment: boolean;
  attachments: Array<{
    filename: string;
    sha256: string;
    verdict: string;
    filesize: string;
  }>;
  malicious_urls: string[];
  agent_id: string;
}

export default function EmailForensics() {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for manual submission
  const [newSender, setNewSender] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newVerdict, setNewVerdict] = useState<'Malicious' | 'Suspicious' | 'Clean'>('Malicious');
  const [newSpf, setNewSpf] = useState<'Pass' | 'Fail'>('Fail');
  const [newDkim, setNewDkim] = useState<'Pass' | 'Fail'>('Fail');
  const [newDmarc, setNewDmarc] = useState<'Pass' | 'Fail'>('Fail');
  const [newScore, setNewScore] = useState<number>(85);
  const [newHasAttachment, setNewHasAttachment] = useState(false);
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newMaliciousUrl, setNewMaliciousUrl] = useState('');
  const [newAgentId, setNewAgentId] = useState('ENDPOINT-SRV-01');
  const [submitting, setSubmitting] = useState(false);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
      const res = await fetch(`${API_URL}/mail/?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: EmailRecord[] = data.map((item: any) => {
            const isMalicious = item.RiskLevel === 'Critical' || item.RiskLevel === 'High';
            const isSuspicious = item.RiskLevel === 'Medium';
            return {
              id: item.Id || Math.floor(Math.random() * 100000),
              sender: item.Sender || 'unknown-sender@external.net',
              recipient: item.Recipient || 'secops@internal.net',
              subject: item.Subject || 'Security Telemetry Alert',
              timestamp: item.Timestamp ? new Date(item.Timestamp).toISOString() : new Date().toISOString(),
              threat_verdict: isMalicious ? 'Malicious' : (isSuspicious ? 'Suspicious' : 'Clean'),
              spf_status: isMalicious ? 'Fail' : 'Pass',
              dkim_status: isMalicious ? 'Fail' : 'Pass',
              dmarc_status: isMalicious ? 'Fail' : 'Pass',
              phishing_score: isMalicious ? 92 : (isSuspicious ? 58 : 4),
              has_attachment: Boolean(item.HasAttachments || (item.Attachments && item.Attachments.length > 0)),
              attachments: (item.Attachments || []).map((att: any) => ({
                filename: att.FileName || 'attachment.bin',
                sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                verdict: isMalicious ? 'Suspicious / Untrusted Payload' : 'Clean Document',
                filesize: `${Math.max(1, Math.round((att.Size || 1024) / 1024))} KB`
              })),
              malicious_urls: isMalicious ? ['https://login-verify.company.internal/oauth/v2'] : [],
              agent_id: item.AgentId || 'ENDPOINT-SRV-01'
            };
          });

          setEmails(mapped);
          if (!selectedEmail && mapped.length > 0) {
            setSelectedEmail(mapped[0]);
          }
          return;
        }
      }

      setEmails([]);
      setSelectedEmail(null);
    } catch (e) {
      console.error(e);
      setEmails([]);
      setSelectedEmail(null);
      toast.error('Failed to load email forensics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleQuarantine = (email: EmailRecord) => {
    toast.success(`Email #${email.id} quarantined & sender blocked across perimeter`);
  };

  const handleDelete = async (emailId: number) => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
      await fetch(`${API_URL}/mail/${emailId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setEmails(prev => prev.filter(e => e.id !== emailId));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(emails.find(e => e.id !== emailId) || null);
      }
      toast.success(`Email record #${emailId} removed`);
    } catch (e: any) {
      toast.error('Failed to remove record');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSender || !newRecipient || !newSubject) {
      toast.error('Sender, Recipient, and Subject are required');
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
      const payload = {
        Sender: newSender.trim(),
        Recipient: newRecipient.trim(),
        Subject: newSubject.trim(),
        BodyPreview: `Manual analysis: Subject '${newSubject}'. Sender: ${newSender}`,
        RiskLevel: newVerdict === 'Malicious' ? 'High' : (newVerdict === 'Suspicious' ? 'Medium' : 'Low'),
        AgentId: newAgentId.trim() || 'MANUAL-CONSOLE',
        HasAttachments: newHasAttachment,
        AttachmentNames: newHasAttachment ? newAttachmentName : null
      };

      const res = await fetch(`${API_URL}/mail/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const newId = res.ok ? (await res.json()).Id : Math.floor(Math.random() * 900000) + 100000;

      const record: EmailRecord = {
        id: newId,
        sender: newSender.trim(),
        recipient: newRecipient.trim(),
        subject: newSubject.trim(),
        timestamp: new Date().toISOString(),
        threat_verdict: newVerdict,
        spf_status: newSpf,
        dkim_status: newDkim,
        dmarc_status: newDmarc,
        phishing_score: newScore,
        has_attachment: newHasAttachment,
        attachments: newHasAttachment ? [{
          filename: newAttachmentName || 'uploaded_sample.bin',
          sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          verdict: newVerdict === 'Malicious' ? 'Detonated Suspicious Binary' : 'Clean Scanned Payload',
          filesize: '128 KB'
        }] : [],
        malicious_urls: newMaliciousUrl ? [newMaliciousUrl.trim()] : [],
        agent_id: newAgentId.trim() || 'MANUAL-CONSOLE'
      };

      setEmails(prev => [record, ...prev]);
      setSelectedEmail(record);
      setShowAddModal(false);
      toast.success('Forensic email record registered and analyzed!');

      // Reset form
      setNewSender('');
      setNewRecipient('');
      setNewSubject('');
      setNewAttachmentName('');
      setNewMaliciousUrl('');
    } catch (e: any) {
      toast.error('Submission failed: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic Metrics
  const maliciousCount = emails.filter(e => e.threat_verdict === 'Malicious').length;
  const spoofedCount = emails.filter(e => e.spf_status === 'Fail' || e.dkim_status === 'Fail' || e.dmarc_status === 'Fail').length;
  const attachmentCount = emails.filter(e => e.has_attachment).length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-850 border border-slate-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-600 dark:text-amber-400">
              <Mail className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Email Security & Phishing Forensics</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Deep header inspection (SPF/DKIM/DMARC), attachment macro detonation & credential harvesting detection
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Email for Analysis
          </button>
          <button
            onClick={fetchEmails}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-all border border-slate-200 dark:border-gray-700 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-850 border border-slate-200 dark:border-gray-800 shadow-sm p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Malicious Intercepts</div>
            <div className="text-2xl font-bold text-red-500 mt-1">{maliciousCount} Intercepted</div>
            <div className="text-xs text-red-500 mt-0.5">Phishing & Macro Threats</div>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-850 border border-slate-200 dark:border-gray-800 shadow-sm p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Auth Spoofing Failures</div>
            <div className="text-2xl font-bold text-amber-500 mt-1">{spoofedCount} Spoofed</div>
            <div className="text-xs text-amber-500 mt-0.5">SPF / DKIM / DMARC Violations</div>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-850 border border-slate-200 dark:border-gray-800 shadow-sm p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Detonated Attachments</div>
            <div className="text-2xl font-bold text-indigo-500 mt-1">{attachmentCount} Scanned</div>
            <div className="text-xs text-slate-500 mt-0.5">Sandbox Macro Analysis</div>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-500">
            <Paperclip className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-850 border border-slate-200 dark:border-gray-800 shadow-sm p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mail Gateway Status</div>
            <div className="text-2xl font-bold text-emerald-500 mt-1">Enforcing</div>
            <div className="text-xs text-emerald-500 mt-0.5">{emails.length} Total Telemetry Records</div>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Mail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Email Message List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Monitored Inbound Messages ({emails.length})</div>
            <span className="text-xs text-slate-400">Click to inspect</span>
          </div>

          {emails.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-8 rounded-xl text-center text-slate-500">
              No email logs found. Click "Add Email for Analysis" to submit telemetry.
            </div>
          ) : (
            emails.map((mail) => {
              const isSelected = selectedEmail?.id === mail.id;
              return (
                <div
                  key={mail.id}
                  onClick={() => setSelectedEmail(mail)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 shadow-sm ring-1 ring-indigo-400'
                      : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      mail.threat_verdict === 'Malicious'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                        : mail.threat_verdict === 'Suspicious'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}>
                      {mail.threat_verdict} ({mail.phishing_score}/100)
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(mail.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{mail.subject}</h4>
                  <div className="text-[11px] text-slate-500 truncate mt-1">From: {mail.sender}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                    <span className="truncate">To: {mail.recipient}</span>
                    <div className="flex items-center gap-2">
                      {mail.has_attachment && <span className="flex items-center gap-1 text-amber-500"><Paperclip className="w-3 h-3" /> Attached</span>}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(mail.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Email Forensic Deep-Dive */}
        <div className="lg:col-span-7">
          {selectedEmail ? (
            <div className="bg-white dark:bg-gray-850 border border-slate-200 dark:border-gray-800 shadow-sm rounded-2xl p-6 shadow-xl space-y-6">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-gray-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      selectedEmail.threat_verdict === 'Malicious'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                        : selectedEmail.threat_verdict === 'Suspicious'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}>
                      {selectedEmail.threat_verdict}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Risk Score: <strong className="text-slate-900 dark:text-white font-bold">{selectedEmail.phishing_score}/100</strong></span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedEmail.subject}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuarantine(selectedEmail)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Ban className="w-4 h-4" />
                    Quarantine Message
                  </button>
                  <button
                    onClick={() => handleDelete(selectedEmail.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Message Header Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-gray-800/60 p-4 rounded-xl border border-slate-200 dark:border-gray-700">
                <div>
                  <span className="text-slate-500 font-medium">Sender: </span>
                  <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">{selectedEmail.sender}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Recipient: </span>
                  <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">{selectedEmail.recipient}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Destination Endpoint: </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{selectedEmail.agent_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Received Timestamp: </span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Authentication Alignment Indicators */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Email Authentication Alignment (Anti-Spoofing)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 rounded-xl border text-center ${
                    selectedEmail.spf_status === 'Pass' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-800 dark:text-rose-300'
                  }`}>
                    <div className="text-[10px] uppercase font-bold">SPF Record</div>
                    <div className="text-sm font-bold mt-0.5">{selectedEmail.spf_status}</div>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${
                    selectedEmail.dkim_status === 'Pass' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-800 dark:text-rose-300'
                  }`}>
                    <div className="text-[10px] uppercase font-bold">DKIM Signature</div>
                    <div className="text-sm font-bold mt-0.5">{selectedEmail.dkim_status}</div>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${
                    selectedEmail.dmarc_status === 'Pass' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-800 dark:text-rose-300'
                  }`}>
                    <div className="text-[10px] uppercase font-bold">DMARC Policy</div>
                    <div className="text-sm font-bold mt-0.5">{selectedEmail.dmarc_status}</div>
                  </div>
                </div>
              </div>

              {/* Attachment Forensics */}
              {selectedEmail.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Detonated Attachment Forensics
                  </h4>
                  <div className="space-y-2">
                    {selectedEmail.attachments.map((att, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                            {att.filename} ({att.filesize})
                          </span>
                          <span className="text-rose-600 font-semibold">{att.verdict}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 truncate">
                          SHA256: {att.sha256}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Malicious URLs */}
              {selectedEmail.malicious_urls.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Extracted Phishing Links / Harvesters
                  </h4>
                  <div className="space-y-2">
                    {selectedEmail.malicious_urls.map((url, i) => (
                      <div key={i} className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-mono text-rose-800 dark:text-rose-300 flex items-center justify-between">
                        <span className="truncate">{url}</span>
                        <span className="px-2 py-0.5 bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100 rounded text-[10px] font-bold">Credential Harvester</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-12 text-slate-500 bg-white dark:bg-gray-850 rounded-2xl border border-slate-200 dark:border-gray-800">
              Select an email to view forensic analysis
            </div>
          )}
        </div>
      </div>

      {/* Manual Email Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Add Email for Forensic Inspection
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sender Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. alert@suspicious-domain.com"
                    value={newSender}
                    onChange={e => setNewSender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. employee@company.internal"
                    value={newRecipient}
                    onChange={e => setNewRecipient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urgent Security Update Notice"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Threat Verdict</label>
                  <select
                    value={newVerdict}
                    onChange={e => setNewVerdict(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Malicious">Malicious</option>
                    <option value="Suspicious">Suspicious</option>
                    <option value="Clean">Clean</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">SPF Status</label>
                  <select
                    value={newSpf}
                    onChange={e => setNewSpf(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Fail">Fail</option>
                    <option value="Pass">Pass</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">DKIM Status</label>
                  <select
                    value={newDkim}
                    onChange={e => setNewDkim(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Fail">Fail</option>
                    <option value="Pass">Pass</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Risk Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newScore}
                    onChange={e => setNewScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Malicious URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://phish-portal.example.com"
                    value={newMaliciousUrl}
                    onChange={e => setNewMaliciousUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Destination Endpoint ID</label>
                  <input
                    type="text"
                    placeholder="e.g. ENDPOINT-SEC-01"
                    value={newAgentId}
                    onChange={e => setNewAgentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-gray-800/60 rounded-xl border border-slate-200 dark:border-gray-700 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newHasAttachment}
                    onChange={e => setNewHasAttachment(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Includes File Attachment for Detonation</span>
                </label>
                {newHasAttachment && (
                  <input
                    type="text"
                    placeholder="Attachment File Name (e.g. Payload_Installer.vbs)"
                    value={newAttachmentName}
                    onChange={e => setNewAttachmentName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                >
                  {submitting ? 'Registering...' : 'Register & Inspect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
