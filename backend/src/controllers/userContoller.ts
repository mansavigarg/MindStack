import { UserModel } from "../models/db.js";
import { ResponseStatus } from "../types/responseStatus.js";
import { z } from "zod"
import type { Request, Response } from "express";
import { generateAccessToken } from "../utils/generateAccessToken.js";

export const signupSchema = z.object({
    username: z.string().min(2),
    email: z.email(),
    password: z.string().min(2)
})

export const signup = async (req: Request, res: Response) => {

    const parsed = signupSchema.safeParse(req.body)

    if(!parsed.success){
        res.status(ResponseStatus.ValidationError).send({
            message: "Invalid input"
        })
        return;
    }

    const username = parsed.data.username;
    const password = parsed.data.password;
    const email = parsed.data.email;

    let existingUser = await UserModel.findOne({
        $or: [
            {username},
            {email}
        ]
    })

    if(existingUser){
        res.status(ResponseStatus.ValidationError).send({
            message: "User already exists"
        });
        return
    }

    const user = await UserModel.create({
        username, 
        password,
        email
    })

    const accessToken = generateAccessToken({
        userID : user._id.toString(),
        email : email
    })

    res.status(ResponseStatus.Created).send({
        message: "User created successfully",
        user,
        accessToken
    })

}
