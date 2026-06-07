import express from "express"
const router = express.Router()
import * as userController from "../controllers/userContoller.js"


router.post("/signup", userController.signup)
router.post("/signin", userController.signin)

export default router