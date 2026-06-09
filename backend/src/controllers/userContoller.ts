import {string, z} from "zod"
import { ResponseStatus } from "../types/responseStatus.js"
import type { Request, Response } from "express"
import { UserModel } from "../models/db.js"
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

    const existingUser = await UserModel.findOne({
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

    const user = await UserModel.create({
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

const signinSchema = z.object({
    email: z.email(),
    password: z.string()
})

export const signin = async (req: Request, res: Response) => {
    const parsed = signinSchema.safeParse(req.body)

    if(!parsed.success){
        return res.status(ResponseStatus.ValidationError).send({
            message: "Invalid inputs"
        })
    }

    const email = parsed.data.email
    const password = parsed.data.password

    const existingUser = await UserModel.findOne({
        email
    })

    if(!existingUser){
        return res.status(ResponseStatus.ValidationError).send({
            message: "User does not exists."
        })
    }

    if(existingUser.password !== password){
        return res.status(ResponseStatus.Unauthorized).send({
            message: "Invalid credentials"
        })
    }

    const token = generateAccessToken({
        email: existingUser.email,
        userID : existingUser._id.toString()
    })

    res.status(ResponseStatus.Success).send({
        message: "User signed in successfully",
        user: existingUser,
        token
    })

}