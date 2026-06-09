import express from "express"
const router = express.Router()
import * as contentController from "../controllers/contentController.js"
import { authMiddleware } from "../middleware/authMiddleware.js"


router.use(authMiddleware)



router.post("/content", contentController.addContent)
router.get("/content", contentController.getContent)

router.delete("/:contentId", contentController.deleteContent)

router.post("/share", contentController.manageShareBrainLink)

export default router