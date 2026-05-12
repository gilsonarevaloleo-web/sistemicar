import { pgTable, text, varchar, serial, timestamp, integer, numeric, bigint, uniqueIndex, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  referralCode: varchar("referral_code", { length: 20 }).notNull().unique(),
  commissionBalance: numeric("commission_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const futurePlans = pgTable("future_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").default("default").notNull(),
  text: text("text").notNull(),
  complexity: varchar("complexity", { length: 20 }).notNull(),
  targetDate: timestamp("target_date"),
  isCompleted: integer("is_completed").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  archivedAt: timestamp("archived_at"),
});

export const hopeLogs = pgTable("hope_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").default("default").notNull(),
  text: text("text").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  referenceDate: timestamp("reference_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bossSteps = pgTable("boss_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").default("default").notNull(),
  text: text("text").notNull(),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  archivedAt: timestamp("archived_at"),
});

export const wisdomLessons = pgTable("wisdom_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").default("default").notNull(),
  context: varchar("context", { length: 50 }).notNull(),
  conflict: text("conflict").notNull(),
  lesson: text("lesson").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const affiliateRequests = pgTable("affiliate_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  currentCp: integer("current_cp").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  partnerId: varchar("partner_id"),
  plan: varchar("plan", { length: 20 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: numeric("commission_amount", { precision: 10, scale: 2 }),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  commissionPaidOut: integer("commission_paid_out").default(0).notNull(),
});

export const energyScans = pgTable("energy_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").default("default").notNull(),
  inputText: text("input_text").notNull(),
  totalScore: integer("total_score").notNull(),
  socialEgoScore: integer("social_ego_score").notNull(),
  biologicalResistanceScore: integer("biological_resistance_score").notNull(),
  financialFrequencyScore: integer("financial_frequency_score").notNull(),
  architectFocusScore: integer("architect_focus_score").notNull(),
  honestyBonus: integer("honesty_bonus").default(0).notNull(),
  dimensionAnalysis: text("dimension_analysis").notNull(),
  oracleConclusion: text("oracle_conclusion").notNull(),
  oracleSuggestions: text("oracle_suggestions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  referredBy: varchar("referred_by"),
  subscriptionPlan: varchar("subscription_plan", { length: 20 }),
  subscriptionStatus: varchar("subscription_status", { length: 20 }).default("free"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  motivationPhotoUrl: text("motivation_photo_url"),
  monthlyGoal: numeric("monthly_goal", { precision: 10, scale: 2 }).default("500"),
});

export const energyLogs = pgTable("energy_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").default("default").notNull(),
  text: text("text").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  points: integer("points").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const subVehicleRecords = pgTable("sub_vehicle_records", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 200 }).notNull(),
  titulo: text("titulo").notNull(),
  minPerUnit: numeric("min_per_unit", { precision: 10, scale: 4 }).notNull(),
  totalMin: numeric("total_min", { precision: 10, scale: 4 }).notNull(),
  tipoReloj: varchar("tipo_reloj", { length: 50 }).notNull(),
  fecha: bigint("fecha", { mode: "number" }).notNull(),
  status: varchar("status", { length: 20 }),
  subResumen: text("sub_resumen"),
}, (table) => ({
  userTituloFechaUnique: uniqueIndex("svr_user_titulo_fecha_unique").on(table.userId, table.titulo, table.fecha),
  userIdIdx: index("idx_sub_vehicle_records_user").on(table.userId),
}));
