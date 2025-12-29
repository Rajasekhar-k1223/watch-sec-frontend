import { useEffect, useState } from 'react';
import { CreditCard, Check, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

interface BillingInfo {
    id: number;
    plan: string;
    agentLimit: number;
    agentCount: number;
    nextBillingDate: string;
    dueAmount: number;
}

export default function Billing() {
    const { user, token } = useAuth();
    const [info, setInfo] = useState<BillingInfo | null>(null);
    const [loading, setLoading] = useState(false);

    // Use centralized configuration imported from ../config
    // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

    const fetchBilling = async () => {
        if (!user?.tenantId) return;
        try {
            const res = await fetch(`${API_URL}/api/billing?tenantId=${user.tenantId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setInfo(await res.json());
        } catch (e) {
            console.error("Billing fetch failed", e);
        }
    };

    useEffect(() => {
        fetchBilling();
    }, [user]);

    const handleUpgrade = async (newPlan: string) => {
        if (!user?.tenantId) return;
        if (!confirm(`Are you sure you want to upgrade to ${newPlan}? This will charge your payment method.`)) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/billing/upgrade?tenantId=${user.tenantId}&newPlan=${newPlan}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert(`Successfully upgraded to ${newPlan}!`);
                fetchBilling();
            }
        } catch (e) {
            alert("Upgrade failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!user?.tenantId) return <div className="p-8 text-gray-500">Billing is only available for Tenant Scoped users.</div>;
    if (!info) return <div className="p-8 text-gray-500 animate-pulse">Loading subscription details...</div>;

    const usagePercent = Math.min((info.agentCount / info.agentLimit) * 100, 100);

    return (
        <div className="p-8 bg-gray-900 min-h-screen text-white font-sans animate-fade-in">
            <div className="flex justify-between items-end border-b border-gray-800 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                        <CreditCard className="text-yellow-400" />
                        Subscription & Billing
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Manage your plan, limits, and invoices.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold">Next Billing Date</p>
                    <p className="text-xl font-mono text-white">{new Date(info.nextBillingDate).toLocaleDateString()}</p>
                </div>
            </div>

            {/* USAGE CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl lg:col-span-2">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-400" /> Usage Overview
                    </h2>
                    <div className="flex justify-between items-end mb-2 text-sm">
                        <span className="text-gray-400">Deployed Agents</span>
                        <span className="font-bold text-white">{info.agentCount} / {info.agentLimit}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden mb-2">
                        <div
                            className={`h-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>
                    {usagePercent > 90 && (
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold mt-2 animate-pulse">
                            <AlertTriangle size={12} /> You are approaching your license limit. Upgrade now to avoid interruptions.
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 border border-indigo-700 shadow-xl flex flex-col justify-center items-center text-center">
                    <p className="text-indigo-300 text-sm uppercase font-bold tracking-wider mb-1">Current Plan</p>
                    <h2 className="text-4xl font-extrabold text-white mb-2">{info.plan}</h2>
                    <p className="text-2xl font-mono text-indigo-200">${info.dueAmount}/mo</p>
                </div>
            </div>

            {/* PRICING TABLE */}
            <h2 className="text-xl font-bold mb-6 text-white">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PlanCard
                    title="Starter"
                    price="$0/mo"
                    features={['Up to 5 Agents', 'Basic Monitoring', '7-Day Retention']}
                    current={info.plan === 'Starter'}
                    onUpgrade={() => handleUpgrade('Starter')}
                    loading={loading}
                />
                <PlanCard
                    title="Pro"
                    price="$99/mo"
                    features={['Up to 50 Agents', 'Real-time Live Screen', '30-Day Retention', 'Priority Support']}
                    current={info.plan === 'Pro'}
                    isPopular
                    onUpgrade={() => handleUpgrade('Pro')}
                    loading={loading}
                />
                <PlanCard
                    title="Enterprise"
                    price="$499/mo"
                    features={['Up to 1000 Agents', 'Unlimited Retention', 'Dedicated Account Manager', 'SLA Guarantees', 'AI Analysis']}
                    current={info.plan === 'Enterprise'}
                    onUpgrade={() => handleUpgrade('Enterprise')}
                    loading={loading}
                />
            </div>
        </div>
    );
}

function PlanCard({ title, price, features, current, isPopular, onUpgrade, loading }: any) {
    return (
        <div className={`relative bg-gray-800 rounded-xl p-6 border ${current ? 'border-green-500 ring-1 ring-green-500/50' : 'border-gray-700'} ${isPopular && !current ? 'border-yellow-500/50' : ''} hover:border-gray-500 transition-all group`}>
            {isPopular && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>}

            <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
            <div className="text-2xl font-mono text-gray-300 mb-6">{price}</div>

            <ul className="space-y-3 mb-8">
                {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={onUpgrade}
                disabled={current || loading}
                className={`w-full py-2 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2
                    ${current
                        ? 'bg-green-900/30 text-green-500 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/20'
                    } ${loading ? 'opacity-50 cursor-wait' : ''}`}
            >
                {current ? (
                    <><Check size={16} /> Current Plan</>
                ) : (
                    <><Zap size={16} /> Upgrade</>
                )}
            </button>
        </div>
    );
}
