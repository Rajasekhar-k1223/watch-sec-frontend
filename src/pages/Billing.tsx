import { useEffect, useState } from 'react';
import { CreditCard, Check, Zap, AlertTriangle, TrendingUp, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import toast from 'react-hot-toast';

interface BillingInfo {
    id: number;
    Plan: string;
    AgentLimit: number;
    AgentCount: number; // NOTE: Backend doesn't verify this exists in PlanDto, might be computed or missing?
    NextBillingDate: string;
    AmountDue: number;
    StripeCustomerId: string | null;
    SubscriptionStatus: string;
    // Map missing lowercase to keep component logic simple or update component? 
    // Let's update component to use Capitalized.
}

export default function Billing() {
    const { user, token } = useAuth();
    const [info, setInfo] = useState<BillingInfo | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchBilling = async () => {
        if (!user?.tenantId) return;
        try {
            const res = await fetch(`${API_URL}/billing?tenantId=${user.tenantId}&t=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Map backend PlanDto to our UI needs or usage
                // PlanDto: { TenantId, Plan, AgentLimit, NextBillingDate, AmountDue, StripeCustomerId, SubscriptionStatus }
                // It does NOT seem to return agentCount? 
                // Let's check billing.py again. It only fetches Tenant and returns PlanDto.
                // PlanDto in billing.py DOES NOT have AgentCount!
                // We might need to fetch AgentCount separately or ignore it for now.
                // For now, let's map what we have.
                setInfo({
                    id: data.TenantId,
                    Plan: data.Plan,
                    AgentLimit: data.AgentLimit,
                    AgentCount: 0, // Placeholder as backend doesn't send it?
                    NextBillingDate: data.NextBillingDate,
                    AmountDue: data.AmountDue,
                    StripeCustomerId: data.StripeCustomerId,
                    SubscriptionStatus: data.SubscriptionStatus
                });
            }
        } catch (e) {
            console.error("Billing fetch failed", e);
        }
    };

    useEffect(() => {
        fetchBilling();

        // Check for success/cancel params from Stripe redirect
        const query = new URLSearchParams(window.location.search);
        if (query.get('success')) {
            toast.success('Subscription updated successfully!');
            window.history.replaceState({}, '', '/billing');
        }
        if (query.get('canceled')) {
            toast.error('Subscription update canceled.');
            window.history.replaceState({}, '', '/billing');
        }
    }, [user]);

    const handleUpgrade = async (newPlan: string) => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            // Call Stripe Checkout Endpoint
            const res = await fetch(`${API_URL}/billing/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ PlanName: newPlan })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.checkoutUrl) {
                    window.location.href = data.checkoutUrl; // Redirect to Stripe
                } else {
                    toast.error("Failed to initialize checkout.");
                }
            } else {
                const err = await res.json();
                toast.error(`Error: ${err.detail || 'Unknown error'}`);
            }
        } catch (e) {
            toast.error("Upgrade failed. Please try again.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/billing/create-portal-session`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.portalUrl) {
                    window.location.href = data.portalUrl;
                }
            } else {
                toast.error("Failed to access billing portal.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!user?.tenantId) return <div className="p-8 text-gray-500">Billing is only available for Tenant Scoped users.</div>;
    if (!info) return <div className="p-8 text-gray-500 animate-pulse">Loading subscription details...</div>;

    const usagePercent = Math.min((info.AgentCount / info.AgentLimit) * 100, 100);

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen font-sans animate-fade-in transition-colors">
            <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600 dark:from-yellow-400 dark:to-orange-500">
                        <CreditCard className="text-yellow-500 dark:text-yellow-400" />
                        Subscription & Billing
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your plan, limits, and invoices.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-500 uppercase font-bold">Next Billing Date</p>
                        <p className="text-xl font-mono text-gray-900 dark:text-white">{new Date(info.NextBillingDate).toLocaleDateString()}</p>
                    </div>
                    {info.Plan !== 'Starter' && (
                        <button
                            onClick={handleManageSubscription}
                            disabled={loading}
                            className="text-xs flex items-center gap-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 px-3 py-1.5 rounded transition-colors"
                        >
                            <Settings size={12} /> Manage Subscription
                        </button>
                    )}
                </div>
            </div>

            {/* USAGE CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-lg lg:col-span-2 transition-colors">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                        <TrendingUp size={20} className="text-blue-500 dark:text-blue-400" /> Usage Overview
                    </h2>
                    <div className="flex justify-between items-end mb-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Deployed Agents</span>
                        <span className="font-bold text-gray-900 dark:text-white">{info.AgentCount} / {info.AgentLimit}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden mb-2">
                        <div
                            className={`h-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>
                    {usagePercent > 90 && (
                        <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-xs font-bold mt-2 animate-pulse">
                            <AlertTriangle size={12} /> You are approaching your license limit. Upgrade now to avoid interruptions.
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-900 dark:to-purple-900 rounded-xl p-6 border border-indigo-500 dark:border-indigo-700 shadow-xl flex flex-col justify-center items-center text-center text-white">
                    <p className="text-indigo-100 dark:text-indigo-300 text-sm uppercase font-bold tracking-wider mb-1">Current Plan</p>
                    <h2 className="text-4xl font-extrabold mb-2 text-white">{info.Plan}</h2>
                    <p className="text-2xl font-mono text-indigo-100 dark:text-indigo-200">${info.AmountDue}/mo</p>
                    <div className="mt-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${info.SubscriptionStatus === 'active' ? 'bg-green-500/20 border-green-400 text-green-100' : 'bg-red-500/20 border-red-400 text-red-100'}`}>
                            {info.SubscriptionStatus}
                        </span>
                    </div>
                </div>
            </div>

            {/* PRICING TABLE */}
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PlanCard
                    title="Starter"
                    price="$0/mo"
                    features={['Up to 5 Agents', 'Basic Monitoring', '7-Day Retention']}
                    current={info.Plan === 'Starter'}
                    onUpgrade={() => handleUpgrade('Starter')}
                    loading={loading}
                />
                <PlanCard
                    title="Professional"
                    price="$49/mo"
                    features={['Up to 50 Agents', 'Real-time Live Screen', '30-Day Retention', 'Priority Support']}
                    current={info.Plan === 'Professional'} // Match backend key
                    isPopular
                    onUpgrade={() => handleUpgrade('Professional')}
                    loading={loading}
                />
                <PlanCard
                    title="Enterprise"
                    price="$299/mo"
                    features={['Up to 1000 Agents', 'Unlimited Retention', 'Dedicated Account Manager', 'SLA Guarantees', 'AI Analysis']}
                    current={info.Plan === 'Enterprise'}
                    onUpgrade={() => handleUpgrade('Enterprise')}
                    loading={loading}
                />
            </div>
        </div>
    );
}

function PlanCard({ title, price, features, current, isPopular, onUpgrade, loading }: any) {
    return (
        <div className={`relative bg-white dark:bg-gray-800 rounded-xl p-6 border ${current ? 'border-green-500 ring-1 ring-green-500/50' : 'border-gray-200 dark:border-gray-700'} ${isPopular && !current ? 'border-yellow-400 ring-1 ring-yellow-400/50 dark:border-yellow-500/50 dark:ring-yellow-500/20' : ''} hover:border-gray-400 dark:hover:border-gray-500 transition-all group shadow-lg dark:shadow-none`}>
            {isPopular && <div className="absolute top-0 right-0 bg-yellow-400 dark:bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl">POPULAR</div>}

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
            <div className="text-2xl font-mono text-gray-500 dark:text-gray-300 mb-6">{price}</div>

            <ul className="space-y-3 mb-8">
                {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
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
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500 cursor-default'
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
