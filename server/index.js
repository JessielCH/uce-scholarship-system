import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { supabase } from "./config/supabase.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURACIÓN DE SWAGGER ---
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "UCE Scholarship API",
      version: "1.0.0",
      description:
        "Documentación de la API del Sistema de Becas de la Universidad Central del Ecuador",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Servidor de Desarrollo",
      },
    ],
  },
  apis: ["./index.js"], // Indica dónde buscar las anotaciones JSDoc
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware
app.use(cors());
app.use(express.json());

/**
 * @openapi
 * /api/admin/create-staff:
 * post:
 * summary: Crear un nuevo usuario de Staff
 * tags: [Admin]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * - fullName
 * properties:
 * email:
 * type: string
 * password:
 * type: string
 * fullName:
 * type: string
 * role:
 * type: string
 * default: STAFF
 * responses:
 * 201:
 * description: Usuario creado exitosamente
 * 400:
 * description: Error en la creación
 */
app.post("/api/admin/create-staff", async (req, res) => {
  const { email, password, fullName, role } = req.body;
  console.log(`👷 Creando usuario Staff: ${email} con rol ${role}`);

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: role || "STAFF",
        full_name: fullName,
      },
    });

    if (error) throw error;
    res
      .status(201)
      .json({ message: "Usuario creado exitosamente", user: data.user });
  } catch (error) {
    console.error("❌ Error creando staff:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("UCE Scholarship API Running 🚀. Documentación en /api-docs");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📖 Swagger docs available at http://localhost:${PORT}/api-docs`);
});
