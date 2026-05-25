import fs from "fs";
import path from "path";
import {
  sellerCommissionForPlan,
  sellerPlanLabel,
  isSellerPlanId,
} from "../shared/sellerCommissions";
import { SUBSCRIPTION_PLANS } from "../shared/mercadopagoPlans";

export interface SellerSaleRecord {
  id: string;
  sellerRef: string;
  planId: string;
  planName: string;
  amountUsd: number;
  commissionUsd: number;
  buyerEmail?: string;
  mpPaymentId: string;
  createdAt: string;
  commissionPaidOut: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const SALES_FILE = path.join(DATA_DIR, "seller-sales.json");

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SALES_FILE)) {
    fs.writeFileSync(SALES_FILE, "[]", "utf8");
  }
}

function readSales(): SellerSaleRecord[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(SALES_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSales(rows: SellerSaleRecord[]): void {
  ensureDataFile();
  fs.writeFileSync(SALES_FILE, JSON.stringify(rows, null, 2), "utf8");
}

export async function recordSellerSale(input: {
  sellerRef: string;
  planId: string;
  buyerEmail?: string;
  mpPaymentId: string;
}): Promise<SellerSaleRecord | null> {
  const sellerRef = input.sellerRef.trim().toUpperCase();
  if (!sellerRef || !isSellerPlanId(input.planId)) return null;

  const commissionUsd = sellerCommissionForPlan(input.planId);
  if (commissionUsd == null) return null;

  const sales = readSales();
  if (sales.some((s) => s.mpPaymentId === input.mpPaymentId)) {
    return sales.find((s) => s.mpPaymentId === input.mpPaymentId) ?? null;
  }

  const plan = SUBSCRIPTION_PLANS[input.planId as keyof typeof SUBSCRIPTION_PLANS];
  const amountUsd = plan && "price" in plan ? plan.price : 0;

  const record: SellerSaleRecord = {
    id: `ss_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sellerRef,
    planId: input.planId,
    planName: sellerPlanLabel(input.planId),
    amountUsd,
    commissionUsd,
    buyerEmail: input.buyerEmail,
    mpPaymentId: input.mpPaymentId,
    createdAt: new Date().toISOString(),
    commissionPaidOut: false,
  };

  sales.unshift(record);
  writeSales(sales);
  console.log(
    `[Seller] Venta atribuida: ${sellerRef} ù ${input.planId} ù $${amountUsd} ù comisiùn $${commissionUsd} ù pago ${input.mpPaymentId}`
  );
  return record;
}

export async function listSellerSales(limit = 100): Promise<SellerSaleRecord[]> {
  return readSales().slice(0, limit);
}

export async function markSellerCommissionPaid(id: string): Promise<boolean> {
  const sales = readSales();
  const idx = sales.findIndex((s) => s.id === id);
  if (idx < 0) return false;
  sales[idx] = { ...sales[idx], commissionPaidOut: true };
  writeSales(sales);
  return true;
}
