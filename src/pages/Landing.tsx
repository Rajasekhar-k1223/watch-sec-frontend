import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Network, Database, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

// Original Assets
import logo from '../assets/logo.png';

// New Advanced Marketing Assets
import hero_bg from '../assets/monitorix_hero_background_1780405175903.png';
import client_architecture from '../assets/monitorix_client_demo_1780403121247.png';
import realtime_protection from '../assets/monitorix_feature_realtime_1780405197682.png';
import endpoint_protection from '../assets/monitorix_feature_endpoint_1780405279101.png';
import advanced_analytics from '../assets/monitorix_feature_analytics_1780405219779.png';
import cinematic_topology from '../assets/monitorix_v2_cinematic_1780405089390.png';
import social_media_bg from '../assets/monitorix_social_media_1780403143642.png';

export default function Landing() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) navigate('/status');
    }, [isAuthenticated, navigate]);

    // Scroll Reveal Hook
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-8');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => {
            el.classList.add('opacity-0', 'translate-y-8', 'transition-all', 'duration-1000', 'ease-out');
            observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
            
            {/* Navbar */}
            <nav className="container mx-auto px-6 h-24 flex items-center justify-between relative z-50">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                    <img src={logo} alt="Monitorix" className="w-10 h-10 rounded-xl shadow-2xl border border-slate-800" />
                    <span className="text-xl font-bold tracking-tight text-white">Monitorix <span className="text-blue-500">EDR</span></span>
                </div>
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/login')} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Sign In</button>
                    <button onClick={() => navigate('/register')} className="bg-white text-slate-900 px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg hover:bg-slate-200 transition-all">
                        Deploy Fleet
                    </button>
                </div>
            </nav>

            {/* [Section 1: The Hero Header] */}
            <header className="relative pt-24 pb-32">
                <div className="absolute inset-0 z-0">
                    <img src={hero_bg} alt="Hero Background" className="w-full h-full object-cover opacity-60 mix-blend-screen" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/80 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Monitorix Architecture v2.0 is Live
                        </div>

                        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-6 leading-[1.05] reveal">
                            Zero-Trust <br />Enterprise Security.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Deployed in 60 Seconds.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mb-10 leading-relaxed reveal delay-100">
                            Stop waiting for breaches to happen. Monitorix delivers real-time telemetry, military-grade anti-tamper protection, and instant threat isolation for your entire Windows and Linux fleet.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 reveal delay-200">
                            <button onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_40px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2">
                                Request a Live Demo <ArrowRight className="w-5 h-5" />
                            </button>
                            <button onClick={() => navigate('/login')} className="bg-transparent border-2 border-slate-600 hover:border-slate-400 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                                View Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* [Section 2: Social Proof / Trust] */}
            <section className="border-y border-slate-800 bg-[#060c22] py-12">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">Trusted by modern enterprises to secure over 100,000+ endpoints globally.</p>
                    <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 text-xl font-bold"><Layers className="w-6 h-6"/> Acorn Corp</div>
                        <div className="flex items-center gap-2 text-xl font-bold"><Network className="w-6 h-6"/> GlobalNet</div>
                        <div className="flex items-center gap-2 text-xl font-bold"><Database className="w-6 h-6"/> DataVault</div>
                        <div className="flex items-center gap-2 text-xl font-bold"><Shield className="w-6 h-6"/> SecOps Inc</div>
                    </div>
                </div>
            </section>

            {/* [Section 3: The "How It Works" Section] */}
            <section className="py-32 container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="reveal">
                        <span className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-4 block">The Monitorix Flow</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white leading-tight">
                            Invisible to your team.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600">Impenetrable to attackers.</span>
                        </h2>
                        
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-200 mb-2">The Old Way (Failing)</h3>
                                <p className="text-slate-400 leading-relaxed">Traditional antivirus relies on outdated virus signatures and slows down your computers with heavy local scanning.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">The Monitorix Solution</h3>
                                <p className="text-slate-400 leading-relaxed">Our lightweight "Sovereign Agent" connects silently to our cloud. It monitors processes, file access, and network traffic in real-time. If a threat is detected, our firewall drops like a steel door, blocking the attack before it touches your sensitive data.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Zero Configuration</h3>
                                <p className="text-slate-400 leading-relaxed">No complex firewall rules. No VPNs required. Just install the agent and you are protected instantly via outbound WebSocket tunnels.</p>
                            </div>
                        </div>
                    </div>
                    <div className="reveal relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full"></div>
                        <img src={client_architecture} alt="Client Architecture" className="w-full rounded-3xl relative z-10 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]" />
                    </div>
                </div>
            </section>

            {/* [Section 4: Feature Showcase Grid] */}
            <section className="py-24 bg-slate-900/30 border-y border-slate-800/50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20 reveal">
                        <span className="text-cyan-500 font-bold uppercase tracking-widest text-sm mb-4 block">Technical Superiority</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Built for speed. Designed for total control.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Real-Time */}
                        <div className="bg-[#0F1525] rounded-3xl border border-slate-800 p-8 flex flex-col reveal">
                            <img src={realtime_protection} alt="Real-Time Protection" className="w-full h-48 object-cover rounded-xl mb-6 shadow-lg border border-slate-700/50" />
                            <h3 className="text-2xl font-bold text-white mb-4">Instant Threat Blocking</h3>
                            <p className="text-slate-400 leading-relaxed">Powered by an ultra-fast WebSocket gateway, Monitorix detects and blocks malicious scripts in milliseconds. While other systems poll every 5 minutes, we respond in real-time.</p>
                        </div>

                        {/* Endpoint */}
                        <div className="bg-[#0F1525] rounded-3xl border border-slate-800 p-8 flex flex-col reveal delay-100">
                            <img src={endpoint_protection} alt="Endpoint Protection" className="w-full h-48 object-cover rounded-xl mb-6 shadow-lg border border-slate-700/50" />
                            <h3 className="text-2xl font-bold text-white mb-4">Unkillable Anti-Tamper</h3>
                            <p className="text-slate-400 leading-relaxed">Our agents run at the SYSTEM level with self-healing architecture. If a malicious insider or ransomware tries to uninstall the agent, it instantly locks down the machine.</p>
                        </div>

                        {/* Analytics */}
                        <div className="bg-[#0F1525] rounded-3xl border border-slate-800 p-8 flex flex-col reveal delay-200">
                            <img src={advanced_analytics} alt="Advanced Analytics" className="w-full h-48 object-cover rounded-xl mb-6 shadow-lg border border-slate-700/50" />
                            <h3 className="text-2xl font-bold text-white mb-4">Global Threat Analytics</h3>
                            <p className="text-slate-400 leading-relaxed">View your entire fleet from a single, beautiful dashboard. Track CPU spikes, unauthorized USB insertions, and network anomalies across the globe with our AI Engine.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* [Section 5: Technical Deep Dive] */}
            <section className="py-32 container mx-auto px-6 text-center">
                <div className="reveal max-w-3xl mx-auto mb-16">
                    <span className="text-indigo-500 font-bold uppercase tracking-widest text-sm mb-4 block">Architecture</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Enterprise Grade. By Design.</h2>
                    <p className="text-xl text-slate-400">
                        Monitorix operates on a strict <strong className="text-white">Zero-Trust</strong> model. Every agent connects via an encrypted Ghost-Mode Tunnel. Your multi-tenant data is strictly isolated within our Secure Cloud Vault.
                    </p>
                </div>
                <div className="reveal relative max-w-6xl mx-auto">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full"></div>
                    <img src={cinematic_topology} alt="Cinematic Zero-Trust Map" className="w-full rounded-3xl border border-slate-700 shadow-2xl relative z-10" />
                </div>
            </section>

            {/* [Section 6: The Final Push (Footer CTA)] */}
            <section className="relative py-40 border-t border-slate-800 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src={social_media_bg} alt="Monitorix Launch" className="w-full h-full object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-[#020617]/50"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
                    <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 reveal">
                        Don't wait until it's too late.<br />Secure your organization today.
                    </h2>
                    <p className="text-xl text-slate-300 mb-12 reveal delay-100">
                        Join the next generation of cyber defense. Deploy the Monitorix agent across your entire organization in under 5 minutes.
                    </p>
                    <div className="reveal delay-200">
                        <button onClick={() => navigate('/register')} className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-xl hover:bg-blue-50 transition-colors shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:scale-105 transform duration-200">
                            Schedule a 15-Minute Demo
                        </button>
                        <p className="mt-6 text-slate-400 font-semibold">No credit card required. See it live on your own machines.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-12 text-slate-500 text-sm bg-[#020617] relative z-20">
                <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <img src={logo} alt="Monitorix" className="w-6 h-6 rounded-md grayscale" />
                            <span className="font-bold text-lg text-slate-300">Monitorix</span>
                        </div>
                        <p className="mb-4">Advanced telemetry and defense for the modern enterprise.</p>
                    </div>
                    <div>
                        <h4 className="text-slate-300 font-semibold mb-4">Platform</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Endpoint Detection</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Network Analysis</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Audit & Compliance</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-slate-300 font-semibold mb-4">Resources</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">API Reference</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Security Whitepaper</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-slate-300 font-semibold mb-4">Company</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Legal & Privacy</a></li>
                        </ul>
                    </div>
                </div>
                <div className="container mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center">
                    <p>&copy; 2026 Monitorix Inc. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
