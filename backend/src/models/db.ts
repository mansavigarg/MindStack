import mongoose, { model, Schema } from "mongoose";
import { env } from "../config/env.js";


export const connectDB = async () => {
    try{
        await mongoose.connect(env.MONGODB_URI)
        console.log("MongoDB is connected successfully :) ")
    }catch(err){
        console.log("MongoDB connection failed --->>", err)
        process.exit(1)
    }
}


const userSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    }
})

const contentSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: Schema.Types.Mixed, 
        required: true
    },
    type: {
        type: String,
        required: true
    },
    tags: [{
        type: String
    }],
    link: {
        type: String,
        required: false
    },
    userId: {
        type: Schema.Types.ObjectId, 
        ref: "User",
        required: true
    }
},{
    timestamps: true
})


const linkSchema = new Schema({
    hash: String,
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    }
})


export const UserModel = model("User", userSchema)
export const ContentModel = model("Content", contentSchema)
export const LinkModel = model("Links", linkSchema)