import { useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/App";
import {
  getLocalVehicles,
  reconcileStaleCentinelaInFirestore,
  subscribeToPlanilla,
  subscribeToVehicles,
  updateVehicle,
  updateVehicleStatus,
  type Planilla,
  type Vehicle,
} from "@/lib/persistence";
import { getJournalDateString, getJournalDayStartMs } from "@/lib/segmentTime";
import {
  activateCentinelaVehicle,
  CENTINELA_DELAY_MS,
  computeCentinelaUiState,
  emitCentinelaUi,
  getCentinelaSegmentGate,
  isCentinelaBlockedByVehicles,
  isCentinelaSuppressed,
  resetCentinelaTimerState,
} from "@/lib/centinelaEngine";

const CENTINELA_MAX_AGE_MS = 8 * 3600 * 1000;

/** Motor global del Centinela ù corre en toda la app, no solo en Planificaciùn. */
export function CentinelaEngine() {
  const { user } = useAuthContext();
  const [planillaFecha, setPlanillaFecha] = useState(() => getJournalDateString());
  const vehiclesRef = useRef<Vehicle[]>([]);
  const planillaRef = useRef<Planilla | null>(null);
  const noVehicleSince = useRef(0);
  const lastCheck = useRef(0);
  const forceCheckRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const tick = () => {
      const f = getJournalDateString();
      setPlanillaFecha(prev => (prev !== f ? f : prev));
    };
    const interval = setInterval(tick, 60_000);
    tick();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fecha = planillaFecha;
    const unsubPlanilla = subscribeToPlanilla(
      user.uid,
      fecha,
      p => {
        planillaRef.current = p;
      },
      e => console.error("[CentinelaEngine] planilla:", e)
    );

    const unsubVehicles = subscribeToVehicles(
      user.uid,
      data => {
        vehiclesRef.current = data;
      },
      e => console.error("[CentinelaEngine] vehicles:", e)
    );

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const resetTimer = () => {
      noVehicleSince.current = 0;
      resetCentinelaTimerState();
    };

    const checkExpiredCentinela = async () => {
      const activeCentinela = vehiclesRef.current.find(v => v.autoVerdad && v.status === "activo");
      if (activeCentinela?.aperturaAt) {
        const dayStartMs = getJournalDayStartMs();
        const age = Date.now() - activeCentinela.aperturaAt;
        const isExpired =
          activeCentinela.aperturaAt < dayStartMs || age > CENTINELA_MAX_AGE_MS;
        if (isExpired) {
          const dur = Math.round(age / 60000);
          try {
            await updateVehicle(user.uid, activeCentinela.id, {
              cierreAt: Date.now(),
              duracionFinal: dur,
            });
            await updateVehicleStatus(user.uid, activeCentinela.id, "archivado");
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("? SISTEMICAR ù Centinela Cerrado", {
                body: `Sesiùn anterior cerrada automùticamente. Duraciùn registrada: ${dur} min.`,
                icon: "/favicon.ico",
                silent: false,
              });
            }
            console.log("[Centinela] Auto-cerrado. Duraciùn:", dur, "min");
          } catch (e) {
            console.error("[Centinela autoclose]", e);
          }
        }
      }
      await reconcileStaleCentinelaInFirestore(user.uid);
    };

    const tickUi = () => {
      const now = Date.now();
      const vehicles = vehiclesRef.current;

      if (isCentinelaBlockedByVehicles(vehicles)) {
        resetTimer();
      }

      const { ui, since } = computeCentinelaUiState(
        planillaRef.current,
        vehicles,
        now,
        noVehicleSince.current
      );
      noVehicleSince.current = since;
      emitCentinelaUi(ui);
    };

    const checkActivate = async () => {
      if (isCentinelaSuppressed()) return;

      const now = Date.now();
      if (now - lastCheck.current < 5000) return;
      lastCheck.current = now;

      const vehicles = vehiclesRef.current;
      const gate = getCentinelaSegmentGate(planillaRef.current, now);
      if (!gate.allowed) {
        resetTimer();
        return;
      }

      if (isCentinelaBlockedByVehicles(vehicles)) {
        resetTimer();
        return;
      }

      if (vehicles.some(v => v.autoVerdad && v.status === "activo")) return;

      const { closedIds, hasActiveRemote } = await reconcileStaleCentinelaInFirestore(user.uid);
      if (closedIds.length > 0) {
        console.log("[Centinela] Limpiados obsoletos:", closedIds.join(", "));
      }
      if (hasActiveRemote) {
        console.log("[Centinela] Ya hay uno activo en la nube ù esperando sync local");
        return;
      }

      const { since } = computeCentinelaUiState(
        planillaRef.current,
        vehiclesRef.current,
        now,
        noVehicleSince.current
      );
      noVehicleSince.current = since;

      const elapsedWait = now - since;
      if (elapsedWait < CENTINELA_DELAY_MS) return;

      if (isCentinelaSuppressed()) return;
      if (isCentinelaBlockedByVehicles(vehiclesRef.current)) return;

      const centinelaAperturaAt = since;
      console.log("[Centinela] Activando tras", Math.round(elapsedWait / 1000), "s sin vehùculos");
      await activateCentinelaVehicle(user.uid, centinelaAperturaAt);
      resetTimer();
    };

    forceCheckRef.current = () => {
      lastCheck.current = 0;
      void checkActivate();
    };

    const localVehicles = getLocalVehicles();
    if (localVehicles.some(v => v.status === "activo" && !v.autoVerdad)) {
      resetTimer();
    }

    void checkExpiredCentinela();
    tickUi();

    const uiInterval = setInterval(tickUi, 1000);
    const activateInterval = setInterval(() => {
      void checkActivate();
    }, 5000);

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      console.log("[Centinela] App visible ù reevaluando");
      void checkExpiredCentinela();
      lastCheck.current = 0;
      setTimeout(() => forceCheckRef.current?.(), 3000);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      unsubPlanilla();
      unsubVehicles();
      clearInterval(uiInterval);
      clearInterval(activateInterval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, planillaFecha]);

  return null;
}
