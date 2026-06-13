/** Planes de suscripción y API usados por Mercado Pago (servidor Node y función Vercel). */
export const SUBSCRIPTION_PLANS = {
  "corazon-sabio": {
    id: "corazon-sabio",
    name: "El Corazón Sabio™",
    price: 17,
    isOneTime: true,
    espejoCredits: 10,
  },
  "soberania-mental": { id: "soberania-mental", name: "Soberanía Mental", price: 9.99 },
  /** Planificación — suscripción base mensual */
  planificacion_base: {
    id: "planificacion_base",
    name: "Planificación Base",
    price: 19.99,
  },
  /** Desglosador Enfoque + Hub Proyectos */
  soberania_dia: {
    id: "soberania_dia",
    name: "Soberanía del día",
    price: 29.99,
  },
  /** Desglosador Conquista (producción) */
  operativo: {
    id: "operativo",
    name: "Operativo",
    price: 39.99,
  },
  /** Legacy — grandfather / webhooks antiguos (no checkout UI) */
  arquitecto: { id: "arquitecto", name: "Arquitecto", price: 24.99, legacy: true },
  soberano_operativo: { id: "soberano_operativo", name: "Soberano Operativo", price: 34.99, legacy: true },
  soberano: { id: "soberano", name: "Soberano", price: 49.99, legacy: true },
  "api-starter": {
    id: "api-starter",
    name: "API Starter",
    price: 29,
    monthlyCallLimit: 500,
    daysValid: 30,
  },
  "api-pro": {
    id: "api-pro",
    name: "API Pro",
    price: 99,
    monthlyCallLimit: 5000,
    daysValid: 30,
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

/** Planes visibles en checkout de Planificación (mensual). */
export const PLANIFICACION_CHECKOUT_PLANS = [
  "planificacion_base",
  "soberania_dia",
  "operativo",
] as const;

export type PlanificacionCheckoutPlanId = (typeof PLANIFICACION_CHECKOUT_PLANS)[number];
