import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { join, resolve } from "node:path";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
// Browser clients use the same-origin /api route. Do not grant arbitrary origins
// credentialed access to administrator endpoints.
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

// Render runs the API and both Vite apps as one same-origin web service.
// Replit keeps serving each artifact through its own managed workflow.
const staticWebRoot = process.env.STATIC_WEB_ROOT;
if (staticWebRoot) {
  const webRoot = resolve(staticWebRoot);
  app.use(express.static(webRoot, { index: false }));
  app.use((req, res, next) => {
    if (
      req.method !== "GET" ||
      req.path === "/api" ||
      req.path.startsWith("/api/")
    ) {
      return next();
    }

    const isDesignerRoute =
      req.path === "/tuzakai" || req.path.startsWith("/tuzakai/");
    const indexPath = isDesignerRoute
      ? join(webRoot, "tuzakai", "index.html")
      : join(webRoot, "index.html");
    res.sendFile(indexPath, (error) => {
      if (error) next(error);
    });
  });
}

export default app;
