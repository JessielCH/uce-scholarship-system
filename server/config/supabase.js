// server/config/supabase.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in .env");
}

// Using Service Role Key allows bypassing RLS for admin ingestion tasks
export const supabase = createClient(supabaseUrl, supabaseKey);
