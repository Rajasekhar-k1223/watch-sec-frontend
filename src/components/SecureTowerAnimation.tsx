// Replaced 3D rotating canvas wireframe (requestAnimationFrame loop with 50 particles)
// with a lightweight static SVG shield. The original caused browser tab freezing.
import { Shield, Lock, Zap } from 'lucide-react';

export default function SecureTowerAnimation() {
    return (
        <div className="w-full h-[400px] flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <div className="relative">
                <div className="w-32 h-32 rounded-full bg-blue-500/10 border-2 border-blue-300/40 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-blue-500/15 border-2 border-blue-400/50 flex items-center justify-center">
                        <Shield className="w-10 h-10 text-blue-600" />
                    </div>
                </div>
            </div>
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-1">Monitorix Secure Core</h3>
                <p className="text-sm text-gray-500">Military-grade encryption at every layer</p>
            </div>
            <div className="flex gap-6">
                {[
                    { icon: Lock, label: 'AES-256 Encryption', color: 'text-blue-600' },
                    { icon: Zap, label: 'Real-time Threat Intel', color: 'text-purple-600' },
                    { icon: Shield, label: 'Zero-Trust Policy', color: 'text-emerald-600' },
                ].map(item => (
                    <div key={item.label} className="flex flex-col items-center gap-1">
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                        <span className="text-[10px] text-gray-500 text-center max-w-[80px]">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
