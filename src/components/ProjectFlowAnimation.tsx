// Replaced 3 setInterval spawners + requestAnimationFrame canvas loop
// with a lightweight static CSS diagram. The original was causing browser tab freezing.
export default function ProjectFlowAnimation() {
    const steps = [
        { label: 'Agent A', color: '#64748b', icon: '💻' },
        { label: 'Agent B', color: '#64748b', icon: '💻' },
        { label: 'Agent C', color: '#64748b', icon: '💻' },
        { label: 'Gateway', color: '#3b82f6', icon: '🌐' },
        { label: 'Analysis', color: '#a855f7', icon: '🔍' },
        { label: 'Dashboard', color: '#f59e0b', icon: '📊' },
    ];

    return (
        <div className="w-full py-10 px-6 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-center gap-2 flex-wrap">
                {steps.map((step, i) => (
                    <div key={step.label} className="flex items-center gap-2">
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2"
                                style={{ borderColor: step.color, background: step.color + '15' }}
                            >
                                {step.icon}
                            </div>
                            <span className="text-[10px] font-semibold text-gray-500">{step.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className="text-gray-300 text-lg pb-4">→</div>
                        )}
                    </div>
                ))}
            </div>
            <div className="flex justify-center gap-6 mt-6">
                {[
                    { dot: '#3b82f6', text: 'Ingestion Rate: 1.2 GB/s' },
                    { dot: '#a855f7', text: 'Threat Analysis: Active' },
                    { dot: '#10b981', text: 'Storage: AES-256' },
                ].map(item => (
                    <div key={item.text} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-2 h-2 rounded-full" style={{ background: item.dot }}></span>
                        {item.text}
                    </div>
                ))}
            </div>
        </div>
    );
}
