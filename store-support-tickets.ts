import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { storeProducts } from "./store-products";

export const storeSupportTicketStatus = pgEnum("store_support_ticket_status", ["new", "open", "answered", "closed"]);

export const storeSupportTickets = pgTable("store_support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  productId: uuid("product_id").references(() => storeProducts.id, { onDelete: "set null" }),
  status: storeSupportTicketStatus("status").notNull().default("new"),
  adminReply: text("admin_reply"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStoreSupportTicketSchema = createInsertSchema(storeSupportTickets).omit({
  id: true,
  status: true,
  adminReply: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStoreSupportTicket = z.infer<typeof insertStoreSupportTicketSchema>;
export type StoreSupportTicket = typeof storeSupportTickets.$inferSelect;