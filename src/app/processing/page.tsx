"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLicenseStore } from "@/lib/store";

const loadingMessages = [
  "라이선스 신청서 검토 중... 📋",
  "우주비행 자격 심사 중... 🧑‍🚀",
  "SK 우주센터 승인 대기 중... 🛸",
  "신입 비행사 등록 처리 중... 👨‍🚀",
  "우주복 지급 준비 중... 👔",
  "비행 훈련 기록 확인 중... 📜",
  "은하수 항로 배정 중... 🌌",
  "우주정거장 입장 허가 중... ✨",
  "라이선스 카드 인쇄 중... 🪪",
  "발급 완료까지 3..2..1.. 🚀",
];

export default function ProcessingPage() {
  const router = useRouter();
  const { userInfo, setUserInfo } = useLicenseStore();
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState("");
  const hasStarted = useRef(false);

  // Rotate loading messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(messageInterval);
  }, []);

  useEffect(() => {
    setCurrentMessage(loadingMessages[messageIndex]);
  }, [messageIndex]);

  // Animate dots
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  // Call AI API
  useEffect(() => {
    if (hasStarted.current) return;
    if (!userInfo.photoUrl) {
      router.push("/upload");
      return;
    }

    hasStarted.current = true;

    const transformImage = async () => {
      try {
        const response = await fetch("/api/transform", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            photoUrl: userInfo.photoUrl,
          }),
        });

        const data = await response.json();

        if (data.transformedPhotoUrl) {
          setUserInfo({ transformedPhotoUrl: data.transformedPhotoUrl });
        } else {
          // Fallback to original photo if transformation fails
          setUserInfo({ transformedPhotoUrl: userInfo.photoUrl });
        }

        router.push("/result/direct");
      } catch (error) {
        console.error("Transform error:", error);
        // Fallback to original photo on error
        setUserInfo({ transformedPhotoUrl: userInfo.photoUrl });
        router.push("/result/direct");
      }
    };

    transformImage();
  }, [userInfo.photoUrl, setUserInfo, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 relative overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-2xl animate-pulse">✨</div>
        <div className="absolute top-20 right-16 text-xl animate-pulse" style={{ animationDelay: "0.5s" }}>🌟</div>
        <div className="absolute top-40 left-1/4 text-sm animate-pulse" style={{ animationDelay: "1s" }}>⭐</div>
        <div className="absolute bottom-40 right-10 text-2xl animate-pulse" style={{ animationDelay: "1.5s" }}>🌙</div>
        <div className="absolute bottom-60 left-8 text-xl animate-pulse" style={{ animationDelay: "0.3s" }}>🪐</div>
        <div className="absolute top-1/3 right-8 text-lg animate-bounce" style={{ animationDelay: "0.7s" }}>🛸</div>
        <div className="absolute bottom-32 right-1/4 text-sm animate-pulse" style={{ animationDelay: "1.2s" }}>💫</div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Astronaut animation */}
        <div className="relative mb-8 w-52 h-52 flex items-center justify-center">
          {/* Orbiting rocket - behind everything (z-0) */}
          <div
            className="absolute w-52 h-52 z-0"
            style={{
              animation: "spin 4s linear infinite",
            }}
          >
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">🚀</span>
          </div>
          {/* Astronaut - in front (z-10) */}
          <div className="relative z-10 text-8xl animate-bounce" style={{ animationDuration: "2s" }}>
            🧑‍🚀
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-4 text-center">
          라이선스 발급 중{dots}
        </h1>

        {/* Loading message */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 mb-8 border border-white/20 min-w-[280px]">
          <p className="text-center text-yellow-300 font-medium text-lg">
            {currentMessage}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
            style={{
              animation: "loading 2s ease-in-out infinite",
            }}
          />
        </div>

        {/* Sub message */}
        <p className="text-gray-400 text-sm text-center max-w-xs">
          SK 우주센터에서 라이선스를 발급하고 있어요!
          <br />
          곧 신입 우주비행사가 됩니다 ✨
        </p>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes loading {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
