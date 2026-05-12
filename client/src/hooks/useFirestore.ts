import { useState, useEffect, useCallback } from "react";
import { 
  db, 
  getPrivatePath, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp,
  User
} from "@/lib/firebase";

export interface EnergyLog {
  id?: string;
  quadrant: "mastery" | "flow" | "conflict" | "trivial";
  activity: string;
  points: number;
  createdAt: Date;
}

export interface BossStep {
  id?: string;
  title: string;
  completedAt: Date | null;
  isActive: boolean;
}

export interface HopeLog {
  id?: string;
  content: string;
  createdAt: Date;
}

export interface FuturePlan {
  id?: string;
  title: string;
  complexity: "simple" | "compound" | "complex";
  status: "pending" | "completed" | "archived";
  createdAt: Date;
}

export function useEnergyLogs(user: User | null) {
  const [logs, setLogs] = useState<EnergyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user || !db) {
      setLogs([]);
      setLoading(false);
      return;
    }
    try {
      const path = getPrivatePath(user.uid, "energyLogs");
      const q = query(collection(db, path), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date()
      })) as EnergyLog[];
      setLogs(data);
    } catch (error) {
      console.error("Error fetching energy logs:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = async (log: Omit<EnergyLog, "id" | "createdAt">) => {
    if (!user || !db) return;
    const path = getPrivatePath(user.uid, "energyLogs");
    await addDoc(collection(db, path), {
      ...log,
      createdAt: Timestamp.now()
    });
    fetchLogs();
  };

  return { logs, loading, addLog, refetch: fetchLogs };
}

export function useBossStep(user: User | null) {
  const [bossStep, setBossStep] = useState<BossStep | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBossStep = useCallback(async () => {
    if (!user || !db) {
      setBossStep(null);
      setLoading(false);
      return;
    }
    try {
      const path = getPrivatePath(user.uid, "bossSteps");
      const snapshot = await getDocs(collection(db, path));
      const active = snapshot.docs.find(d => d.data().isActive);
      if (active) {
        setBossStep({
          id: active.id,
          ...active.data(),
          completedAt: active.data().completedAt?.toDate() || null
        } as BossStep);
      } else {
        setBossStep(null);
      }
    } catch (error) {
      console.error("Error fetching boss step:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBossStep();
  }, [fetchBossStep]);

  const setBoss = async (title: string) => {
    if (!user || !db) return;
    const path = getPrivatePath(user.uid, "bossSteps");
    await addDoc(collection(db, path), {
      title,
      isActive: true,
      completedAt: null,
      createdAt: Timestamp.now()
    });
    fetchBossStep();
  };

  const completeBoss = async () => {
    if (!user || !db || !bossStep?.id) return;
    const path = getPrivatePath(user.uid, "bossSteps");
    await updateDoc(doc(db, path, bossStep.id), {
      isActive: false,
      completedAt: Timestamp.now()
    });
    fetchBossStep();
  };

  return { bossStep, loading, setBoss, completeBoss, refetch: fetchBossStep };
}

export function useHopeLogs(user: User | null) {
  const [logs, setLogs] = useState<HopeLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user || !db) {
      setLogs([]);
      setLoading(false);
      return;
    }
    try {
      const path = getPrivatePath(user.uid, "hopeLogs");
      const q = query(collection(db, path), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date()
      })) as HopeLog[];
      setLogs(data);
    } catch (error) {
      console.error("Error fetching hope logs:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = async (content: string) => {
    if (!user || !db) return;
    const path = getPrivatePath(user.uid, "hopeLogs");
    await addDoc(collection(db, path), {
      content,
      createdAt: Timestamp.now()
    });
    fetchLogs();
  };

  return { logs, loading, addLog, refetch: fetchLogs };
}

export function useFuturePlans(user: User | null) {
  const [plans, setPlans] = useState<FuturePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    if (!user || !db) {
      setPlans([]);
      setLoading(false);
      return;
    }
    try {
      const path = getPrivatePath(user.uid, "futurePlans");
      const q = query(collection(db, path), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date()
      })) as FuturePlan[];
      setPlans(data);
    } catch (error) {
      console.error("Error fetching future plans:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const addPlan = async (plan: Omit<FuturePlan, "id" | "createdAt">) => {
    if (!user || !db) return;
    const path = getPrivatePath(user.uid, "futurePlans");
    await addDoc(collection(db, path), {
      ...plan,
      createdAt: Timestamp.now()
    });
    fetchPlans();
  };

  const updatePlan = async (id: string, updates: Partial<FuturePlan>) => {
    if (!user || !db) return;
    const path = getPrivatePath(user.uid, "futurePlans");
    await updateDoc(doc(db, path, id), updates);
    fetchPlans();
  };

  return { plans, loading, addPlan, updatePlan, refetch: fetchPlans };
}

export function useStats(user: User | null) {
  const [stats, setStats] = useState({ cp: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  const calculateStats = useCallback(async () => {
    if (!user || !db) {
      setStats({ cp: 0, streak: 0 });
      setLoading(false);
      return;
    }
    try {
      const path = getPrivatePath(user.uid, "energyLogs");
      const snapshot = await getDocs(collection(db, path));
      const totalCP = snapshot.docs.reduce((sum, d) => sum + (d.data().points || 0), 0);
      setStats({ cp: totalCP, streak: 0 });
    } catch (error) {
      console.error("Error calculating stats:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  return { stats, loading, refetch: calculateStats };
}
