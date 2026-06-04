/** Abre el panel global del Doctor IA (montado en App). */

export const DOCTOR_IA_OPEN_EVENT = "sistemicar:doctor-ia-open";

export function openDoctorIAChat(message?: string): void {
  window.dispatchEvent(
    new CustomEvent(DOCTOR_IA_OPEN_EVENT, { detail: { message } })
  );
}
