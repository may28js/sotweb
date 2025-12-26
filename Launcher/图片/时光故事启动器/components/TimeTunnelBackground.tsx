import React, { useEffect, useRef } from 'react';

const TimeTunnelBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    // Vortex center: Top-Right (approx 70% right, 30% down)
    let cx = width * 0.7; 
    let cy = height * 0.3;

    let time = 0;
    let animationFrameId: number;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      cx = width * 0.7;
      cy = height * 0.3;
    };

    window.addEventListener('resize', resize);
    resize();

    // Palette: Cool Cyans, Deep Violets, Whites (Reference Image style)
    const COLORS = [
      '#22d3ee', // Cyan-400 (Glowing energy)
      '#67e8f9', // Cyan-300
      '#a78bfa', // Violet-400
      '#8b5cf6', // Violet-500
      '#c084fc', // Purple-400
      '#1e3a8a', // Blue-900 (Dark debris)
      '#e0f2fe', // Sky-100 (Highlights)
    ];

    interface Particle {
      angle: number;
      radius: number;
      speed: number;
      size: number;
      color: string;
      alpha: number;
      rotation: number;
      rotationSpeed: number;
      z: number; // Depth
    }

    const getMaxDist = () => {
        const dx = Math.max(cx, width - cx);
        const dy = Math.max(cy, height - cy);
        return Math.sqrt(dx * dx + dy * dy);
    };

    const createParticle = (startAtEdge = false): Particle => {
      const currentMaxDist = getMaxDist();
      const r = startAtEdge ? currentMaxDist : Math.random() * currentMaxDist;
      
      return {
        angle: Math.random() * Math.PI * 2,
        radius: r,
        // Slower movement for a "floating in space" feel
        speed: 0.1 + Math.random() * 0.3, 
        size: Math.random() * 15 + 5, // 5px to 20px blocks
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.5 + 0.1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        z: Math.random() * 0.5 + 0.5
      };
    };

    const particles: Particle[] = [];
    const PARTICLE_COUNT = 120;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }

    // Helper to draw a pseudo-3D Cube
    const drawCube = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, color: string, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      const adjustedSize = size; // Could scale by Z if fully 3D, but simple is fine
      
      // Main Face
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(-adjustedSize/2, -adjustedSize/2, adjustedSize, adjustedSize);
      
      // Side Face (Simulate depth)
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = '#000000'; // Shadow overlay
      ctx.beginPath();
      ctx.moveTo(adjustedSize/2, -adjustedSize/2);
      ctx.lineTo(adjustedSize/2 + adjustedSize*0.2, -adjustedSize/2 - adjustedSize*0.2);
      ctx.lineTo(adjustedSize/2 + adjustedSize*0.2, adjustedSize/2 - adjustedSize*0.2);
      ctx.lineTo(adjustedSize/2, adjustedSize/2);
      ctx.fill();
      
      // Top Face
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = '#ffffff'; // Highlight overlay
      ctx.globalCompositeOperation = 'overlay';
      ctx.beginPath();
      ctx.moveTo(-adjustedSize/2, -adjustedSize/2);
      ctx.lineTo(-adjustedSize/2 + adjustedSize*0.2, -adjustedSize/2 - adjustedSize*0.2);
      ctx.lineTo(adjustedSize/2 + adjustedSize*0.2, -adjustedSize/2 - adjustedSize*0.2);
      ctx.lineTo(adjustedSize/2, -adjustedSize/2);
      ctx.fill();

      // Reset composite
      ctx.globalCompositeOperation = 'source-over';

      // Glow
      if (alpha > 0.3) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = color;
      }
      
      ctx.restore();
    };

    const render = () => {
      time += 0.005;
      ctx.clearRect(0, 0, width, height);
      
      const currentMaxDist = getMaxDist();

      // --- Layer 1: The "Vortex" Tunnel (Smoky texture) ---
      // We draw large rotating gradients
      
      ctx.save();
      ctx.translate(cx, cy);
      
      // Dark Core
      const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 300);
      coreGradient.addColorStop(0, 'rgba(15, 5, 24, 0)');
      coreGradient.addColorStop(1, 'rgba(15, 5, 24, 0.8)');
      
      // Swirl 1 (Cyan/Blue)
      ctx.rotate(time * 0.5);
      const swirl1 = ctx.createRadialGradient(0, 0, 50, 0, 0, currentMaxDist);
      swirl1.addColorStop(0, 'rgba(34, 211, 238, 0)'); // Inner transparent
      swirl1.addColorStop(0.2, 'rgba(34, 211, 238, 0.05)'); // Cyan hint
      swirl1.addColorStop(0.6, 'rgba(59, 130, 246, 0.02)'); // Blue hint
      swirl1.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = swirl1;
      // Draw a "fan" or arc to simulate swirl
      ctx.beginPath();
      ctx.arc(0, 0, currentMaxDist, 0, Math.PI * 2);
      ctx.fill();

      // Swirl 2 (Violet) - Rotating opposite
      ctx.rotate(-time * 0.8);
      const swirl2 = ctx.createRadialGradient(50, 50, 50, 0, 0, currentMaxDist * 0.8);
      swirl2.addColorStop(0, 'rgba(139, 92, 246, 0)');
      swirl2.addColorStop(0.3, 'rgba(139, 92, 246, 0.08)');
      swirl2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = swirl2;
      ctx.fillRect(-currentMaxDist, -currentMaxDist, currentMaxDist*2, currentMaxDist*2);

      ctx.restore();

      // --- Layer 2: The "Light" at the end of the tunnel ---
      // Bright Cyan/White glow
      ctx.globalCompositeOperation = 'screen';
      // Enhanced glow: increased radius from 250 to 350
      const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 350);
      centerGlow.addColorStop(0, 'rgba(207, 250, 254, 0.9)'); // Almost white cyan core
      // Expanded core brightness area: 0.15 -> 0.25
      centerGlow.addColorStop(0.25, 'rgba(34, 211, 238, 0.55)'); // Stronger Cyan
      // Extended outer glow
      centerGlow.addColorStop(0.6, 'rgba(124, 58, 237, 0.35)'); // Violet
      centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = centerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 350, 0, Math.PI * 2); // Matched arc radius to gradient radius
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';


      // --- Layer 3: Particles (Debris) ---
      particles.forEach((p, i) => {
        // Update physics
        // Calculate normalized distance (0 = center, 1 = edge)
        const dist = p.radius / currentMaxDist;
        
        // Move towards center. Speed increases slightly as it gets closer, but then slows down at the very center to "fade into the light"
        const speedMultiplier = 1 + (1 - dist);
        p.radius -= p.speed * speedMultiplier;
        
        // Spiral motion
        p.angle += 0.002 * speedMultiplier;
        p.rotation += p.rotationSpeed;

        // Reset if sucked in
        if (p.radius <= 10) {
          particles[i] = createParticle(true);
          return;
        }

        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;
        
        // Fade out near edges and very near center
        let alpha = p.alpha;
        if (dist > 0.8) alpha *= (1 - dist) * 5; // Fade in from edge
        if (dist < 0.1) alpha *= dist * 10; // Fade out to center

        drawCube(ctx, x, y, p.size * p.z, p.rotation, p.color, alpha);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none mix-blend-screen"
    />
  );
};

export default TimeTunnelBackground;