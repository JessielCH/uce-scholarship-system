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

  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("❌ [Auth] Error cargando perfil:", err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        // Intentar recuperar sesión actual
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("🚨 [Auth] Sesión corrupta detectada. Limpiando...");
          await supabase.auth.signOut(); // Limpieza forzada de Supabase
          throw error;
        }

        if (mounted) {
          if (initialSession) {
            const profile = await fetchProfile(initialSession.user);
            setSession(initialSession);
            setUser({ ...initialSession.user, ...profile });
          }
        }
      } catch (error) {
        console.error("❌ [Auth] Error en inicialización:", error.message);
        // No bloqueamos el sistema, permitimos que redirija a Login
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      console.log(`🔔 [Auth] Evento: ${event}`);

      // Solo actualizamos si el token realmente cambió
      if (newSession?.access_token !== session?.access_token) {
        if (newSession) {
          const profile = await fetchProfile(newSession.user);
          setSession(newSession);
          setUser({ ...newSession.user, ...profile });
        } else {
          setSession(null);
          setUser(null);
        }
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, session?.access_token]);

  const signOut = async () => {
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
