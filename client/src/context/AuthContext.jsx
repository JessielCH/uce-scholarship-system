import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { supabase } from "../services/supabaseClient";
import { logger } from "../utils/logger";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para cargar perfil con logs detallados
  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) return null;

    logger.info("AuthContext", "Cargando perfil de usuario", {
      userId: authUser.id,
      email: authUser.email,
    });

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        logger.debug("AuthContext", "Perfil recuperado", {
          role: data.role,
          fullName: data.full_name,
        });
      } else {
        logger.debug("AuthContext", "No se encontró perfil extendido en DB");
      }
      return data;
    } catch (err) {
      logger.error("AuthContext", "Error cargando perfil", err);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      logger.info("AuthContext", "Inicializando sistema de autenticación");

      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          logger.error("AuthContext", "Sesión corrupta detectada", error);
          await supabase.auth.signOut();
          throw error;
        }

        if (mounted) {
          if (initialSession) {
            logger.debug("AuthContext", "Sesión activa encontrada");
            const profile = await fetchProfile(initialSession.user);
            setSession(initialSession);
            setUser({ ...initialSession.user, ...profile });
          } else {
            logger.debug("AuthContext", "No hay sesión activa");
          }
        }
      } catch (error) {
        logger.error("AuthContext", "Error en inicialización", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      logger.debug("AuthContext", `Evento de Auth: ${event}`, {
        timestamp: new Date().toISOString(),
      });

      if (newSession?.access_token !== session?.access_token) {
        if (newSession) {
          logger.debug("AuthContext", "Actualizando datos de usuario y perfil");
          const profile = await fetchProfile(newSession.user);
          setSession(newSession);
          setUser({ ...newSession.user, ...profile });
        } else {
          logger.debug("AuthContext", "Usuario desconectado");
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
    logger.audit("LOGOUT", "auth", { timestamp: new Date().toISOString() });
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
