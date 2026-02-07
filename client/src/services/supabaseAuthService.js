/**
 * Supabase Authentication Service - Migrated from Backend
 * This service handles student verification and staff creation directly from the client
 */

import { supabase } from "./supabaseClient";

/**
 * Verify if an email belongs to a scholarship student
 * @param {string} email - Student email to verify
 * @returns {Promise<Object>} { isBecado: boolean, student: Object }
 */
export const verifyStudent = async (email) => {
  try {
    if (!email || typeof email !== "string") {
      throw new Error("Email required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(
      `🔍 [Client] Looking for student with email: ${normalizedEmail}`,
    );

    const { data: student, error } = await supabase
      .from("students")
      .select("id, first_name, last_name, national_id, university_email")
      .eq("university_email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase error:", error);
      throw new Error(`Error verifying student: ${error.message}`);
    }

    if (student) {
      console.log(`✅ Scholarship student found: ${normalizedEmail}`);
      console.log(
        `   Data: ${student.first_name} ${student.last_name} (${student.national_id})`,
      );
      return {
        isBecado: true,
        message: "Scholarship student found",
        student: {
          id: student.id,
          fullName: `${student.first_name} ${student.last_name}`,
          nationalId: student.national_id,
          email: student.university_email,
        },
      };
    }

    console.log(
      `⚠️ Email not found in scholarship students database: ${normalizedEmail}`,
    );
    return {
      isBecado: false,
      message: "This email is not registered as a scholarship student",
    };
  } catch (error) {
    console.error("❌ Critical error:", error);
    throw error;
  }
};

/**
 * Create a new Staff user in Supabase
 * Requires service role key (admin access)
 * @param {string} email - Staff email (@uce.edu.ec)
 * @param {string} password - Initial password
 * @param {string} fullName - Staff full name
 * @param {string} role - STAFF or ADMIN
 * @returns {Promise<Object>} { user: Object }
 */
export const createStaff = async (
  email,
  password,
  fullName,
  role = "STAFF",
) => {
  try {
    console.group(`👤 [Client] Attempt to create staff`);

    // Validation
    if (!email || !email.endsWith("@uce.edu.ec")) {
      throw new Error("Email must be institutional (@uce.edu.ec)");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    if (!fullName || fullName.length < 3) {
      throw new Error("Full name is too short");
    }
    if (!["STAFF", "ADMIN"].includes(role)) {
      throw new Error("Role must be STAFF or ADMIN");
    }

    console.log(`Data validated for: ${email}`);

    // Create user in Supabase Auth (using admin API via service role)
    // NOTE: This requires Supabase to have the service role key available client-side
    // For production, this should be done server-side or via a secure function
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

    if (authError) {
      throw authError;
    }

    const newUser = authData.user;
    console.log(`✅ Auth exitosa: ${newUser.id}`);

    // Sync profile (Manual Upsert)
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
      console.error("⚠️ Error linking profile:", profileError.message);
    } else {
      console.log(`✅ Perfil sincronizado con rol: ${role}`);
    }

    console.groupEnd();

    return {
      message: "Staff registrado y validado exitosamente",
      user: { id: newUser.id, email: newUser.email, role },
    };
  } catch (error) {
    console.groupEnd();
    console.error("❌ Critical error:", error.message);
    throw error;
  }
};
