// TiltCard: disabled 3D GPU transforms — were firing setState on every mousemove
// across 17+ cards simultaneously, causing jank and frozen cursors.
// Replaced with a simple hover scale via CSS only (zero JS on mouse move).
import type { ReactNode } from 'react';

interface TiltCardProps {
    children: ReactNode;
    className?: string;
    perspective?: number;
    scale?: number;
}

export default function TiltCard({ children, className = "" }: TiltCardProps) {
    return (
        <div className={`transition-transform duration-200 hover:scale-[1.02] ${className}`}>
            {children}
        </div>
    );
}
