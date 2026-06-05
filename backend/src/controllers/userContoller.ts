import {z} from "zod"
import { ResponseStatus } from "../types/responseStatus.js"
import type { Request, Response } from "express"
import { userModel } from "../models/db.js"
import { generateAccessToken } from "../utils/generateAccessToken.js"

export const signUpSchema = z.object({
    username: z.string().min(1),
    email: z.email(),
    password: z.string().min(1)
})

export const signup = async (req: Request, res: Response) => {
    const parsed = signUpSchema.safeParse(req.body)  

    if(!parsed.success){
        return res.status(ResponseStatus.ValidationError).send({
            message: "Invalid inputs"
        })
    }

    const username = parsed.data.username
    const password = parsed.data.password
    const email = parsed.data.email

    const existingUser = await userModel.findOne({
        $or : [
            {email},
            {username}
        ]
    })

    if(existingUser){
        return res.status(ResponseStatus.ValidationError).send({
            message: "User already exists"
        })
    }

    const user = await userModel.create({
        username,
        email,
        password
    })

    const token = generateAccessToken({
        email: email,
        userID: user._id.toString()
    })
    
    res.status(ResponseStatus.Success).send({
        message: "user created successfully",
        user,
        token
    })
}