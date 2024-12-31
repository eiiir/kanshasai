import React, { useEffect, useRef } from "react";

const Fireworks: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set up canvas dimensions
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Array to hold fireworks particles
        const particles: Particle[] = [];

        interface Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            alpha: number; // Opacity
            color: string;
        }

        // Generate a random number in a range
        const random = (min: number, max: number) => Math.random() * (max - min) + min;

        // Create a firework explosion
        const createFirework = (x: number, y: number) => {
            const colors = ["#ff4c4c", "#ffbb33", "#4caf50", "#2196f3", "#9c27b0", "#ff5722"];
            const numParticles = 50;

            for (let i = 0; i < numParticles; i++) {
                const angle = random(0, Math.PI * 2);
                const speed = random(2, 5);
                particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: 1,
                    color: colors[Math.floor(random(0, colors.length))],
                });
            }
        };

        // Animation loop
        const animate = () => {
            if (!ctx) return;

            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];

                // Update particle position and fade it out
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.02;

                // Remove particles that are no longer visible
                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${hexToRgb(p.color)}, ${p.alpha})`;
                ctx.fill();
            }

            // Launch new fireworks randomly
            if (Math.random() < 0.05) {
                createFirework(random(0, canvas.width), random(0, canvas.height / 2));
            }

            requestAnimationFrame(animate);
        };

        // Helper: Convert hex color to RGB
        const hexToRgb = (hex: string) => {
            const bigint = parseInt(hex.slice(1), 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return `${r}, ${g}, ${b}`;
        };

        // Start animation
        animate();

        // Resize canvas on window resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, pointerEvents: "none", /*Added to allow interactions with components behind */ }} />;
};

export default Fireworks;
