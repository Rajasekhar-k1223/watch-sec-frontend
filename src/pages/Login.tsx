import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import "./Login.css";
import {
  Shield, ShieldCheck, User, Building2, Lock, Eye, EyeOff, Sun, Globe,
  Check, Monitor, FileCheck, ArrowRight, ChevronDown, AlertCircle
} from "lucide-react";
import { BarChart3 as ChartColumn } from "lucide-react";

export default function Login() {
  const [activeTab, setActiveTab] = useState<'operator' | 'sso'>('operator');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/status');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (searchParams.get('reason') === 'session_expired') {
      setSessionExpired(true);
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSessionExpired(false);

    if (activeTab === 'sso') {
      setError("SSO integration not configured.");
      return;
    }

    if (!username.trim() || !password) {
      setError("Enter your Operator ID and cryptographic key.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid operator credentials or identity token.");
      }

      const data = await res.json();
      login(data.token, data.user);
      navigate('/status');
    } catch (err: any) {
      setError(err.message || "Invalid operator credentials or identity token.");
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    setError("Microsoft Entra ID integration not configured.");
  };

  const handleForgotKey = () => {
    setError("Key recovery service unavailable.");
  };

  const handleProvision = () => {
    navigate("/register");
  };

  return (
    <main className="login-page">
      {/* LEFT: Brand and security showcase */}
      <section className="login-hero">
        <div className="cyber-background" />
        <div className="login-illustration-glow" />

        <div className="login-hero-content">
          <header className="login-brand">
            <div className="login-brand-icon">
              <Shield className="h-7 w-7" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="login-brand-name">Monitorix</h1>
              <div className="login-brand-subtitle">
                Enterprise Command Center
              </div>
            </div>
          </header>

          <div className="login-hero-badge">
            Unified security operations
          </div>

          <h2 className="login-hero-heading">
            Secure Today.<br />
            <span>Safer Tomorrow.</span>
          </h2>

          <p className="login-hero-description">
            Unified security, monitoring and operations platform to protect
            your infrastructure, applications and data across the
            enterprise.
          </p>

          <ul className="login-benefits">
            <li>Real-time Threat Monitoring</li>
            <li>Endpoint Visibility & Control</li>
            <li>Compliance & Risk Management</li>
            <li>Multi-Cloud Support</li>
            <li>AI-Powered Insights</li>
          </ul>

          {/* Bottom capability cards */}
          <div className="login-feature-grid">
            <div className="login-feature-card">
              <div className="login-feature-icon">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3>Threat Detection</h3>
              <p>Identify and stop threats before they impact</p>
            </div>
            <div className="login-feature-card">
              <div className="login-feature-icon">
                <Monitor className="h-5 w-5" />
              </div>
              <h3>Endpoint Control</h3>
              <p>Complete visibility across all your devices</p>
            </div>
            <div className="login-feature-card">
              <div className="login-feature-icon">
                <FileCheck className="h-5 w-5" />
              </div>
              <h3>Compliance Ready</h3>
              <p>Meet industry and regulatory standards</p>
            </div>
            <div className="login-feature-card">
              <div className="login-feature-icon">
                <ChartColumn className="h-5 w-5" />
              </div>
              <h3>Operational Insights</h3>
              <p>AI-driven analytics and reporting</p>
            </div>
          </div>
          
          <footer className="login-hero-footer">
            &copy; 2026 MONITORIX. HIGH-TRUST INFRASTRUCTURE.
          </footer>
        </div>
      </section>

      {/* RIGHT: Login panel */}
      <section className="login-panel">
        <div className="login-top-controls">
          <button
            type="button"
            className="login-theme-button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
          >
            <Sun className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            className="login-language-button"
          >
            <Globe className="h-4 w-4" />
            {language}
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <div className="login-card">
          <div className="login-card-brand">
            <div className="login-card-brand-icon">
              <Shield className="h-10 w-10" strokeWidth={2.2} />
            </div>
            <h2>Monitorix <span>Portal</span></h2>
            <p>Enterprise Command Center</p>
          </div>

          <div className="login-tabs">
            <button
              type="button"
              onClick={() => setActiveTab('operator')}
              className={`login-tab ${activeTab === 'operator' ? 'active' : ''}`}
            >
              <User className="h-4 w-4" />
              Operator Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sso')}
              className={`login-tab ${activeTab === 'sso' ? 'active' : ''}`}
            >
              <Building2 className="h-4 w-4" />
              SSO Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {sessionExpired && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px', fontSize: '13px', border: '1px solid #fcd34d' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Your session has expired. Please sign in again.</span>
              </div>
            )}
            
            {activeTab === 'operator' ? (
              <>
                <div className="login-form-group">
                  <label htmlFor="operatorId">Identity Token</label>
                  <div className="login-input-wrapper">
                    <User className="login-input-icon h-4 w-4" />
                    <input
                      id="operatorId"
                      name="operatorId"
                      type="text"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Operator ID"
                    />
                  </div>
                </div>

                <div className="login-form-group">
                  <label htmlFor="secret">Cryptographic Key</label>
                  <div className="login-input-wrapper">
                    <Lock className="login-input-icon h-4 w-4" />
                    <input
                      id="secret"
                      name="secret"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your cryptographic key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide cryptographic key" : "Show cryptographic key"}
                      className="login-input-toggle"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="login-form-options">
                  <label className="login-remember">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(event) => setRememberDevice(event.target.checked)}
                    />
                    Remember this device
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotKey}
                    className="login-forgot-link"
                  >
                    Forgot key?
                  </button>
                </div>
              </>
            ) : (
              <div className="login-form-group">
                <label htmlFor="ssoOrg">Organization URL or Domain</label>
                <div className="login-input-wrapper">
                  <Building2 className="login-input-icon h-4 w-4" />
                  <input
                    id="ssoOrg"
                    name="ssoOrg"
                    type="text"
                    required
                    placeholder="company.com"
                  />
                </div>
              </div>
            )}

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', fontSize: '12px', border: '1px solid #fee2e2' }}>
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="login-submit-button"
            >
              {loading ? "Establishing session..." : "Establish Session"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="login-divider">
              OR
            </div>

            <button
              type="button"
              onClick={handleMicrosoftLogin}
              className="login-microsoft-button"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
              </svg>
              Sign in with Microsoft
              <ArrowRight className="h-4 w-4" style={{ color: '#8294b1' }} />
            </button>

            <p className="login-provision">
              NEW PROTOCOL?{" "}
              <button
                type="button"
                onClick={handleProvision}
                style={{ background: 'none', border: 'none', color: 'var(--monitorix-primary)', fontWeight: 800, cursor: 'pointer', padding: 0 }}
              >
                PROVISION ORGANIZATION
              </button>
            </p>
          </form>
        </div>

        <footer className="login-footer">
          <a href="#">About</a>
          <span>|</span>
          <a href="#">Security</a>
          <span>|</span>
          <a href="#">Compliance</a>
          <span>|</span>
          <a href="#">Support</a>
        </footer>
      </section>
    </main>
  );
}
