"use client";

import { useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import LicenseCard from "@/components/LicenseCard";
import { useLicenseStore } from "@/lib/store";

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  use(params); // Consume params to avoid warnings
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { userInfo, reset } = useLicenseStore();

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });

      // Create download link
      const link = document.createElement("a");
      link.download = `sk-astronaut-license-${userInfo.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
      alert("다운로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `sk-astronaut-license-${userInfo.name}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "SK 우주비행사 라이선스",
          text: `${userInfo.name}님의 우주비행사 라이선스입니다!`,
          files: [file],
        });
      } else {
        // Fallback to download
        handleDownload();
      }
    } catch (error) {
      console.error("Share failed:", error);
      handleDownload();
    }
  };

  const handleCreateNew = () => {
    reset();
    router.push("/");
  };

  // Use transformed photo if available, otherwise fallback to original
  const displayPhotoUrl = userInfo.transformedPhotoUrl || userInfo.photoUrl;

  if (!displayPhotoUrl) {
    router.push("/");
    return null;
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-6 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          라이선스 발급 완료! 🎉
        </h1>
        <p className="text-gray-400 text-sm">
          축하합니다! 우주비행사가 되었습니다
        </p>
      </div>

      {/* License Card */}
      <div className="mb-8 transform scale-[0.85] origin-top">
        <LicenseCard
          ref={cardRef}
          name={userInfo.name}
          company={userInfo.company}
          commitment={userInfo.commitment}
          photoUrl={displayPhotoUrl}
        />
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-space-dark font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
        >
          {isDownloading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> 저장 중...
            </span>
          ) : (
            "이미지 저장하기 📥"
          )}
        </button>

        <button
          onClick={handleShare}
          className="w-full bg-white/10 backdrop-blur-sm text-white font-medium py-4 px-8 rounded-full text-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
        >
          공유하기 📤
        </button>

        <button
          onClick={handleCreateNew}
          className="w-full text-gray-400 py-3 text-sm hover:text-white transition-colors"
        >
          처음부터 다시 만들기
        </button>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-16 left-6 text-2xl animate-float">🎊</div>
      <div className="absolute top-24 right-8 text-xl animate-float" style={{ animationDelay: "1s" }}>✨</div>
      <div className="absolute bottom-40 left-10 text-2xl animate-float" style={{ animationDelay: "2s" }}>🌟</div>
      <div className="absolute bottom-32 right-6 text-3xl animate-float" style={{ animationDelay: "0.5s" }}>🚀</div>
    </div>
  );
}
