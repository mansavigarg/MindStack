import { Router } from "express";
import { getSharedBrain } from "../controllers/contentController.js";

const router = Router()

router.get("/brain/:shareLink", getSharedBrain)

export default router