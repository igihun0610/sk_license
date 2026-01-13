"use client";

import { forwardRef } from "react";

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

    return (
      <div
        ref={ref}
        className="w-[360px] h-[560px] rounded-3xl overflow-hidden relative"
        style={{
          background: "linear-gradient(180deg, #0d1b2a 0%, #1b1464 50%, #2d1b69 100%)",
        }}
      >
        {/* Stars background */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-4 left-6 text-2xl">✨</div>
          <div className="absolute top-8 right-8 text-xl">🌟</div>
          <div className="absolute top-16 left-1/4 text-sm">⭐</div>
          <div className="absolute top-24 right-1/3 text-xs">✦</div>
          <div className="absolute bottom-32 left-8 text-lg">🪐</div>
          <div className="absolute bottom-24 right-6 text-2xl">🌙</div>
          <div className="absolute top-1/3 right-4 text-xl">🚀</div>
          <div className="absolute top-1/2 left-4 text-sm">★</div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center pt-8 px-6">
          {/* Photo frame */}
          <div className="relative mb-6">
            <div
              className="w-40 h-40 rounded-full overflow-hidden border-4 border-yellow-400/70"
              style={{
                boxShadow: "0 0 30px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.2)",
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url(${photoUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              />
            </div>
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, transparent 60%, rgba(255, 215, 0, 0.1) 100%)",
              }}
            />
          </div>

          {/* Title */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-yellow-400/70" />
              <span className="text-yellow-400 text-xs tracking-[0.3em] font-medium">
                SK 신입구성원
              </span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-yellow-400/70" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <img src="/img/sk.png" alt="SK" className="h-7 w-auto" />
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
          </div>

          {/* Name */}
          <div className="text-center mb-2">
            <p className="text-white text-2xl font-bold tracking-wide">
              {name}
            </p>
          </div>

          {/* Company & Class */}
          <div className="text-center mb-4">
            <p className="text-gray-300 text-sm mb-1">{company}</p>
            <p className="text-yellow-400/80 text-xs tracking-wider">
              CLASS: 신입 우주비행사
            </p>
          </div>

          {/* Commitment */}
          <div className="flex-1 flex items-center">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/10 max-w-[280px]">
              <p className="text-center text-gray-200 text-sm italic leading-relaxed">
                &ldquo;{commitment}&rdquo;
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full flex items-center justify-between pb-6 mt-4">
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
    );
  }
);

LicenseCard.displayName = "LicenseCard";

export default LicenseCard;
