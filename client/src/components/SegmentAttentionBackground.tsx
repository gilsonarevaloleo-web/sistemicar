import { useEffect, useRef } from "react";
import { useAuthContext } from "@/App";
import {
  getLocalVehicles,
  getPlanillaHoy,
  hasPlanificacionBaseAccess,
  subscribeToPlanilla,
  subscribeToProgression,
  subscribeToVehicles,
  type Planilla,
  type UserProgression,
  type Vehicle,
} from "@/lib/persistence";
import { getJournalDateString } from "@/lib/segmentTime";
import {
  clearCruceWarnedIds,
  dispatchSegmentAttentionTick,
  dispatchSegmentDayRollover,
  registerSegmentAttentionForceTick,
  runSegmentAttentionCycle,
} from "@/lib/segmentAttentionCycle";
import {
  flushMissedPuertaVoiceOnVisible,
  isAppInBackground,
} from "@/lib/backgroundAttentionAlerts";
import {
  cancelAllNotifications,
  scheduleCrossEntropyNotifications,
  scheduleSegmentNotifications,
} from "@/lib/notifications";
import { recoverSpeechQueue, warmupSpeechSynthesis } from "@/lib/speechQueue";

const TICK_MS_FOREGROUND = 10_000;
const TICK_MS_BACKGROUND = 15_000;

/**
 * Motor global de segmentos: puertas, entropía y cierres por cruce.
 * Sigue activo en cualquier ruta de la app (no solo /planeacion).
 */
export function SegmentAttentionBackground() {
  const { user } = useAuthContext();
  const planillaRef = useRef<Planilla | null>(null);
  const vehiclesRef = useRef<Vehicle[]>([]);
  const planillaFechaRef = useRef(getJournalDateString());
  const tickingRef = useRef(false);
  const hasAccessRef = useRef(false);
  const progressionRef = useRef<UserProgression | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubProg = subscribeToProgression(
      user.uid,
      p => {
        progressionRef.current = p;
        hasAccessRef.current = hasPlanificacionBaseAccess(
          p?.subscriptionPlan,
          user.email,
          p?.rank,
          p?.activeModules
        );
      },
      e => console.error("[SegmentAttentionBackground] progression", e)
    );

    void getPlanillaHoy(user.uid).then(p => {
      planillaRef.current = p;
      planillaFechaRef.current = p.fecha;
      if (hasAccessRef.current) {
        scheduleSegmentNotifications(p.segmentos);
        scheduleCrossEntropyNotifications(p.segmentos, vehiclesRef.current);
      }
    });

    const unsubPlanilla = subscribeToPlanilla(
      user.uid,
      planillaFechaRef.current,
      p => {
        planillaRef.current = p;
        if (hasAccessRef.current) {
          scheduleSegmentNotifications(p.segmentos);
          scheduleCrossEntropyNotifications(p.segmentos, vehiclesRef.current);
        }
      },
      e => console.error("[SegmentAttentionBackground] planilla", e)
    );

    const unsubVehicles = subscribeToVehicles(
      user.uid,
      data => {
        vehiclesRef.current = data.length > 0 ? data : getLocalVehicles();
        if (planillaRef.current && hasAccessRef.current) {
          scheduleCrossEntropyNotifications(planillaRef.current.segmentos, vehiclesRef.current);
        }
      },
      e => console.error("[SegmentAttentionBackground] vehicles", e)
    );

    const runTick = async () => {
      if (!hasAccessRef.current || tickingRef.current) return;
      const planilla = planillaRef.current;
      if (!planilla) return;

      tickingRef.current = true;
      try {
        const result = await runSegmentAttentionCycle(user.uid, {
          planilla,
          vehicles: vehiclesRef.current,
        });
        if (result.planilla) planillaRef.current = result.planilla;
        if (result.vehicles) vehiclesRef.current = result.vehicles;
        if (result.dayRolloverFecha) {
          planillaFechaRef.current = result.dayRolloverFecha;
          dispatchSegmentDayRollover(result.dayRolloverFecha);
        }
        if (result.changed) {
          dispatchSegmentAttentionTick();
        }
      } catch (e) {
        console.error("[SegmentAttentionBackground] tick", e);
      } finally {
        tickingRef.current = false;
      }
    };

    const unregisterForce = registerSegmentAttentionForceTick(() => {
      void runTick();
    });

    let intervalMs = TICK_MS_FOREGROUND;
    let intervalId = window.setInterval(() => void runTick(), intervalMs);
    void runTick();

    const resetInterval = () => {
      clearInterval(intervalId);
      intervalMs = isAppInBackground() ? TICK_MS_BACKGROUND : TICK_MS_FOREGROUND;
      intervalId = window.setInterval(() => void runTick(), intervalMs);
    };

    const onVisible = () => {
      warmupSpeechSynthesis(true);
      recoverSpeechQueue();
      const flushed = flushMissedPuertaVoiceOnVisible();
      if (flushed > 0) {
        console.log(`[Voz] Reproduciendo ${flushed} aviso(s) de segundo plano`);
      }
      resetInterval();
      void runTick();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      unsubProg();
      unsubPlanilla();
      unsubVehicles();
      unregisterForce();
      clearInterval(intervalId);
      cancelAllNotifications();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [user]);

  return null;
}

export { runSegmentAttentionTickNow } from "@/lib/segmentAttentionCycle";
