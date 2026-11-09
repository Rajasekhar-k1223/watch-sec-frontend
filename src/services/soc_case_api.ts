/**
 * Monitorix Enterprise SOC Case Management API Client
 * ====================================================
 * Typed interface for Module 08 SOC Case Lifecycle APIs.
 */

import { API_URL } from '../config';
import { apiFetch } from './api';

export type SocCaseStatus = 'NEW' | 'TRIAGED' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
export type SocCaseSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type SocCasePriority = 'P1' | 'P2' | 'P3' | 'P4';

export interface MitreMapItem {
    tactic?: string;
    technique?: string;
    category?: string;
    [key: string]: unknown;
}

export interface SocCaseEvidenceItem {
    type: string;
    agent_id?: string;
    hostname?: string;
    alert_id?: number;
    promoted_alert_id?: number;
    matched_content?: string;
    rule_id?: number;
    rule_name?: string;
    timestamp?: string;
    reason?: string;
    safe_mode?: boolean;
    executed_by?: string;
    [key: string]: unknown;
}

export interface SocCaseComment {
    id: number;
    case_id: number;
    incident_id?: number | null;
    tenant_id: number;
    author_username: string;
    author_role?: string;
    is_customer_visible: boolean;
    comment_text: string;
    attachments: string[];
    created_at: string;
}

export interface SocCaseItem {
    id: number;
    case_id: number;
    case_number: string;
    tenant_id: number;
    incident_id?: number | null;
    title: string;
    description?: string;
    severity: SocCaseSeverity;
    priority: SocCasePriority;
    status: SocCaseStatus;
    lead_analyst?: string | null;
    assigned_team?: string | null;
    subtasks: Record<string, unknown>[];
    investigation_notes?: string | null;
    evidence: SocCaseEvidenceItem[];
    mitre_map: MitreMapItem[];
    customer_visible_notes?: string | null;
    internal_notes?: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
    closed_at?: string | null;
    comment_count: number;
    comments?: SocCaseComment[];
}

export interface ListCasesFilter {
    status?: string;
    severity?: string;
    priority?: string;
    lead_analyst?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface CreateCasePayload {
    title: string;
    description?: string;
    severity?: SocCaseSeverity;
    priority?: SocCasePriority;
    lead_analyst?: string;
    assigned_team?: string;
    tags?: string[];
    evidence?: Record<string, unknown>[];
    incident_id?: number;
}

export interface UpdateStatusPayload {
    status: SocCaseStatus;
    notes?: string;
    closure_summary?: string;
    root_cause?: string;
}

export interface AssignCasePayload {
    lead_analyst: string;
    assigned_team?: string;
}

export interface AddCommentPayload {
    comment_text: string;
    is_customer_visible?: boolean;
    attachments?: string[];
}

export interface PromoteAlertPayload {
    alert_id: number;
    title?: string;
    priority?: SocCasePriority;
    notes?: string;
}

export interface ContainHostPayload {
    agent_id: string;
    confirmed: boolean;
    safe_mode?: boolean;
    reason: string;
}

export interface ContainHostResponse {
    status: string;
    mode: string;
    safe_mode: boolean;
    message: string;
    is_isolated: boolean;
    case_id: number;
    case_number: string;
    case_status: string;
    agent_id: string;
    action_taken?: string;
}

// ---------------------------------------------------------------------------
// Documented State Machine
// ---------------------------------------------------------------------------
export const VALID_CASE_TRANSITIONS: Record<SocCaseStatus, SocCaseStatus[]> = {
    NEW: ['TRIAGED', 'CLOSED'],
    TRIAGED: ['CONTAINED', 'RESOLVED', 'CLOSED'],
    CONTAINED: ['RESOLVED', 'TRIAGED'],
    RESOLVED: ['CLOSED', 'TRIAGED'],
    CLOSED: ['TRIAGED'] // Re-open permitted
};

export function getPermittedTransitions(currentStatus: SocCaseStatus): SocCaseStatus[] {
    return VALID_CASE_TRANSITIONS[currentStatus] || [];
}

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------

export async function fetchSocCases(filter: ListCasesFilter = {}): Promise<SocCaseItem[]> {
    const params = new URLSearchParams();
    if (filter.status && filter.status !== 'All') params.set('status', filter.status);
    if (filter.severity && filter.severity !== 'All') params.set('severity', filter.severity);
    if (filter.priority && filter.priority !== 'All') params.set('priority', filter.priority);
    if (filter.lead_analyst) params.set('lead_analyst', filter.lead_analyst);
    if (filter.search?.trim()) params.set('search', filter.search.trim());
    if (filter.limit) params.set('limit', String(filter.limit));
    if (filter.offset) params.set('offset', String(filter.offset));

    const qs = params.toString();
    const url = `${API_URL}/v2/soc/cases${qs ? `?${qs}` : ''}`;
    const res = await apiFetch(url);

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch cases (HTTP ${res.status})`);
    }

    return await res.json();
}

export async function fetchSocCaseDetail(caseId: number): Promise<SocCaseItem> {
    const res = await apiFetch(`${API_URL}/v2/soc/cases/${caseId}`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch case #${caseId} (HTTP ${res.status})`);
    }
    return await res.json();
}

export async function createSocCase(payload: CreateCasePayload): Promise<SocCaseItem> {
    const res = await apiFetch(`${API_URL}/v2/soc/cases`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to create SOC case (HTTP ${res.status})`);
    }

    return await res.json();
}

export async function updateSocCaseStatus(caseId: number, payload: UpdateStatusPayload): Promise<SocCaseItem> {
    const res = await apiFetch(`${API_URL}/v2/soc/cases/${caseId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to update case status (HTTP ${res.status})`);
    }

    return await res.json();
}

export async function assignSocCase(caseId: number, payload: AssignCasePayload): Promise<SocCaseItem> {
    const res = await apiFetch(`${API_URL}/v2/soc/cases/${caseId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to assign case (HTTP ${res.status})`);
    }

    return await res.json();
}

export async function fetchSocCaseComments(caseId: number): Promise<SocCaseComment[]> {
    const res = await apiFetch(`${API_URL}/v2/soc/cases/${caseId}/comments`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch comments (HTTP ${res.status})`);
    }
    return await res.json();
}

export async function addSocCaseComment(caseId: number, payload: AddCommentPayload): Promise<SocCaseComment> {
    const res = await apiFetch(`${API_URL}/v2/soc/cases/${caseId}/comments`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to add comment (HTTP ${res.status})`);
    }

    return await res.json();
}

export async function addSocCaseEvidence(caseId: number, evidence: Record<string, unknown>[]): Promise<SocCaseItem> {
    const res = await apiFetch(`${API_URL}/v2/soc/cases/${caseId}/evidence`, {
        method: 'POST',
        body: JSON.stringify({ evidence })
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to attach evidence (HTTP ${res.status})`);
    }

    return await res.json();
}

export interface DuplicateAlertError extends Error {
    isDuplicate: boolean;
    statusCode: number;
}

export async function promoteAlertToSocCase(payload: PromoteAlertPayload): Promise<SocCaseItem> {
    const res = await apiFetch(`${API_URL}/v2/soc/cases/promote-alert`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    if (res.status === 409) {
        const errorData = await res.json().catch(() => ({}));
        const err = new Error(errorData.detail || 'This detection alert has already been promoted to a SOC case.') as DuplicateAlertError;
        err.isDuplicate = true;
        err.statusCode = 409;
        throw err;
    }

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to promote alert (HTTP ${res.status})`);
    }

    return await res.json();
}

export async function containHostSafely(caseId: number, payload: ContainHostPayload): Promise<ContainHostResponse> {
    const res = await apiFetch(`${API_URL}/v2/soc/cases/${caseId}/contain-host`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Host containment failed (HTTP ${res.status})`);
    }

    return await res.json();
}
