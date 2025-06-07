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
    const particleCount = 40; // Fixed count for consistency
    const initialParticles: Particle[] = [];
    
    console.log('Initializing particles:', particleCount); // Debug log

    for (let i = 0; i < particleCount; i++) {
      initialParticles.push({
        id: i,
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
        vx: (Math.random() - 0.5) * 2, // Much faster movement
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 2, // 2-5px (bigger)
        opacity: Math.random() * 0.6 + 0.2, // 0.2-0.8 (much more visible)
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

          // Update opacity for more noticeable pulsing
          let newOpacity = particle.opacity + particle.opacityDirection * 0.01;
          let newOpacityDirection = particle.opacityDirection;
          
          if (newOpacity > 0.8) {
            newOpacity = 0.8;
            newOpacityDirection = -1;
          } else if (newOpacity < 0.2) {
            newOpacity = 0.2;
            newOpacityDirection = 1;
          }

          // Draw particle
          ctx.beginPath();
          ctx.arc(newX, newY, particle.size, 0, Math.PI * 2);
          
          // Enhanced gradient for stronger glow effect
          const gradient = ctx.createRadialGradient(
            newX, newY, 0,
            newX, newY, particle.size * 4
          );
          gradient.addColorStop(0, `rgba(100, 255, 150, ${newOpacity})`); // Bright green center
          gradient.addColorStop(0.3, `rgba(150, 255, 200, ${newOpacity * 0.8})`); // Light green
          gradient.addColorStop(0.6, `rgba(200, 255, 255, ${newOpacity * 0.4})`); // Cyan
          gradient.addColorStop(1, `rgba(100, 255, 150, 0)`); // Transparent edge
          
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