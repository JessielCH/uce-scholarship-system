import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { z } from "zod"; // [SPRINT 4] Zod para validación en servidor
import { supabase } from "./config/supabase.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- [SPRINT 4] ESQUEMA DE VERDAD PARA STAFF ---
const staffSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .endsWith("@uce.edu.ec", "El correo debe ser institucional (@uce.edu.ec)"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  fullName: z.string().min(3, "El nombre es demasiado corto"),
  role: z
    .enum(["STAFF", "ADMIN"], {
      errorMap: () => ({ message: "Rol no permitido. Debe ser STAFF o ADMIN" }),
    })
    .default("STAFF"),
});

// --- CONFIGURACIÓN DE SWAGGER ---
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "UCE Scholarship API",
      version: "1.0.0",
      description:
        "API Documentation for the UCE Scholarship Management System [Zod Enabled]",
    },
    servers: [
      { url: `http://localhost:${PORT}`, description: "Development Server" },
    ],
  },
  apis: ["./index.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(cors());
app.use(express.json());

/**
 * @openapi
 * /api/admin/create-staff:
 * post:
 * summary: Create a new Staff user with Zod validation
 * tags: [Admin]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [email, password, fullName]
 * properties:
 * email: { type: string }
 * password: { type: string }
 * fullName: { type: string }
 * role: { type: string, default: STAFF }
 * responses:
 * 201:
 * description: User and profile created successfully
 * 400:
 * description: Validation error or creation failure
 */
app.post("/api/admin/create-staff", async (req, res) => {
  console.group(`👤 [ADMIN ACTION] Intento de creación de Staff`);

  try {
    // 1. [SPRINT 4] VALIDACIÓN CON ZOD
    // Si los datos no cumplen el esquema, lanza una excepción automáticamente
    const validatedData = staffSchema.parse(req.body);
    const { email, password, fullName, role } = validatedData;

    console.log(`Datos validados para: ${email}`);

    // 2. CREACIÓN EN SUPABASE AUTH
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: role,
          full_name: fullName,
        },
      });

    if (authError) throw authError;

    const newUser = authData.user;
    console.log(`✅ Auth exitosa: ${newUser.id}`);

    // 3. SINCRONIZACIÓN DE PERFIL (Manual Upsert)
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: newUser.id,
        email: email,
        full_name: fullName,
        role: role,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      console.error("⚠️ Error vinculando perfil:", profileError.message);
    } else {
      console.log(`✅ Perfil sincronizado con rol: ${role}`);
    }

    console.groupEnd();
    res.status(201).json({
      message: "Staff registrado y validado exitosamente",
      user: { id: newUser.id, email: newUser.email, role },
    });
  } catch (error) {
    console.groupEnd();

    // [SPRINT 4] Manejo específico de errores de Zod
    if (error instanceof z.ZodError) {
      console.error("❌ Error de validación Zod:", error.errors);
      return res.status(400).json({
        error: "Error de validación",
        details: error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
    }

    console.error("❌ Error crítico:", error.message);
    res.status(400).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("UCE Scholarship API Running 🚀. Documentation at /api-docs");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
