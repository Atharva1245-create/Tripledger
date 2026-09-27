import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SplashLoaderProps {
  onComplete?: () => void;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsFinished(true);
            if (onComplete) onComplete();
          }, 500);
          return 100;
        }
        return prev + 4;
      });
    }, 80);

    return () => clearInterval(timer);
  }, [onComplete]);

  if (isFinished) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#1C092B] via-[#3D1B5B] to-[#12051E] text-white overflow-hidden transition-opacity duration-700">
      {/* 3D Depth Background Grid */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#D5BD97_1.5px,transparent_1.5px)] [background-size:32px_32px] pointer-events-none"></div>

      {/* 3D Perspective Scene Container */}
      <div className="relative w-96 h-96 flex items-center justify-center [perspective:1200px]">
        
        {/* 3D Inclined Orbit Stage */}
        <div className="relative w-80 h-80 flex items-center justify-center [transform-style:preserve-3d] [transform:rotateX(68deg)_rotateY(-16deg)]">
          
          {/* 3D Orbit Track Rings */}
          <div className="absolute w-[300px] h-[300px] rounded-full border-2 border-dashed border-[#D5BD97]/30 shadow-[0_0_30px_rgba(213,189,151,0.2)]"></div>

          {/* 3D Orbiting Airplane Container */}
          <div className="absolute inset-0 animate-3d-orbit [transform-style:preserve-3d]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]">
              <div className="relative [transform:rotateX(-65deg)_rotateY(25deg)_rotateZ(90deg)]">
                {/* 3D Jet Glow Trail */}
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-16 h-4 bg-gradient-to-r from-transparent via-[#D5BD97]/60 to-white rounded-full blur-xs"></div>

                {/* 3D SVG Airplane */}
                <svg width="64" height="64" viewBox="0 0 64 64" className="drop-shadow-[0_10px_15px_rgba(0,0,0,0.7)]">
                  <defs>
                    <linearGradient id="planeBody" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="60%" stopColor="#E2D1ED" />
                      <stop offset="100%" stopColor="#8E58A6" />
                    </linearGradient>
                    <linearGradient id="wingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#D5BD97" />
                      <stop offset="100%" stopColor="#3D1B5B" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M 32 4 
                       C 35 12, 37 22, 37 32 
                       L 60 48 
                       L 60 53 
                       L 37 44 
                       L 36 58 
                       L 44 64 
                       L 32 61 
                       L 20 64 
                       L 28 58 
                       L 27 44 
                       L 4 53 
                       L 4 48 
                       L 27 32 
                       C 27 22, 29 12, 32 4 Z"
                    fill="url(#planeBody)"
                    stroke="#1F0B30"
                    strokeWidth="1.5"
                  />
                  <path d="M 32 20 L 52 46 L 46 47 Z" fill="url(#wingGrad)" />
                  <path d="M 32 20 L 12 46 L 18 47 Z" fill="url(#wingGrad)" />
                  <circle cx="32" cy="62" r="3" fill="#D5BD97" className="animate-pulse" />
                </svg>
              </div>
            </div>
          </div>

        </div>

        {/* Center 3D Brand Badge */}
        <div className="absolute z-30 flex flex-col items-center justify-center [transform:translateZ(40px)]">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#D5BD97] via-[#F3EAF8] to-white text-[#3D1B5B] flex items-center justify-center shadow-[0_15px_35px_rgba(61,27,91,0.5)] border-2 border-white/50 backdrop-blur-md">
            <Sparkles className="w-10 h-10 fill-current text-[#3D1B5B]" />
          </div>
        </div>

      </div>

      {/* Brand Title & Tagline */}
      <div className="text-center space-y-2 z-30 max-w-sm px-4 -mt-4">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
          TripLedger
        </h1>
        <p className="text-xs text-purple-200 font-medium tracking-wide">
          "Your trip. Your expenses. One smart ledger."
        </p>
      </div>

      {/* Progress & Flight Status */}
      <div className="w-64 mt-8 space-y-2 z-30">
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden p-0.5 border border-white/10 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#D5BD97] to-[#F3EAF8] rounded-full transition-all duration-150 ease-out shadow-lg"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[11px] text-purple-300 font-mono font-medium">
          <span>3D Flight Orbit...</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
};
