"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLicenseStore } from "@/lib/store";

export default function CreatePage() {
  const router = useRouter();
  const { userInfo, setUserInfo } = useLicenseStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!userInfo.name.trim()) {
      newErrors.name = "이름을 입력해주세요";
    }
    if (!userInfo.company.trim()) {
      newErrors.company = "소속 회사를 입력해주세요";
    }
    if (!userInfo.commitment.trim()) {
      newErrors.commitment = "다짐을 입력해주세요";
    } else if (userInfo.commitment.length > 50) {
      newErrors.commitment = "다짐은 50자 이내로 입력해주세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      router.push("/upload");
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
          기본 정보 입력 👤
        </h1>
        <p className="text-gray-400 text-sm">
          라이선스에 표시될 정보를 입력해주세요
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-full bg-space-gold text-space-dark flex items-center justify-center font-bold text-sm">
          1
        </div>
        <div className="flex-1 h-1 bg-gray-700 rounded">
          <div className="w-0 h-full bg-space-gold rounded" />
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center font-bold text-sm">
          2
        </div>
        <div className="flex-1 h-1 bg-gray-700 rounded" />
        <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center font-bold text-sm">
          3
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">
        {/* Name field */}
        <div>
          <label className="block text-white font-medium mb-2">
            이름 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={userInfo.name}
            onChange={(e) => setUserInfo({ name: e.target.value })}
            placeholder="이기훈"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-space-gold focus:ring-1 focus:ring-space-gold transition-colors"
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Company field */}
        <div>
          <label className="block text-white font-medium mb-2">
            소속 회사 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={userInfo.company}
            onChange={(e) => setUserInfo({ company: e.target.value })}
            placeholder="SK AX"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-space-gold focus:ring-1 focus:ring-space-gold transition-colors"
          />
          {errors.company && (
            <p className="text-red-400 text-sm mt-1">{errors.company}</p>
          )}
        </div>

        {/* Commitment field */}
        <div>
          <label className="block text-white font-medium mb-2">
            나의 다짐 <span className="text-red-400">*</span>
            <span className="text-gray-400 font-normal text-sm ml-2">
              ({userInfo.commitment.length}/50)
            </span>
          </label>
          <textarea
            value={userInfo.commitment}
            onChange={(e) => setUserInfo({ commitment: e.target.value })}
            placeholder="새로운 도전을 두려워하지 않겠습니다!"
            maxLength={50}
            rows={3}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-space-gold focus:ring-1 focus:ring-space-gold transition-colors resize-none"
          />
          {errors.commitment && (
            <p className="text-red-400 text-sm mt-1">{errors.commitment}</p>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Submit button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-space-dark font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
        >
          다음 단계 →
        </button>
      </form>
    </div>
  );
}
