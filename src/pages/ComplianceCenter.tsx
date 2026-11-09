import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle,
  Clock, Search, Download, RefreshCw, Play, FileText, Database,
  Globe, Lock, FileCheck, Layers, Copy, Check, Activity, Scale,
  Fingerprint, FileSpreadsheet, UserX, SlidersHorizontal, Info,
  Building2, CheckSquare, Wrench, Archive, BookOpen
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface FrameworkSummary {
  id: string;
  framework_id: string;
  name: string;
  region: string;
  country?: string;
  jurisdiction: string;
  category: string;
  industry?: string;
  version: string;
  regulatory_authority?: string;
  source_reference?: string;
  score: number;
  status: string;
  total_controls: number;
  applicable_controls: number;
  passed_controls: number;
  partial_controls: number;
  failed_controls: number;
  manual_review_controls: number;
  not_applicable_controls: number;
  open_findings_count: number;
  supported_privacy_rights?: string[];
  last_assessed_at?: string;
}

interface PostureData {
  tenant_id: number;
  assessment_type: string;
  legal_disclaimer: string;
  overall_score: number;
  organization_score: number;
  tenant_score: number;
  total_frameworks: number;
  active_frameworks: number;
  verified_posture_frameworks: number;
  partial_posture_frameworks: number;
  gap_identified_frameworks: number;
  manual_review_frameworks: number;
  total_controls_assessed: number;
  total_controls_monitored: number;
  total_passed_controls: number;
  total_partial_controls: number;
  total_failed_controls: number;
  total_manual_reviews: number;
  open_findings_count: number;
  critical_findings_count: number;
  high_findings_count: number;
  category_scores: Record<string, number>;
  country_scores: Record<string, number>;
  industry_scores: Record<string, number>;
  department_scores: Record<string, number>;
  frameworks: FrameworkSummary[];
  assessed_at: string;
}

interface EvaluatedControl {
  framework: string;
  control_id: string;
  check_name: string;
  category: string;
  status: string;
  severity: string;
  score: number;
  legal_reference: string;
  last_checked_at: string;
  evidence?: Array<{
    evidence_id: string;
    evidence_hash: string;
    source_service: string;
    summary: string;
  }>;
  finding?: {
    finding_id: string;
    title: string;
    finding_details: string;
  } | null;
  remediation?: {
    recommended_action: string;
    automated_fix_available: boolean;
  } | null;
}

interface CatalogControl {
  framework_id: string;
  framework_name: string;
  region: string;
  control_id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  legal_citation: string;
  automated: boolean;
}

interface ComplianceFinding {
  id: string;
  finding_id: string;
  framework_id: string;
  control_id: string;
  severity: string;
  title: string;
  description: string;
  affected_asset: string;
  recommendation: string;
  remediation_cmd?: string;
  status: string;
  detected_at: string;
}

interface RemediationItem {
  finding_id: string;
  framework_id: string;
  control_id: string;
  severity: string;
  title: string;
  recommended_action: string;
  automated_command?: string;
  priority_rank: number;
}

interface EvidenceRecord {
  evidence_id: string;
  framework_id: string;
  control_id: string;
  source: string;
  evidence_type: string;
  summary: string;
  sha256_hash: string;
  collected_at: string;
  tenant_id: number;
}

interface PiiClassifierItem {
  classifier_id: string;
  identifier: string;
  name: string;
  country: string;
  category: string;
  severity: string;
  checksum_validator: string;
  requires_context_for_high: boolean;
  regulations: string[];
}

interface ResidencyZone {
  region_code: string;
  name: string;
  jurisdiction: string;
  primary_vault: string;
  residency_enforced: boolean;
  cross_border_telemetry_fenced: boolean;
  cross_border_transfer_mechanism: string;
  encryption_at_rest: string;
  encryption_in_transit: string;
  default_retention_days: number;
  applicable_frameworks: string[];
  sovereignty_status: string;
}

interface PrivacyRequestItem {
  id: string;
  request_id: string;
  data_subject_identifier: string;
  right_type: string;
  framework_id: string;
  status: string;
  submitted_at: string;
  sla_due_at: string;
  notes?: string;
}

interface DslAssetItem {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  dsl_tier: string;
  department: string;
  cross_border_export_approved: boolean;
  security_assessment_completed: boolean;
  updated_at?: string;
}

interface NistFamilyItem {
  family_code: string;
  family_name: string;
  control_id: string;
  minimum_baseline: string;
  representative_nist_controls: string[];
  monitorix_telemetry_source: string;
}

interface ApplicabilityMatch {
  framework_id: string;
  name: string;
  region: string;
  applicable: boolean;
  confidence: string;
  triggers: string[];
  legal_note: string;
}

interface AuditHistoryItem {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  details: Record<string, any>;
}

const STATUTORY_REGULATOR_WORKFLOWS = [
  { authority: 'UK ICO (UK GDPR / DPA 2018)', deadline: '72 Hours', portal: 'ico.org.uk/for-organisations/report-a-breach', scope: 'Notifiable personal data breaches risking individual rights & freedoms (Art. 33)' },
  { authority: 'Brazil ANPD (LGPD Art. 48)', deadline: '3 Working Days', portal: 'gov.br/anpd/pt-br/canais_atendimento', scope: 'Security incidents creating relevant risk or damage to data subjects (Res. CD/ANPD No. 15/2024)' },
  { authority: 'India Data Protection Board (DPDP Act §8(6))', deadline: 'Without Delay / Prescribed SLA', portal: 'dpbi.gov.in (MeitY Statutory Portal)', scope: 'All personal data breaches affecting Data Principals + parallel CERT-In 6-hour cyber reporting' },
  { authority: 'Australia OAIC (NDB Scheme — Part IIIC)', deadline: 'Assessment <= 30 Days', portal: 'oaic.gov.au/privacy/notifiable-data-breaches', scope: 'Eligible data breaches likely to result in serious harm to individuals' },
  { authority: 'Canada OPC (PIPEDA RROSR §10.1)', deadline: 'As Soon As Feasible', portal: 'priv.gc.ca/en/report-a-concern/report-a-privacy-breach', scope: 'Breaches of security safeguards posing Real Risk of Significant Harm (RROSR) + 24-month breach ledger' },
  { authority: 'South Korea PIPC (PIPA Art. 34)', deadline: '72 Hours', portal: 'privacy.go.kr (PIPC / KISA Notification)', scope: 'Leakage of >=1,000 subjects, sensitive/unique IDs (RRN), or external cyber intrusion' },
  { authority: 'Singapore PDPC (PDPA §26D)', deadline: '3 Calendar Days', portal: 'eservice.pdpc.gov.sg', scope: 'Notifiable breaches causing significant harm or affecting >=500 individuals' },
  { authority: 'Türkiye KVKK Board + VERBİS (Law 6698 Art. 12/16)', deadline: '72 Hours', portal: 'bildirim.kvkk.gov.tr / verbis.kvkk.gov.tr', scope: 'Unlawful acquisition of personal data + mandatory Data Controllers Registry (VERBİS) filing' },
  { authority: 'Kenya ODPC (DPA 2019 §43)', deadline: '72 Hours', portal: 'odpc.go.ke', scope: 'Notifiable breach posing real risk of harm to data subjects + Data Controller/Processor registration' },
  { authority: 'Colombia SIC — RNBD (Law 1581 Art. 25)', deadline: '15 Business Days', portal: 'rnbd.sic.gov.co', scope: 'Security incidents reported to National Database Registry (RNBD) & Superintendence of Industry and Commerce' },
];

type TabKey =
  | 'overview'
  | 'frameworks'
  | 'controls'
  | 'findings'
  | 'evidence'
  | 'pii'
  | 'residency'
  | 'privacy_requests'
  | 'governance'
  | 'applicability'
  | 'reports';

export default function ComplianceCenter() {
  const { token, user } = useAuth();
  const userRole = (user?.role || user?.Role || 'Admin').toUpperCase();
  const isReadOnly = ['VIEWER', 'READONLY', 'READ_ONLY', 'AUDITOR', 'GUEST'].includes(userRole);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [posture, setPosture] = useState<PostureData | null>(null);

  // Overview & Framework Explorer State
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFramework, setSelectedFramework] = useState<string>('GDPR');
  const [selectedFwScore, setSelectedFwScore] = useState<FrameworkSummary | null>(null);
  const [selectedFwControls, setSelectedFwControls] = useState<EvaluatedControl[]>([]);
  const [loadingFwDetail, setLoadingFwDetail] = useState<boolean>(false);

  // Controls, Findings, Remediation & Evidence State
  const [controlsCatalog, setControlsCatalog] = useState<CatalogControl[]>([]);
  const [controlSeverityFilter, setControlSeverityFilter] = useState<string>('ALL');
  const [findingsList, setFindingsList] = useState<ComplianceFinding[]>([]);
  const [remediationPlan, setRemediationPlan] = useState<RemediationItem[]>([]);
  const [remediatingId, setRemediatingId] = useState<string | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Scanning State
  const [runningFramework, setRunningFramework] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState<boolean>(false);

  // PII Classifiers State
  const [piiCatalog, setPiiCatalog] = useState<PiiClassifierItem[]>([]);
  const [piiCountries, setPiiCountries] = useState<string[]>([]);
  const [piiCountry, setPiiCountry] = useState<string>('ALL');
  const [piiInput, setPiiInput] = useState<string>(
    'Employee Aadhaar: 2341 2341 2346, PAN: ABCDE1234F, UK NHS: 943 476 5919, UK NINO: AB123456C, Canada SIN: 046-454-286, Brazil CPF: 529.982.247-25'
  );
  const [classifyingPii, setClassifyingPii] = useState<boolean>(false);
  const [piiResults, setPiiResults] = useState<any[]>([]);

  // Residency State
  const [residencyZones, setResidencyZones] = useState<ResidencyZone[]>([]);

  // Privacy Requests & CCPA Preferences State
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequestItem[]>([]);
  const [doNotSell, setDoNotSell] = useState<boolean>(true);
  const [limitSensitive, setLimitSensitive] = useState<boolean>(true);
  const [gpcHonored, setGpcHonored] = useState<boolean>(true);
  const [ciiDesignated, setCiiDesignated] = useState<boolean>(false);
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);
  const [showReqModal, setShowReqModal] = useState<boolean>(false);
  const [newReqEmail, setNewReqEmail] = useState<string>('');
  const [newReqType, setNewReqType] = useState<string>('ACCESS');
  const [newReqFw, setNewReqFw] = useState<string>('GDPR');
  const [newReqNotes, setNewReqNotes] = useState<string>('');

  // Governance: China DSL & NIST 800-53 State
  const [dslAssets, setDslAssets] = useState<DslAssetItem[]>([]);
  const [newDslName, setNewDslName] = useState<string>('');
  const [newDslTier, setNewDslTier] = useState<string>('IMPORTANT_DATA');
  const [newDslDept, setNewDslDept] = useState<string>('Security Operations');
  const [newDslExportApproved, setNewDslExportApproved] = useState<boolean>(false);
  const [nistFamilies, setNistFamilies] = useState<NistFamilyItem[]>([]);
  const [nistBaselineFilter, setNistBaselineFilter] = useState<string>('ALL');

  // Applicability Engine State
  const [appCountries, setAppCountries] = useState<string>('US, DE, IN, BR, GB, CN, SG');
  const [appIndustry, setAppIndustry] = useState<string>('FINANCE');
  const [appEmployees, setAppEmployees] = useState<number>(500);
  const [appHealthData, setAppHealthData] = useState<boolean>(true);
  const [appFinancialData, setAppFinancialData] = useState<boolean>(true);
  const [appPubliclyTraded, setAppPubliclyTraded] = useState<boolean>(true);
  const [appGovContractor, setAppGovContractor] = useState<boolean>(false);
  const [appCiiOperator, setAppCiiOperator] = useState<boolean>(false);
  const [applicabilityResults, setApplicabilityResults] = useState<ApplicabilityMatch[]>([]);
  const [evaluatingApp, setEvaluatingApp] = useState<boolean>(false);

  // Reports & Audit History State
  const [exportTargetFw, setExportTargetFw] = useState<string>('summary');
  const [auditHistory, setAuditHistory] = useState<AuditHistoryItem[]>([]);

  const getHeaders = useCallback(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  }, [token]);

  const fetchPosture = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v2/compliance/posture`, { headers: getHeaders() });
      if (res.ok) {
        const data: PostureData = await res.json();
        setPosture(data);
      }
    } catch (e) {
      console.error('Failed to load compliance posture:', e);
    }
  }, [getHeaders]);

  const fetchFrameworkDetail = useCallback(async (fwId: string) => {
    if (!fwId) return;
    setLoadingFwDetail(true);
    try {
      const res = await fetch(`${API_URL}/v2/compliance/frameworks/${fwId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSelectedFwScore(data.framework || null);
        setSelectedFwControls(data.controls || []);
      }
    } catch (e) {
      console.error('Failed to load framework evaluation:', e);
    } finally {
      setLoadingFwDetail(false);
    }
  }, [getHeaders]);

  const fetchControlsCatalog = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v2/compliance/controls`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setControlsCatalog(data.controls || []);
      }
    } catch (e) {
      console.error('Failed to load controls catalog:', e);
    }
  }, [getHeaders]);

  const fetchFindingsAndRemediation = useCallback(async () => {
    try {
      const [fRes, rRes] = await Promise.all([
        fetch(`${API_URL}/v2/compliance/findings`, { headers: getHeaders() }),
        fetch(`${API_URL}/v2/compliance/remediation`, { headers: getHeaders() }),
      ]);
      if (fRes.ok) {
        const fData = await fRes.json();
        setFindingsList(fData.findings || []);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setRemediationPlan(rData.recommendations || []);
      }
    } catch (e) {
      console.error('Failed to load findings & remediation:', e);
    }
  }, [getHeaders]);

  const fetchEvidence = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v2/compliance/evidence`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEvidenceList(data.evidence || []);
      }
    } catch (e) {
      console.error('Failed to load evidence ledger:', e);
    }
  }, [getHeaders]);

  const fetchPiiCatalog = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v2/compliance/pii`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPiiCatalog(data.classifiers || []);
        setPiiCountries(data.countries || []);
      }
    } catch (e) {
      console.error('Failed to load PII classifier catalog:', e);
    }
  }, [getHeaders]);

  const fetchResidencyZones = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v2/compliance/residency`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setResidencyZones(data.zones || []);
      }
    } catch (e) {
      console.error('Failed to load residency zones:', e);
    }
  }, [getHeaders]);

  const fetchPrivacyWorkspace = useCallback(async () => {
    try {
      const [reqRes, prefRes] = await Promise.all([
        fetch(`${API_URL}/v2/compliance/privacy-requests`, { headers: getHeaders() }),
        fetch(`${API_URL}/v2/compliance/privacy-preferences`, { headers: getHeaders() }),
      ]);
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setPrivacyRequests(reqData.requests || []);
      }
      if (prefRes.ok) {
        const prefData = await prefRes.json();
        const prefs = prefData.preferences || {};
        setDoNotSell(Boolean(prefs.do_not_sell_share));
        setLimitSensitive(Boolean(prefs.limit_sensitive_personal_info));
        setGpcHonored(Boolean(prefs.global_privacy_control_honored));
        setCiiDesignated(Boolean(prefs.cii_operator_designated));
      }
    } catch (e) {
      console.error('Failed to load privacy workspace:', e);
    }
  }, [getHeaders]);

  const fetchGovernanceWorkspace = useCallback(async (baseline: string = nistBaselineFilter) => {
    try {
      const nistUrl = baseline === 'ALL'
        ? `${API_URL}/v2/compliance/nist-mapping`
        : `${API_URL}/v2/compliance/nist-mapping?baseline=${baseline}`;
      const [dslRes, nistRes] = await Promise.all([
        fetch(`${API_URL}/v2/compliance/dsl-assets`, { headers: getHeaders() }),
        fetch(nistUrl, { headers: getHeaders() }),
      ]);
      if (dslRes.ok) {
        const dslData = await dslRes.json();
        setDslAssets(dslData.assets || []);
      }
      if (nistRes.ok) {
        const nistData = await nistRes.json();
        setNistFamilies(nistData.families || []);
      }
    } catch (e) {
      console.error('Failed to load regulatory governance workspace:', e);
    }
  }, [getHeaders, nistBaselineFilter]);

  const fetchAuditHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v2/compliance/audit-history?limit=40`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAuditHistory(data.history || []);
      }
    } catch (e) {
      console.error('Failed to load compliance audit history:', e);
    }
  }, [getHeaders]);

  const loadInitialWorkspace = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchPosture(),
      fetchControlsCatalog(),
      fetchFindingsAndRemediation(),
      fetchEvidence(),
      fetchPiiCatalog(),
      fetchResidencyZones(),
      fetchPrivacyWorkspace(),
    ]);
    setLoading(false);
  }, [
    fetchPosture,
    fetchControlsCatalog,
    fetchFindingsAndRemediation,
    fetchEvidence,
    fetchPiiCatalog,
    fetchResidencyZones,
    fetchPrivacyWorkspace,
  ]);

  useEffect(() => {
    loadInitialWorkspace();
  }, [loadInitialWorkspace]);

  useEffect(() => {
    if (activeTab === 'frameworks' && selectedFramework) {
      fetchFrameworkDetail(selectedFramework);
    } else if (activeTab === 'governance') {
      fetchGovernanceWorkspace(nistBaselineFilter);
    } else if (activeTab === 'reports') {
      fetchAuditHistory();
    }
  }, [activeTab, selectedFramework, nistBaselineFilter, fetchFrameworkDetail, fetchGovernanceWorkspace, fetchAuditHistory]);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    await loadInitialWorkspace();
    if (activeTab === 'frameworks') await fetchFrameworkDetail(selectedFramework);
    if (activeTab === 'governance') await fetchGovernanceWorkspace(nistBaselineFilter);
    if (activeTab === 'reports') await fetchAuditHistory();
    setRefreshing(false);
    toast.success('Synchronized live compliance telemetry across 32 statutory frameworks.');
  };

  const handleEvaluateAll = async () => {
    if (isReadOnly) {
      toast.error('Read-only role cannot trigger compliance scans.');
      return;
    }
    setRunningAll(true);
    try {
      const res = await fetch(`${API_URL}/v2/compliance/evaluate-all`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPosture(data);
        await Promise.all([fetchFindingsAndRemediation(), fetchEvidence()]);
        toast.success(`Evaluated all ${data.total_frameworks} regulations (${data.overall_score}% technical posture).`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Global scan failed.');
      }
    } catch {
      toast.error('Network error triggering global compliance scan.');
    } finally {
      setRunningAll(false);
    }
  };

  const handleRunSingleFramework = async (fwId: string) => {
    if (isReadOnly) {
      toast.error('Read-only role cannot trigger framework scans.');
      return;
    }
    setRunningFramework(fwId);
    try {
      const res = await fetch(`${API_URL}/v2/compliance/frameworks/${fwId}/run`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        const job = await res.json();
        toast.success(`Queued async scan job ${job.job_id} for ${fwId}.`);
        setTimeout(async () => {
          await Promise.all([
            fetchPosture(),
            fetchFrameworkDetail(fwId),
            fetchFindingsAndRemediation(),
            fetchEvidence(),
          ]);
          setRunningFramework(null);
        }, 1200);
      } else {
        setRunningFramework(null);
        toast.error(`Failed to dispatch scan for ${fwId}.`);
      }
    } catch {
      setRunningFramework(null);
      toast.error(`Error scanning ${fwId}.`);
    }
  };

  const handleRemediateFinding = async (findingId: string) => {
    if (isReadOnly) {
      toast.error('Read-only role cannot execute remediation actions.');
      return;
    }
    setRemediatingId(findingId);
    try {
      const res = await fetch(`${API_URL}/v2/compliance/findings/${findingId}/remediate`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        toast.success(`Remediation recorded for finding ${findingId}; AuditLog updated.`);
        await Promise.all([fetchFindingsAndRemediation(), fetchPosture()]);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Remediation action failed.');
      }
    } catch {
      toast.error('Failed to execute remediation workflow.');
    } finally {
      setRemediatingId(null);
    }
  };

  const handleClassifyPii = async () => {
    if (!piiInput.trim()) return;
    setClassifyingPii(true);
    try {
      const res = await fetch(`${API_URL}/v2/compliance/pii`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          text_sample: piiInput,
          country: piiCountry === 'ALL' ? null : piiCountry,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPiiResults(data.detections || []);
        toast.success(`Detected ${data.count || 0} national PII entities.`);
      }
    } catch {
      toast.error('PII classification request failed.');
    } finally {
      setClassifyingPii(false);
    }
  };

  const handleSavePrivacyPreferences = async () => {
    if (isReadOnly) {
      toast.error('Read-only role cannot modify tenant privacy preferences.');
      return;
    }
    setSavingPrefs(true);
    try {
      const res = await fetch(`${API_URL}/v2/compliance/privacy-preferences`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          do_not_sell_share: doNotSell,
          limit_sensitive_personal_info: limitSensitive,
          global_privacy_control_honored: gpcHonored,
          cii_operator_designated: ciiDesignated,
        }),
      });
      if (res.ok) {
        toast.success('Persisted tenant privacy & CCPA/CPRA preferences to PostgreSQL.');
        await fetchPosture();
      } else {
        toast.error('Failed to save privacy preferences.');
      }
    } catch {
      toast.error('Error saving privacy preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleCreatePrivacyRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqEmail.trim()) return;
    try {
      const res = await fetch(`${API_URL}/v2/compliance/privacy-requests`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          data_subject_identifier: newReqEmail.trim(),
          right_type: newReqType,
          framework_id: newReqFw,
          notes: newReqNotes || `Submitted via Compliance Center (${newReqFw})`,
        }),
      });
      if (res.ok) {
        toast.success('Statutory privacy request logged and SLA timer started.');
        setShowReqModal(false);
        setNewReqEmail('');
        setNewReqNotes('');
        await fetchPrivacyWorkspace();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Failed to create privacy request.');
      }
    } catch {
      toast.error('Error submitting privacy request.');
    }
  };

  const handleUpdatePrivacyRequestStatus = async (reqId: string, newStatus: string) => {
    if (isReadOnly) {
      toast.error('Read-only role cannot update DSR status.');
      return;
    }
    try {
      const res = await fetch(
        `${API_URL}/v2/compliance/privacy-requests/${reqId}?status=${encodeURIComponent(newStatus)}`,
        { method: 'PATCH', headers: getHeaders() }
      );
      if (res.ok) {
        toast.success(`Updated ${reqId} to ${newStatus}.`);
        await fetchPrivacyWorkspace();
      }
    } catch {
      toast.error('Failed to update privacy request.');
    }
  };

  const handleCreateDslAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDslName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/v2/compliance/dsl-assets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          asset_name: newDslName.trim(),
          asset_type: 'DATABASE',
          dsl_tier: newDslTier,
          department: newDslDept,
          cross_border_export_approved: newDslExportApproved,
          security_assessment_completed: newDslTier !== 'GENERAL_DATA',
        }),
      });
      if (res.ok) {
        toast.success(`Registered China DSL ${newDslTier} asset.`);
        setNewDslName('');
        await fetchGovernanceWorkspace();
      } else {
        toast.error('Failed to register DSL asset.');
      }
    } catch {
      toast.error('Error registering DSL asset.');
    }
  };

  const handleEvaluateApplicability = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluatingApp(true);
    try {
      const countries = appCountries
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);
      const res = await fetch(`${API_URL}/v2/compliance/applicability`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          operating_countries: countries,
          data_subject_locations: countries,
          industry: appIndustry,
          employee_count: Number(appEmployees) || 100,
          processes_health_data: appHealthData,
          processes_financial_data: appFinancialData,
          is_publicly_traded: appPubliclyTraded,
          is_us_federal_contractor: appGovContractor,
          is_critical_infrastructure: appCiiOperator,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setApplicabilityResults(data.applicable_frameworks || []);
        toast.success(`Evaluated applicability across 32 statutory frameworks (${data.applicable_count || 0} triggered).`);
      }
    } catch {
      toast.error('Applicability evaluation failed.');
    } finally {
      setEvaluatingApp(false);
    }
  };

  const handleDownloadReport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const target = exportTargetFw || 'summary';
      const res = await fetch(
        `${API_URL}/v2/compliance/reports/${target}/export?format=${format}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) {
        toast.error('Report generation failed.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Monitorix_Compliance_${target}_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${format.toUpperCase()} assessment report.`);
    } catch {
      toast.error(`Error exporting ${format.toUpperCase()} report.`);
    }
  };

  const handleDownloadEvidenceZip = async (fw: string = 'GDPR') => {
    try {
      const res = await fetch(
        `${API_URL}/v2/compliance/evidence-packager?framework=${encodeURIComponent(fw)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) {
        toast.error('Failed to build signed ZIP evidence bundle.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Monitorix_Auditor_Evidence_${fw}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded signed SHA-256 auditor evidence bundle (.ZIP) for ${fw}.`);
    } catch {
      toast.error('Error downloading ZIP evidence bundle.');
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast.success('Copied SHA-256 evidence digest.');
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 65) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getPostureBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'EVIDENCE_BACKED_POSTURE' || s === 'PASS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> {status}
        </span>
      );
    }
    if (s === 'PARTIAL_TECHNICAL_POSTURE' || s === 'PARTIAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5" /> {status}
        </span>
      );
    }
    if (s === 'POTENTIAL_COMPLIANCE_GAP' || s === 'FAIL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <XCircle className="w-3.5 h-3.5" /> {status}
        </span>
      );
    }
    if (s === 'MANUAL_REVIEW_REQUIRED' || s === 'MANUAL_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
          <Clock className="w-3.5 h-3.5" /> {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/15 text-slate-300 border border-slate-500/30">
        {status || 'NOT_APPLICABLE'}
      </span>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const s = (severity || '').toUpperCase();
    if (s === 'CRITICAL') return <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL</span>;
    if (s === 'HIGH') return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">HIGH</span>;
    if (s === 'MEDIUM') return <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">MEDIUM</span>;
    return <span className="px-2 py-0.5 text-xs font-medium rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">LOW</span>;
  };

  const frameworks = posture?.frameworks || [];
  const uniqueRegions = Array.from(new Set(frameworks.map((f) => f.region))).sort();
  const uniqueCategories = Array.from(new Set(frameworks.map((f) => f.category))).sort();

  const filteredFrameworks = frameworks.filter((fw) => {
    const matchesRegion = regionFilter === 'ALL' || fw.region === regionFilter;
    const matchesCategory = categoryFilter === 'ALL' || fw.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      fw.name.toLowerCase().includes(q) ||
      fw.framework_id.toLowerCase().includes(q) ||
      fw.jurisdiction.toLowerCase().includes(q) ||
      (fw.regulatory_authority || '').toLowerCase().includes(q);
    return matchesRegion && matchesCategory && matchesSearch;
  });

  const filteredCatalogControls = controlsCatalog.filter((ctrl) => {
    const matchesSev = controlSeverityFilter === 'ALL' || ctrl.severity === controlSeverityFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      ctrl.control_id.toLowerCase().includes(q) ||
      ctrl.title.toLowerCase().includes(q) ||
      ctrl.framework_id.toLowerCase().includes(q) ||
      ctrl.legal_citation.toLowerCase().includes(q);
    return matchesSev && matchesSearch;
  });

  const navTabs: Array<{ id: TabKey; label: string; icon: any; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'frameworks', label: '32 Frameworks', icon: Scale, badge: posture?.total_frameworks },
    { id: 'controls', label: 'Controls', icon: Layers, badge: posture?.total_controls_assessed },
    { id: 'findings', label: 'Findings & Remediation', icon: ShieldAlert, badge: findingsList.length },
    { id: 'evidence', label: 'Evidence Ledger', icon: FileCheck, badge: evidenceList.length },
    { id: 'pii', label: '25-Country PII', icon: Fingerprint, badge: piiCountries.length },
    { id: 'residency', label: 'Data Residency', icon: Globe, badge: residencyZones.length },
    { id: 'privacy_requests', label: 'Privacy & CCPA', icon: UserX, badge: privacyRequests.length },
    { id: 'governance', label: 'Regulators, DSL & NIST', icon: Building2 },
    { id: 'applicability', label: 'Applicability', icon: CheckSquare },
    { id: 'reports', label: 'Audit & Reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                Global Compliance & Regulatory Governance Center
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  {posture ? `${posture.total_frameworks} Statutory Regulations` : 'Loading...'}
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Evidence-backed technical control verification, 25-country checksum PII classification, 10-region data residency & DSR orchestration
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            Sync Telemetry
          </button>

          <button
            onClick={handleEvaluateAll}
            disabled={runningAll || isReadOnly}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition"
          >
            <Play className={`w-4 h-4 ${runningAll ? 'animate-pulse' : ''}`} />
            {runningAll ? 'Evaluating 32 Frameworks...' : 'Run Global Assessment'}
          </button>
        </div>
      </div>

      {/* Mandatory Legal-Safety Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200/90">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Technical Control Posture Disclaimer: </span>
          {posture?.legal_disclaimer ||
            'Scores reflect automated technical security and privacy controls verified by Monitorix telemetry. Non-technical statutory, contractual, and regulator-filing obligations are marked MANUAL_REVIEW and require qualified legal counsel.'}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                active
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {typeof tab.badge === 'number' && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && !posture ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-medium">Evaluating live technical controls across 32 global regulations...</p>
        </div>
      ) : null}

      {/* ===================================================================== */}
      {/* TAB 1: OVERVIEW */}
      {/* ===================================================================== */}
      {activeTab === 'overview' && posture && (
        <div className="space-y-6">
          {/* KPI Cards — 100% Live API Derived */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Weighted Technical Posture</div>
              <div className={`text-3xl font-bold mt-1.5 ${getScoreColor(posture.overall_score)}`}>
                {posture.overall_score.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Tenant #{posture.tenant_id} • Severity-Weighted
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Controls Assessed</div>
              <div className="text-3xl font-bold mt-1.5 text-white">
                {posture.total_controls_assessed}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">
                {posture.total_passed_controls} Passed • {posture.total_partial_controls} Partial
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Evidence-Backed Frameworks</div>
              <div className="text-3xl font-bold mt-1.5 text-emerald-400">
                {posture.verified_posture_frameworks}
                <span className="text-base text-slate-500 font-normal"> / {posture.total_frameworks}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {posture.partial_posture_frameworks} Partial • {posture.gap_identified_frameworks} With Gaps
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Open Technical Findings</div>
              <div className="text-3xl font-bold mt-1.5 text-rose-400">
                {posture.open_findings_count}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {posture.critical_findings_count} Critical • {posture.high_findings_count} High
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Legal / Manual Reviews</div>
              <div className="text-3xl font-bold mt-1.5 text-purple-400">
                {posture.total_manual_reviews}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Excluded from automated score inflation
              </div>
            </div>
          </div>

          {/* Multi-Dimensional Score Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Category Posture Scores
              </h3>
              <div className="space-y-2.5">
                {Object.entries(posture.category_scores || {}).map(([cat, val]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{cat.replace(/_/g, ' ')}</span>
                      <span className={`font-semibold ${getScoreColor(val)}`}>{val.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, val)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Industry & Department Scores
              </h3>
              <div className="space-y-2">
                {Object.entries(posture.industry_scores || {}).map(([ind, val]) => (
                  <div key={ind} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">{ind}</span>
                    <span className={`font-semibold ${getScoreColor(val)}`}>{val.toFixed(1)}%</span>
                  </div>
                ))}
                {Object.entries(posture.department_scores || {}).slice(0, 4).map(([dept, val]) => (
                  <div key={dept} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Dept: {dept}</span>
                    <span className={`font-semibold ${getScoreColor(val)}`}>{val.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Jurisdiction Posture Snapshot
              </h3>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {Object.entries(posture.country_scores || {}).map(([cc, val]) => (
                  <div key={cc} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-950/70 border border-slate-800 text-xs">
                    <span className="font-mono text-slate-300">{cc}</span>
                    <span className={`font-semibold ${getScoreColor(val)}`}>{val.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 32 statutory regulations by name, ID, country, or regulator..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
            >
              <option value="ALL">All Jurisdictions ({uniqueRegions.length})</option>
              {uniqueRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
            >
              <option value="ALL">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 32-Regulation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFrameworks.map((fw) => (
              <div
                key={fw.framework_id}
                onClick={() => {
                  setSelectedFramework(fw.framework_id);
                  setActiveTab('frameworks');
                }}
                className="cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        {fw.region}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{fw.framework_id}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-white mt-1">{fw.name}</h4>
                    <p className="text-[11px] text-slate-400">{fw.jurisdiction} • {fw.version}</p>
                  </div>
                  <div className={`text-xl font-bold ${getScoreColor(fw.score)}`}>
                    {fw.score.toFixed(1)}%
                  </div>
                </div>

                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      fw.score >= 85 ? 'bg-emerald-500' : fw.score >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, fw.score)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>
                    Pass: <strong className="text-emerald-400">{fw.passed_controls}</strong> •
                    Part: <strong className="text-amber-400">{fw.partial_controls}</strong> •
                    Fail: <strong className="text-rose-400">{fw.failed_controls}</strong> •
                    Manual: <strong className="text-purple-300">{fw.manual_review_controls}</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/70">
                  {getPostureBadge(fw.status)}
                  <span className="text-[11px] text-indigo-400 font-medium">Inspect Controls →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: 32 FRAMEWORKS EXPLORER (LIVE EVALUATED CONTROLS) */}
      {/* ===================================================================== */}
      {activeTab === 'frameworks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-3 max-h-[750px] overflow-y-auto space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 py-1.5">
              32 Statutory Regulations
            </div>
            {frameworks.map((fw) => (
              <button
                key={fw.framework_id}
                onClick={() => setSelectedFramework(fw.framework_id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition flex items-center justify-between ${
                  selectedFramework === fw.framework_id
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                    : 'bg-slate-950/50 border-slate-800/60 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-semibold truncate">{fw.name}</div>
                  <div className="text-[11px] text-slate-400">{fw.region} • {fw.framework_id}</div>
                </div>
                <span className={`text-xs font-bold shrink-0 ${getScoreColor(fw.score)}`}>
                  {fw.score.toFixed(1)}%
                </span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 space-y-4">
            {loadingFwDetail ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-xl">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Evaluating live controls for {selectedFramework}...</p>
              </div>
            ) : selectedFwScore ? (
              <>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono">
                          {selectedFwScore.region}
                        </span>
                        {getPostureBadge(selectedFwScore.status)}
                      </div>
                      <h2 className="text-xl font-bold text-white mt-2">{selectedFwScore.name}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Version: {selectedFwScore.version} • Regulator: {selectedFwScore.regulatory_authority || selectedFwScore.jurisdiction}
                      </p>
                      {selectedFwScore.source_reference && (
                        <p className="text-xs text-slate-500 mt-1">{selectedFwScore.source_reference}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">Technical Score</div>
                        <div className={`text-3xl font-bold ${getScoreColor(selectedFwScore.score)}`}>
                          {selectedFwScore.score.toFixed(1)}%
                        </div>
                      </div>
                      <button
                        onClick={() => handleRunSingleFramework(selectedFwScore.framework_id)}
                        disabled={runningFramework === selectedFwScore.framework_id || isReadOnly}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {runningFramework === selectedFwScore.framework_id ? 'Scanning...' : 'Re-Evaluate'}
                      </button>
                      <button
                        onClick={() => handleDownloadEvidenceZip(selectedFwScore.framework_id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                      >
                        <Archive className="w-3.5 h-3.5 text-emerald-400" />
                        Evidence .ZIP
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
                    <div className="p-2 rounded bg-slate-950/60">
                      <div className="text-slate-400">Total</div>
                      <div className="font-bold text-white text-sm">{selectedFwScore.total_controls}</div>
                    </div>
                    <div className="p-2 rounded bg-emerald-500/10">
                      <div className="text-emerald-300">PASS</div>
                      <div className="font-bold text-emerald-400 text-sm">{selectedFwScore.passed_controls}</div>
                    </div>
                    <div className="p-2 rounded bg-amber-500/10">
                      <div className="text-amber-300">PARTIAL</div>
                      <div className="font-bold text-amber-400 text-sm">{selectedFwScore.partial_controls}</div>
                    </div>
                    <div className="p-2 rounded bg-rose-500/10">
                      <div className="text-rose-300">FAIL</div>
                      <div className="font-bold text-rose-400 text-sm">{selectedFwScore.failed_controls}</div>
                    </div>
                    <div className="p-2 rounded bg-purple-500/10">
                      <div className="text-purple-300">MANUAL</div>
                      <div className="font-bold text-purple-300 text-sm">{selectedFwScore.manual_review_controls}</div>
                    </div>
                  </div>
                </div>

                {/* Live Evaluated Controls Table */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Control ID</th>
                        <th className="px-4 py-3">Technical Check & Statutory Citation</th>
                        <th className="px-4 py-3">Severity</th>
                        <th className="px-4 py-3">Live Status</th>
                        <th className="px-4 py-3">SHA-256 Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {selectedFwControls.map((ctrl) => {
                        const evHash = ctrl.evidence?.[0]?.evidence_hash || '';
                        return (
                          <tr key={ctrl.control_id} className="hover:bg-slate-800/40">
                            <td className="px-4 py-3 font-mono font-semibold text-indigo-300 whitespace-nowrap">
                              {ctrl.control_id}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-200">{ctrl.check_name}</div>
                              <div className="text-[11px] text-slate-400">{ctrl.legal_reference}</div>
                              {ctrl.finding && (
                                <div className="text-[11px] text-amber-300 mt-1">
                                  Finding: {ctrl.finding.title}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">{getSeverityBadge(ctrl.severity)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{getPostureBadge(ctrl.status)}</td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              {evHash ? (
                                <button
                                  onClick={() => copyHash(evHash)}
                                  className="flex items-center gap-1 hover:text-indigo-300"
                                >
                                  {evHash.slice(0, 12)}...
                                  <Copy className="w-3 h-3" />
                                </button>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: CONTROLS CATALOG */}
      {/* ===================================================================== */}
      {activeTab === 'controls' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 322 statutory controls by ID, title, framework, or legal article..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
              />
            </div>
            <select
              value={controlSeverityFilter}
              onChange={(e) => setControlSeverityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
            >
              <option value="ALL">All Severities ({controlsCatalog.length})</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Framework</th>
                  <th className="px-4 py-3">Control ID</th>
                  <th className="px-4 py-3">Control Title & Requirement</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredCatalogControls.slice(0, 150).map((c) => (
                  <tr key={`${c.framework_id}-${c.control_id}`} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono text-indigo-300">{c.framework_id}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-200">{c.control_id}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-white">{c.title}</div>
                      <div className="text-[11px] text-slate-400">{c.legal_citation} — {c.description}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{c.category}</td>
                    <td className="px-4 py-2.5">{getSeverityBadge(c.severity)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        c.automated ? 'bg-emerald-500/15 text-emerald-300' : 'bg-purple-500/15 text-purple-300'
                      }`}>
                        {c.automated ? 'AUTOMATED' : 'MANUAL_LEGAL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: FINDINGS & REMEDIATION */}
      {/* ===================================================================== */}
      {activeTab === 'findings' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-indigo-400" />
              Open Technical & Statutory Findings ({findingsList.length})
            </h3>
            {findingsList.length === 0 ? (
              <p className="text-sm text-emerald-400">Zero open compliance findings across evaluated controls.</p>
            ) : (
              <div className="space-y-3">
                {findingsList.map((f) => {
                  const fid = f.finding_id || f.id;
                  return (
                    <div key={fid} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(f.severity)}
                          <span className="font-mono text-xs text-indigo-300">{f.framework_id}</span>
                          <span className="font-mono text-xs text-slate-400">{f.control_id}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{f.status}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white">{f.title}</h4>
                        <p className="text-xs text-slate-400">{f.description}</p>
                        {f.recommendation && (
                          <p className="text-xs text-emerald-300/90 pt-1">
                            <strong>Recommended Action:</strong> {f.recommendation}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemediateFinding(fid)}
                        disabled={remediatingId === fid || isReadOnly}
                        className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        {remediatingId === fid ? 'Applying...' : 'Mark / Apply Remediation'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {remediationPlan.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
                Prioritized Remediation Roadmap ({remediationPlan.length} Ranked Actions)
              </h3>
              <div className="divide-y divide-slate-800 text-xs">
                {remediationPlan.slice(0, 20).map((r) => (
                  <div key={r.finding_id} className="py-2.5 flex items-center justify-between gap-4">
                    <div>
                      <span className="font-mono text-indigo-400 mr-2">#{r.priority_rank}</span>
                      <span className="font-semibold text-white">[{r.framework_id} / {r.control_id}]</span>{' '}
                      <span className="text-slate-300">{r.recommended_action}</span>
                    </div>
                    {getSeverityBadge(r.severity)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: CRYPTOGRAPHIC EVIDENCE LEDGER */}
      {/* ===================================================================== */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div>
              <h3 className="text-base font-bold text-white">Tamper-Evident SHA-256 Evidence Ledger</h3>
              <p className="text-xs text-slate-400">
                Cryptographic digests anchored per tenant from Monitorix AuditLog, DLP, DSPM, and Federation telemetry
              </p>
            </div>
            <button
              onClick={() => handleDownloadEvidenceZip('GLOBAL')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              <Archive className="w-4 h-4" />
              Download Signed Global Evidence Bundle (.ZIP)
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Evidence ID</th>
                  <th className="px-4 py-3">Framework / Control</th>
                  <th className="px-4 py-3">Source Service</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">SHA-256 Digest</th>
                  <th className="px-4 py-3">Collected (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {evidenceList.slice(0, 120).map((ev) => (
                  <tr key={ev.evidence_id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono text-slate-300">{ev.evidence_id.slice(0, 14)}</td>
                    <td className="px-4 py-2.5 font-mono text-indigo-300">{ev.framework_id} • {ev.control_id}</td>
                    <td className="px-4 py-2.5 text-slate-300">{ev.source}</td>
                    <td className="px-4 py-2.5 text-slate-300 max-w-md truncate">{ev.summary}</td>
                    <td className="px-4 py-2.5 font-mono text-emerald-400">
                      <button
                        onClick={() => copyHash(ev.sha256_hash)}
                        className="flex items-center gap-1.5 hover:underline"
                      >
                        {ev.sha256_hash.slice(0, 16)}...
                        {copiedHash === ev.sha256_hash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">{ev.collected_at?.slice(0, 19).replace('T', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: 25-COUNTRY PII CLASSIFIERS & LIVE CHECKSUM SCANNER */}
      {/* ===================================================================== */}
      {activeTab === 'pii' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-indigo-400" />
                  Context-Aware National PII Scanner ({piiCountries.length} Jurisdictions, {piiCatalog.length} Identifiers)
                </h3>
                <p className="text-xs text-slate-400">
                  Validates Verhoeff, Luhn, Modulo-11, EAN-13, Turkish 2-step Mod-10/11, Singapore NRIC, and negative invoice/timestamp suppression
                </p>
              </div>
              <select
                value={piiCountry}
                onChange={(e) => setPiiCountry(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200"
              >
                <option value="ALL">All {piiCountries.length} Countries (Global Scan)</option>
                {piiCountries.map((cc) => (
                  <option key={cc} value={cc}>Country: {cc}</option>
                ))}
              </select>
            </div>

            <textarea
              rows={3}
              value={piiInput}
              onChange={(e) => setPiiInput(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end">
              <button
                onClick={handleClassifyPii}
                disabled={classifyingPii}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <Fingerprint className="w-4 h-4" />
                {classifyingPii ? 'Scanning...' : 'Scan Text for National PII'}
              </button>
            </div>

            {piiResults.length > 0 && (
              <div className="border-t border-slate-800 pt-4">
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">
                  Live Detections ({piiResults.length}) — Automatically Masked
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {piiResults.map((det, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                            {det.country_code || det.country}
                          </span>
                          {det.name || det.identifier}
                        </div>
                        <div className="font-mono text-emerald-400 mt-1">
                          Masked Value: {det.masked_match || det.masked_value}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div>{getSeverityBadge(det.severity || 'HIGH')}</div>
                        <div className="text-[10px] text-slate-400">
                          Confidence: <strong className="text-white">{det.confidence_level || det.confidence}</strong> •{' '}
                          {det.checksum_passed ? 'Checksum OK' : 'Pattern+Context'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 25-Country Classifier Catalog */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
              Registered National PII Classifiers ({piiCatalog.length})
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Country</th>
                    <th className="px-4 py-2.5">Identifier</th>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Checksum / Validator</th>
                    <th className="px-4 py-2.5">Mapped Regulations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {piiCatalog.map((c) => (
                    <tr key={c.classifier_id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-2 font-mono font-bold text-indigo-300">{c.country}</td>
                      <td className="px-4 py-2 font-mono text-slate-300">{c.identifier}</td>
                      <td className="px-4 py-2 text-white">{c.name}</td>
                      <td className="px-4 py-2 font-mono text-emerald-400">{c.checksum_validator}</td>
                      <td className="px-4 py-2 text-slate-400">{(c.regulations || []).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: 10-REGION SOVEREIGN DATA RESIDENCY */}
      {/* ===================================================================== */}
      {activeTab === 'residency' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {residencyZones.map((z) => (
            <div key={z.region_code} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-xs">
                    {z.region_code}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">{z.name}</h4>
                  <p className="text-xs text-slate-400">{z.jurisdiction} • Vault: {z.primary_vault}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {z.sovereignty_status}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800">
                <div><strong>Transfer Mechanism:</strong> {z.cross_border_transfer_mechanism}</div>
                <div><strong>Encryption:</strong> {z.encryption_at_rest} / {z.encryption_in_transit}</div>
                <div><strong>Telemetry Fencing:</strong> {z.cross_border_telemetry_fenced ? 'Enforced (Zero Unauthorized Egress)' : 'Standard'} • Retention: {z.default_retention_days} days</div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(z.applicable_frameworks || []).map((fw) => (
                  <span key={fw} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 8: PRIVACY REQUESTS (DSR / ARCO) & CCPA PREFERENCES */}
      {/* ===================================================================== */}
      {activeTab === 'privacy_requests' && (
        <div className="space-y-6">
          {/* Persistent CCPA / CPRA & Governance Preferences */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                  Privacy Governance & CCPA / CPRA Preferences (PostgreSQL Persisted)
                </h3>
                <p className="text-xs text-slate-400">
                  Controls evaluated directly by CCPA_CPRA, CHINA_CSL, GDPR, and LGPD technical checks
                </p>
              </div>
              <button
                onClick={handleSavePrivacyPreferences}
                disabled={savingPrefs || isReadOnly}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {savingPrefs ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <span>Do Not Sell or Share Personal Info (§1798.120)</span>
                <input type="checkbox" checked={doNotSell} onChange={(e) => setDoNotSell(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <span>Limit Use of Sensitive Personal Info (§1798.121)</span>
                <input type="checkbox" checked={limitSensitive} onChange={(e) => setLimitSensitive(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <span>Honor Global Privacy Control (GPC) Signal</span>
                <input type="checkbox" checked={gpcHonored} onChange={(e) => setGpcHonored(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <span>Designated Critical Info Infrastructure (CIIO)</span>
                <input type="checkbox" checked={ciiDesignated} onChange={(e) => setCiiDesignated(e.target.checked)} />
              </label>
            </div>
          </div>

          {/* DSR / ARCO Queue */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Data Subject / Principal / Consumer Rights Queue ({privacyRequests.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Supports GDPR DSR, India DPDP Data Principal, CCPA Consumer, and LATAM ARCO (Mexico/Argentina/Chile/Colombia) workflows
                </p>
              </div>
              <button
                onClick={() => setShowReqModal(!showReqModal)}
                disabled={isReadOnly}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                + Log Privacy Request
              </button>
            </div>

            {showReqModal && (
              <form onSubmit={handleCreatePrivacyRequest} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <input
                  type="text"
                  required
                  value={newReqEmail}
                  onChange={(e) => setNewReqEmail(e.target.value)}
                  placeholder="Subject email or principal ID..."
                  className="px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white"
                />
                <select
                  value={newReqType}
                  onChange={(e) => setNewReqType(e.target.value)}
                  className="px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="ACCESS">ACCESS</option>
                  <option value="DELETE">DELETE / ERASURE</option>
                  <option value="RECTIFY">RECTIFY / CORRECT</option>
                  <option value="PORTABILITY">PORTABILITY</option>
                  <option value="RESTRICT">RESTRICT</option>
                  <option value="OBJECT">OBJECT / OPOSICIÓN (ARCO)</option>
                  <option value="OPT_OUT">OPT_OUT</option>
                  <option value="DO_NOT_SELL_SHARE">DO_NOT_SELL_SHARE (CCPA)</option>
                  <option value="LIMIT_SENSITIVE_DATA">LIMIT_SENSITIVE_DATA (CPRA)</option>
                </select>
                <select
                  value={newReqFw}
                  onChange={(e) => setNewReqFw(e.target.value)}
                  className="px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white"
                >
                  {frameworks.map((f) => (
                    <option key={f.framework_id} value={f.framework_id}>{f.framework_id} — {f.name}</option>
                  ))}
                </select>
                <button type="submit" className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
                  Submit Request
                </button>
              </form>
            )}

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Request ID</th>
                  <th className="px-4 py-2.5">Masked Subject</th>
                  <th className="px-4 py-2.5">Right Type</th>
                  <th className="px-4 py-2.5">Framework</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Statutory SLA Due</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {privacyRequests.map((r) => {
                  const rid = r.request_id || r.id;
                  return (
                    <tr key={rid} className="hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-mono text-indigo-300">{rid}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-300">{r.data_subject_identifier}</td>
                      <td className="px-4 py-2.5 font-semibold text-white">{r.right_type}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-300">{r.framework_id}</td>
                      <td className="px-4 py-2.5">{getPostureBadge(r.status)}</td>
                      <td className="px-4 py-2.5 text-slate-400">{r.sla_due_at?.slice(0, 10)}</td>
                      <td className="px-4 py-2.5 space-x-2">
                        {r.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleUpdatePrivacyRequestStatus(rid, 'COMPLETED')}
                            disabled={isReadOnly}
                            className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30"
                          >
                            Fulfill
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 9: REGULATORY REPORTING, CHINA DSL 3-TIER & NIST 800-53 MATRIX */}
      {/* ===================================================================== */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          {/* Statutory Regulator Breach Reporting Matrix */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Statutory Supervisory Authority Breach & Registry Workflows
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {STATUTORY_REGULATOR_WORKFLOWS.map((w) => (
                <div key={w.authority} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{w.authority}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono text-[11px]">
                      SLA: {w.deadline}
                    </span>
                  </div>
                  <p className="text-slate-400">{w.scope}</p>
                  <div className="text-[11px] text-indigo-400 font-mono">{w.portal}</div>
                </div>
              ))}
            </div>
          </div>

          {/* China Data Security Law (DSL) 3-Tier Asset Classification Catalog */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">
                China Data Security Law (DSL Art. 21) — 3-Tier Data Classification Catalog ({dslAssets.length})
              </h3>
              <p className="text-xs text-slate-400">
                Classifies data assets into GENERAL_DATA, IMPORTANT_DATA, and CORE_DATA; live-evaluated by run_china_dsl_checks()
              </p>
            </div>

            <form onSubmit={handleCreateDslAsset} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <input
                type="text"
                required
                value={newDslName}
                onChange={(e) => setNewDslName(e.target.value)}
                placeholder="Data asset name (e.g., CN Telemetry Lake)..."
                className="px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
              />
              <select
                value={newDslTier}
                onChange={(e) => setNewDslTier(e.target.value)}
                className="px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
              >
                <option value="GENERAL_DATA">GENERAL_DATA (Tier 1)</option>
                <option value="IMPORTANT_DATA">IMPORTANT_DATA (Tier 2)</option>
                <option value="CORE_DATA">CORE_DATA (Tier 3 — National Core)</option>
              </select>
              <input
                type="text"
                value={newDslDept}
                onChange={(e) => setNewDslDept(e.target.value)}
                placeholder="Department"
                className="px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
              />
              <label className="flex items-center gap-2 px-3 py-2 rounded bg-slate-950 border border-slate-700 text-slate-300">
                <input
                  type="checkbox"
                  checked={newDslExportApproved}
                  onChange={(e) => setNewDslExportApproved(e.target.checked)}
                />
                CAC Export Approved
              </label>
              <button
                type="submit"
                disabled={isReadOnly}
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold"
              >
                Register DSL Asset
              </button>
            </form>

            {dslAssets.length > 0 && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2">Asset Name</th>
                    <th className="px-4 py-2">DSL Statutory Tier</th>
                    <th className="px-4 py-2">Department</th>
                    <th className="px-4 py-2">CAC Export Approved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {dslAssets.map((a) => (
                    <tr key={a.asset_id}>
                      <td className="px-4 py-2 font-medium text-white">{a.asset_name}</td>
                      <td className="px-4 py-2 font-mono text-amber-300">{a.dsl_tier}</td>
                      <td className="px-4 py-2 text-slate-300">{a.department}</td>
                      <td className="px-4 py-2 text-slate-300">{a.cross_border_export_approved ? 'Yes' : 'Localized Only'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* USA FISMA / NIST SP 800-53 Rev. 5 20-Family Matrix */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  USA FISMA / NIST SP 800-53 Rev. 5 — 20 Control Families ({nistFamilies.length})
                </h3>
                <p className="text-xs text-slate-400">
                  FIPS 199 / FIPS 200 Low, Moderate, and High impact baseline mapping
                </p>
              </div>
              <select
                value={nistBaselineFilter}
                onChange={(e) => setNistBaselineFilter(e.target.value)}
                className="px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <option value="ALL">All 20 Families</option>
                <option value="LOW">FIPS 199 LOW Baseline</option>
                <option value="MODERATE">FIPS 199 MODERATE Baseline</option>
                <option value="HIGH">FIPS 199 HIGH Baseline</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {nistFamilies.map((f) => (
                <div key={f.family_code} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-400">{f.family_code}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{f.minimum_baseline}</span>
                  </div>
                  <div className="font-semibold text-white">{f.family_name}</div>
                  <div className="text-[11px] text-slate-400">Controls: {(f.representative_nist_controls || []).join(', ')}</div>
                  <div className="text-[10px] text-emerald-400 font-mono truncate">{f.monitorix_telemetry_source}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 10: REGULATORY APPLICABILITY ENGINE */}
      {/* ===================================================================== */}
      {activeTab === 'applicability' && (
        <div className="space-y-6">
          <form onSubmit={handleEvaluateApplicability} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">
              32-Regulation Technical Applicability Scoping Engine
            </h3>
            <p className="text-slate-400">
              Evaluates operating jurisdictions, subject locations, sector, and sensitive data classes to scope relevant statutory frameworks (advisory scoping only; not legal counsel).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Operating / Subject ISO Countries (comma-separated)</label>
                <input
                  type="text"
                  value={appCountries}
                  onChange={(e) => setAppCountries(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Primary Industry Sector</label>
                <select
                  value={appIndustry}
                  onChange={(e) => setAppIndustry(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="TECHNOLOGY">TECHNOLOGY / SAAS</option>
                  <option value="FINANCE">FINANCE / BANKING</option>
                  <option value="HEALTHCARE">HEALTHCARE / LIFE SCIENCES</option>
                  <option value="GOVERNMENT">GOVERNMENT / PUBLIC SECTOR</option>
                  <option value="RETAIL">RETAIL / E-COMMERCE</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Employee Headcount</label>
                <input
                  type="number"
                  value={appEmployees}
                  onChange={(e) => setAppEmployees(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-800">
                <input type="checkbox" checked={appHealthData} onChange={(e) => setAppHealthData(e.target.checked)} />
                Health / PHI Data
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-800">
                <input type="checkbox" checked={appFinancialData} onChange={(e) => setAppFinancialData(e.target.checked)} />
                Financial / NPI Data
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-800">
                <input type="checkbox" checked={appPubliclyTraded} onChange={(e) => setAppPubliclyTraded(e.target.checked)} />
                Publicly Traded (SOX)
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-800">
                <input type="checkbox" checked={appGovContractor} onChange={(e) => setAppGovContractor(e.target.checked)} />
                US Federal / FISMA
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-800">
                <input type="checkbox" checked={appCiiOperator} onChange={(e) => setAppCiiOperator(e.target.checked)} />
                Critical Infra (CII)
              </label>
            </div>

            <button
              type="submit"
              disabled={evaluatingApp}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
            >
              {evaluatingApp ? 'Evaluating...' : 'Evaluate 32-Regulation Applicability'}
            </button>
          </form>

          {applicabilityResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {applicabilityResults.map((m) => (
                <div key={m.framework_id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{m.name} ({m.framework_id})</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono">
                      {m.confidence}
                    </span>
                  </div>
                  <div className="text-slate-300">Triggers: {(m.triggers || []).join(' • ')}</div>
                  <div className="text-[11px] text-slate-500">{m.legal_note}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 11: AUDIT HISTORY & EXPORTABLE REPORTS (PDF 1.4, CSV, JSON, ZIP) */}
      {/* ===================================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              Auditor-Ready Compliance Assessment Exports
            </h3>
            <p className="text-xs text-slate-400">
              Generate standards-compliant %PDF-1.4 executive reports, CSV control matrices, JSON machine bundles, and SHA-256 signed .ZIP auditor packages
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={exportTargetFw}
                onChange={(e) => setExportTargetFw(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <option value="summary">Global 32-Regulation Executive Summary</option>
                {frameworks.map((f) => (
                  <option key={f.framework_id} value={f.framework_id}>
                    {f.framework_id} — {f.name} ({f.score.toFixed(1)}%)
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleDownloadReport('pdf')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                <Download className="w-4 h-4" /> Export PDF 1.4 Report
              </button>

              <button
                onClick={() => handleDownloadReport('csv')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export CSV Matrix
              </button>

              <button
                onClick={() => handleDownloadReport('json')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <FileText className="w-4 h-4" /> Export JSON Package
              </button>

              <button
                onClick={() => handleDownloadEvidenceZip(exportTargetFw === 'summary' ? 'GLOBAL' : exportTargetFw)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold"
              >
                <Archive className="w-4 h-4 text-emerald-400" /> Signed Evidence .ZIP
              </button>
            </div>
          </div>

          {/* Immutable Compliance Scan & Mutation Audit History */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
              Immutable Compliance Audit Trail (PostgreSQL AuditLog — {auditHistory.length} Recent Events)
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Timestamp (UTC)</th>
                  <th className="px-4 py-2.5">Actor</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Target</th>
                  <th className="px-4 py-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {auditHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2 font-mono text-slate-400">{h.timestamp?.slice(0, 19).replace('T', ' ')}</td>
                    <td className="px-4 py-2 text-slate-200">{h.actor}</td>
                    <td className="px-4 py-2 font-mono text-indigo-300">{h.action}</td>
                    <td className="px-4 py-2 font-mono text-emerald-400">{h.target}</td>
                    <td className="px-4 py-2 text-slate-400 font-mono truncate max-w-md">
                      {JSON.stringify(h.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
