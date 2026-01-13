"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      {/* Decorative elements */}
      <div className="absolute top-10 left-6 text-4xl animate-float">🪐</div>
      <div className="absolute top-20 right-8 text-2xl animate-float" style={{ animationDelay: "1s" }}>✨</div>
      <div className="absolute bottom-32 left-10 text-3xl animate-float" style={{ animationDelay: "2s" }}>🌟</div>
      <div className="absolute bottom-20 right-6 text-4xl animate-float" style={{ animationDelay: "0.5s" }}>🚀</div>

      {/* Logo area */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-4 animate-float">🧑‍🚀</div>
        <div className="text-sm tracking-widest text-space-gold font-semibold mb-2">
          SK NEW CREW
        </div>
      </div>

      {/* Main title */}
      <h1 className="text-3xl font-bold text-center mb-4 text-white">
        우주비행사
        <br />
        <span className="text-space-gold">라이선스</span> 발급
      </h1>

      {/* Description */}
      <p className="text-center text-gray-300 text-sm mb-12 max-w-xs leading-relaxed">
        SK 신입구성원 여러분, 환영합니다!
        <br />
        나만의 우주비행사 라이선스를 만들어보세요.
      </p>

      {/* CTA Button */}
      <Link
        href="/create"
        className="w-full max-w-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-space-dark font-bold py-4 px-8 rounded-full text-center text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 glow"
      >
        라이선스 발급 시작 🚀
      </Link>

      {/* Footer info */}
      <div className="mt-16 text-center text-gray-500 text-xs">
        <p>© 2026 SK 신입구성원과정</p>
        <p className="mt-1">Powered by AI ✨</p>
      </div>
    </div>
  );
}
