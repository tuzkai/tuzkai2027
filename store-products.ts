import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { storeCategories } from "./store-categories";

export const storeProductType = pgEnum("store_product_type", ["digital", "ai_tool"]);
export const storeProductStatus = pgEnum("store_product_status", ["draft", "published", "archived"]);

export const storeProducts = pgTable("store_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => storeCategories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  productType: storeProductType("product_type").notNull(),
  summary: text("summary"),
  description: text("description"),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  requirements: jsonb("requirements").$type<string[]>().notNull().default([]),
  imageUrl: text("image_url"),
  // Whop owns all price, checkout, and payment data; these are references only.
  whopProductId: text("whop_product_id"),
  whopProductUrl: text("whop_product_url"),
  // Delivery is configured as a URL and/or instructions. File storage is a later slice.
  deliveryUrl: text("delivery_url"),
  deliveryInstructions: text("delivery_instructions"),
  status: storeProductStatus("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStoreProductSchema = createInsertSchema(storeProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStoreProduct = z.infer<typeof insertStoreProductSchema>;
export type StoreProduct = typeof storeProducts.$inferSelect;