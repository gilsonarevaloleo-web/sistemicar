import { create } from 'zustand';
import { safeSetItem } from './storageHygiene';

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

export function backupToLocal(key: string, data: unknown): void {
  try {
    const payload = JSON.stringify(data);
    if (payload.length > 1_500_000) return;
    safeSetItem(`${BACKUP_PREFIX}${key}`, payload);
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
