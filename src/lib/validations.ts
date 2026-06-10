import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name is too short").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  referralCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  code: z.string().optional(), // 2FA code
});

export const forgotSchema = z.object({
  email: z.string().email(),
});

export const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const courseSchema = z.object({
  title: z.string().min(3),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  price: z.number().min(0).default(0),
  discountPrice: z.number().min(0).optional().nullable(),
  isFree: z.boolean().default(false),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"]).default("ALL_LEVELS"),
  language: z.string().default("English"),
  categoryId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  learningOutcomes: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
});

export const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});

export const couponSchema = z.object({
  code: z.string().min(3).toUpperCase(),
  type: z.enum(["PERCENTAGE", "FLAT"]),
  value: z.number().min(0),
  maxUses: z.number().int().min(0).default(0),
  minAmount: z.number().min(0).default(0),
  expiresAt: z.string().optional().nullable(),
});

export const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
});

export const noteSchema = z.object({
  lessonId: z.string(),
  content: z.string().min(1),
  timestamp: z.number().int().optional(),
});

export const progressSchema = z.object({
  lessonId: z.string(),
  watchedSeconds: z.number().int().min(0),
  lastPosition: z.number().int().min(0),
  completed: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
