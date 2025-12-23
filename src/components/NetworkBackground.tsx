import { useEffect, useRef } from 'react';

interface NetworkBackgroundProps {
    nodeCount?: number;
    connectionDistance?: number;
    particleColor?: string;
    lineColor?: string;
}

export default function NetworkBackground({
    nodeCount = 70,
    connectionDistance = 180,
    particleColor = "rgba(59, 130, 246, 0.8)", // Blue-500
    lineColor = "rgba(59, 130, 246, 0.15)"
}: NetworkBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        let height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

        const particles: { x: number, y: number, vx: number, vy: number, size: number, pulse: number }[] = [];

        // Initialize particles
        for (let i = 0; i < nodeCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3, // Slower base movement
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 1,
                pulse: Math.random() * Math.PI
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Mouse Interaction Ring
            const mouseX = mouseRef.current.x;
            const mouseY = mouseRef.current.y;

            // Update and draw particles
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += 0.05;

                // Bounce off walls
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // React to mouse
                const dxMouse = p.x - mouseX;
                const dyMouse = p.y - mouseY;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
                if (distMouse < 250) {
                    // Gentle push away or pull towards? Let's do connections
                    if (distMouse < 200) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 * (1 - distMouse / 200)})`; // Purple connection to mouse
                        ctx.lineWidth = 1;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(mouseX, mouseY);
                        ctx.stroke();
                    }
                }

                // Draw Particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = particleColor;
                ctx.fill();

                // Occasional Pulse
                if (Math.sin(p.pulse) > 0.95) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(59, 130, 246, 0.2)`;
                    ctx.fill();
                }

                // Draw Particle-to-Particle Connections
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = lineColor;
                        ctx.lineWidth = 1 - distance / connectionDistance;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        const handleResize = () => {
            width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
            height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
        }
    }, [nodeCount, connectionDistance, particleColor, lineColor]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0"
            style={{ width: '100%', height: '100%' }}
        />
    );
}
