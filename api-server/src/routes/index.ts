import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tuzakaiRouter from "./tuzakai";
import storeRouter from "./store";
import storePaymentsRouter from "./store-payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tuzakaiRouter);
router.use(storeRouter);
router.use(storePaymentsRouter);

export default router;
