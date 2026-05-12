import { type EnergyLog, type BossStep } from "@shared/schema";

export async function getEnergyLogs(): Promise<EnergyLog[]> {
  const res = await fetch("/api/energy-logs");
  if (!res.ok) throw new Error("Failed to fetch energy logs");
  return res.json();
}

export async function createEnergyLog(data: {
  text: string;
  type: string;
  points: number;
}): Promise<EnergyLog> {
  const res = await fetch("/api/energy-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create energy log");
  return res.json();
}

export async function getTotalCP(): Promise<{ cp: number }> {
  const res = await fetch("/api/stats/cp");
  if (!res.ok) throw new Error("Failed to fetch CP");
  return res.json();
}

export async function getActiveBossStep(): Promise<BossStep | null> {
  const res = await fetch("/api/boss-step");
  if (!res.ok) throw new Error("Failed to fetch boss step");
  return res.json();
}

export async function createBossStep(text: string): Promise<BossStep> {
  const res = await fetch("/api/boss-step", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, isActive: 1 }),
  });
  if (!res.ok) throw new Error("Failed to create boss step");
  return res.json();
}

export async function completeBossStep(id: string): Promise<void> {
  const res = await fetch(`/api/boss-step/${id}/complete`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to complete boss step");
}

export async function archiveBossStep(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/boss-step/${id}/archive`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to archive boss step");
  return res.json();
}

export async function getArchivedBossSteps(): Promise<BossStep[]> {
  const res = await fetch("/api/boss-steps/archived");
  if (!res.ok) throw new Error("Failed to fetch archived boss steps");
  return res.json();
}

export async function getCompletedBossSteps(): Promise<BossStep[]> {
  const res = await fetch("/api/boss-steps/completed");
  if (!res.ok) throw new Error("Failed to fetch completed boss steps");
  return res.json();
}

export interface CircadianRhythm {
  timeBlocks: Array<{
    name: string;
    start: number;
    end: number;
    dominant: string;
    count: number;
  }>;
  currentBlock: string;
  currentDominant: string;
  totalLogs: number;
  isPersonalized: boolean;
}

export async function getCircadianRhythm(): Promise<CircadianRhythm> {
  const res = await fetch("/api/circadian-rhythm");
  if (!res.ok) throw new Error("Failed to fetch circadian rhythm");
  return res.json();
}

export interface WeeklyStats {
  chartData: Array<{ day: string; date: string; score: number }>;
  distribution: { 
    enfoque: number; pasos: number; conflicto: number; alcance: number;
    // Legacy support
    mastery?: number; flow?: number; conflict?: number; trivial?: number;
  };
  record: number;
  totalLogs: number;
  bossStepsCompleted: number;
}

export async function getWeeklyStats(): Promise<WeeklyStats> {
  const res = await fetch("/api/stats/weekly");
  if (!res.ok) throw new Error("Failed to fetch weekly stats");
  return res.json();
}

// ============ FUTURE PLANS (Planeación) ============

export interface FuturePlan {
  id: string;
  userId: string;
  text: string;
  complexity: string;
  targetDate: string | null;
  isCompleted: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  archivedAt: string | null;
}

export async function getFuturePlans(): Promise<FuturePlan[]> {
  const res = await fetch("/api/future-plans");
  if (!res.ok) throw new Error("Failed to fetch future plans");
  return res.json();
}

export async function createFuturePlan(text: string, complexity: string): Promise<FuturePlan> {
  const res = await fetch("/api/future-plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, complexity }),
  });
  if (!res.ok) throw new Error("Failed to create future plan");
  return res.json();
}

export async function completeFuturePlan(id: string): Promise<void> {
  const res = await fetch(`/api/future-plans/${id}/complete`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to complete future plan");
}

export async function archiveFuturePlan(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/future-plans/${id}/archive`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to archive future plan");
  return res.json();
}

export async function getArchivedFuturePlans(): Promise<FuturePlan[]> {
  const res = await fetch("/api/future-plans/archived");
  if (!res.ok) throw new Error("Failed to fetch archived future plans");
  return res.json();
}

export async function getCompletedFuturePlans(): Promise<FuturePlan[]> {
  const res = await fetch("/api/future-plans/completed");
  if (!res.ok) throw new Error("Failed to fetch completed future plans");
  return res.json();
}

// ============ HOPE LOGS (Esperanza) ============

export interface HopeLog {
  id: string;
  userId: string;
  text: string;
  type: string;
  referenceDate: string | null;
  createdAt: string;
}

export async function getHopeLogs(): Promise<HopeLog[]> {
  const res = await fetch("/api/hope-logs");
  if (!res.ok) throw new Error("Failed to fetch hope logs");
  return res.json();
}

export async function createHopeLog(text: string, type: string): Promise<HopeLog> {
  const res = await fetch("/api/hope-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, type }),
  });
  if (!res.ok) throw new Error("Failed to create hope log");
  return res.json();
}

export async function deleteHopeLog(id: string): Promise<void> {
  const res = await fetch(`/api/hope-logs/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete hope log");
}

// ============ WISDOM LESSONS (Destilación de Sabiduría) ============

export interface WisdomLesson {
  id: string;
  userId: string;
  context: string;
  conflict: string;
  lesson: string;
  createdAt: string;
}

export async function getWisdomLessons(): Promise<WisdomLesson[]> {
  const res = await fetch("/api/wisdom-lessons");
  if (!res.ok) throw new Error("Failed to fetch wisdom lessons");
  return res.json();
}

export async function createWisdomLesson(data: { context: string; conflict: string; lesson: string }): Promise<WisdomLesson> {
  const res = await fetch("/api/wisdom-lessons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create wisdom lesson");
  return res.json();
}

export async function deleteWisdomLesson(id: string): Promise<void> {
  const res = await fetch(`/api/wisdom-lessons/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete wisdom lesson");
}

// ============ ORÁCULO (Cerebro SISTEMI) ============

export interface OraculoResponse {
  marketIntelligence: string;
  sistemiTranslation: string;
  sources?: string[];
}

export async function getOraculoStatus(): Promise<{ configured: boolean }> {
  const res = await fetch("/api/oraculo/status");
  if (!res.ok) throw new Error("Failed to fetch oraculo status");
  return res.json();
}

export async function queryOraculo(query: string): Promise<OraculoResponse> {
  const res = await fetch("/api/oraculo/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error.error || "Failed to query oraculo");
  }
  return res.json();
}

// ============ ESCÁNER DE ENERGÍA BIOPSÍQUICO ============

export interface EnergyScanResult {
  id?: string;
  totalScore: number;
  socialEgoScore: number;
  biologicalResistanceScore: number;
  financialFrequencyScore: number;
  architectFocusScore: number;
  honestyBonus: number;
  dimensionAnalysis: {
    socialEgo: { score: number; analysis: string; level: string };
    biologicalResistance: { score: number; analysis: string; level: string };
    financialFrequency: { score: number; analysis: string; level: string };
    architectFocus: { score: number; analysis: string; level: string };
  };
  oracleConclusion: string;
  oracleSuggestions: string[];
  honestyDetected: boolean;
  honestyMessage: string | null;
  createdAt?: string;
}

export async function performEnergyScan(inputText: string): Promise<EnergyScanResult> {
  const res = await fetch("/api/energy-scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputText }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error.error || "Failed to perform energy scan");
  }
  return res.json();
}

export async function getEnergyScans(): Promise<EnergyScanResult[]> {
  const res = await fetch("/api/energy-scans");
  if (!res.ok) throw new Error("Failed to fetch energy scans");
  return res.json();
}

export async function getLatestEnergyScan(): Promise<EnergyScanResult | null> {
  const res = await fetch("/api/energy-scan/latest");
  if (!res.ok) throw new Error("Failed to fetch latest energy scan");
  return res.json();
}
