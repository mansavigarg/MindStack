import jwt from "jsonwebtoken"
import { env } from "../config/env.js";


export const generateAccessToken = (payload: {
    email: string,
    userID: string
}) => {
    return jwt.sign(payload,
        env.JWT_SECRET,
        {
            expiresIn: "5d"
        }
    )
}