import { useEffect, useRef } from 'react';

export default function SecureTowerAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.parentElement?.clientWidth || 800;
        let height = canvas.height = 600;

        // 3D Point
        interface Point3D { x: number, y: number, z: number }

        // Cube definition
        const createCube = (size: number, yOffset: number): Point3D[] => {
            const h = size / 2;
            return [
                { x: -h, y: yOffset - h, z: -h }, { x: h, y: yOffset - h, z: -h }, { x: h, y: yOffset + h, z: -h }, { x: -h, y: yOffset + h, z: -h }, // Front
                { x: -h, y: yOffset - h, z: h }, { x: h, y: yOffset - h, z: h }, { x: h, y: yOffset + h, z: h }, { x: -h, y: yOffset + h, z: h }   // Back
            ];
        };

        // Tower stack
        const cubes = [
            ...createCube(60, -80),
            ...createCube(80, 0),
            ...createCube(60, 80)
        ];

        // Shield Particles
        const particles: { angle: number, y: number, r: number, speed: number, size: number, color: string }[] = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                angle: Math.random() * Math.PI * 2,
                y: (Math.random() - 0.5) * 300,
                r: 100 + Math.random() * 50,
                speed: 0.02 + Math.random() * 0.03,
                size: Math.random() * 3 + 1,
                color: Math.random() > 0.5 ? '#3b82f6' : '#a855f7' // Blue or Purple
            });
        }

        // Project 3D to 2D
        const project = (p: Point3D, center: { x: number, y: number }, scale: number = 400) => {
            const perspective = scale / (scale + p.z);
            return {
                x: p.x * perspective + center.x,
                y: p.y * perspective + center.y,
                scale: perspective
            };
        };

        // Rotate point around Y axis
        const rotateY = (p: Point3D, angle: number): Point3D => {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return {
                x: p.x * cos - p.z * sin,
                y: p.y,
                z: p.x * sin + p.z * cos
            };
        };

        // Rotate point around X axis (tilt)
        const rotateX = (p: Point3D, angle: number): Point3D => {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return {
                x: p.x,
                y: p.y * cos - p.z * sin,
                z: p.y * sin + p.z * cos
            };
        };

        let angle = 0;

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            const center = { x: width / 2, y: height / 2 };
            angle += 0.01;

            // Draw Shield/Data Particles (Back)
            particles.filter(p => Math.cos(p.angle + angle) < 0).forEach(p => {
                const x = center.x + Math.cos(p.angle + angle) * p.r;
                const y = center.y + p.y;
                const zScale = (Math.sin(p.angle + angle) + 2) / 3; // Fake depth scale

                ctx.beginPath();
                ctx.arc(x, y, p.size * zScale, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = 0.3 * zScale;
                ctx.fill();
                ctx.globalAlpha = 1;

                // Move vertical slightly
                p.y += Math.sin(angle) * 0.5;
            });

            // Draw Tower (Wireframe)
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';

            // Define edges indices for a cube
            const edges = [
                [0, 1], [1, 2], [2, 3], [3, 0], // Front Face
                [4, 5], [5, 6], [6, 7], [7, 4], // Back Face
                [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting edges
            ];

            // Render 3 stacked cubes
            // Note: Our `cubes` array is just points. We know every 8 points is a cube.
            for (let c = 0; c < 3; c++) {
                const offset = c * 8;
                const cubePoints = cubes.slice(offset, offset + 8).map(p => {
                    let rot = rotateY(p, angle);
                    rot = rotateX(rot, 0.2); // Tilt slightly
                    return project(rot, center);
                });

                ctx.beginPath();
                edges.forEach((edge) => {
                    const p1 = cubePoints[edge[0]];
                    const p2 = cubePoints[edge[1]];
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                });

                ctx.shadowBlur = 10;
                ctx.shadowColor = '#3b82f6';
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Fill faces (semi-transparent) to look solid
                // Front face approximation
                ctx.fillStyle = 'rgba(30, 64, 175, 0.3)';
                // A simple fill of the bounding box or specific faces is hard without hidden surface removal.
                // Let's purely stick to wireframe "hologram" look which works better for "secure data"
            }

            // Draw Shield/Data Particles (Front)
            particles.filter(p => Math.cos(p.angle + angle) >= 0).forEach(p => {
                const x = center.x + Math.cos(p.angle + angle) * p.r;
                const y = center.y + p.y;
                const zScale = (Math.sin(p.angle + angle) + 2) / 3;

                ctx.beginPath();
                ctx.arc(x, y, p.size * zScale, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = 0.8 * zScale;
                ctx.fill();
                ctx.globalAlpha = 1;

                // Connections to central tower
                if (Math.random() > 0.98) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(center.x, center.y + p.y * 0.5); // Beam to tower
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 1;
                    ctx.globalAlpha = 0.4;
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            });

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        const handleResize = () => {
            width = canvas.width = canvas.parentElement?.clientWidth || 800;
            height = canvas.height = 600;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    return (
        <div className="w-full h-[600px] flex items-center justify-center relative perspective-container">
            <canvas ref={canvasRef} className="absolute inset-0 z-10" />
            <div className="absolute inset-0 bg-gradient-radial from-blue-900/20 to-transparent z-0"></div>
        </div>
    );
}
