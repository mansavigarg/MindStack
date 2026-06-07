import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../lib/db";               // your DB client
import { generateToken } from "../lib/jwt";   // your JWT/session helper
import { rateLimiter } from "../lib/rate-limiter";

export const authRouter = Router();

// ─── Validation Schema ────────────────────────────────────────────────────────

const SignupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be 100 characters or fewer."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number."),
});

type SignupBody = z.infer<typeof SignupSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiError {
  message: string;
  field?: keyof SignupBody;
  code?: string;
}

// ─── POST /signup ─────────────────────────────────────────────────────────────

authRouter.post(
  "/signup",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 attempts per 15 min per IP
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1. Validate request body
    const parsed = SignupSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const field = firstIssue.path[0] as keyof SignupBody | undefined;
      const error: ApiError = { message: firstIssue.message, field, code: "VALIDATION_ERROR" };
      res.status(422).json(error);
      return;
    }

    const { fullName, email, password } = parsed.data;

    try {
      // 2. Check for existing account — constant-time to avoid user enumeration
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        // Simulate hashing delay so timing doesn't reveal whether the email exists
        await bcrypt.hash(password, 12);
        const error: ApiError = {
          message: "An account with this email already exists.",
          field: "email",
          code: "EMAIL_TAKEN",
        };
        res.status(409).json(error);
        return;
      }

      // 3. Hash password
      const SALT_ROUNDS = 12;
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // 4. Persist user
      const user = await db.user.create({
        data: { fullName, email, passwordHash },
        select: { id: true, email: true, createdAt: true },
      });

      // 5. Issue auth token / session
      const token = generateToken({ userId: user.id, email: user.email });

      // 6. Respond — set HttpOnly cookie and return JSON
      res
        .cookie("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .status(201)
        .json({
          userId: user.id,
          email: user.email,
          redirectUrl: "/dashboard",
        });
    } catch (err) {
      next(err); // delegate to your global error handler
    }
  }
);