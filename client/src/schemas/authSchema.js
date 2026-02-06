import { z } from "zod";

// Esquema base para correos institucionales (solo caracteres que Supabase acepta)
export const universityEmail = z
  .string()
  .refine((v) => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v), {
    message:
      "Email inválido. Solo se permiten letras, números, puntos, guiones y guiones bajos",
  });

export const passwordSchema = z
  .string()
  .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  .max(128);

export const loginSchema = z.object({
  email: universityEmail,
  password: passwordSchema,
});

export const signUpSchema = loginSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const staffCreateSchema = z.object({
  email: z
    .string()
    .refine(
      (v) =>
        /^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v),
      { message: "Email inválido" },
    )
    .refine((v) => v.endsWith("@uce.edu.ec"), {
      message: "Debe ser correo institucional @uce.edu.ec",
    }),
  password: passwordSchema,
  fullName: z.string().min(3, { message: "El nombre es demasiado corto" }),
  role: z.enum(["STAFF", "ADMIN"]).default("STAFF"),
});

export const fileUploadSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().max(10 * 1024 * 1024), // 10 MB
  selectionId: z.string().uuid().optional(),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().min(3).max(200),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export default {
  universityEmail,
  passwordSchema,
  loginSchema,
  signUpSchema,
  staffCreateSchema,
  fileUploadSchema,
  profileUpdateSchema,
};
