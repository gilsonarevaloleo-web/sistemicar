import { SUBSCRIPTION_PLANS } from "../shared/mercadopagoPlans";

type MpPaymentInfo = {
  id?: string | number;
  external_reference?: string | null;
  payer?: { email?: string | null };
  transaction_amount?: number | null;
};
import {
  getEspejoDeliveryByPaymentId,
  processCorazonSabioPayment,
} from "./espejoCreditDeliveries";
import { sendPaymentConfirmationEmail } from "./emailService";

export type MpExternalRef = {
  planId?: string;
  email?: string;
  userName?: string;
  timestamp?: number;
};

export function parseMpExternalRef(paymentInfo: MpPaymentInfo): MpExternalRef {
  const externalRef: MpExternalRef = paymentInfo.external_reference
    ? JSON.parse(paymentInfo.external_reference)
    : {};
  if (!externalRef.email && paymentInfo.payer?.email) {
    externalRef.email = paymentInfo.payer.email;
  }
  return externalRef;
}

/** Entrega de cr�ditos Espejo para plan corazon-sabio (idempotente por payment id). */
export async function deliverCorazonSabioIfNeeded(
  paymentInfo: MpPaymentInfo,
  externalRef: MpExternalRef
): Promise<void> {
  if (externalRef.planId !== "corazon-sabio") return;

  const plan = SUBSCRIPTION_PLANS["corazon-sabio"];
  const credits = plan.espejoCredits ?? 10;
  const email = externalRef.email?.trim();
  if (!email) {
    console.warn("[MP] corazon-sabio sin email � no se pueden acreditar cr�ditos");
    return;
  }

  const paymentIdStr = String(paymentInfo.id);
  const existing = await getEspejoDeliveryByPaymentId(paymentIdStr);
  if (existing.exists && existing.status === "granted") {
    console.log(`[MP] Espejo: pago ${paymentIdStr} ya acreditado`);
    return;
  }

  const result = await processCorazonSabioPayment({
    mpPaymentId: paymentIdStr,
    buyerEmail: email,
    credits,
  });

  try {
    await sendPaymentConfirmationEmail({
      to: email,
      userName: externalRef.userName || "Explorador",
      planName: plan.name,
      amount: paymentInfo.transaction_amount ?? plan.price,
    });
  } catch (emailErr) {
    console.error(`[MP] Email confirmaci�n Espejo fall� para ${email}`, emailErr);
  }

  if (result.granted) {
    console.log(`[MP] Espejo: cr�ditos activados para ${email}`);
  } else {
    console.log(
      `[MP] Espejo: pago registrado para ${email} � claim al iniciar sesi�n con el mismo correo`
    );
  }
}
