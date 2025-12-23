import { useRef, useState, MouseEvent } from 'react';

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    perspective?: number;
    scale?: number;
}

export default function TiltCard({
    children,
    className = "",
    perspective = 1000,
    scale = 1.05
}: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    const [glow, setGlow] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        // Max rotation: 15 deg
        const rotateX = yPct * -15; // Invert Y
        const rotateY = xPct * 15;

        setTransform(`
            perspective(${perspective}px) 
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg) 
            scale3d(${scale}, ${scale}, ${scale})
        `);

        setGlow({
            x: (mouseX / width) * 100,
            y: (mouseY / height) * 100,
            opacity: 1
        });
    };

    const handleMouseLeave = () => {
        setTransform(`perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`);
        setGlow(prev => ({ ...prev, opacity: 0 }));
    };

    return (
        <div
            ref={ref}
            className={`relative transition-all duration-200 ease-out transform-gpu ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform,
                transformStyle: 'preserve-3d'
            }}
        >
            {/* Glow Gradient Overlay */}
            <div
                className="absolute inset-0 z-0 rounded-[inherit] pointer-events-none transition-opacity duration-500"
                style={{
                    background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(59, 130, 246, 0.15), transparent 80%)`,
                    opacity: glow.opacity
                }}
            />

            {/* Glossy Reflection */}
            <div
                className="absolute inset-0 z-20 rounded-[inherit] pointer-events-none mix-blend-overlay opacity-0 transition-opacity duration-200"
                style={{
                    background: `linear-gradient(125deg, transparent 40%, rgba(255,255,255,0.4) 45%, transparent 50%)`,
                    backgroundPosition: `${glow.x}% ${glow.y}%`,
                    opacity: glow.opacity * 0.5
                }}
            />

            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
}
