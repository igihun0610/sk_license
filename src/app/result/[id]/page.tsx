"use client";

import { useRef, useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import LicenseCard from "@/components/LicenseCard";
import { useLicenseStore } from "@/lib/store";
import { generateLicenseImage } from "@/lib/generateLicenseImage";
import { ArrowDownTrayIcon, ShareIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  use(params); // Consume params to avoid warnings
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { userInfo, reset } = useLicenseStore();

  // Use transformed photo if available, otherwise fallback to original
  const displayPhotoUrl = userInfo.transformedPhotoUrl || userInfo.photoUrl;

  // Redirect if no photo available
  useEffect(() => {
    if (!displayPhotoUrl) {
      router.push("/");
    }
  }, [displayPhotoUrl, router]);

  // Preload image to ensure it's cached
  useEffect(() => {
    if (displayPhotoUrl) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = displayPhotoUrl;
    }
  }, [displayPhotoUrl]);

  const captureCard = async (): Promise<string> => {
    if (!displayPhotoUrl) throw new Error("No photo available");

    // Use Canvas API for reliable image generation on all devices
    return generateLicenseImage({
      name: userInfo.name,
      company: userInfo.company,
      commitment: userInfo.commitment,
      photoUrl: displayPhotoUrl,
    });
  };

  const handleDownload = async () => {
    if (!cardRef.current || !imageLoaded) return;

    setIsDownloading(true);
    try {
      const dataUrl = await captureCard();

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
    if (!cardRef.current || !imageLoaded) return;

    try {
      const dataUrl = await captureCard();

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

  if (!displayPhotoUrl) {
    return null;
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-6 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          라이선스 발급 완료!
        </h1>
        <p className="text-gray-400 text-sm">
          축하합니다! 우주비행사가 되었습니다
        </p>
      </div>

      {/* License Card - mobile optimized */}
      <div className="mb-4 transform scale-[0.85] origin-top" style={{ marginBottom: "-70px" }}>
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
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              저장 중...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ArrowDownTrayIcon className="h-5 w-5" />
              이미지 저장하기
            </span>
          )}
        </button>

        <button
          onClick={handleShare}
          className="w-full bg-white/10 backdrop-blur-sm text-white font-medium py-4 px-8 rounded-full text-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
        >
          <span className="flex items-center justify-center gap-2">
            <ShareIcon className="h-5 w-5" />
            공유하기
          </span>
        </button>

        <button
          onClick={handleCreateNew}
          className="w-full text-gray-400 py-3 text-sm hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          <ArrowPathIcon className="h-4 w-4" />
          처음부터 다시 만들기
        </button>
      </div>

    </div>
  );
}
