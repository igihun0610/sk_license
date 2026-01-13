"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLicenseStore } from "@/lib/store";

// Compress image to reduce size
const compressImage = (file: File, maxWidth = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function UploadPage() {
  const router = useRouter();
  const { userInfo, setUserInfo } = useLicenseStore();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(userInfo.photoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert("파일 크기는 20MB 이하여야 합니다.");
      return;
    }

    try {
      // Compress image to reduce size for API calls
      const compressedDataUrl = await compressImage(file, 800);
      setPreviewUrl(compressedDataUrl);
      setUserInfo({ photoUrl: compressedDataUrl });
    } catch (error) {
      console.error("Image compression failed:", error);
      alert("이미지 처리에 실패했습니다. 다시 시도해주세요.");
    }
  }, [setUserInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async () => {
    if (!previewUrl) {
      alert("사진을 업로드해주세요.");
      return;
    }

    setIsUploading(true);

    try {
      // Call AI transformation API
      const response = await fetch("/api/transform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoUrl: previewUrl,
        }),
      });

      const data = await response.json();

      if (data.transformedPhotoUrl) {
        setUserInfo({ transformedPhotoUrl: data.transformedPhotoUrl });
      } else {
        // Fallback to original photo if transformation fails
        setUserInfo({ transformedPhotoUrl: previewUrl });
      }

      router.push("/result/direct");
    } catch (error) {
      console.error("Transform error:", error);
      // Fallback to original photo on error
      setUserInfo({ transformedPhotoUrl: previewUrl });
      router.push("/result/direct");
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
        >
          ← 뒤로
        </button>
        <h1 className="text-2xl font-bold text-white mb-2">
          프로필 사진 📸
        </h1>
        <p className="text-gray-400 text-sm">
          우주비행사로 변신할 사진을 선택해주세요
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
          ✓
        </div>
        <div className="flex-1 h-1 bg-space-gold rounded" />
        <div className="w-8 h-8 rounded-full bg-space-gold text-space-dark flex items-center justify-center font-bold text-sm">
          2
        </div>
        <div className="flex-1 h-1 bg-gray-700 rounded" />
        <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center font-bold text-sm">
          3
        </div>
      </div>

      {/* Upload area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="relative mb-6">
            <div className="w-64 h-64 rounded-2xl overflow-hidden border-4 border-space-gold/50 shadow-lg glow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full border border-white/30 hover:bg-white/30 transition-colors"
            >
              다시 선택
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-64 h-64 rounded-2xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center gap-4 hover:border-space-gold hover:bg-white/5 transition-all duration-300"
          >
            <span className="text-5xl">📷</span>
            <div className="text-center">
              <p className="text-white font-medium mb-1">사진 촬영 또는 선택</p>
              <p className="text-gray-400 text-sm">터치하여 업로드</p>
            </div>
          </button>
        )}

        {/* Tips */}
        <div className="mt-8 bg-white/10 rounded-xl p-4 max-w-xs">
          <p className="text-space-gold font-medium mb-2 text-sm">💡 TIP</p>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• 정면 얼굴 사진이 가장 좋아요</li>
            <li>• 밝은 조명에서 촬영하세요</li>
            <li>• 얼굴이 잘 보이는 사진을 선택하세요</li>
          </ul>
        </div>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!previewUrl || isUploading}
        className={`w-full font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-all duration-300 mt-8
          ${previewUrl && !isUploading
            ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-space-dark hover:shadow-xl hover:scale-[1.02]"
            : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
      >
        {isUploading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span> AI 변환 중...
          </span>
        ) : (
          "우주비행사 변신 🚀"
        )}
      </button>
    </div>
  );
}
