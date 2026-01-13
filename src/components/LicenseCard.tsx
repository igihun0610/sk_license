"use client";

import { forwardRef, useState, useEffect, useCallback } from "react";

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

    // Handle device orientation for mobile gyro
    const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
      const { beta, gamma } = event;
      // Only activate gyro if we actually get valid data
      if (beta !== null && gamma !== null && (beta !== 0 || gamma !== 0)) {
        setIsGyroActive(true);
        // Limit tilt range to -15 to 15 degrees
        const tiltX = Math.max(-15, Math.min(15, gamma * 0.5));
        const tiltY = Math.max(-15, Math.min(15, (beta - 45) * 0.5));
        setTilt({ x: tiltX, y: tiltY });
      }
    }, []);

    // Request permission for iOS 13+
    const requestPermission = useCallback(async () => {
      if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (error) {
          console.error('Gyro permission denied:', error);
        }
      } else {
        // Non-iOS devices - just add listener, gyro will activate when data comes
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }, [handleOrientation]);

    useEffect(() => {
      // Check if device orientation is available
      if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        requestPermission();
      }

      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }, [handleOrientation, requestPermission]);

    // Handle mouse move for desktop
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (isGyroActive) return; // Skip if gyro is actively sending data

      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const tiltX = ((e.clientX - centerX) / (rect.width / 2)) * 15;
      const tiltY = ((e.clientY - centerY) / (rect.height / 2)) * -15;

      setTilt({ x: tiltX, y: tiltY });
    }, [isGyroActive]);

    const handleMouseLeave = useCallback(() => {
      if (!isGyroActive) {
        setTilt({ x: 0, y: 0 });
      }
    }, [isGyroActive]);

    // Calculate shine position based on tilt
    const shineX = 50 + tilt.x * 3;
    const shineY = 50 + tilt.y * 3;

    return (
      <div
        className="perspective-1000"
        style={{ perspective: "1000px" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={ref}
          className="w-[360px] min-h-[640px] h-auto rounded-3xl overflow-hidden relative transition-transform duration-150 ease-out"
          style={{
            background: "linear-gradient(180deg, #0a0a1a 0%, #0d1b2a 30%, #1a1a3e 60%, #2d1b4e 100%)",
            transform: `rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Holographic shine effect */}
          <div
            className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-150"
            style={{
              background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 20%, transparent 50%)`,
              opacity: Math.abs(tilt.x) + Math.abs(tilt.y) > 2 ? 1 : 0,
            }}
          />

          {/* Rainbow holographic overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-150 mix-blend-overlay"
            style={{
              background: `linear-gradient(${135 + tilt.x * 2}deg,
                rgba(255, 0, 0, 0.1) 0%,
                rgba(255, 165, 0, 0.1) 20%,
                rgba(255, 255, 0, 0.1) 40%,
                rgba(0, 255, 0, 0.1) 60%,
                rgba(0, 0, 255, 0.1) 80%,
                rgba(238, 130, 238, 0.1) 100%)`,
              opacity: Math.abs(tilt.x) + Math.abs(tilt.y) > 3 ? 0.6 : 0,
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
