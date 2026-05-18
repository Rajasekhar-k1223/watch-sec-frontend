import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { Shield, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Detect redirect from 401 interceptor
    useEffect(() => {
        if (searchParams.get('reason') === 'session_expired') {
            setSessionExpired(true);
            // Clean up the URL without triggering a navigation
            window.history.replaceState({}, '', '/login');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate network delay for "best view" demonstration if local
        // await new Promise(r => setTimeout(r, 800)); 

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                // Try to parse error message
                const msg = await res.text();
                throw new Error(msg || 'Invalid Credentials');
            }

            const data = await res.json();

            // Validate Token Structure (Basic check)
            if (!data.token || !data.user) {
                throw new Error("Invalid server response (Missing Token)");
            }

            // Successful Login
            await login(data.token, data.user);
            navigate('/status');

        } catch (err: any) {
            console.error("Login Failed:", err);
            setError(err.message || 'Failed to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center relative overflow-hidden transition-colors">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/10 dark:bg-emerald-600/15 rounded-full blur-[120px] animate-pulse-slow delay-700 pointer-events-none"></div>

            <div className="w-full max-w-md glass-card p-10 relative z-10 transition-all duration-500 hover:shadow-blue-500/10 hover:border-blue-500/30 animate-in fade-in slide-in-from-bottom-8">

                {/* Logo / Header */}
                <div className="text-center mb-10">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20 transform rotate-3 hover:rotate-6 transition-transform ring-4 ring-white/10">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter mb-2">
                        <span className="text-gradient">Monitorix Portal</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Enterprise Command Center</p>
                </div>

                {/* Session Expired Banner */}
                {sessionExpired && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs p-4 rounded-2xl mb-6 flex items-start gap-3 font-bold animate-in fade-in slide-in-from-top-4">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-black uppercase tracking-wide mb-0.5">Session Expired</p>
                            <p className="font-medium opacity-80">Your session timed out. Please sign in again to continue.</p>
                        </div>
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-2xl mb-6 flex items-start gap-3 animate-shake font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Identity Token</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-12 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all font-semibold text-sm"
                                    placeholder="Operator ID"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Cryptographic Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all font-semibold text-sm"
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl shadow-2xl shadow-blue-500/20 text-xs font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none ring-2 ring-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-95"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="animate-pulse">Authorizing...</span>
                            </>
                        ) : (
                            <>
                                Establish Session <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <div className="text-center pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-500">New Protocol? </span>
                            <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors underline-offset-4 decoration-blue-500/20">
                                Provision Organization
                            </Link>
                        </p>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <p>&copy; 2026 Monitorix. High-Trust Infrastructure.</p>
                <div className="flex gap-6 justify-center mt-3 opacity-40">
                    <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">Protocol</span>
                    <span>•</span>
                    <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">Compliance</span>
                </div>
            </div>
        </div>
    );
}
