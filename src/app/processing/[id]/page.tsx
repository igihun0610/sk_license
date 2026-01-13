"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useLicenseStore } from "@/lib/store";

interface JobStatus {
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  position?: number;
  total?: number;
  transformedPhotoUrl?: string;
  error?: string;
}

export default function ProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { setUserInfo } = useLicenseStore();
  const [status, setStatus] = useState<JobStatus>({
    status: "pending",
    progress: 0,
  });

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/status/${id}`);

        // Job not found - simulate processing locally
        if (response.status === 404) {
          retryCount++;
          if (retryCount >= maxRetries) {
            // Simulate completion with original photo
            simulateLocalProcessing();
            return;
          }
          return;
        }

        const data: JobStatus = await response.json();
        setStatus(data);

        if (data.status === "completed" && data.transformedPhotoUrl) {
          setUserInfo({ transformedPhotoUrl: data.transformedPhotoUrl });
          router.push(`/result/${id}`);
        } else if (data.status === "failed") {
          alert(data.error || "처리에 실패했습니다. 다시 시도해주세요.");
          router.push("/upload");
        }
      } catch (error) {
        console.error("Status check failed:", error);
        retryCount++;
        if (retryCount >= maxRetries) {
          simulateLocalProcessing();
        }
      }
    };

    const simulateLocalProcessing = () => {
      // Simulate progress locally when server job is lost
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 20;
        setStatus({ status: "processing", progress });

        if (progress >= 100) {
          clearInterval(progressInterval);
          // Use original photo from store
          router.push(`/result/${id}`);
        }
      }, 500);
    };

    // Poll every 2 seconds
    const interval = setInterval(checkStatus, 2000);
    checkStatus(); // Initial check

    return () => clearInterval(interval);
  }, [id, router, setUserInfo]);

  const getStatusMessage = () => {
    switch (status.status) {
      case "pending":
        return "대기 중...";
      case "processing":
        return "AI가 변환 중...";
      case "completed":
        return "완료!";
      case "failed":
        return "실패";
      default:
        return "처리 중...";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      {/* Animated astronaut */}
      <div className="text-8xl mb-8 animate-float">🧑‍🚀</div>

      {/* Status message */}
      <h1 className="text-2xl font-bold text-white mb-4 text-center">
        우주비행사로 변신 중...
      </h1>

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-4">
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${status.progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-gray-400">{getStatusMessage()}</span>
          <span className="text-space-gold font-medium">{status.progress}%</span>
        </div>
      </div>

      {/* Queue position */}
      {status.position && status.total && (
        <div className="bg-white/10 rounded-xl px-6 py-3 mb-8">
          <p className="text-gray-300 text-sm">
            현재 위치: <span className="text-space-gold font-bold">{status.position}</span>
            /{status.total}
          </p>
        </div>
      )}

      {/* Fun messages */}
      <div className="text-center max-w-xs">
        <p className="text-gray-400 text-sm mb-2">💫 잠시만 기다려주세요!</p>
        <p className="text-gray-500 text-xs">
          AI가 당신을 멋진 우주비행사로 만들고 있어요
        </p>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-8 text-3xl animate-float" style={{ animationDelay: "0s" }}>🚀</div>
      <div className="absolute top-32 right-10 text-2xl animate-float" style={{ animationDelay: "1s" }}>✨</div>
      <div className="absolute bottom-40 left-12 text-2xl animate-float" style={{ animationDelay: "2s" }}>🌟</div>
      <div className="absolute bottom-28 right-8 text-3xl animate-float" style={{ animationDelay: "0.5s" }}>🪐</div>
    </div>
  );
}
