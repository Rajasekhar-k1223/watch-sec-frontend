import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { I18nProvider } from './contexts/I18nContext';
import DashboardLayout from './layouts/DashboardLayout';
import LiveMonitor from './pages/LiveMonitor';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Admin from './pages/Admin';
import Agents from './pages/Agents';
import LocationMap from './pages/LocationMap';
import SystemAudit from './pages/SystemAudit';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CentralServer from './pages/CentralServer';
import MailProcessing from './pages/MailProcessing';
import IcapServer from './pages/IcapServer';
import ImageRecognition from './pages/ImageRecognition';
import SpeechRecognition from './pages/SpeechRecognition';
import Vulnerabilities from './pages/Vulnerabilities';
import FleetInventory from './pages/FleetInventory';
import Login from './pages/Login';
import Policies from './pages/Policies';
import Reports from './pages/Reports';
import Productivity from './pages/Productivity';
import EmployeePulse from './pages/EmployeePulse';
import HumanIntelligence from './pages/HumanIntelligence';
import Register from './pages/Register';
import Landing from './pages/Landing';
import NetworkAnalytics from './pages/NetworkAnalytics';
import Architecture from './pages/Architecture';
import AiCopilot from './pages/AiCopilot';
import SoftwareRequests from './pages/SoftwareRequests';
import YaraScanner from './pages/YaraScanner';
import ThreatHunting from './pages/ThreatHunting';
import RansomwareDashboard from './pages/RansomwareDashboard';
import ZeroTrustDashboard from './pages/ZeroTrustDashboard';
import BandwidthSettings from './pages/BandwidthSettings';
import AgentlessDashboard from './pages/AgentlessDashboard';
import SoarPlaybooks from './pages/SoarPlaybooks';
import ForensicsDashboard from './pages/ForensicsDashboard';
import DetectionAlerts from './pages/DetectionAlerts';
import SandboxDashboard from './pages/SandboxDashboard';
import Incidents from './pages/Incidents';
import ThreatIntelligence from './pages/ThreatIntelligence';
import SecurityLogs from './pages/SecurityLogs';
import UebaIdentity from './pages/UebaIdentity';
import XdrConnectors from './pages/XdrConnectors';
import SecurityGraph from './pages/SecurityGraph';
import CorrelationChains from './pages/CorrelationChains';
import DlpDashboard from './pages/DlpDashboard';
import EmailForensics from './pages/EmailForensics';
import AuditTrail from './pages/AuditTrail';
import PerformanceAnalytics from './pages/PerformanceAnalytics';
import ExecutiveIntelligence from './pages/ExecutiveIntelligence';
import RuntimeScope from './pages/RuntimeScope';
import PlatformStatus from './pages/PlatformStatus';
import CyberRange from './pages/CyberRange';
import ReleaseGate from './pages/ReleaseGate';
import SocCommandCenter from './pages/SocCommandCenter';
import AdvancedIncidentWorkspace from './pages/AdvancedIncidentWorkspace';
import AnalystWorkQueue from './pages/AnalystWorkQueue';
import MdrOperationsDashboard from './pages/MdrOperationsDashboard';
import CustomerSecurityPortal from './pages/CustomerSecurityPortal';
import GlobalOperations from './pages/GlobalOperations';
import AdminOrganizations from './pages/AdminOrganizations';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminUsage from './pages/AdminUsage';
import AdminRegions from './pages/AdminRegions';
import AdminQuotas from './pages/AdminQuotas';
import Marketplace from './pages/Marketplace';
import IntegrationHealth from './pages/IntegrationHealth';
import DeveloperPortal from './pages/DeveloperPortal';
import CustomerSuccess from './pages/CustomerSuccess';
import CommercialAnalytics from './pages/CommercialAnalytics';
import GlobalPlatform from './pages/GlobalPlatform';
import AutonomousSecurity from './pages/AutonomousSecurity';
import GlobalThreatIntelligence from './pages/GlobalThreatIntelligence';
import SecurityResearchLab from './pages/SecurityResearchLab';
import GlobalMdrMssp from './pages/GlobalMdrMssp';
import ContinuousEvolution from './pages/ContinuousEvolution';
import IdentityThreatDetection from './pages/IdentityThreatDetection';
import CloudSecurityCnapp from './pages/CloudSecurityCnapp';
import ExternalAttackSurface from './pages/ExternalAttackSurface';
import WebApisecurityWaap from './pages/WebApisecurityWaap';
import DataSecurityDspm from './pages/DataSecurityDspm';
import SecretsSecurity from './pages/SecretsSecurity';
import DatabaseSecurity from './pages/DatabaseSecurity';
import KubernetesSecurity from './pages/KubernetesSecurity';
import SupplyChainSecurity from './pages/SupplyChainSecurity';
import NetworkDetectionResponse from './pages/NetworkDetectionResponse';
import PlatformSelfProtection from './pages/PlatformSelfProtection';
import AdvancedMalwareLab from './pages/AdvancedMalwareLab';
import AttackValidationCenter from './pages/AttackValidationCenter';
import DataLossMonitoring from './pages/DataLossMonitoring';
import CustomerPortal from './pages/CustomerPortal';
import PartnerPortal from './pages/PartnerPortal';
import AdminCommercialPortal from './pages/AdminCommercialPortal';
import FirstRunSetupWizard from './pages/FirstRunSetupWizard';
import ComplianceCenter from './pages/ComplianceCenter';
import HoneypotDeception from './pages/HoneypotDeception';
import { AuthProvider, useAuth } from './contexts/AuthContext';


function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

import { useEffect } from 'react';
import { Analytics } from './services/analytics';
import { useLocation } from 'react-router-dom';

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    Analytics.init();
  }, []);

  useEffect(() => {
    Analytics.track('Page View', {
      path: location.pathname,
      search: location.search
    });
  }, [location]);

  return null;
}

import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import AntiTamper from './components/AntiTamper';

function ExternalDocsRedirect() {
  useEffect(() => {
    window.location.href = '/docs/';
  }, []);
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-sm font-medium">Opening Monitorix Enterprise Documentation Portal...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <>
    <AuthProvider>
      {/* <AntiTamper /> */}
      <ThemeProvider>
        <I18nProvider>
        <Toaster position="top-right"
          containerStyle={{ zIndex: 10001 }}
          toastOptions={{
            style: {
              background: '#fff',
              color: '#1f2937',
              border: '1px solid #e5e7eb'
            }
          }} />
        <BrowserRouter>
          <AnalyticsTracker />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/setup" element={<FirstRunSetupWizard />} />
            <Route path="/first-run" element={<FirstRunSetupWizard />} />
            <Route path="/docs" element={<ExternalDocsRedirect />} />
            <Route path="/docs/*" element={<ExternalDocsRedirect />} />
            <Route path="/documentation" element={<ExternalDocsRedirect />} />

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/status" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/overview" element={<Dashboard />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/central-server" element={<CentralServer />} />
                <Route path="/users" element={<Admin />} />
                <Route path="/tenants" element={<Tenants />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/fleet-map" element={<LocationMap />} />
                <Route path="/mail" element={<MailProcessing />} />
                <Route path="/icap" element={<IcapServer />} />
                <Route path="/image-recognition" element={<ImageRecognition />} />
                <Route path="/speech-recognition" element={<SpeechRecognition />} />
                <Route path="/vulnerabilities" element={<Vulnerabilities />} />
                <Route path="/yara-scanner" element={<YaraScanner />} />
                <Route path="/fleet-inventory" element={<FleetInventory />} />
                <Route path="/events" element={<LiveMonitor />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/audit" element={<SystemAudit />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/alerts" element={<DetectionAlerts />} />
                <Route path="/forensics/:agentId" element={<ForensicsDashboard />} />
                <Route path="/my-dashboard" element={<EmployeeDashboard />} />
                <Route path="/productivity" element={<Productivity />} />
                <Route path="/human-intelligence" element={<HumanIntelligence />} />
                <Route path="/employee-pulse" element={<EmployeePulse />} />
                <Route path="/bandwidth" element={<NetworkAnalytics />} />
                <Route path="/architecture" element={<Architecture />} />
                <Route path="/ai-copilot" element={<AiCopilot />} />
                <Route path="/software-requests" element={<SoftwareRequests />} />
                <Route path="/threat-hunting" element={<ThreatHunting />} />
                <Route path="/ransomware" element={<RansomwareDashboard />} />
                <Route path="/zero-trust" element={<ZeroTrustDashboard />} />
                <Route path="/agentless" element={<AgentlessDashboard />} />
                <Route path="/bandwidth-settings" element={<BandwidthSettings />} />
                <Route path="/playbooks" element={<SoarPlaybooks />} />
                <Route path="/sandbox" element={<SandboxDashboard />} />
                <Route path="/incidents" element={<Incidents />} />
                <Route path="/attack-chains" element={<CorrelationChains />} />
                <Route path="/correlation" element={<CorrelationChains />} />
                
                {/* New Routes Mapped to Coming Soon */}
                <Route path="/infrastructure-map" element={<SecurityGraph />} />
                <Route path="/threat-intelligence" element={<ThreatIntelligence />} />
                <Route path="/security-logs" element={<SecurityLogs />} />
                <Route path="/email-forensics" element={<EmailForensics />} />
                <Route path="/dlp" element={<DlpDashboard />} />
                <Route path="/incident-forensics" element={<ForensicsDashboard />} />
                <Route path="/identity" element={<UebaIdentity />} />
                <Route path="/user-identity" element={<UebaIdentity />} />
                <Route path="/automation" element={<XdrConnectors />} />
                <Route path="/audit-trail" element={<AuditTrail />} />
                <Route path="/performance" element={<PerformanceAnalytics />} />
                <Route path="/executive" element={<ExecutiveIntelligence />} />
                <Route path="/runtime-scope" element={<RuntimeScope />} />
                <Route path="/platform-status" element={<PlatformStatus />} />
                <Route path="/cyber-range" element={<CyberRange />} />
                <Route path="/release-gate" element={<ReleaseGate />} />
                <Route path="/soc" element={<SocCommandCenter />} />
                <Route path="/soc/queue" element={<AnalystWorkQueue />} />
                <Route path="/soc/incidents/:id" element={<AdvancedIncidentWorkspace />} />
                <Route path="/soc/cases/:id" element={<AdvancedIncidentWorkspace />} />
                <Route path="/mdr" element={<MdrOperationsDashboard />} />
                <Route path="/portal" element={<CustomerSecurityPortal />} />
                
                {/* Phase 10: SaaS & Global Enterprise Routes */}
                <Route path="/global/operations" element={<GlobalOperations />} />
                <Route path="/admin/organizations" element={<AdminOrganizations />} />
                <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                <Route path="/admin/usage" element={<AdminUsage />} />
                <Route path="/admin/regions" element={<AdminRegions />} />
                <Route path="/admin/quotas" element={<AdminQuotas />} />

                {/* Phase 11: Ecosystem & Security Marketplace Routes */}
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/integrations" element={<IntegrationHealth />} />
                <Route path="/developers" element={<DeveloperPortal />} />

                {/* Phase 12: Commercialization & Customer Success Routes */}
                <Route path="/customer-success" element={<CustomerSuccess />} />
                <Route path="/business/analytics" element={<CommercialAnalytics />} />

                {/* Phase 19: Customer Commercial & Deployment Portal */}
                <Route path="/customer" element={<CustomerPortal />} />
                <Route path="/customer/dashboard" element={<CustomerPortal />} />
                <Route path="/customer/subscription" element={<CustomerPortal />} />
                <Route path="/customer/license" element={<CustomerPortal />} />
                <Route path="/customer/usage" element={<CustomerPortal />} />
                <Route path="/customer/deployments" element={<CustomerPortal />} />
                <Route path="/customer/deployments/:id" element={<CustomerPortal />} />
                <Route path="/customer/agents" element={<CustomerPortal />} />
                <Route path="/customer/entitlements" element={<CustomerPortal />} />
                <Route path="/customer/security" element={<CustomerPortal />} />
                <Route path="/customer/support" element={<CustomerPortal />} />
                <Route path="/customer/invoices" element={<CustomerPortal />} />
                <Route path="/customer/renewal" element={<CustomerPortal />} />
                <Route path="/customer/settings" element={<CustomerPortal />} />

                {/* Phase 19: Partner / Reseller Commercial Portal */}
                <Route path="/partner" element={<PartnerPortal />} />
                <Route path="/partner/dashboard" element={<PartnerPortal />} />
                <Route path="/partner/customers" element={<PartnerPortal />} />
                <Route path="/partner/products" element={<PartnerPortal />} />
                <Route path="/partner/pricing" element={<PartnerPortal />} />
                <Route path="/partner/quotes" element={<PartnerPortal />} />
                <Route path="/partner/orders" element={<PartnerPortal />} />
                <Route path="/partner/subscriptions" element={<PartnerPortal />} />
                <Route path="/partner/licenses" element={<PartnerPortal />} />
                <Route path="/partner/deployments" element={<PartnerPortal />} />
                <Route path="/partner/commissions" element={<PartnerPortal />} />
                <Route path="/partner/invoices" element={<PartnerPortal />} />
                <Route path="/partner/renewals" element={<PartnerPortal />} />
                <Route path="/partner/support" element={<PartnerPortal />} />

                {/* Phase 19: Monitorix Admin Commercial Management */}
                <Route path="/admin/partners" element={<AdminCommercialPortal />} />
                <Route path="/admin/customers" element={<AdminCommercialPortal />} />
                <Route path="/admin/commercial" element={<AdminCommercialPortal />} />
                <Route path="/admin/plans" element={<AdminCommercialPortal />} />
                <Route path="/admin/quotes" element={<AdminCommercialPortal />} />
                <Route path="/admin/orders" element={<AdminCommercialPortal />} />
                <Route path="/admin/commercial/licenses" element={<AdminCommercialPortal />} />
                <Route path="/admin/deployments" element={<AdminCommercialPortal />} />
                <Route path="/admin/commissions" element={<AdminCommercialPortal />} />


                {/* Phase 13: Global Security Platform Routes */}
                <Route path="/global/platform" element={<GlobalPlatform />} />

                {/* Phase 14: Autonomous Security & Defense Routes */}
                <Route path="/ai/autonomous" element={<AutonomousSecurity />} />

                {/* Phase 15: Security Intelligence Network Routes */}
                <Route path="/intelligence/global" element={<GlobalThreatIntelligence />} />

                {/* Phase 16: Security Research & Innovation Lab Routes */}
                <Route path="/research" element={<SecurityResearchLab />} />

                {/* Phase 17: Global MDR & MSSP Partner Routes */}
                <Route path="/mssp" element={<GlobalMdrMssp />} />
                <Route path="/mssp/partners" element={<GlobalMdrMssp />} />

                {/* Phase 18: Continuous Evolution & Permanent Release Governance */}
                <Route path="/evolution" element={<ContinuousEvolution />} />
                <Route path="/governance/releases" element={<ContinuousEvolution />} />

                {/* Identity Threat Detection & Response (ITDR) */}
                <Route path="/identity/threats" element={<IdentityThreatDetection />} />
                <Route path="/itdr" element={<IdentityThreatDetection />} />

                {/* Cloud Security, CNAPP & CSPM */}
                <Route path="/cloud/cnapp" element={<CloudSecurityCnapp />} />
                <Route path="/cloud/security" element={<CloudSecurityCnapp />} />

                {/* External Attack Surface Management (EASM) */}
                <Route path="/easm" element={<ExternalAttackSurface />} />
                <Route path="/surface/perimeter" element={<ExternalAttackSurface />} />

                {/* Web Application & API Security (WAAP / WAF) */}
                <Route path="/waap" element={<WebApisecurityWaap />} />
                <Route path="/security/waf" element={<WebApisecurityWaap />} />

                {/* Data Security Posture Management (DSPM) */}
                <Route path="/dspm" element={<DataSecurityDspm />} />
                <Route path="/data-security/dspm" element={<DataSecurityDspm />} />

                {/* Secrets Security & Vault Governance */}
                <Route path="/secrets" element={<SecretsSecurity />} />
                <Route path="/security/secrets" element={<SecretsSecurity />} />

                {/* Database Security & Activity Monitoring (DAM) */}
                <Route path="/database-security" element={<DatabaseSecurity />} />
                <Route path="/security/databases" element={<DatabaseSecurity />} />

                {/* Kubernetes & Container Workload Security (KSPM / CWPP) */}
                <Route path="/k8s-security" element={<KubernetesSecurity />} />
                <Route path="/kubernetes-security" element={<KubernetesSecurity />} />
                <Route path="/security/kubernetes" element={<KubernetesSecurity />} />

                {/* Software Supply-Chain Security & SBOM Governance */}
                <Route path="/supply-chain" element={<SupplyChainSecurity />} />
                <Route path="/security/supply-chain" element={<SupplyChainSecurity />} />

                {/* Advanced Network Detection & Response (NDR) */}
                <Route path="/ndr" element={<NetworkDetectionResponse />} />
                <Route path="/security/ndr" element={<NetworkDetectionResponse />} />
                <Route path="/network-detection" element={<NetworkDetectionResponse />} />

                {/* Platform Self-Protection & Tamper Defense */}
                <Route path="/platform-protection" element={<PlatformSelfProtection />} />
                <Route path="/security/self-protection" element={<PlatformSelfProtection />} />
                <Route path="/tamper-defense" element={<PlatformSelfProtection />} />

                {/* Advanced Malware Analysis & Detonation Sandbox */}
                <Route path="/malware-lab" element={<AdvancedMalwareLab />} />
                <Route path="/security/malware-analysis" element={<AdvancedMalwareLab />} />
                <Route path="/malware-sandbox" element={<AdvancedMalwareLab />} />

                {/* Attack-Path Validation & Automated Breach Emulation */}
                <Route path="/attack-validation" element={<AttackValidationCenter />} />
                <Route path="/breach-emulation" element={<AttackValidationCenter />} />
                <Route path="/security/validation" element={<AttackValidationCenter />} />

                {/* Data-Loss Monitoring & Ingestion Observability */}
                <Route path="/data-loss-monitoring" element={<DataLossMonitoring />} />
                <Route path="/ingestion-health" element={<DataLossMonitoring />} />
                <Route path="/data-integrity" element={<DataLossMonitoring />} />

                {/* Global Compliance & Regulatory Framework (32 Regulations) */}
                <Route path="/compliance" element={<ComplianceCenter />} />
                <Route path="/compliance-center" element={<ComplianceCenter />} />
                <Route path="/regulatory" element={<ComplianceCenter />} />
                <Route path="/governance/compliance" element={<ComplianceCenter />} />

                {/* Honeypots & Deception Technology Grid */}
                <Route path="/deception" element={<HoneypotDeception />} />
                <Route path="/honeypots" element={<HoneypotDeception />} />
                <Route path="/honeypot" element={<HoneypotDeception />} />
                <Route path="/security/deception" element={<HoneypotDeception />} />
              </Route>
            </Route>

            {/* Global Catch-All Fallback Route: Prevents Blank Page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider >
    </>
  );
}

export default App;
