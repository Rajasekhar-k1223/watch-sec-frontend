import { useNavigate } from 'react-router-dom';
import { Shield, BarChart3, Lock, Zap, Check, ArrowRight, Server, Globe, Star, Users, Briefcase, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import NetworkBackground from '../components/NetworkBackground';
import ProjectFlowAnimation from '../components/ProjectFlowAnimation';
import SecureTowerAnimation from '../components/SecureTowerAnimation';
import TiltCard from '../components/TiltCard';

export default function Landing() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) navigate('/status');
    }, [isAuthenticated, navigate]);

    // Scroll Reveal Hook
    const useScrollReveal = () => {
        useEffect(() => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal-active');
                    }
                });
            }, { threshold: 0.1 });

            document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
            return () => observer.disconnect();
        }, []);
    };
    useScrollReveal();

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 overflow-x-hidden font-sans">
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .reveal {
                    opacity: 0;
                    transform: translateY(30px);
                    transition: all 0.8s cubic-bezier(0.5, 0, 0, 1);
                }
                .reveal-active {
                    opacity: 1;
                    transform: translateY(0);
                }
                .typewriter::after {
                    content: '|';
                    animation: blink 1s step-start infinite;
                }
                @keyframes blink { 50% { opacity: 0; } }
                .delay-100 { transition-delay: 100ms; }
                .delay-200 { transition-delay: 200ms; }
                .delay-300 { transition-delay: 300ms; }
            `}</style>

            {/* -- HERO SECTION -- */}
            <div className="relative min-h-screen flex flex-col pt-6 overflow-hidden">

                {/* 2D Canvas Background - Network Topology */}
                <div className="absolute inset-0 bg-[#020617]"></div>
                <NetworkBackground nodeCount={60} connectionDistance={150} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/50 to-[#020617] pointer-events-none"></div>

                {/* Navbar */}
                <nav className="container mx-auto px-6 h-20 flex items-center justify-between relative z-20 animate-fade-in-down">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-50 animate-pulse group-hover:opacity-80 transition-opacity"></div>
                            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-2xl border border-white/10">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <span className="text-xl font-bold tracking-tight">WatchSec <span className="text-blue-500">Enterprise</span></span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/login')} className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">Sign In</button>
                        <button onClick={() => navigate('/register')} className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-blue-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transform hover:-translate-y-1 active:scale-95">
                            Get Started
                        </button>
                    </div>
                </nav>

                {/* Hero Content */}
                <main className="flex-1 container mx-auto px-6 flex flex-col items-center justify-center text-center relative z-10 pb-20">

                    <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-8 hover:bg-blue-500/20 transition-colors cursor-default">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        v2.0 Enterprise Release
                    </div>

                    <h1 className="reveal text-6xl md:text-8xl font-extrabold tracking-tighter mb-8 leading-[1.1] max-w-5xl bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-gray-400 drop-shadow-2xl">
                        Secure Your Workforce <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">Across the Globe.</span>
                    </h1>

                    <p className="reveal text-xl md:text-2xl text-gray-400 max-w-3xl mb-12 leading-relaxed font-light">
                        The all-in-one Endpoint Detection & Response (EDR) platform.<br />
                        <Typewriter text="Monitor. Audit. Protect." />
                    </p>

                    <div className="reveal flex flex-col md:flex-row gap-6 w-full md:w-auto mb-20">
                        <button onClick={() => navigate('/register')} className="group relative bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-full text-lg font-bold transition-all shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] flex items-center justify-center gap-3 overflow-hidden active:scale-[0.98]">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative">Start Free Trial</span>
                            <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button onClick={() => window.open('https://youtube.com', '_blank')} className="bg-gray-800/50 hover:bg-gray-800 text-white px-10 py-5 rounded-full text-lg font-bold border border-gray-700 transition-all backdrop-blur-sm hover:border-gray-500 active:scale-[0.98]">
                            Watch Interactive Demo
                        </button>
                    </div>

                    {/* 3D Dashboard Illustration (Tilt Effect) */}
                    <div className="reveal relative w-full max-w-6xl">
                        <TiltCard className="rounded-[2rem]">
                            <div className="relative bg-[#0B0F19] rounded-[2rem] border border-gray-800 overflow-hidden shadow-2xl">
                                {/* Mock UI Header */}
                                <div className="h-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 flex items-center px-4 gap-2">
                                    <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
                                    <div className="bg-gray-800 rounded px-2 w-64 h-5 mx-auto opacity-50"></div>
                                </div>
                                {/* Mock UI Content */}
                                <div className="p-8 grid grid-cols-12 gap-6 opacity-90 h-[500px] bg-[url('https://assets.aceternity.com/demos/glass-morphism.jpeg')] bg-cover bg-center blend-overlay relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] to-transparent opacity-80"></div>
                                    <div className="col-span-3 bg-gray-900/80 backdrop-blur rounded-lg border border-white/5 p-4 space-y-3 relative z-10">
                                        <div className="h-8 w-8 bg-blue-500/20 rounded mb-4"></div>
                                        <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                                        <div className="h-2 bg-gray-700 rounded w-1/2"></div>
                                        <div className="h-2 bg-gray-700 rounded w-full mt-4"></div>
                                        <div className="h-2 bg-gray-700 rounded w-5/6"></div>
                                    </div>
                                    <div className="col-span-9 grid grid-rows-2 gap-6 relative z-10">
                                        <div className="bg-gray-900/80 backdrop-blur rounded-lg border border-white/5 p-6 flex items-end relative overflow-hidden">
                                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-blue-500/20 to-transparent"></div>
                                            <div className="flex items-end gap-2 w-full h-32 justify-between px-4">
                                                {[40, 60, 45, 80, 55, 70, 90, 65, 50, 75, 60, 85].map((h, i) => (
                                                    <div key={i} style={{ height: `${h}%` }} className="w-full bg-blue-500/50 rounded-t hover:bg-blue-400 transition-colors shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-gray-900/80 backdrop-blur rounded-lg border border-white/5 p-4 flex items-center justify-center relative overflow-hidden">
                                                <div className="text-center">
                                                    <div className="text-4xl font-bold text-white mb-2"><CountUp end={99.9} decimals={1} suffix="%" /></div>
                                                    <div className="text-sm text-gray-400">Threat Block Rate</div>
                                                </div>
                                            </div>
                                            <div className="bg-gray-900/80 backdrop-blur rounded-lg border border-white/5 p-4 flex items-center justify-center relative overflow-hidden">
                                                <div className="text-center">
                                                    <div className="text-4xl font-bold text-white mb-2"><CountUp end={12} suffix="ms" /></div>
                                                    <div className="text-sm text-gray-400">Latency Overhead</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TiltCard>
                    </div>
                </main>
            </div>

            {/* -- LOGO MARQUEE -- */}
            <div className="bg-black py-10 border-y border-white/5 overflow-hidden relative z-20">
                <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#020617] to-transparent z-10"></div>
                <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-[#020617] to-transparent z-10"></div>

                <div className="flex gap-16 min-w-max animate-marquee opacity-50 hover:opacity-100 transition-opacity duration-500">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex gap-16 items-center">
                            <span className="text-2xl font-bold text-gray-500 flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer"><Globe className="w-6 h-6" /> GLOBAL_CORP</span>
                            <span className="text-2xl font-bold text-gray-500 flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer"><Shield className="w-6 h-6" /> SECURE_SYS</span>
                            <span className="text-2xl font-bold text-gray-500 flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer"><Lock className="w-6 h-6" /> DATA_VAULT</span>
                            <span className="text-2xl font-bold text-gray-500 flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer"><Briefcase className="w-6 h-6" /> ENTERPRISE_LLC</span>
                            <span className="text-2xl font-bold text-gray-500 flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer"><Server className="w-6 h-6" /> CLOUD_NET</span>
                            <span className="text-2xl font-bold text-gray-500 flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer"><Activity className="w-6 h-6" /> ACTIVE_MON</span>
                            <span className="text-2xl font-bold text-gray-500 flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer"><Briefcase className="w-6 h-6" /> LEGAL_FIRM</span>
                            <span className="text-2xl font-bold text-gray-500 flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer"><Users className="w-6 h-6" /> HR_SOLUTIONS</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* -- 2D ILLUSTRATION: ARCHITECTURE FLOW -- */}
            <section className="py-24 bg-[#0B0F19] relative z-10">
                <div className="container mx-auto px-6">
                    <div className="reveal text-center mb-16">
                        <span className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-4 block">System Architecture</span>
                        <h2 className="text-4xl font-bold mb-4">How WatchSec Works</h2>
                        <p className="text-gray-400">Real-time telemetry streaming from edge to cloud.</p>
                    </div>
                    <div className="reveal">
                        {/* Integrated Canvas Animation */}
                        <ProjectFlowAnimation />
                    </div>
                </div>
            </section>

            {/* -- 3D ILLUSTRATION: SECURE TOWER -- */}
            <section className="py-24 bg-[#020617] relative z-10 overflow-hidden">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="reveal order-2 lg:order-1 relative">
                        {/* 3D Wireframe Animation */}
                        <SecureTowerAnimation />
                        <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#020617] opacity-50 pointer-events-none"></div>
                    </div>
                    <div className="reveal order-1 lg:order-2">
                        <span className="text-purple-500 font-bold uppercase tracking-widest text-sm mb-4 block">Central Intelligence</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
                            The Secure Tower <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">Protecting Your Data Core.</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            Our centralized Secure Tower architecture ensures that all endpoint telemetry is encrypted, analyzed, and stored with military-grade precision.
                            <br /><br />
                            Infinite scalability meets zero-trust security.
                        </p>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><Check className="w-4 h-4" /></div>
                                Real-time Data Ingestion & Analysis
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><Check className="w-4 h-4" /></div>
                                AIS-256 Encrypted Storage Vaults
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><Check className="w-4 h-4" /></div>
                                Automated Threat Neutralization
                            </li>
                        </ul>
                        <button onClick={() => navigate('/register')} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-purple-500/25">
                            Secure Your Infrastructure
                        </button>
                    </div>
                </div>
            </section>

            {/* -- 3D CARDS: FEATURES GRID -- */}
            <section className="py-32 bg-[#0B0F19] relative z-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] pointer-events-none"></div>
                <div className="container mx-auto px-6">
                    <div className="reveal text-center mb-24 max-w-3xl mx-auto">
                        <span className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-4 block">Platform Capabilities</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Everything You Need.<br />Nothing You Don't.</h2>
                        <p className="text-gray-400 text-lg">Comprehensive security coverage for endpoints, networks, and cloud infrastructure.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<BarChart3 className="text-blue-500" />}
                            title="Productivity Analytics"
                            desc="Track detailed app usage, web activity, and generate efficiency scores for every employee."
                            delay="0"
                        />
                        <FeatureCard
                            icon={<Lock className="text-purple-500" />}
                            title="Active Defense"
                            desc="Block USB devices, Kill malicious processes, and Isolate infected machines instantly."
                            delay="100"
                        />
                        <FeatureCard
                            icon={<Globe className="text-green-500" />}
                            title="Global Visibility"
                            desc="Real-time map visualization of your entire workforce with Geo-location tracking."
                            delay="200"
                        />
                        <FeatureCard
                            icon={<Server className="text-red-500" />}
                            title="Audit Logs"
                            desc="Immutable audit trails for compliance. Track every admin action and system event."
                            delay="300"
                        />
                        <FeatureCard
                            icon={<Zap className="text-yellow-500" />}
                            title="Instant Deployment"
                            desc="Deploy to Windows, Linux, and macOS in seconds with our unified installer."
                            delay="400"
                        />
                        <FeatureCard
                            icon={<Shield className="text-cyan-500" />}
                            title="Threat Detection"
                            desc="AI-powered analysis to detect anomalies and potential breaches before they happen."
                            delay="500"
                        />
                    </div>
                </div>
            </section>

            {/* -- 3D CARDS: TESTIMONIALS -- */}
            <section className="py-32 bg-[#020617] relative z-10 border-t border-gray-900">
                <div className="absolute left-0 bottom-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[100px] pointer-events-none"></div>
                <div className="container mx-auto px-6">
                    <div className="reveal text-center mb-20">
                        <span className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-4 block">Customer Success</span>
                        <h2 className="text-4xl font-bold mb-4">Trusted by Market Leaders</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <TestimonialCard
                            quote="WatchSec completely transformed our remote security posture. The visibility is unmatched."
                            author="Sarah Connor"
                            role="CISO @ SkyNet Systems"
                            rating={5}
                            delay="0"
                        />
                        <TestimonialCard
                            quote="The deployment was incredibly fast. We secured 500 endpoints in less than 2 hours."
                            author="John Wick"
                            role="DevOps Lead @ Continental"
                            rating={5}
                            delay="100"
                        />
                        <TestimonialCard
                            quote="The productivity analytics helped us identify bottlenecks we didn't know existed."
                            author="Tony Stark"
                            role="CTO @ Stark Industries"
                            rating={5}
                            delay="200"
                        />
                    </div>
                </div>
            </section>

            {/* -- 3D CARDS: PRICING -- */}
            <section className="py-32 bg-[#0B0F19] relative z-10 border-t border-gray-800">
                <div className="container mx-auto px-6">
                    <div className="reveal text-center mb-20">
                        <div className="inline-block px-4 py-1 rounded-full bg-green-500/10 text-green-400 font-bold text-sm mb-4 animate-pulse">Limited Time Offer</div>
                        <h2 className="text-4xl font-bold mb-4">Transparent Pricing</h2>
                        <p className="text-gray-400">Choose the plan that scales with your business.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <PricingCard
                            name="Starter" price="$0" period="Forever"
                            features={["upto 5 Agents", "Basic Monitoring", "7-Day History"]}
                            cta="Start Free"
                            onClick={() => navigate('/register')}
                            delay="0"
                        />
                        <PricingCard
                            name="Professional" price="$49" period="/ month" recommended
                            features={["upto 50 Agents", "Full EDR Suite", "Productivity Analytics", "30-Day History", "Email Alerts"]}
                            cta="Go Pro"
                            onClick={() => navigate('/register')}
                            delay="100"
                        />
                        <PricingCard
                            name="Enterprise" price="Custom" period=""
                            features={["Unlimited Agents", "SSO / SAML", "Dedicated Support", "1-Year History", "On-Prem Option"]}
                            cta="Contact Sales"
                            onClick={() => window.location.href = 'mailto:sales@watchsec.io'}
                            delay="200"
                        />
                    </div>
                </div>
            </section>

            {/* -- CTA BANNER -- */}
            <section className="py-20 relative z-10">
                <div className="container mx-auto px-6">
                    <TiltCard className="rounded-3xl">
                        <div className="reveal bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-2xl group">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000"></div>

                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 relative z-10">Ready to secure your future?</h2>
                            <button onClick={() => navigate('/register')} className="bg-white text-blue-900 px-10 py-5 rounded-full text-xl font-bold hover:bg-gray-100 transition-all shadow-xl hover:scale-105 active:scale-95 relative z-10">
                                Get Started Now
                            </button>
                        </div>
                    </TiltCard>
                </div>
            </section>

            {/* -- FOOTER -- */}
            <footer className="bg-[#020617] border-t border-gray-800 py-16 text-gray-500 text-sm">
                <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <Shield className="w-6 h-6 text-white" />
                            <span className="font-bold text-xl text-white">WatchSec</span>
                        </div>
                        <p className="mb-6">The next generation of endpoint security for the distributed enterprise.</p>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"><Globe className="w-5 h-5" /></div>
                            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"><Activity className="w-5 h-5" /></div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-6">Platform</h4>
                        <ul className="space-y-4">
                            <li className="hover:text-blue-500 cursor-pointer">EDR</li>
                            <li className="hover:text-blue-500 cursor-pointer">Productivity</li>
                            <li className="hover:text-blue-500 cursor-pointer">Compliance</li>
                            <li className="hover:text-blue-500 cursor-pointer">Download Agent</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-6">Resources</h4>
                        <ul className="space-y-4">
                            <li className="hover:text-blue-500 cursor-pointer">Documentation</li>
                            <li className="hover:text-blue-500 cursor-pointer">API Reference</li>
                            <li className="hover:text-blue-500 cursor-pointer">Blog</li>
                            <li className="hover:text-blue-500 cursor-pointer">Community</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-6">Company</h4>
                        <ul className="space-y-4">
                            <li className="hover:text-blue-500 cursor-pointer">About Us</li>
                            <li className="hover:text-blue-500 cursor-pointer">Careers</li>
                            <li className="hover:text-blue-500 cursor-pointer">Legal</li>
                            <li className="hover:text-blue-500 cursor-pointer">Contact</li>
                        </ul>
                    </div>
                </div>
                <div className="text-center border-t border-gray-800 pt-8">
                    <p>&copy; 2025 WatchSec Inc. All rights reserved.</p>
                </div>
            </footer>

        </div>
    );
}

// -- SUB-COMPONENTS (With Tilt Wrapper) --

function Typewriter({ text }: { text: string }) {
    const [display, setDisplay] = useState('');

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplay(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 100);
        return () => clearInterval(timer);
    }, [text]);

    return <span className="text-white font-semibold typewriter">{display}</span>;
}

function CountUp({ end, suffix = '', decimals = 0 }: { end: number, suffix?: string, decimals?: number }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                let start = 0;
                const duration = 2000;
                const increment = end / (duration / 16);

                const timer = setInterval(() => {
                    start += increment;
                    if (start >= end) {
                        setCount(end);
                        clearInterval(timer);
                    } else {
                        setCount(start);
                    }
                }, 16);
                observer.disconnect();
            }
        });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end]);

    return <span ref={ref}>{count.toFixed(decimals)}{suffix}</span>;
}

function FeatureCard({ icon, title, desc, delay }: any) {
    return (
        <TiltCard className={`reveal delay-${delay} h-full rounded-3xl`}>
            <div className={`bg-gray-900/50 border border-gray-800 p-8 rounded-3xl hover:bg-gray-800 transition-all h-full group hover:border-blue-500/30 shadow-lg`}>
                <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-blue-500/20 group-hover:text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">{title}</h3>
                <p className="text-gray-400 leading-relaxed font-medium">{desc}</p>
            </div>
        </TiltCard>
    );
}

function TestimonialCard({ quote, author, role, rating, delay }: any) {
    return (
        <TiltCard className={`reveal delay-${delay} h-full rounded-3xl`}>
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl h-full relative group hover:border-blue-500/20">
                <div className="absolute top-4 right-8 text-6xl text-gray-800 font-serif opacity-50 select-none">"</div>
                <div className="flex gap-1 mb-6 text-yellow-500">
                    {[...Array(rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />)}
                </div>
                <p className="text-xl text-gray-300 mb-8 italic relative z-10">{quote}</p>
                <div className="flex items-center gap-4 mt-auto">
                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {author[0]}
                    </div>
                    <div>
                        <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{author}</h4>
                        <p className="text-sm text-gray-500">{role}</p>
                    </div>
                </div>
            </div>
        </TiltCard>
    )
}

function PricingCard({ name, price, period, features, recommended, cta, onClick, delay }: any) {
    return (
        <TiltCard className={`reveal delay-${delay} h-full rounded-3xl ${recommended ? 'scale-105 z-10' : ''}`} scale={1.02}>
            <div className={`relative bg-gray-900/50 border rounded-3xl p-8 flex flex-col h-full transition-all ${recommended ? 'border-blue-500 ring-2 ring-blue-500/20 bg-gray-900 shadow-2xl shadow-blue-500/10' : 'border-gray-800 hover:border-gray-600'}`}>
                {recommended && (
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-2">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/30">RECOMMENDED</span>
                    </div>
                )}
                <h3 className={`text-lg font-bold uppercase tracking-widest mb-4 ${recommended ? 'text-blue-400' : 'text-gray-400'}`}>{name}</h3>
                <div className="mb-8">
                    <span className="text-5xl font-bold text-white tracking-tight">{price}</span>
                    <span className="text-gray-500 ml-1 font-medium">{period}</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                    {features.map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-3 text-gray-300">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${recommended ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400'}`}>
                                <Check className="w-3 h-3" />
                            </div>
                            {f}
                        </li>
                    ))}
                </ul>
                <button
                    onClick={onClick}
                    className={`w-full py-4 rounded-xl font-bold transition-all ${recommended
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40'
                        : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-gray-500'}`}
                >
                    {cta}
                </button>
            </div>
        </TiltCard>
    );
}
