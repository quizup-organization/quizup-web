import { z } from "zod";

export const requestCodeSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
});

export const verifyCodeSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  code: z
    .string()
    .regex(/^\d{6}$/, "Le code doit contenir 6 chiffres"),
});

export type RequestCodeValues = z.infer<typeof requestCodeSchema>;
export type VerifyCodeValues = z.infer<typeof verifyCodeSchema>;
