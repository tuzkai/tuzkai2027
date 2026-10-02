import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tuzakaiDesigns = pgTable("tuzakai_designs", {
  id: uuid("id").primaryKey().defaultRandom(),
  visitorId: uuid("visitor_id").notNull(),
  name: text("name").notNull(),
  // Snapshot includes resolved component prices so changing the catalog cannot
  // retroactively change a maker's saved cost sheet.
  profile: jsonb("profile").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index("tuzakai_designs_visitor_idx").on(table.visitorId)]);

export const insertTuzakaiDesignSchema = createInsertSchema(tuzakaiDesigns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTuzakaiDesign = z.infer<typeof insertTuzakaiDesignSchema>;
export type TuzakaiDesign = typeof tuzakaiDesigns.$inferSelect;