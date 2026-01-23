import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./config/supabase.js"; // Asegúrate que este usa la SERVICE_KEY

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta para crear Staff (Solo accesible internamente o protegida)
app.post("/api/admin/create-staff", async (req, res) => {
  const { email, password, fullName, role } = req.body;

  console.log(`👷 Creando usuario Staff: ${email} con rol ${role}`);

  try {
    // 1. Crear usuario en Supabase Auth usando Service Role
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        role: role || "STAFF",
        full_name: fullName,
      },
    });

    if (error) throw error;

    // 2. Respuesta exitosa
    res.status(201).json({
      message: "Usuario creado exitosamente",
      user: data.user,
    });
  } catch (error) {
    console.error("❌ Error creando staff:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("UCE Scholarship API Running 🚀");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
