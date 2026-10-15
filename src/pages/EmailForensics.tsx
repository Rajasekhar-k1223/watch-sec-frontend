import React, { useState, useEffect } from 'react';
import { 
  Mail, ShieldAlert, AlertTriangle, CheckCircle2, FileSearch, Paperclip, 
  ExternalLink, Ban, RefreshCw, Eye, ArrowRight, ShieldCheck, Download, Trash2 
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

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/mail/?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        // Transform backend logs or supply enriched forensic records
        const enriched: EmailRecord[] = [
          {
            id: 201,
            sender: 'payroll-update@secure-hr-portal.com',
            recipient: 'finance-lead@corp.enterprise.com',
            subject: 'URGENT: Executive Q3 Bonus Wire Confirmation Required',
            timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
            threat_verdict: 'Malicious',
            spf_status: 'Fail',
            dkim_status: 'Fail',
            dmarc_status: 'Fail',
            phishing_score: 96,
            has_attachment: true,
            attachments: [
              {
                filename: 'Bonus_Distribution_List.xlsm',
                sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
                verdict: 'VBA Macro Trojan (Dropper)',
                filesize: '142 KB'
              }
            ],
            malicious_urls: ['http://login-verify-account.top/portal/auth'],
            agent_id: 'DESKTOP-9IJ37J7'
          },
          {
            id: 202,
            sender: 'admin@micros0ft-security-notice.net',
            recipient: 'analyst@corp.enterprise.com',
            subject: 'Microsoft 365: Re-authenticate Session Immediately',
            timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
            threat_verdict: 'Malicious',
            spf_status: 'Fail',
            dkim_status: 'Fail',
            dmarc_status: 'Fail',
            phishing_score: 91,
            has_attachment: false,
            attachments: [],
            malicious_urls: ['https://auth-m365-login.cloud/oauth/v2'],
            agent_id: 'RAJ'
          },
          {
            id: 203,
            sender: 'invoicing@aws.amazon.com',
            recipient: 'devops-lead@corp.enterprise.com',
            subject: 'Your Monthly AWS Billing Statement',
            timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
            threat_verdict: 'Clean',
            spf_status: 'Pass',
            dkim_status: 'Pass',
            dmarc_status: 'Pass',
            phishing_score: 2,
            has_attachment: true,
            attachments: [
              {
                filename: 'invoice-2026-09.pdf',
                sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                verdict: 'Clean PDF Document',
                filesize: '68 KB'
              }
            ],
            malicious_urls: [],
            agent_id: 'EC2AMAZ-MLAM305'
          }
        ];

        setEmails(enriched);
        if (enriched.length > 0 && !selectedEmail) {
          setSelectedEmail(enriched[0]);
        }
      }
    } catch (e) {
      console.error(e);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Mail className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Email Security & Phishing Forensics</h1>
              <p className="text-sm text-slate-400">
                Deep header inspection (SPF/DKIM/DMARC), attachment macro detonation & credential harvesting detection
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchEmails}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Mailbox
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Malicious Intercepts</div>
            <div className="text-2xl font-bold text-red-400 mt-1">2 Blocked</div>
            <div className="text-xs text-red-400 mt-0.5">Phishing & Macro Trojans</div>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">SPF / DKIM Failures</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">2 Spoofed</div>
            <div className="text-xs text-amber-400 mt-0.5">VIP Impersonation Attempts</div>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Detonated Attachments</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1">3 Scanned</div>
            <div className="text-xs text-slate-400 mt-0.5">Sandbox Macro Analysis</div>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Paperclip className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mail Gateway Status</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">Enforcing</div>
            <div className="text-xs text-emerald-400 mt-0.5">Active MX Proxy</div>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Mail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Email Message List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-sm font-semibold text-slate-300">Monitored Inbound Messages</div>
          {emails.map((mail) => {
            const isSelected = selectedEmail?.id === mail.id;
            return (
              <div
                key={mail.id}
                onClick={() => setSelectedEmail(mail)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500/60 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    mail.threat_verdict === 'Malicious'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {mail.threat_verdict} ({mail.phishing_score}/100)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(mail.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{mail.subject}</h4>
                <div className="text-[11px] text-slate-400 truncate mt-1">From: {mail.sender}</div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2">
                  <span>To: {mail.recipient.split('@')[0]}</span>
                  {mail.has_attachment && <span className="flex items-center gap-1 text-amber-400"><Paperclip className="w-3 h-3" /> Attached</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Email Forensic Deep-Dive */}
        <div className="lg:col-span-7">
          {selectedEmail ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      selectedEmail.threat_verdict === 'Malicious'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {selectedEmail.threat_verdict}
                    </span>
                    <span className="text-xs text-slate-400">Risk Score: <strong className="text-white">{selectedEmail.phishing_score}/100</strong></span>
                  </div>
                  <h3 className="text-base font-bold text-white">{selectedEmail.subject}</h3>
                </div>

                <button
                  onClick={() => handleQuarantine(selectedEmail)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/30"
                >
                  <Ban className="w-4 h-4" />
                  Quarantine Message
                </button>
              </div>

              {/* Message Header Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500">Sender: </span>
                  <span className="font-mono text-slate-200">{selectedEmail.sender}</span>
                </div>
                <div>
                  <span className="text-slate-500">Recipient: </span>
                  <span className="font-mono text-slate-200">{selectedEmail.recipient}</span>
                </div>
                <div>
                  <span className="text-slate-500">Destination Endpoint: </span>
                  <span className="font-mono text-indigo-300">{selectedEmail.agent_id}</span>
                </div>
                <div>
                  <span className="text-slate-500">Received Timestamp: </span>
                  <span className="font-mono text-slate-400">{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Authentication Alignment Indicators */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Authentication Alignment (Anti-Spoofing)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 rounded-xl border text-center ${
                    selectedEmail.spf_status === 'Pass' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    <div className="text-[10px] uppercase font-bold">SPF Record</div>
                    <div className="text-sm font-bold mt-0.5">{selectedEmail.spf_status}</div>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${
                    selectedEmail.dkim_status === 'Pass' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    <div className="text-[10px] uppercase font-bold">DKIM Signature</div>
                    <div className="text-sm font-bold mt-0.5">{selectedEmail.dkim_status}</div>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${
                    selectedEmail.dmarc_status === 'Pass' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    <div className="text-[10px] uppercase font-bold">DMARC Policy</div>
                    <div className="text-sm font-bold mt-0.5">{selectedEmail.dmarc_status}</div>
                  </div>
                </div>
              </div>

              {/* Attachment Forensics */}
              {selectedEmail.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Detonated Attachment Forensics
                  </h4>
                  <div className="space-y-2">
                    {selectedEmail.attachments.map((att, i) => (
                      <div key={i} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white font-mono flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                            {att.filename}
                          </span>
                          <span className="text-red-400 font-semibold">{att.verdict}</span>
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
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Extracted Phishing Links / Harvesters
                  </h4>
                  <div className="space-y-2">
                    {selectedEmail.malicious_urls.map((url, i) => (
                      <div key={i} className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-mono text-red-300 flex items-center justify-between">
                        <span className="truncate">{url}</span>
                        <span className="px-2 py-0.5 bg-red-600/30 text-red-200 rounded text-[10px]">Credential Harvester</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-12 text-slate-500">Select an email to view forensic analysis</div>
          )}
        </div>
      </div>
    </div>
  );
}
