import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || "https://192.168.1.10:7033";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate network delay for "best view" demonstration if local
        // await new Promise(r => setTimeout(r, 800)); 

        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
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
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow delay-700"></div>

            <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-8 relative z-10 transition-all duration-300 hover:shadow-blue-900/20 hover:border-gray-600">

                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25 transform rotate-3 hover:rotate-6 transition-transform">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-gray-400 text-sm">Sign in to access your secure dashboard.</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6 flex items-start gap-3 animate-shake">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-12 bg-gray-800/50 border border-gray-700 rounded-xl py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-800 transition-all font-medium"
                                    placeholder="Enter your username"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2 ml-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 bg-gray-800/50 border border-gray-700 rounded-xl py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-800 transition-all font-medium"
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
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="animate-pulse">Authenticating...</span>
                            </>
                        ) : (
                            <>
                                Sign In <ArrowRight className="w-4 h-4 ml-1" />
                            </>
                        )}
                    </button>

                    <div className="text-center pt-2">
                        <p className="text-sm">
                            <span className="text-gray-500">Don't have an account? </span>
                            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold transition-colors hover:underline decoration-blue-500/30 underline-offset-4">
                                Create Organization
                            </Link>
                        </p>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 text-center text-gray-600 text-xs">
                <p>&copy; 2025 Watch Sec Platform. All rights reserved.</p>
                <div className="flex gap-4 justify-center mt-2 opacity-50">
                    <span>Privacy Policy</span>
                    <span>•</span>
                    <span>Terms of Service</span>
                </div>
            </div>
        </div>
    );
}
