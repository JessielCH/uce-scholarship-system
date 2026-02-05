import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { supabase } from "./config/supabase.js"; // Ensure this uses the Service Role Key

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- SWAGGER CONFIGURATION ---
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "UCE Scholarship API",
      version: "1.0.0",
      description:
        "API Documentation for the UCE Scholarship Management System",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development Server",
      },
    ],
  },
  apis: ["./index.js"],
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
 * summary: Create a new Staff user and their profile
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
 * description: User and profile created successfully
 * 400:
 * description: Error during creation
 */
app.post("/api/admin/create-staff", async (req, res) => {
  const { email, password, fullName, role } = req.body;

  // Server-side Audit Log
  console.group(`👤 [ADMIN ACTION] Creating user: ${email}`);
  console.log(`Assigned Role: ${role || "STAFF"}`);

  try {
    // 1. Create the user in Supabase Auth
    // Using admin.createUser prevents logging out the current admin session
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          role: role || "STAFF", // This metadata is read by the DB Trigger
          full_name: fullName,
        },
      });

    if (authError) throw authError;

    const newUser = authData.user;
    console.log(`✅ Auth created: ${newUser.id}`);

    // 2. IDENTITY DISTRIBUTION: Manual Profile Upsert
    // We use 'upsert' to override the default 'STUDENT' role if the DB trigger fired first
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: newUser.id,
        email: email,
        full_name: fullName,
        role: role || "STAFF",
      },
      { onConflict: "id" },
    );

    if (profileError) {
      console.error(
        "⚠️ Error creating profile, but Auth was successful:",
        profileError.message,
      );
    } else {
      console.log(
        `✅ Profile linked in 'profiles' table with role: ${role || "STAFF"}`,
      );
    }

    console.groupEnd();
    res.status(201).json({
      message: "Staff registered and distributed successfully",
      user: newUser,
    });
  } catch (error) {
    console.groupEnd();
    console.error("❌ Critical error during staff creation:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("UCE Scholarship API Running 🚀. Documentation at /api-docs");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📖 Swagger docs available at http://localhost:${PORT}/api-docs`);
});
