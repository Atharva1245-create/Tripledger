import React, { useEffect, useRef } from 'react';

export interface GhostFibersProps {
  lineColor?: string;
  glowColor?: string;
  goldGlowColor?: string;
  speed?: number;
  scale?: number;
  rotation?: number;
  rotationSpeed?: number;
  layers?: number;
  waveAmplitude?: number;
  waveFrequency?: number;
  waveSpeed?: number;
  layerSpeed?: number;
  twist?: number;
  twistFrequency?: number;
  twistSpeed?: number;
  lineFrequency?: number;
  lineSpacing?: number;
  lineSharpness?: number;
  glowFalloff?: number;
  glowIntensity?: number;
  brightness?: number;
  blueBoost?: number;
  vignette?: number;
  grain?: number;
  dpr?: number;
  lightMode?: boolean;
  fps?: number;
  paused?: boolean;
}

export const GhostFibers: React.FC<GhostFibersProps> = ({
  lineColor = "#3D1B5B",      // Deep Plum matching TripLedger UI
  glowColor = "#8E58A6",      // Soft Lavender Glow
  goldGlowColor = "#D5BD97",  // Warm Gold Glow
  speed = 0.2,
  scale = 2,
  rotation = 0,
  rotationSpeed = 0.25,
  layers = 4,
  waveAmplitude = 0.015,
  waveFrequency = 3,
  waveSpeed = 0.15,
  layerSpeed = 0.08,
  twist = 0.1,
  twistFrequency = 5,
  twistSpeed = 1.2,
  lineFrequency = 5,
  lineSpacing = 2,
  glowIntensity = 1.6,
  brightness = 2,
  vignette = 0.8,
  paused = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      if (!ctx || !canvas) return;

      time += speed * 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const cX = width / 2;
      const cY = height / 2;

      // Draw multi-layered organic flowing ghost fiber lines
      for (let l = 0; l < layers; l++) {
        const layerOffset = l * (Math.PI / layers);
        const lSpeed = time * (1 + l * layerSpeed);

        ctx.save();
        ctx.translate(cX, cY);
        ctx.rotate(rotation + time * rotationSpeed * 0.1 + layerOffset * 0.2);
        ctx.translate(-cX, -cY);

        ctx.beginPath();
        const numLines = lineFrequency * 6;

        for (let i = 0; i < numLines; i++) {
          const progress = i / numLines;
          const yBase = cY + (progress - 0.5) * height * scale;

          ctx.moveTo(0, yBase);

          for (let x = 0; x <= width; x += 15) {
            const normX = x / width;
            const wave1 = Math.sin(normX * waveFrequency * Math.PI + lSpeed * waveSpeed * 10 + layerOffset) * (height * waveAmplitude * 10);
            const wave2 = Math.cos(normX * twistFrequency * Math.PI - lSpeed * twistSpeed * 5) * (twist * 80);
            const y = yBase + wave1 + wave2;

            ctx.lineTo(x, y);
          }
        }

        // Apply TripLedger Harmonized Gradient Line & Glow
        const grad = ctx.createLinearGradient(0, 0, width, height);
        if (l % 2 === 0) {
          grad.addColorStop(0, `${lineColor}15`);
          grad.addColorStop(0.5, `${glowColor}40`);
          grad.addColorStop(1, `${goldGlowColor}20`);
        } else {
          grad.addColorStop(0, `${goldGlowColor}10`);
          grad.addColorStop(0.5, `${glowColor}30`);
          grad.addColorStop(1, `${lineColor}30`);
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth = lineSpacing * (1 + l * 0.5);
        ctx.shadowBlur = 15 * glowIntensity;
        ctx.shadowColor = l % 2 === 0 ? glowColor : goldGlowColor;
        ctx.stroke();

        ctx.restore();
      }

      if (!paused) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [
    lineColor, glowColor, goldGlowColor, speed, scale, rotation, rotationSpeed,
    layers, waveAmplitude, waveFrequency, waveSpeed, layerSpeed, twist,
    twistFrequency, twistSpeed, lineFrequency, lineSpacing, glowIntensity, paused
  ]);

  return (
    <div className="w-full h-full relative overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default GhostFibers;
