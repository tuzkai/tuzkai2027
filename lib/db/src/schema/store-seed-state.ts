import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Persistent idempotency marker keeps deleted initial catalog records deleted
// across server restarts.
export const storeSeedState = pgTable("store_seed_state", {
  key: text("key").primaryKey(),
  seededAt: timestamp("seeded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStoreSeedStateSchema = createInsertSchema(storeSeedState).omit({ seededAt: true });
export type InsertStoreSeedState = z.infer<typeof insertStoreSeedStateSchema>;
export type StoreSeedState = typeof storeSeedState.$inferSelect;