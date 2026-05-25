import { SUBSCRIPTION_PLANS } from "./mercadopagoPlans";

/** Comisión del vendedor sobre el primer pago del módulo (30% legacy Alianza). */
export const SELLER_COMMISSION_RATE = 0.3;

export const SELLER_PLAN_IDS = [
  "corazon-sabio",
  "planificacion_base",
  "soberania_dia",
  "operativo",
] as const;

export type SellerPlanId = (typeof SELLER_PLAN_IDS)[number];

export function isSellerPlanId(planId: string): planId is SellerPlanId {
  return (SELLER_PLAN_IDS as readonly string[]).includes(planId);
}

export function sellerCommissionForPlan(planId: string): number | null {
  if (!isSellerPlanId(planId)) return null;
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan || !("price" in plan)) return null;
  return Math.round(plan.price * SELLER_COMMISSION_RATE * 100) / 100;
}

export function sellerPlanLabel(planId: string): string {
  const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
  return plan?.name ?? planId;
}
