import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

export interface ElectricLogoProps {
  src?: string;
  color?: string;
  glowColor?: string;
  scale?: number;
  strands?: number;
  bend?: number;
  crackle?: number;
  arcs?: number;
  speed?: number;
  interactive?: boolean;
  intensity?: number;
  glow?: number;
  thickness?: number;
  flicker?: number;
  fill?: number;
  cursorIntensity?: number;
  cursorRadius?: number;
  glowIntensity?: number;
}

export const ElectricLogo: React.FC<ElectricLogoProps> = ({
  src,
  color = "#D5BD97",
  glowColor = "#8E58A6",
  scale = 0.7,
  strands = 4,
  bend = 0.6,
  crackle = 1.5,
  arcs = 1,
  speed = 2.5,
  interactive = true,
  intensity = 1,
  glow = 1,
  thickness = 1.5,
  flicker = 0.6,
  cursorIntensity = 0.75,
  cursorRadius = 100,
  glowIntensity = 1.6
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cursor, setCursor] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      if (!containerRef.current) return;
      canvas.width = containerRef.current.clientWidth || 400;
      canvas.height = containerRef.current.clientHeight || 400;
    };

    resize();
    window.addEventListener('resize', resize);

    // Mouse movement interaction
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCursor({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    const containerEl = containerRef.current;
    if (containerEl && interactive) {
      containerEl.addEventListener('mousemove', handleMouseMove);
    }

    // Helper to generate jittery lightning arc points
    const generateArcPoints = (
      x1: number, y1: number,
      x2: number, y2: number,
      displace: number
    ) => {
      const points = [{ x: x1, y: y1 }];
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      const normalX = -(y2 - y1);
      const normalY = x2 - x1;
      const len = Math.hypot(normalX, normalY) || 1;

      const offset = (Math.random() - 0.5) * displace;
      const px = midX + (normalX / len) * offset;
      const py = midY + (normalY / len) * offset;

      points.push({ x: px, y: py });
      points.push({ x: x2, y: y2 });
      return points;
    };

    const draw = () => {
      if (!ctx || !canvas) return;

      time += speed * 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cX = canvas.width / 2;
      const cY = canvas.height / 2;
      const baseRadius = Math.min(canvas.width, canvas.height) * 0.3 * scale;

      // Draw Crackling Outer Glow Aura
      const auraGrad = ctx.createRadialGradient(cX, cY, baseRadius * 0.5, cX, cY, baseRadius * 1.8);
      auraGrad.addColorStop(0, `${glowColor}40`);
      auraGrad.addColorStop(0.6, `${color}20`);
      auraGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cX, cY, baseRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Render Electric Plasma Strands
      for (let s = 0; s < strands; s++) {
        const strandAngle = (s / strands) * Math.PI * 2 + time * 0.8;
        const currentRadius = baseRadius + Math.sin(time * 3 + s) * 8 * bend;

        const startX = cX + Math.cos(strandAngle) * (currentRadius * 0.4);
        const startY = cY + Math.sin(strandAngle) * (currentRadius * 0.4);
        const endX = cX + Math.cos(strandAngle) * currentRadius;
        const endY = cY + Math.sin(strandAngle) * currentRadius;

        const points = generateArcPoints(startX, startY, endX, endY, 18 * crackle);

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * (0.8 + Math.random() * flicker * 0.8);
        ctx.shadowBlur = 16 * glow;
        ctx.shadowColor = glowColor;
        ctx.stroke();
      }

      // Cursor Interactive Arc Interaction
      if (interactive && cursor.x > 0 && cursor.y > 0) {
        const dist = Math.hypot(cursor.x - cX, cursor.y - cY);
        if (dist < cursorRadius * 1.8) {
          const arcPoints = generateArcPoints(cX, cY, cursor.x, cursor.y, 25 * crackle);

          ctx.beginPath();
          ctx.moveTo(arcPoints[0].x, arcPoints[0].y);
          for (let i = 1; i < arcPoints.length; i++) {
            ctx.lineTo(arcPoints[i].x, arcPoints[i].y);
          }

          ctx.strokeStyle = color;
          ctx.lineWidth = thickness * 1.8 * cursorIntensity;
          ctx.shadowBlur = 24 * glowIntensity;
          ctx.shadowColor = glowColor;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      if (containerEl && interactive) {
        containerEl.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [color, glowColor, scale, strands, bend, crackle, arcs, speed, interactive, intensity, glow, thickness, flicker, cursorIntensity, cursorRadius, glowIntensity, cursor]);

  return (
    <div ref={containerRef} className="w-full h-full relative flex items-center justify-center overflow-hidden">
      {/* Background Canvas for Plasma Lightning */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Center Logo Graphic / Icon */}
      <div className="relative z-10 flex items-center justify-center">
        {src ? (
          <img src={src} alt="Electric Logo" className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(213,189,151,0.8)]" />
        ) : (
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#3D1B5B] via-[#4D2375] to-[#8E58A6] text-[#D5BD97] flex items-center justify-center shadow-[0_0_35px_rgba(142,88,166,0.7)] border-2 border-[#D5BD97]/60">
            <Sparkles className="w-12 h-12 fill-current animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectricLogo;
