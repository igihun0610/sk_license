import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserInfo {
  name: string;
  company: string;
  commitment: string;
  photoUrl: string | null;
  transformedPhotoUrl: string | null;
}

interface LicenseStore {
  userInfo: UserInfo;
  jobId: string | null;
  setUserInfo: (info: Partial<UserInfo>) => void;
  setJobId: (id: string | null) => void;
  reset: () => void;
}

const initialUserInfo: UserInfo = {
  name: "",
  company: "",
  commitment: "",
  photoUrl: null,
  transformedPhotoUrl: null,
};

export const useLicenseStore = create<LicenseStore>()(
  persist(
    (set) => ({
      userInfo: initialUserInfo,
      jobId: null,
      setUserInfo: (info) =>
        set((state) => ({
          userInfo: { ...state.userInfo, ...info },
        })),
      setJobId: (id) => set({ jobId: id }),
      reset: () => set({ userInfo: initialUserInfo, jobId: null }),
    }),
    {
      name: "sk-license-storage",
    }
  )
);
