// /src/components/ScrollSpaceParticles.tsx
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  opacityDirection: number;
}

const ScrollSpaceParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  // Initialize particles and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI scaling properly
    const ratio = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    
    // Set the actual canvas size in memory (scaled up for high-DPI)
    canvas.width = displayWidth * ratio;
    canvas.height = displayHeight * ratio;
    
    // Scale the canvas back down using CSS
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    // Scale the drawing context so everything will work at the higher ratio
    ctx.scale(ratio, ratio);
    
    console.log('Canvas setup - Display:', displayWidth, 'x', displayHeight, 'Ratio:', ratio, 'Actual:', canvas.width, 'x', canvas.height);

    // Initialize particles
    const particleCount = 40;
    const particles: Particle[] = [];
    
    console.log('Initializing particles:', particleCount, 'Canvas size:', canvas.width, canvas.height);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * displayWidth,
        y: Math.random() * displayHeight,
        vx: (Math.random() - 0.5) * 6, // Much faster movement
        vy: (Math.random() - 0.5) * 6,
        size: 50, // MASSIVE 50px circles
        opacity: 1, // Fully opaque
        opacityDirection: Math.random() > 0.5 ? 1 : -1
      });
    }

    particlesRef.current = particles;
    console.log('Particles stored:', particles.length, 'First particle:', particles[0]);

    // Animation loop
    const animate = () => {
      // Clear canvas completely (no trail effect) - use display dimensions
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around screen edges (use display dimensions, not canvas dimensions)
        if (particle.x > displayWidth) particle.x = 0;
        if (particle.x < 0) particle.x = displayWidth;
        if (particle.y > displayHeight) particle.y = 0;
        if (particle.y < 0) particle.y = displayHeight;

        // Update opacity for pulsing
        particle.opacity += particle.opacityDirection * 0.02;
        
        if (particle.opacity > 1) {
          particle.opacity = 1;
          particle.opacityDirection = -1;
        } else if (particle.opacity < 0.7) {
          particle.opacity = 0.7;
          particle.opacityDirection = 1;
        }

        // Draw as bright rectangles to test
        ctx.fillStyle = 'rgba(255, 0, 0, 1)'; // Bright red
        ctx.fillRect(particle.x - particle.size, particle.y - particle.size, particle.size * 2, particle.size * 2);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return React.createElement('canvas', {
    ref: canvasRef,
    className: 'fixed inset-0 pointer-events-none',
    style: {
      zIndex: 5,
      width: '100vw',
      height: '100vh',
      background: 'rgba(255, 0, 0, 0.1)', // Slight red tint to see the canvas
      border: '5px solid red' // Red border to confirm canvas position
    }
  });
};

export default ScrollSpaceParticles;