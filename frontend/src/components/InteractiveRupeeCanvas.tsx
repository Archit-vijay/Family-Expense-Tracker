import { useEffect, useRef } from "react";
import { TrendingUp, KeyRound } from "lucide-react";

interface InteractiveRupeeCanvasProps {
  className?: string;
}

export default function InteractiveRupeeCanvas({
  className = "",
}: InteractiveRupeeCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 3D transform state
  const stateRef = useRef({
    targetRotX: 0,
    targetRotY: 0,
    targetTransX: 0,
    targetTransY: 0,
    rotX: 0,
    rotY: 0,
    transX: 0,
    transY: 0,
    glareX: 50,
    glareY: 50,
    isHovered: false,
  });

  const cardTransformRef = useRef<HTMLDivElement | null>(null);
  const glareRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const badge1Ref = useRef<HTMLDivElement | null>(null);
  const badge2Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalized coordinates from -1 to 1 based on viewport distance
      const normX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth / 2)));
      const normY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight / 2)));

      stateRef.current.targetRotY = normX * 22; // max 22 deg yaw
      stateRef.current.targetRotX = -normY * 18; // max 18 deg pitch
      stateRef.current.targetTransX = normX * 16; // 16px parallax
      stateRef.current.targetTransY = normY * 12; // 12px parallax
      stateRef.current.isHovered = true;
    };

    const handleMouseLeave = () => {
      stateRef.current.targetRotX = 0;
      stateRef.current.targetRotY = 0;
      stateRef.current.targetTransX = 0;
      stateRef.current.targetTransY = 0;
      stateRef.current.isHovered = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // High performance animation loop (60-120 fps)
    let startTime = performance.now();

    const loop = (time: number) => {
      const elapsed = (time - startTime) * 0.001;
      const s = stateRef.current;

      // Ambient idle float when mouse is idle
      const idleFloatY = Math.sin(elapsed * 1.6) * 9;
      const idleRotZ = Math.cos(elapsed * 1.2) * 1.8;
      const idleRotY = Math.sin(elapsed * 0.9) * 3;

      // Damped lerp (spring physics inertia)
      s.rotX += (s.targetRotX - s.rotX) * 0.085;
      s.rotY += (s.targetRotY + idleRotY - s.rotY) * 0.085;
      s.transX += (s.targetTransX - s.transX) * 0.085;
      s.transY += (s.targetTransY + idleFloatY - s.transY) * 0.085;

      // Glare position responds to angle of light
      const targetGlareX = 50 + (s.rotY / 22) * 40;
      const targetGlareY = 50 - (s.rotX / 18) * 40;
      s.glareX += (targetGlareX - s.glareX) * 0.1;
      s.glareY += (targetGlareY - s.glareY) * 0.1;

      // Apply 3D transforms directly to DOM elements for maximum frame rate
      if (cardTransformRef.current) {
        cardTransformRef.current.style.transform = `
          translate3d(${s.transX.toFixed(2)}px, ${s.transY.toFixed(2)}px, 0px)
          rotateX(${s.rotX.toFixed(2)}deg)
          rotateY(${s.rotY.toFixed(2)}deg)
          rotateZ(${idleRotZ.toFixed(2)}deg)
        `;
      }

      // Dynamic specular glare sheen
      if (glareRef.current) {
        glareRef.current.style.background = `radial-gradient(
          circle at ${s.glareX.toFixed(1)}% ${s.glareY.toFixed(1)}%,
          rgba(255, 255, 255, 0.45) 0%,
          rgba(255, 179, 195, 0.25) 30%,
          rgba(255, 255, 255, 0) 70%
        )`;
      }

      // Dynamic physical drop shadow that opposes light direction
      if (shadowRef.current) {
        const shadowX = (-s.rotY * 1.8).toFixed(1);
        const shadowY = (45 + s.rotX * 1.4).toFixed(1);
        const shadowSpread = Math.max(20, 48 - Math.abs(idleFloatY)).toFixed(1);
        shadowRef.current.style.transform = `translate3d(${shadowX}px, ${shadowY}px, -40px) scale(${1 - idleFloatY * 0.015})`;
        shadowRef.current.style.filter = `blur(${shadowSpread}px)`;
      }

      // Floating 3D Badge 1 (AI Radar, Top Right - Higher Z-Depth)
      if (badge1Ref.current) {
        const b1X = (s.transX * 1.4).toFixed(2);
        const b1Y = (s.transY * 1.3 - idleFloatY * 0.4).toFixed(2);
        badge1Ref.current.style.transform = `translate3d(${b1X}px, ${b1Y}px, 60px) rotateX(${(s.rotX * 0.7).toFixed(2)}deg) rotateY(${(s.rotY * 0.7).toFixed(2)}deg)`;
      }

      // Floating 3D Badge 2 (Family Access Pass, Bottom Left - Deep Z-Depth)
      if (badge2Ref.current) {
        const b2X = (s.transX * 1.25).toFixed(2);
        const b2Y = (s.transY * 1.2 + idleFloatY * 0.5).toFixed(2);
        badge2Ref.current.style.transform = `translate3d(${b2X}px, ${b2Y}px, 50px) rotateX(${(s.rotX * 0.6).toFixed(2)}deg) rotateY(${(s.rotY * 0.6).toFixed(2)}deg)`;
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ perspective: 1200 }}
    >
      {/* Ambient background atmosphere */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
        {/* Soft radial blush-pink & indigo glow */}
        <div className="h-80 w-80 rounded-full bg-gradient-to-tr from-[#2a234f]/80 via-[#ffb3c3]/20 to-[#ff9fb4]/10 blur-3xl opacity-80" />
        
        {/* Subtle decorative geometric orbit ring */}
        <div className="absolute h-96 w-96 rounded-full border border-white/5 opacity-40 animate-spin-slow" />
        <div className="absolute h-80 w-80 rounded-full border border-dashed border-[#ffb3c3]/20 opacity-60" />
      </div>

      {/* 3D Perspective Card Container */}
      <div
        ref={cardTransformRef}
        className="relative flex items-center justify-center transition-transform duration-75 will-change-transform"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Contact Drop Shadow on the floor */}
        <div
          ref={shadowRef}
          className="absolute -bottom-10 h-16 w-64 rounded-full bg-[#05030a]/80 opacity-90 transition-all pointer-events-none"
        />

        {/* The 3D Solid Metallic Rupee Emblem */}
        <div className="relative h-72 w-72 sm:h-84 sm:w-84 md:h-96 md:w-96 flex items-center justify-center">
          {/* Base isolated 3D metallic render from internet/studio */}
          <img
            src="/rupee-3d.png"
            alt="3D Solid Metallic Indian Rupee"
            className="h-full w-full object-contain pointer-events-none drop-shadow-[0_20px_45px_rgba(42,35,79,0.7)]"
            draggable={false}
          />

          {/* Interactive Dynamic Specular Glare Overlayer (glints on cursor move) */}
          <div
            ref={glareRef}
            className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-65 transition-opacity duration-300"
            style={{
              maskImage: "url(/rupee-3d.png)",
              WebkitMaskImage: "url(/rupee-3d.png)",
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
            }}
          />
        </div>

        {/* 3D Parallax Floating Card 1: Top Right (AI Velocity Radar) */}
        <div
          ref={badge1Ref}
          className="absolute -top-3 -right-6 sm:-right-8 z-30 flex items-center gap-3 rounded-2xl border border-white/20 bg-[#17132f]/85 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl will-change-transform"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-white tracking-wide">AI Velocity Radar</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% On-Track Pacing
            </p>
          </div>
        </div>

        {/* 3D Parallax Floating Card 2: Bottom Left (Family Access Pass) */}
        <div
          ref={badge2Ref}
          className="absolute -bottom-6 -left-6 sm:-left-8 z-30 flex items-center gap-3 rounded-2xl border border-white/20 bg-[#17132f]/85 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl will-change-transform"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffb3c3]/20 text-[#ffb3c3] border border-[#ffb3c3]/30 shadow-inner">
            <KeyRound size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-white tracking-wide">Family Access Pass</p>
            <p className="font-mono text-xs font-extrabold text-[#ffb3c3] tracking-widest">
              K92X4P
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
