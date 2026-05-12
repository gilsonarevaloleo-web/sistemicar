/** Planes de suscripción y API usados por Mercado Pago (servidor Node y función Vercel). */
export const SUBSCRIPTION_PLANS = {
  "soberania-mental": { id: "soberania-mental", name: "Soberanía Mental", price: 9.99 },
  arquitecto: { id: "arquitecto", name: "Arquitecto", price: 24.99 },
  soberano_operativo: { id: "soberano_operativo", name: "Soberano Operativo", price: 34.99 },
  soberano: { id: "soberano", name: "Soberano", price: 49.99 },
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
