// /src/components/ScrollSpaceParticles.tsx
import { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
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
  const [particles, setParticles] = useState<Particle[]>([]);

  // Initialize particles
  useEffect(() => {
    const particleCount = Math.floor(Math.random() * 21) + 30; // 30-50 particles
    const initialParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      initialParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5, // Slow movement
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1, // 1-3px
        opacity: Math.random() * 0.3 + 0.1, // 0.1-0.4
        opacityDirection: Math.random() > 0.5 ? 1 : -1
      });
    }

    setParticles(initialParticles);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          // Update position
          let newX = particle.x + particle.vx;
          let newY = particle.y + particle.vy;

          // Wrap around screen edges
          if (newX > canvas.width) newX = 0;
          if (newX < 0) newX = canvas.width;
          if (newY > canvas.height) newY = 0;
          if (newY < 0) newY = canvas.height;

          // Update opacity for subtle pulsing
          let newOpacity = particle.opacity + particle.opacityDirection * 0.002;
          let newOpacityDirection = particle.opacityDirection;
          
          if (newOpacity > 0.4) {
            newOpacity = 0.4;
            newOpacityDirection = -1;
          } else if (newOpacity < 0.05) {
            newOpacity = 0.05;
            newOpacityDirection = 1;
          }

          // Draw particle
          ctx.beginPath();
          ctx.arc(newX, newY, particle.size, 0, Math.PI * 2);
          
          // Gradient for glow effect
          const gradient = ctx.createRadialGradient(
            newX, newY, 0,
            newX, newY, particle.size * 2
          );
          gradient.addColorStop(0, `rgba(173, 216, 230, ${newOpacity})`); // Light blue center
          gradient.addColorStop(0.5, `rgba(255, 255, 255, ${newOpacity * 0.6})`); // White middle
          gradient.addColorStop(1, `rgba(173, 216, 230, 0)`); // Transparent edge
          
          ctx.fillStyle = gradient;
          ctx.fill();

          return {
            ...particle,
            x: newX,
            y: newY,
            opacity: newOpacity,
            opacityDirection: newOpacityDirection
          };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles.length]); // Only re-run when particle count changes

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        width: '100vw',
        height: '100vh',
      }}
      width={typeof window !== 'undefined' ? window.innerWidth : 1920}
      height={typeof window !== 'undefined' ? window.innerHeight : 1080}
    />
  );
};

export default ScrollSpaceParticles;