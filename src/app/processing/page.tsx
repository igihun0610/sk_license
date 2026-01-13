"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

const waitingMessages = [
  "우주센터가 바빠요! 잠시만 기다려주세요 🚀",
  "다른 우주비행사들이 먼저 등록 중이에요 👨‍🚀",
  "대기열에서 순서를 기다리는 중... ⏳",
  "곧 당신의 차례가 올 거예요! 🌟",
];

interface QueueStatus {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number;
  status: "waiting" | "processing" | "ready" | "disabled";
  currentProcessing: number;
}

export default function ProcessingPage() {
  const router = useRouter();
  const { userInfo, setUserInfo } = useLicenseStore();
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState("");
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [queueId, setQueueId] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTransformingRef = useRef(false); // Prevent duplicate transform calls

  // Join queue on mount
  const joinQueue = useCallback(async () => {
    try {
      const response = await fetch("/api/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (data.queueId) {
        setQueueId(data.queueId);
        setQueueStatus({
          position: data.position,
          totalInQueue: data.totalInQueue,
          estimatedWaitTime: data.estimatedWaitTime,
          status: data.status,
          currentProcessing: data.currentProcessing,
        });
      }
      return data;
    } catch (error) {
      console.error("Failed to join queue:", error);
      return { status: "disabled" };
    }
  }, []);

  // Poll queue status
  const pollQueueStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/queue/status?queueId=${id}`);
      const data = await response.json();

      setQueueStatus({
        position: data.position,
        totalInQueue: data.totalInQueue,
        estimatedWaitTime: data.estimatedWaitTime,
        status: data.status,
        currentProcessing: data.currentProcessing,
      });

      return data.status;
    } catch (error) {
      console.error("Failed to poll queue status:", error);
      return "disabled";
    }
  }, []);

  // Leave queue on unmount
  useEffect(() => {
    return () => {
      if (queueId) {
        fetch("/api/queue/leave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queueId }),
        }).catch(console.error);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [queueId]);

  // Rotate loading messages
  useEffect(() => {
    const messages = queueStatus?.status === "waiting" ? waitingMessages : loadingMessages;
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(messageInterval);
  }, [queueStatus?.status]);

  useEffect(() => {
    const messages = queueStatus?.status === "waiting" ? waitingMessages : loadingMessages;
    setCurrentMessage(messages[messageIndex % messages.length]);
  }, [messageIndex, queueStatus?.status]);

  // Animate dots
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  // Main processing logic
  useEffect(() => {
    if (hasStarted.current) return;
    if (!userInfo.photoUrl) {
      router.push("/upload");
      return;
    }

    hasStarted.current = true;

    const startProcess = async () => {
      // Join queue first
      const queueData = await joinQueue();

      // If queue is disabled or ready, process immediately
      if (queueData.status === "disabled" || queueData.status === "ready") {
        await transformImage(queueData.queueId);
        return;
      }

      // Otherwise, poll until ready
      const id = queueData.queueId;
      pollIntervalRef.current = setInterval(async () => {
        const status = await pollQueueStatus(id);

        // Prevent duplicate transform calls with isTransformingRef
        if ((status === "ready" || status === "disabled") && !isTransformingRef.current) {
          isTransformingRef.current = true; // Set flag before clearing interval
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          await transformImage(id);
        }
      }, 5000); // 5초 간격 폴링 (Redis 커맨드 최적화)
    };

    const transformImage = async (id?: string) => {
      try {
        setQueueStatus(prev => prev ? { ...prev, status: "processing" } : null);

        const response = await fetch("/api/transform", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            photoUrl: userInfo.photoUrl,
            queueId: id,
          }),
        });

        const data = await response.json();

        if (data.transformedPhotoUrl) {
          setUserInfo({ transformedPhotoUrl: data.transformedPhotoUrl });
        } else {
          setUserInfo({ transformedPhotoUrl: userInfo.photoUrl });
        }

        router.push("/result/direct");
      } catch (error) {
        console.error("Transform error:", error);
        setUserInfo({ transformedPhotoUrl: userInfo.photoUrl });
        router.push("/result/direct");
      }
    };

    startProcess();
  }, [userInfo.photoUrl, setUserInfo, router, joinQueue, pollQueueStatus]);

  // Format wait time
  const formatWaitTime = (seconds: number) => {
    if (seconds < 60) return `약 ${seconds}초`;
    const minutes = Math.ceil(seconds / 60);
    return `약 ${minutes}분`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 relative overflow-hidden">
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
          {queueStatus?.status === "waiting" ? "대기열에서 기다리는 중" : "라이선스 발급 중"}{dots}
        </h1>

        {/* Queue Status Display */}
        {queueStatus && queueStatus.status === "waiting" && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl px-6 py-4 mb-4 border border-purple-500/30 min-w-[280px]">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300 mb-2">
                {queueStatus.position}번째
              </div>
              <div className="text-sm text-gray-300">
                전체 대기: {queueStatus.totalInQueue}명 | 처리 중: {queueStatus.currentProcessing}명
              </div>
              {queueStatus.estimatedWaitTime > 0 && (
                <div className="text-sm text-purple-300 mt-2">
                  예상 대기시간: {formatWaitTime(queueStatus.estimatedWaitTime)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading message */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 mb-8 border border-white/20 min-w-[280px]">
          <p className="text-center text-yellow-300 font-medium text-lg">
            {currentMessage}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full rounded-full ${
              queueStatus?.status === "waiting"
                ? "bg-gradient-to-r from-purple-400 to-pink-500"
                : "bg-gradient-to-r from-yellow-400 to-orange-500"
            }`}
            style={{
              animation: "loading 2s ease-in-out infinite",
            }}
          />
        </div>

        {/* Sub message */}
        <p className="text-gray-400 text-sm text-center max-w-xs">
          {queueStatus?.status === "waiting" ? (
            <>
              많은 분들이 우주비행사가 되고 싶어해요!
              <br />
              조금만 기다려주시면 곧 발급해드릴게요 ✨
            </>
          ) : (
            <>
              SK 우주센터에서 라이선스를 발급하고 있어요!
              <br />
              곧 신입 우주비행사가 됩니다 ✨
            </>
          )}
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
