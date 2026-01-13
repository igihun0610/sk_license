"use client";

import { forwardRef, useState, useEffect, useCallback, useRef } from "react";

interface LicenseCardProps {
  name: string;
  company: string;
  commitment: string;
  photoUrl: string;
}

const LicenseCard = forwardRef<HTMLDivElement, LicenseCardProps>(
  ({ name, company, commitment, photoUrl }, ref) => {
    const today = new Date();
    const issueDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}`;

    // 3D tilt state
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [isGyroActive, setIsGyroActive] = useState(false);
    const [needsPermission, setNeedsPermission] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Refs for smooth animation
    const targetTilt = useRef({ x: 0, y: 0 });
    const animationRef = useRef<number | null>(null);

    // Check if mobile device
    useEffect(() => {
      const checkMobile = () => {
        const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(mobile);
      };
      checkMobile();
    }, []);

    // Smooth animation loop using lerp
    useEffect(() => {
      const animate = () => {
        setTilt(prev => {
          const lerpFactor = 0.15; // Smoothing factor (0-1, lower = smoother)
          const newX = prev.x + (targetTilt.current.x - prev.x) * lerpFactor;
          const newY = prev.y + (targetTilt.current.y - prev.y) * lerpFactor;

          // Only update if there's significant change
          if (Math.abs(newX - prev.x) > 0.01 || Math.abs(newY - prev.y) > 0.01) {
            return { x: newX, y: newY };
          }
          return prev;
        });
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, []);

    // Handle device orientation for mobile gyro
    const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
      const { beta, gamma } = event;
      if (beta !== null && gamma !== null) {
        setIsGyroActive(true);
        // Smoother tilt calculation with reduced sensitivity
        const tiltX = Math.max(-12, Math.min(12, gamma * 0.3));
        const tiltY = Math.max(-12, Math.min(12, (beta - 45) * 0.3));
        targetTilt.current = { x: tiltX, y: tiltY };
      }
    }, []);

    // Request permission for iOS 13+
    const requestGyroPermission = useCallback(async () => {
      const DeviceOrientationEventTyped = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };

      if (typeof DeviceOrientationEventTyped.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEventTyped.requestPermission();
          if (permission === 'granted') {
            setNeedsPermission(false);
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (error) {
          console.error('Gyro permission denied:', error);
        }
      }
    }, [handleOrientation]);

    // Initialize gyro on mount
    useEffect(() => {
      if (typeof window === 'undefined') return;

      const DeviceOrientationEventTyped = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };

      // Check if iOS needs permission
      if (typeof DeviceOrientationEventTyped.requestPermission === 'function') {
        setNeedsPermission(true);
      } else if ('DeviceOrientationEvent' in window) {
        // Android and other devices - just add listener
        window.addEventListener('deviceorientation', handleOrientation);
      }

      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }, [handleOrientation]);

    // Handle mouse move for desktop only
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (isGyroActive || isMobile) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const tiltX = ((e.clientX - centerX) / (rect.width / 2)) * 12;
      const tiltY = ((e.clientY - centerY) / (rect.height / 2)) * -12;

      targetTilt.current = { x: tiltX, y: tiltY };
    }, [isGyroActive, isMobile]);

    const handleMouseLeave = useCallback(() => {
      if (!isGyroActive && !isMobile) {
        targetTilt.current = { x: 0, y: 0 };
      }
    }, [isGyroActive, isMobile]);

    // Handle card tap for iOS permission
    const handleCardTap = useCallback(() => {
      if (needsPermission && isMobile) {
        requestGyroPermission();
      }
    }, [needsPermission, isMobile, requestGyroPermission]);

    // Calculate shine position based on tilt
    const shineX = 50 + tilt.x * 3;
    const shineY = 50 + tilt.y * 3;

    return (
      <div
        className="perspective-1000"
        style={{ perspective: "1000px" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardTap}
      >
        {/* iOS Permission prompt */}
        {needsPermission && isMobile && (
          <div className="text-center text-yellow-400 text-xs mb-2 animate-pulse">
            카드를 탭하여 3D 효과를 활성화하세요
          </div>
        )}

        <div
          ref={ref}
          className="w-[360px] min-h-[640px] h-auto rounded-3xl overflow-hidden relative"
          style={{
            background: "linear-gradient(180deg, #0a0a1a 0%, #0d1b2a 30%, #1a1a3e 60%, #2d1b4e 100%)",
            transform: `rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)`,
            transformStyle: "preserve-3d",
            transition: "transform 0.05s ease-out",
          }}
        >
          {/* Holographic shine effect */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.1) 25%, transparent 50%)`,
              opacity: Math.abs(tilt.x) + Math.abs(tilt.y) > 1 ? 1 : 0,
              transition: "opacity 0.2s ease-out",
            }}
          />

          {/* Rainbow holographic overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay"
            style={{
              background: `linear-gradient(${135 + tilt.x * 3}deg,
                rgba(255, 0, 0, 0.12) 0%,
                rgba(255, 165, 0, 0.12) 20%,
                rgba(255, 255, 0, 0.12) 40%,
                rgba(0, 255, 0, 0.12) 60%,
                rgba(0, 0, 255, 0.12) 80%,
                rgba(238, 130, 238, 0.12) 100%)`,
              opacity: Math.abs(tilt.x) + Math.abs(tilt.y) > 2 ? 0.7 : 0,
              transition: "opacity 0.2s ease-out",
            }}
          />

          {/* Nebula background effects */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Nebula glow 1 - Purple */}
            <div
              className="absolute w-[300px] h-[300px] rounded-full opacity-30"
              style={{
                background: "radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, rgba(147, 51, 234, 0) 70%)",
                top: "-50px",
                right: "-80px",
                filter: "blur(40px)",
              }}
            />
            {/* Nebula glow 2 - Blue */}
            <div
              className="absolute w-[250px] h-[250px] rounded-full opacity-25"
              style={{
                background: "radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0) 70%)",
                top: "150px",
                left: "-60px",
                filter: "blur(50px)",
              }}
            />
            {/* Nebula glow 3 - Pink */}
            <div
              className="absolute w-[200px] h-[200px] rounded-full opacity-20"
              style={{
                background: "radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, rgba(236, 72, 153, 0) 70%)",
                bottom: "100px",
                right: "-40px",
                filter: "blur(45px)",
              }}
            />
            {/* Nebula glow 4 - Cyan */}
            <div
              className="absolute w-[180px] h-[180px] rounded-full opacity-20"
              style={{
                background: "radial-gradient(circle, rgba(34, 211, 238, 0.6) 0%, rgba(34, 211, 238, 0) 70%)",
                bottom: "200px",
                left: "20px",
                filter: "blur(35px)",
              }}
            />
            {/* Stars layer */}
            <div className="absolute inset-0" style={{
              backgroundImage: `
                radial-gradient(1px 1px at 20px 30px, white, transparent),
                radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.8), transparent),
                radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.6), transparent),
                radial-gradient(1.5px 1.5px at 130px 80px, white, transparent),
                radial-gradient(1px 1px at 160px 120px, rgba(255,255,255,0.7), transparent),
                radial-gradient(1px 1px at 200px 50px, rgba(255,255,255,0.5), transparent),
                radial-gradient(1.5px 1.5px at 250px 150px, white, transparent),
                radial-gradient(1px 1px at 280px 90px, rgba(255,255,255,0.6), transparent),
                radial-gradient(1px 1px at 310px 200px, rgba(255,255,255,0.8), transparent),
                radial-gradient(1px 1px at 50px 250px, rgba(255,255,255,0.5), transparent),
                radial-gradient(1.5px 1.5px at 100px 300px, white, transparent),
                radial-gradient(1px 1px at 180px 280px, rgba(255,255,255,0.7), transparent),
                radial-gradient(1px 1px at 240px 350px, rgba(255,255,255,0.6), transparent),
                radial-gradient(1px 1px at 300px 320px, rgba(255,255,255,0.8), transparent),
                radial-gradient(1.5px 1.5px at 70px 400px, white, transparent),
                radial-gradient(1px 1px at 150px 450px, rgba(255,255,255,0.5), transparent),
                radial-gradient(1px 1px at 220px 420px, rgba(255,255,255,0.7), transparent),
                radial-gradient(1px 1px at 320px 480px, rgba(255,255,255,0.6), transparent),
                radial-gradient(1.5px 1.5px at 30px 520px, white, transparent),
                radial-gradient(1px 1px at 120px 580px, rgba(255,255,255,0.8), transparent),
                radial-gradient(1px 1px at 260px 550px, rgba(255,255,255,0.5), transparent),
                radial-gradient(1px 1px at 340px 600px, rgba(255,255,255,0.7), transparent)
              `,
            }} />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center pt-4 px-6 pb-0">
            {/* Title - moved above photo */}
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-yellow-400/70" />
                <span className="text-yellow-400 text-xs tracking-[0.3em] font-medium">
                  SK 신입구성원
                </span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-yellow-400/70" />
              </div>
              <h2
                className="text-2xl font-bold tracking-wider"
                style={{
                  background: "linear-gradient(180deg, #ffd700 0%, #ffaa00 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                PILOT LICENSE
              </h2>
            </div>

            {/* Photo frame - rectangular for upper body portrait (1.2x enlarged) */}
            <div className="relative mb-3">
              <div
                className="w-[268px] h-[346px] rounded-2xl overflow-hidden border-4 border-yellow-400/70"
                style={{
                  boxShadow: "0 0 30px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.2)",
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${photoUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center top",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              </div>
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, transparent 70%, rgba(255, 215, 0, 0.1) 100%)",
                }}
              />
            </div>

            {/* Name */}
            <div className="text-center mb-2">
              <p className="text-white text-3xl font-bold tracking-wide">
                {name}
              </p>
            </div>

            {/* Company */}
            <div className="text-center mb-3">
              <p className="text-gray-300 text-base">{company}</p>
            </div>

            {/* Commitment */}
            <div className="mb-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10 max-w-[280px]">
                <p className="text-center text-gray-200 text-base italic leading-relaxed">
                  &ldquo;{commitment}&rdquo;
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="w-full flex items-center justify-between pb-6 pt-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 flex items-center justify-center"
                  style={{
                    backgroundImage: "url(/img/sk.png)",
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />
                <span className="text-gray-400 text-xs">2026 SK 신입구성원 과정</span>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-[10px] tracking-wider">ISSUED</p>
                <p className="text-gray-300 text-sm font-medium">{issueDate}</p>
              </div>
            </div>
          </div>

          {/* Border glow */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              boxShadow: "inset 0 0 30px rgba(138, 43, 226, 0.3), inset 0 0 60px rgba(75, 0, 130, 0.2)",
            }}
          />
        </div>
      </div>
    );
  }
);

LicenseCard.displayName = "LicenseCard";

export default LicenseCard;
