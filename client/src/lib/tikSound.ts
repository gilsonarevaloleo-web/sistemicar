const TIK_SOUND_KEY = "sistemicar_tik_sound";
const SITUACION_ALERTS_KEY = "sistemicar_situacion_alerts";

export function isTikSoundEnabled(): boolean {
  try {
    return localStorage.getItem(TIK_SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function isSituacionAlertsEnabled(): boolean {
  try {
    const v = localStorage.getItem(SITUACION_ALERTS_KEY);
    if (v === "off") return false;
    return true;
  } catch {
    return true;
  }
}

export function setTikSoundEnabled(on: boolean): void {
  try {
    localStorage.setItem(TIK_SOUND_KEY, on ? "on" : "off");
    if (!on && typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
    }
    window.dispatchEvent(new CustomEvent("sistemicar-tik-sound-changed", { detail: { on } }));
  } catch {
    /* noop */
  }
}

export function setSituacionAlertsEnabled(on: boolean): void {
  try {
    localStorage.setItem(SITUACION_ALERTS_KEY, on ? "on" : "off");
    if (!on && typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
    }
    window.dispatchEvent(new CustomEvent("sistemicar-situacion-alerts-changed", { detail: { on } }));
  } catch {
    /* noop */
  }
}
