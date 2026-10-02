import { getAuth } from "@clerk/express";
import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { Router, type IRouter, type Request } from "express";
import {
  CreateAdminStoreCategoryBody,
  CreateAdminStoreCategoryResponse,
  CreateAdminStoreProductBody,
  CreateAdminStoreProductResponse,
  DeleteAdminStoreCategoryParams,
  DeleteAdminStoreCategoryResponse,
  DeleteAdminStoreProductParams,
  DeleteAdminStoreProductResponse,
  GetAdminStoreProductParams,
  GetAdminStoreProductResponse,
  GetStoreCategoryParams,
  GetStoreCategoryResponse,
  GetStoreProductParams,
  GetStoreProductResponse,
  ListAdminStoreCategoriesResponse,
  ListAdminStoreProductsResponse,
  ListAdminStoreSupportTicketsResponse,
  ListStoreCategoriesResponse,
  ListStoreProductsQueryParams,
  ListStoreProductsResponse,
  SearchStoreProductsQueryParams,
  SearchStoreProductsResponse,
  SubmitStoreSupportTicketBody,
  SubmitStoreSupportTicketResponse,
  UpdateAdminStoreCategoryBody,
  UpdateAdminStoreCategoryParams,
  UpdateAdminStoreCategoryResponse,
  UpdateAdminStoreProductBody,
  UpdateAdminStoreProductParams,
  UpdateAdminStoreProductResponse,
  UpdateAdminStoreSupportTicketBody,
  UpdateAdminStoreSupportTicketParams,
  UpdateAdminStoreSupportTicketResponse,
} from "@workspace/api-zod";
import {
  db,
  storeCategories,
  storeProducts,
  storeSeedState,
  storeSupportTickets,
} from "@workspace/db";

const router: IRouter = Router();

const ticketRateLimit = 5;
const ticketRateWindowMs = 15 * 60 * 1000;
const maxTrackedTicketIps = 10_000;
const rateLimitCleanupIntervalMs = 60 * 1000;
const ticketRequestsByIp = new Map<string, { windowStartedAt: number; count: number }>();
let lastRateLimitCleanupAt = 0;

function consumeTicketRequest(ip: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  if (now - lastRateLimitCleanupAt >= rateLimitCleanupIntervalMs || ticketRequestsByIp.size >= maxTrackedTicketIps) {
    for (const [trackedIp, entry] of ticketRequestsByIp) {
      if (now - entry.windowStartedAt >= ticketRateWindowMs) ticketRequestsByIp.delete(trackedIp);
    }
    lastRateLimitCleanupAt = now;
  }

  const existing = ticketRequestsByIp.get(ip);
  if (!existing || now - existing.windowStartedAt >= ticketRateWindowMs) {
    if (!existing && ticketRequestsByIp.size >= maxTrackedTicketIps) {
      return { allowed: false, retryAfterSeconds: Math.ceil(ticketRateWindowMs / 1000) };
    }
    ticketRequestsByIp.set(ip, { windowStartedAt: now, count: 1 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (existing.count >= ticketRateLimit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((ticketRateWindowMs - (now - existing.windowStartedAt)) / 1000)),
    };
  }
  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

const initialCategories = [
  { id: "b0000000-0000-4000-8000-000000000001", name: "Jewelry Design", slug: "jewelry-design" },
  { id: "b0000000-0000-4000-8000-000000000002", name: "Business Tools", slug: "business-tools" },
  { id: "b0000000-0000-4000-8000-000000000003", name: "Guides & Ebooks", slug: "guides-ebooks" },
  { id: "b0000000-0000-4000-8000-000000000004", name: "Social Media Templates", slug: "social-media-templates" },
  { id: "b0000000-0000-4000-8000-000000000005", name: "Canva Templates", slug: "canva-templates" },
  { id: "b0000000-0000-4000-8000-000000000006", name: "AI Tools", slug: "ai-tools" },
];

const initialProducts = [
  ["TuzakAI Jewelry Designer — Creator", "tuzakai-jewelry-designer-creator", "ai_tool", 0],
  ["TuzakAI Jewelry Designer — Pro", "tuzakai-jewelry-designer-pro", "ai_tool", 0],
  ["Jewelry Design Planner", "jewelry-design-planner", "digital", 0],
  ["Jewelry Cost Calculator", "jewelry-cost-calculator", "digital", 1],
  ["Jewelry Pricing Calculator", "jewelry-pricing-calculator", "digital", 1],
  ["Resin Jewelry Design Pack", "resin-jewelry-design-pack", "digital", 0],
  ["Jewelry Business Guide", "jewelry-business-guide", "digital", 2],
  ["Social Media Content Pack", "social-media-content-pack", "digital", 3],
  ["Canva Jewelry Templates", "canva-jewelry-templates", "digital", 4],
  ["Jewelry Product Photography Templates", "jewelry-product-photography-templates", "digital", 5],
] as const;

async function ensureInitialDrafts(): Promise<void> {
  await db.transaction(async (tx) => {
    const [seedState] = await tx.insert(storeSeedState).values({ key: "initial-store-catalog" })
      .onConflictDoNothing().returning({ key: storeSeedState.key });
    if (!seedState) return;
    await tx.insert(storeCategories).values(initialCategories).onConflictDoNothing();
    await tx.insert(storeProducts).values(initialProducts.map(([name, slug, productType, categoryIndex]) => ({
        name,
        slug,
        productType,
        categoryId: initialCategories[categoryIndex].id,
        status: "draft" as const,
    }))).onConflictDoNothing();
  });
}

function isAdmin(req: Request): boolean {
  const userId = getAuth(req).userId;
  const allowlist = (process.env.TUZAKAI_ADMIN_USER_IDS ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  return Boolean(userId && allowlist.includes(userId));
}

function adminRequired(req: Request, res: Parameters<Parameters<IRouter["get"]>[1]>[1]): boolean {
  if (isAdmin(req)) return true;
  res.status(403).json({ error: "Administrator access required." });
  return false;
}

function categoryOutput(row: typeof storeCategories.$inferSelect) {
  return { ...row, description: row.description ?? null };
}

function validationMessage(issues: readonly { path: readonly (string | number)[]; message: string }[]): string {
  return issues.map(({ path, message }) => `${path.length ? path.join(".") : "request"}: ${message}`).join("; ");
}

function adminProductOutput(row: {
  product: typeof storeProducts.$inferSelect;
  categoryName: string | null;
}) {
  return {
    ...row.product,
    categoryName: row.categoryName ?? null,
    categoryId: row.product.categoryId ?? null,
    summary: row.product.summary ?? null,
    description: row.product.description ?? null,
    imageUrl: row.product.imageUrl ?? null,
    whopProductId: row.product.whopProductId ?? null,
    whopProductUrl: row.product.whopProductUrl ?? null,
    deliveryUrl: row.product.deliveryUrl ?? null,
    deliveryInstructions: row.product.deliveryInstructions ?? null,
  };
}

function publicProductOutput(row: {
  product: typeof storeProducts.$inferSelect;
  categoryName: string | null;
}) {
  return {
    ...adminProductOutput(row),
    whopProductId: null,
    whopProductUrl: null,
    deliveryUrl: null,
    deliveryInstructions: null,
  };
}

async function productById(id: string) {
  const [row] = await db.select({
    product: storeProducts,
    categoryName: storeCategories.name,
  }).from(storeProducts)
    .leftJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
    .where(eq(storeProducts.id, id));
  return row;
}

async function validCategoryForProduct(categoryId: string | null | undefined, published: boolean): Promise<boolean> {
  if (!categoryId) return true;
  const [category] = await db.select({ active: storeCategories.active })
    .from(storeCategories).where(eq(storeCategories.id, categoryId));
  return Boolean(category && (!published || category.active));
}

function canPublish(product: {
  whopProductId?: string | null;
  whopProductUrl?: string | null;
  deliveryUrl?: string | null;
  deliveryInstructions?: string | null;
}): boolean {
  const validWhopUrl = (() => {
    if (!product.whopProductUrl) return false;
    try {
      const url = new URL(product.whopProductUrl);
      return url.protocol === "https:" && (url.hostname === "whop.com" || url.hostname.endsWith(".whop.com"));
    } catch {
      return false;
    }
  })();
  const validDeliveryUrl = (() => {
    if (!product.deliveryUrl) return false;
    try {
      return new URL(product.deliveryUrl).protocol === "https:";
    } catch {
      return false;
    }
  })();
  return Boolean(product.whopProductId?.trim() && validWhopUrl &&
    (validDeliveryUrl || product.deliveryInstructions?.trim()));
}

router.get("/store/categories", async (_req, res): Promise<void> => {
  await ensureInitialDrafts();
  const rows = await db.selectDistinct({
    category: storeCategories,
  }).from(storeCategories)
    .innerJoin(storeProducts, eq(storeProducts.categoryId, storeCategories.id))
    .where(and(eq(storeCategories.active, true), eq(storeProducts.status, "published")))
    .orderBy(asc(storeCategories.name));
  res.json(ListStoreCategoriesResponse.parse(rows.map(({ category }) => categoryOutput(category))));
});

router.get("/store/categories/:slug", async (req, res): Promise<void> => {
  await ensureInitialDrafts();
  const params = GetStoreCategoryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [category] = await db.select({ category: storeCategories })
    .from(storeCategories)
    .innerJoin(storeProducts, eq(storeProducts.categoryId, storeCategories.id))
    .where(and(
      eq(storeCategories.slug, params.data.slug),
      eq(storeCategories.active, true),
      eq(storeProducts.status, "published"),
    ));
  if (!category) { res.status(404).json({ error: "Category not found." }); return; }
  res.json(GetStoreCategoryResponse.parse(categoryOutput(category.category)));
});

router.get("/store/products", async (req, res): Promise<void> => {
  await ensureInitialDrafts();
  const query = ListStoreProductsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const predicates = [eq(storeProducts.status, "published")];
  if (query.data.category) predicates.push(eq(storeCategories.slug, query.data.category));
  const rows = await db.select({
    product: storeProducts,
    categoryName: storeCategories.name,
  }).from(storeProducts)
    .leftJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
    .where(and(...predicates, or(eq(storeCategories.active, true), isNull(storeProducts.categoryId))))
    .orderBy(desc(storeProducts.createdAt))
    .limit(query.data.limit).offset(query.data.offset);
  res.json(ListStoreProductsResponse.parse(rows.map(publicProductOutput)));
});

router.get("/store/products/:slug", async (req, res): Promise<void> => {
  await ensureInitialDrafts();
  const params = GetStoreProductParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.select({
    product: storeProducts,
    categoryName: storeCategories.name,
  }).from(storeProducts)
    .leftJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
    .where(and(
      eq(storeProducts.slug, params.data.slug),
      eq(storeProducts.status, "published"),
      or(eq(storeCategories.active, true), isNull(storeProducts.categoryId)),
    ));
  if (!row) { res.status(404).json({ error: "Product not found." }); return; }
  res.json(GetStoreProductResponse.parse(publicProductOutput(row)));
});

router.get("/store/search", async (req, res): Promise<void> => {
  await ensureInitialDrafts();
  const query = SearchStoreProductsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const search = query.data.q.replace(/[\\%_]/g, "\\$&");
  const rows = await db.select({
    product: storeProducts,
    categoryName: storeCategories.name,
  }).from(storeProducts)
    .leftJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
    .where(and(
      eq(storeProducts.status, "published"),
      or(eq(storeCategories.active, true), isNull(storeProducts.categoryId)),
      or(
        ilike(storeProducts.name, `%${search}%`),
        ilike(storeProducts.summary, `%${search}%`),
        ilike(storeProducts.description, `%${search}%`),
      ),
    ))
    .orderBy(desc(storeProducts.createdAt))
    .limit(query.data.limit);
  res.json(SearchStoreProductsResponse.parse(rows.map(publicProductOutput)));
});

router.get("/store/admin/categories", async (req, res): Promise<void> => {
  if (!adminRequired(req, res)) return;
  await ensureInitialDrafts();
  const rows = await db.select().from(storeCategories).orderBy(asc(storeCategories.name));
  res.json(ListAdminStoreCategoriesResponse.parse(rows.map(categoryOutput)));
});

router.post("/store/admin/categories", async (req, res): Promise<void> => {
  if (!adminRequired(req, res)) return;
  await ensureInitialDrafts();
  const parsed = CreateAdminStoreCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [category] = await db.insert(storeCategories).values({
    ...parsed.data,
    description: parsed.data.description ?? null,
  }).onConflictDoNothing().returning();
  if (!category) { res.status(400).json({ error: "A category with that slug already exists." }); return; }
  res.status(201).json(CreateAdminStoreCategoryResponse.parse(categoryOutput(category)));
});

router.patch("/store/admin/categories/:id", async (req, res): Promise<void> => {
  if (!adminRequired(req, res)) return;
  const params = UpdateAdminStoreCategoryParams.safeParse(req.params);
  const parsed = UpdateAdminStoreCategoryBody.safeParse(req.body);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (!Object.keys(parsed.data).length) { res.status(400).json({ error: "Provide at least one category field to update." }); return; }
  if (parsed.data.slug) {
    const [duplicate] = await db.select({ id: storeCategories.id }).from(storeCategories)
      .where(eq(storeCategories.slug, parsed.data.slug));
    if (duplicate && duplicate.id !== params.data.id) {
      res.status(400).json({ error: "A category with that slug already exists." });
      return;
    }
  }
  const [category] = await db.update(storeCategories)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(storeCategories.id, params.data.id)).returning();
  if (!category) { res.status(404).json({ error: "Category not found." }); return; }
  res.json(UpdateAdminStoreCategoryResponse.parse(categoryOutput(category)));
});

router.delete("/store/admin/categories/:id", async (req, res): Promise<void> => {
  if (!adminRequired(req, res)) return;
  const params = DeleteAdminStoreCategoryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [category] = await db.delete(storeCategories)
    .where(eq(storeCategories.id, params.data.id)).returning({ id: storeCategories.id });
  if (!category) { res.status(404).json({ error: "Category not found." }); return; }
  res.json(DeleteAdminStoreCategoryResponse.parse({ success: true }));
});

router.get("/store/admin/products", async (req, res): Promise<void> => {
  if (!adminRequired(req, res)) return;
  await ensureInitialDrafts();
  const rows = await db.select({
    product: storeProducts,
    categoryName: storeCategories.name,
  }).from(storeProducts)
    .leftJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
    .orderBy(desc(storeProducts.createdAt));
  res.json(ListAdminStoreProductsResponse.parse(rows.map(adminProductOutput)));
});

router.post("/store/admin/products", async (req, res): Promise<void> => {
  if (!adminRequired(req, res)) return;
  await ensureInitialDrafts();
  const parsed = CreateAdminStoreProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: validationMessage(parsed.error.issues) });
    return;
  }
  if (!await validCategoryForProduct(parsed.data.categoryId, parsed.data.status === "published")) {
    res.status(400).json({ error: "Choose an existing active category before publishing." });
    return;
  }
  if (parsed.data.status === "published" && !canPublish(parsed.data)) {
    res.status(400).json({ error: "Publishing requires a Whop product ID, Whop HTTPS product URL, and delivery URL or instructions." });
    return;
  }
  const [product] = await db.insert(storeProducts).values({
    ...parsed.data,
    categoryId: parsed.data.categoryId ?? null,
    summary: parsed.data.summary ?? null,
    description: parsed.data.description ?? null,
    imageUrl: parsed.data.imageUrl ?? null,
    whopProductId: parsed.data.whopProductId ?? null,
    whopProductUrl: parsed.data.whopProductUrl ?? null,
    deliveryUrl: parsed.data.deliveryUrl ?? null,
    deliveryInstructions: parsed.data.deliveryInstructions ?? null,
    features: parsed.data.features ?? [],
    requirements: parsed.data.requirements ?? [],
  }).onConflictDoNothing().returning();
  if (!product) { res.status(400).json({ error: "A product with that slug already exists." }); return; }
  const row = await productById(product.id);
  res.status(201).json(CreateAdminStoreProductResponse.parse(adminProductOutput(row!)));
});

router.get("/store/admin/products/:id", async (req, res): Promise<void> => {
  if (!adminRequired(req, res)) return;
  const params = GetAdminStoreProductParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const row = await productById(params.data.id);
  if (!row) { res.status(404).json({ error: "Product not found." }); return; }
  res.json(GetAdminStoreProductResponse.parse(adminProductOutput(row)));
});

router.patch("/store/admin/products/:id", async (req, res): Promise<void> => {
  if (!adminRequired(req, res)) return;
  const params = UpdateAdminStoreProductParams.safeParse(req.params);
  const parsed = UpdateAdminStoreProductBody.safeParse(req.body);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  if (!parsed.success) {
    res.status(400).json({ error: validationMessage(parsed.error.issues) });
    return;
  }
  if (!Object.keys(parsed.data).length) { res.status(400).json({ error: "Provide at least one product field to update." }); return; }
  const current = await productById(params.data.id);
  if (!current) { res.status(404).json({ error: "Product not found." }); return; }
  if (parsed.data.slug) {
    const [duplicate] = await db.select({ id: storeProducts.id }).from(storeProducts)
      .where(eq(storeProducts.slug, parsed.data.slug));
    if (duplicate && duplicate.id !== params.data.id) {
      res.status(400).json({ error: "A product with that slug already exists." });
      return;
    }
  }
  const candidate = { ...current.product, ...parsed.data };
  if (!await validCategoryForProduct(candidate.categoryId, candidate.status === "published")) {
    res.status(400).json({ error: "Choose an existing active category before publishing." });
    return;
  }
  if (candidate.status === "published" && !canPublish(candidate)) {
    res.status(400).json({ error: "Publishing requires a Whop product ID, Whop HTTPS product URL, and delivery URL or instructions." });
    return;
  }
  const [product] = await db.update(storeProducts)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(storeProducts.id, params.data.id)).returning();
  if (!product) { res.status(404).json({ error: "Product not found." }); return; }
  const row = await productById(product.id);
  res.json(UpdateAdminStoreProductResponse.parse(adminProductOutput(row!)));
});

router.delete("/store/admin/products/:id", async (req, res): Promise<void> => {
  if (!adminRequired(req, res)) return;
  const params = DeleteAdminStoreProductParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [product] = await db.delete(storeProducts)
    .where(eq(storeProducts.id, params.data.id)).returning({ id: storeProducts.id });
  if (!product) { res.status(404).json({ error: "Product not found." }); return; }
  res.json(DeleteAdminStoreProductResponse.parse({ success: true }));
});

router.post("/store/support/tickets", async (req, res): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const limit = consumeTicketRequest(ip);
  if (!limit.allowed) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    res.status(429).json({ error: "Too many support requests. Please try again later." });
    return;
  }

  const requestBody = req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? req.body as Record<string, unknown>
    : {};
  if (Object.hasOwn(requestBody, "status") || Object.hasOwn(requestBody, "adminReply")) {
    res.status(400).json({ error: "Support ticket status and reply are managed by administrators." });
    return;
  }
  const parsed = SubmitStoreSupportTicketBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const name = parsed.data.name.trim();
  const subject = parsed.data.subject.trim();
  const message = parsed.data.message.trim();
  if (!name || !subject || !message) {
    res.status(400).json({ error: "Name, subject, and message must not be blank." });
    return;
  }
  if (parsed.data.productId) {
    const [product] = await db.select({ id: storeProducts.id })
      .from(storeProducts).where(and(
        eq(storeProducts.id, parsed.data.productId),
        eq(storeProducts.status, "published"),
      ));
    if (!product) { res.status(400).json({ error: "The related product is not available." }); return; }
  }
  const [ticket] = await db.insert(storeSupportTickets).values({
    ...parsed.data,
    name,
    subject,
    message,
    productId: parsed.data.productId ?? null,
  }).returning();
  res.status(201).json(SubmitStoreSupportTicketResponse.parse(ticket));
});

router.get("/store/admin/support/tickets", async (req, res): Promise<void> => {
  if (!adminRequired(req, res)) return;
  const tickets = await db.select().from(storeSupportTickets).orderBy(desc(storeSupportTickets.createdAt));
  res.json(ListAdminStoreSupportTicketsResponse.parse(tickets));
});

router.patch("/store/admin/support/tickets/:id", async (req, res): Promise<void> => {
  if (!adminRequired(req, res)) return;
  const params = UpdateAdminStoreSupportTicketParams.safeParse(req.params);
  const parsed = UpdateAdminStoreSupportTicketBody.safeParse(req.body);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (!Object.keys(parsed.data).length) { res.status(400).json({ error: "Provide a ticket status or reply to update." }); return; }
  const [ticket] = await db.update(storeSupportTickets)
    .set({
      ...parsed.data,
      ...(parsed.data.adminReply && parsed.data.status === undefined ? { status: "answered" as const } : {}),
      updatedAt: new Date(),
    })
    .where(eq(storeSupportTickets.id, params.data.id)).returning();
  if (!ticket) { res.status(404).json({ error: "Support ticket not found." }); return; }
  res.json(UpdateAdminStoreSupportTicketResponse.parse(ticket));
});

export default router;