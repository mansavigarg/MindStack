import {z} from "zod"
import type { Request, Response } from "express";
import { ContentModel, LinkModel } from "../models/db.js";
import { ResponseStatus } from "../types/responseStatus.js";
import { random } from "../utils/random.js";

const contentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    body: z.union([z.string(), z.array(z.string())]),
    type: z.string().min(1, "Type is required"),
    tags: z.array(z.string()).default([]),
    link: z.union([z.string().url(), z.literal("")]).optional()
})

export const addContent = async (req: Request, res: Response) => {
    const {title, body, type, tags, link} = contentSchema.parse(req.body)

    const newContent = await ContentModel.create({
        title,
        body,
        type,
        userId: req.userId!,
        ...(tags?.length ? { tags } : {}),
        ...(link ? { link } : {}),
    });

    return res.status(201).json({
        message: "Content added successfully", 
        content: newContent
    })
}

export const getContent = async (req: Request, res: Response) => {
    const contents = ContentModel.find({userId: req.userId!}).sort({createdAt: -1})
    res.status(ResponseStatus.Success).send({
        message : "Content added successfully",
        contents
    })
}

export const deleteContent = async (req: Request, res: Response) => {
    const contentId = req.query.contentId as string

    if(!contentId){
        return res.status(ResponseStatus.ValidationError).send({
            message: "ContentId is required."
        })
    }

    const content = await ContentModel.find({_id: contentId, userId: req.userId!})

    if(!content){
        return res.status(ResponseStatus.NotFound).send({
            message: "Content not found."
        })
    }

    await ContentModel.deleteOne({_id: contentId})

    return res.status(ResponseStatus.Success).send({
        message: "Content deleted successfully"
    })
}

const shareContentSchema = z.object({share: z.boolean()})

export const manageShareBrainLink = async (req: Request, res: Response) => {
    const { share } = shareContentSchema.parse(req.body)
    const userId = req.userId!

    if(share){
        const existingLink = await LinkModel.findOne({userId})
        if(existingLink){
            return res.status(ResponseStatus.Success).json({
                hash: existingLink.hash
            })
        }
        const hash =  random(10);
        await LinkModel.create({hash, userId})
        return res.status(ResponseStatus.Success).send({
            message: "Share link created", 
            hash
        })
    }
    else {
        await LinkModel.deleteOne({userId})
        return res.status(ResponseStatus.Success).send({
            message: "Share link removed"
        })
    }
}

export const getSharedBrain = async (req: Request, res: Response) => {
    const {shareLink} = req.params!

    if(!shareLink){
        return res.status(ResponseStatus.ValidationError).send({
            message: "Share link is required."
        })
    }

    const link = await LinkModel.findOne({hash: shareLink})

    if(!link){
        return res.status(ResponseStatus.ValidationError).send({
            message: "Share brain not found."
        })
    }

    const contents = await ContentModel.find({
        userId: link.userId
    })
    return res.status(ResponseStatus.Success).json({
        message: "Shared brain retrieved successfully",
        contents
    })
}