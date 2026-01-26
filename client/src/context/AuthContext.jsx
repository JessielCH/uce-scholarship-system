import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Empieza cargando

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      try {
        // 1. Obtener sesión actual
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          if (session) {
            setSession(session);

            // Intentamos obtener perfil, pero si falla no bloqueamos la app
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle(); // maybeSingle no lanza error si es null

            setUser({ ...session.user, ...profile });
          } else {
            setSession(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        if (mounted) {
          setLoading(false); // SOLO AQUÍ dejamos de cargar
        }
      }
    }

    getSession();

    // 2. Escuchar cambios (Login con Google, Logout, etc)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setSession(session);
        if (session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          setUser({ ...session.user, ...profile });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    // 3. Refrescar sesión cuando la ventana gana foco (para evitar sesiones obsoletas)
    const handleWindowFocus = async () => {
      if (mounted && session) {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error("Error refreshing session:", error);
            // Si falla, limpiar sesión
            setSession(null);
            setUser(null);
          } else if (data.session) {
            setSession(data.session);
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.session.user.id)
              .maybeSingle();
            setUser({ ...data.session.user, ...profile });
          }
        } catch (err) {
          console.error("Session refresh error:", err);
        }
      }
    };

    window.addEventListener("focus", handleWindowFocus);

    // 4. Intervalo para refrescar sesión cada 2 minutos (120000 ms) si hay sesión activa
    const sessionRefreshInterval = setInterval(async () => {
      if (mounted && session) {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error("Auto refresh error:", error);
            setSession(null);
            setUser(null);
          } else if (data.session) {
            setSession(data.session);
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.session.user.id)
              .maybeSingle();
            setUser({ ...data.session.user, ...profile });
          }
        } catch (err) {
          console.error("Auto refresh error:", err);
        }
      }
    }, 120000); // 2 minutos

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("focus", handleWindowFocus);
      clearInterval(sessionRefreshInterval);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const value = { session, user, loading, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
