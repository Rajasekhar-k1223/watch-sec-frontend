import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { Shield, Lock, User as UserIcon, Building2, Check, ArrowRight, Mail } from 'lucide-react';

export default function Register() {
    const [tenantName, setTenantName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [plan, setPlan] = useState('Starter');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

    const plans = [
        { id: 'Starter', name: 'Starter', price: '$0', limit: '5 Agents', color: 'blue' },
        { id: 'Professional', name: 'Professional', price: '$49/mo', limit: '50 Agents', color: 'purple' },
        // { id: 'Enterprise', name: 'Enterprise', price: 'Custom', limit: 'Unlimited', color: 'emerald' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/register-tenant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantName, adminUsername: username, email, password, plan }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'Registration failed');
            }

            const data = await res.json();
            login(data.token, data.user);
            navigate('/status'); // Redirect to dashboard
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex items-center justify-center relative overflow-hidden transition-colors">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

            <div className="w-full max-w-2xl bg-white dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-2xl p-8 relative z-10 animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Create Organization</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Start securing your workforce in minutes.</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Step 1: Organization & Admin Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Organization Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                                <input
                                    type="text"
                                    value={tenantName}
                                    onChange={(e) => setTenantName(e.target.value)}
                                    className="block w-full pl-10 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="Acme Corp"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Admin Username</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-10 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="admin_acme"
                                    required
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Admin Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="admin@company.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Plan Selection */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Select Plan</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {plans.map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => setPlan(p.id)}
                                    className={`relative cursor-pointer rounded-xl border p-4 transition-all ${plan === p.id
                                        ? `bg-${p.color}-500/10 border-${p.color}-500 ring-1 ring-${p.color}-500`
                                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 dark:text-white">{p.name}</h3>
                                        <span className={`text-xs font-bold px-2 py-1 rounded bg-${p.color}-100 dark:bg-${p.color}-500/20 text-${p.color}-600 dark:text-${p.color}-400`}>
                                            {p.price}
                                        </span>
                                    </div>
                                    <ul className="space-y-1">
                                        <li className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                            <Check className="w-3 h-3 text-green-500" /> {p.limit}
                                        </li>
                                        <li className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                            <Check className="w-3 h-3 text-green-500" /> Full EDR Features
                                        </li>
                                    </ul>
                                    {plan === p.id && (
                                        <div className={`absolute top-2 right-2 w-4 h-4 rounded-full bg-${p.color}-500 flex items-center justify-center`}>
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? 'Creating Account...' : (
                            <>Create Account <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>

                    <div className="text-center mt-4">
                        <Link to="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                            Already have an account? Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
