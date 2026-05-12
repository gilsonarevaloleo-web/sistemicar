import { create } from 'zustand';

interface SovereignState {
  isOfflineMode: boolean;
  errorMsg: string;
  activateSovereignMode: (reason: string) => void;
  deactivateSovereignMode: () => void;
}

export const useSovereignMode = create<SovereignState>((set) => ({
  isOfflineMode: false,
  errorMsg: "",
  activateSovereignMode: (reason: string) => set({ isOfflineMode: true, errorMsg: reason }),
  deactivateSovereignMode: () => set({ isOfflineMode: false, errorMsg: "" }),
}));

export function activateSovereignModeGlobal(reason: string): void {
  useSovereignMode.getState().activateSovereignMode(reason);
}

export function deactivateSovereignModeGlobal(): void {
  useSovereignMode.getState().deactivateSovereignMode();
}

export const BACKUP_PREFIX = "sistemicar_backup_";

export function backupToLocal(key: string, data: any): void {
  try {
    localStorage.setItem(`${BACKUP_PREFIX}${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn("Error backing up to localStorage:", e);
  }
}

export function restoreFromLocal<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(`${BACKUP_PREFIX}${key}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
