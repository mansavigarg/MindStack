import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import { env } from "../config/env.js";
import { ResponseStatus } from "../types/responseStatus.js";

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers["authorization"];

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(ResponseStatus.Unauthorized).send({
            message: "Authorization header is missing or malformed"
        })
    }

    const token = authHeader.split(" ")[1]

    if(!token){
        return res.status(ResponseStatus.Unauthorized).send({
            message: "Unauthorized, token is not correct"
        })
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { id?: string}

        if(!decoded.id){
            return res.status(ResponseStatus.Forbidden).json({ message: "Invalid token payload" });
        }

        req.userId = decoded.id
        next();
    }catch(err){
        return res.status(ResponseStatus.Forbidden).json({ message: "Invalid or expired token" });
    }
}