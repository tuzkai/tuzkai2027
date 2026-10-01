import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Singleton site configuration. Public fields are projected explicitly by the API.
export const tuzakaiSiteSettings = pgTable("tuzakai_site_settings", {
  id: integer("id").primaryKey(),
  websiteUrl: text("website_url").notNull().default("https://tuzkai.com"),
  supportEmail: text("support_email"),
  businessEmail: text("business_email"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  pinterest: text("pinterest"),
  youtube: text("youtube"),
  tiktok: text("tiktok"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});