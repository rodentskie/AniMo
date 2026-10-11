import { z } from "zod";

export const PASSWORD_MAX_LENGTH = 72;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email")),
  password: z
    .string()
    .min(1, "Password is required")
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`),
});

export type LoginInput = z.infer<typeof loginSchema>;
