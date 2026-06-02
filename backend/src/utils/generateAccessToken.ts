import { env } from "../config/env.js";
import jwt from "jsonwebtoken"

export function generateAccessToken(payload: {
    userID : string,
    email : string
}){
    return jwt.sign(
        payload,
        env.JWT_SECRET,
        {
            expiresIn: "5d"
        }
    )
}