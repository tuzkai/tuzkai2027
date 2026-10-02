import { pgTable, text, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tuzakaiComponents = pgTable("tuzakai_components", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  jewelryTypes: text("jewelry_types").array().notNull(),
  material: text("material").notNull(),
  color: text("color").notNull(),
  size: text("size").notNull(),
  unit: text("unit").notNull(),
  priceCents: integer("price_cents"),
  supplier: text("supplier"),
  supplierUrl: text("supplier_url"),
  imageUrl: text("image_url"),
  weightGrams: numeric("weight_grams", { mode: "number" }),
  inventoryQuantity: integer("inventory_quantity"),
  notes: text("notes").notNull().default(""),
  active: boolean("active").notNull().default(true),
});

export const insertTuzakaiComponentSchema = createInsertSchema(tuzakaiComponents);
export type InsertTuzakaiComponent = z.infer<typeof insertTuzakaiComponentSchema>;
export type TuzakaiComponent = typeof tuzakaiComponents.$inferSelect;