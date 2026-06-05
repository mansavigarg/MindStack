import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
    MONGODB_URI: z.string().min(1, "Mongo URI is required"),
    JWT_SECRET: z.string().min(1, "Jwt secret is required"),
    PORT: z.coerce.number().default(3000)
})


export const env = envSchema.parse(process.env)