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
        className="w-[360px] min-h-[640px] h-auto rounded-3xl overflow-hidden relative"
        style={{
          background: "linear-gradient(180deg, #0a0a1a 0%, #0d1b2a 30%, #1a1a3e 60%, #2d1b4e 100%)",
        }}
      >
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

          {/* Title */}
          <div className="text-center mb-4">
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
    );
  }
);

LicenseCard.displayName = "LicenseCard";

export default LicenseCard;
