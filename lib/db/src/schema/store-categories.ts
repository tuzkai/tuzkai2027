import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storeCategories = pgTable("store_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStoreCategorySchema = createInsertSchema(storeCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStoreCategory = z.infer<typeof insertStoreCategorySchema>;
export type StoreCategory = typeof storeCategories.$inferSelect;