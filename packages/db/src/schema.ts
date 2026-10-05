import {
  boolean, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, unique, uuid,
} from "drizzle-orm/pg-core";

export const orderStatus = pgEnum("order_status", ["new", "accepted", "preparing", "ready", "completed", "cancelled"]);
export const orderType = pgEnum("order_type", ["dine_in", "takeaway", "delivery"]);
export const paymentStatus = pgEnum("payment_status", ["pending", "authorized", "paid", "failed", "refunded", "partially_refunded"]);
export const stockMovementType = pgEnum("stock_movement_type", ["sale", "adjustment", "return", "opening"]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  timezone: text("timezone").notNull().default("Asia/Bahrain"),
  currency: text("currency").notNull().default("BHD"),
  active: boolean("active").notNull().default(true),
}, (table) => ({
  organizationName: unique("locations_organization_name_unique").on(table.organizationId, table.name),
}));

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  active: boolean("active").notNull().default(true),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  organizationEmail: unique("users_organization_email_unique").on(table.organizationId, table.email),
  emailGlobal: unique("users_email_global_unique").on(table.email),
}));

export const menuCategories = pgTable("menu_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  locationId: uuid("location_id").notNull().references(() => locations.id),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const menuItems = pgTable("menu_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  locationId: uuid("location_id").notNull().references(() => locations.id),
  categoryId: uuid("category_id").references(() => menuCategories.id),
  name: text("name").notNull(),
  sku: text("sku"),
  price: numeric("price", { precision: 12, scale: 3 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(3),
  trackAvailability: boolean("track_availability").notNull().default(true),
  active: boolean("active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id),
  locationId: uuid("location_id").notNull().references(() => locations.id),
  type: stockMovementType("type").notNull(),
  quantity: integer("quantity").notNull(),
  referenceType: text("reference_type"),
  referenceId: uuid("reference_id"),
  idempotencyKey: text("idempotency_key").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tables = pgTable("tables", {
  id: uuid("id").defaultRandom().primaryKey(),
  locationId: uuid("location_id").notNull().references(() => locations.id),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  active: boolean("active").notNull().default(true),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  locationId: uuid("location_id").notNull().references(() => locations.id),
  number: text("number").notNull(),
  type: orderType("type").notNull(),
  status: orderStatus("status").notNull().default("new"),
  tableId: uuid("table_id").references(() => tables.id),
  subtotal: numeric("subtotal", { precision: 12, scale: 3 }).notNull(),
  tax: numeric("tax", { precision: 12, scale: 3 }).notNull().default("0"),
  discount: numeric("discount", { precision: 12, scale: 3 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 3 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 3 }).notNull(),
  total: numeric("total", { precision: 12, scale: 3 }).notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  provider: text("provider").notNull(),
  method: text("method").notNull(),
  status: paymentStatus("status").notNull().default("pending"),
  amount: numeric("amount", { precision: 12, scale: 3 }).notNull(),
  providerReference: text("provider_reference"),
  idempotencyKey: text("idempotency_key").unique(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  organizationPhone: unique("customers_organization_phone_unique").on(table.organizationId, table.phone),
}));

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
