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

  // Function to load profile with detailed logs
  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) return null;

    logger.info("AuthContext", "Loading user profile", {
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
        logger.debug("AuthContext", "Profile retrieved", {
          role: data.role,
          fullName: data.full_name,
        });
      } else {
        logger.debug("AuthContext", "No extended profile found in database");
      }
      return data;
    } catch (err) {
      logger.error("AuthContext", "Error loading profile", err);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      logger.info("AuthContext", "Initializing authentication system");

      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          logger.error("AuthContext", "Corrupted session detected", error);
          await supabase.auth.signOut();
          throw error;
        }

        if (mounted) {
          if (initialSession) {
            logger.debug("AuthContext", "Active session found");
            const profile = await fetchProfile(initialSession.user);
            setSession(initialSession);
            setUser({ ...initialSession.user, ...profile });
          } else {
            logger.debug("AuthContext", "No active session");
          }
        }
      } catch (error) {
        logger.error("AuthContext", "Error during initialization", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      logger.debug("AuthContext", `Auth event: ${event}`, {
        timestamp: new Date().toISOString(),
      });

      if (newSession?.access_token !== session?.access_token) {
        if (newSession) {
          logger.debug("AuthContext", "Updating user data and profile");
          const profile = await fetchProfile(newSession.user);
          setSession(newSession);
          setUser({ ...newSession.user, ...profile });
        } else {
          logger.debug("AuthContext", "User logged out");
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
