import { z } from "zod";

export const eventInput = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z
      .string()
      .min(3)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().max(2000).default(""),
  })
  .strict();

export const teamInput = z
  .object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(2000).default(""),
  })
  .strict();

export const memberInput = z
  .object({
    user_id: z.uuid(),
    role: z.enum(["lead", "developer", "mentor"]),
  })
  .strict();

export const idInput = z.uuid();
export type ApiError = { error: { code: string; message: string } };
