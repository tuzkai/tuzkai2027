import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { getWhopCompanyId } from "../lib/whopClient";

const router: IRouter = Router();
const paymentSetupRequired = {
  status: "payment_setup_required",
  checkoutAvailable: false,
  paidAccessVerificationAvailable: false,
  reason: "A user-approved Whop price and plan, plus a server-verifiable Clerk-to-Whop purchase binding, are required.",
} as const;

function setupState() {
  const missingConfiguration: string[] = [];
  if (!getWhopCompanyId()) missingConfiguration.push("WHOP_COMPANY_ID");
  if (!process.env.WHOP_PLAN_ID?.trim()) missingConfiguration.push("WHOP_PLAN_ID");
  return {
    ...paymentSetupRequired,
    missingConfiguration,
    missingCapabilities: ["server_verified_clerk_to_whop_purchase_binding"],
  };
}

router.get("/store/payments/setup", (_req, res): void => {
  res.json(setupState());
});

router.post("/store/payments/checkout", (req, res): void => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Sign in is required to start checkout." });
    return;
  }

  res.status(503).json({
    ...setupState(),
    error: "Checkout is unavailable until payment setup and server-side purchase verification are configured.",
  });
});

export default router;