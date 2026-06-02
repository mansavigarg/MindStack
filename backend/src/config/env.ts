import 'dotenv/config'
import { z } from "zod"

const envSchema = z.object({
    PORT: z.coerce.number().default(3000), // coerce converts string to number
    MONGODB_URI: z.string().min(1, "URI is required"),
    JWT_SECRET: z.string().min(1, "Secret is required")

})

export const env = envSchema.parse(process.env)