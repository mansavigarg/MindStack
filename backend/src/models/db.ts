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



export const userModel = model("User", userSchema)
