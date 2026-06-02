import mongoose, {model, Schema} from "mongoose";
import { env } from "../config/env.js";

export const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGODB_URI)
        console.log("MongoDB connection done")
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
}


const UserSchema = new Schema({
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

export const UserModel = model("User", UserSchema)
