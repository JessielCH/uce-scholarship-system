import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para cargar perfil con logs detallados
  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) return null;

    console.group("👤 [AUDIT LOG] Cargando Perfil de Usuario");
    console.log(`ID: ${authUser.id}`);
    console.log(`Email: ${authUser.email}`);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        console.log("✅ Perfil recuperado:", {
          rol: data.role,
          nombre: data.full_name,
        });
      } else {
        console.log(
          "ℹ️ No se encontró un perfil extendido en la tabla 'profiles'.",
        );
      }
      console.groupEnd();
      return data;
    } catch (err) {
      console.error("❌ [AUDIT LOG] Error cargando perfil:", err.message);
      console.groupEnd();
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      console.log("🏗️ [AUDIT LOG] Inicializando sistema de autenticación...");

      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error(
            "🚨 [AUDIT LOG] Sesión corrupta detectada. Limpiando...",
          );
          await supabase.auth.signOut();
          throw error;
        }

        if (mounted) {
          if (initialSession) {
            console.log("🔑 [AUDIT LOG] Sesión activa encontrada.");
            const profile = await fetchProfile(initialSession.user);
            setSession(initialSession);
            setUser({ ...initialSession.user, ...profile });
          } else {
            console.log(
              "🛡️ [AUDIT LOG] No hay sesión activa. Esperando login.",
            );
          }
        }
      } catch (error) {
        console.error("❌ [AUDIT LOG] Error en inicialización:", error.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      console.group(`🔔 [AUDIT LOG] Evento de Auth: ${event}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);

      if (newSession?.access_token !== session?.access_token) {
        if (newSession) {
          console.log("🔄 Actualizando datos de usuario y perfil...");
          const profile = await fetchProfile(newSession.user);
          setSession(newSession);
          setUser({ ...newSession.user, ...profile });
        } else {
          console.log("📤 Usuario desconectado. Limpiando estado global.");
          setSession(null);
          setUser(null);
        }
      }

      console.groupEnd();
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, session?.access_token]);

  const signOut = async () => {
    console.log("🚪 [AUDIT LOG] Cerrando sesión...");
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const authValue = useMemo(
    () => ({
      session,
      user,
      loading,
      signOut,
    }),
    [session, user, loading],
  );

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
