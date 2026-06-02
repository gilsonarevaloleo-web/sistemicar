const TIK_SOUND_KEY = "sistemicar_tik_sound";
const SITUACION_ALERTS_KEY = "sistemicar_situacion_alerts";
const PUERTA_VOZ_KEY = "sistemicar_puerta_voz";
const DESGLOSADOR_VOZ_KEY = "sistemicar_desglosador_voz";

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

/** Voz de puerta de atención (minuto 4). Default ON si alertas situacionales están ON. */
export function isPuertaVozEnabled(): boolean {
  try {
    const v = localStorage.getItem(PUERTA_VOZ_KEY);
    if (v === "off") return false;
    if (v === "on") return true;
    return isSituacionAlertsEnabled();
  } catch {
    return true;
  }
}

/** Voz del desglosador (ruta de enfoque): solo si el usuario activa DSG explícitamente. */
export function isDesglosadorVoiceEnabled(): boolean {
  try {
    return localStorage.getItem(DESGLOSADOR_VOZ_KEY) === "on";
  } catch {
    return false;
  }
}

export function setDesglosadorVoiceEnabled(on: boolean): void {
  try {
    localStorage.setItem(DESGLOSADOR_VOZ_KEY, on ? "on" : "off");
    if (!on && typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
    }
    window.dispatchEvent(new CustomEvent("sistemicar-desglosador-voz-changed", { detail: { on } }));
  } catch {
    /* noop */
  }
}

export function setPuertaVozEnabled(on: boolean): void {
  try {
    localStorage.setItem(PUERTA_VOZ_KEY, on ? "on" : "off");
    window.dispatchEvent(new CustomEvent("sistemicar-puerta-voz-changed", { detail: { on } }));
  } catch {
    /* noop */
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
