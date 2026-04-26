import { createContext, useContext, useEffect, useState } from "react";
import { getSession, loginUser, logoutUser } from "../api/localApi";

const SESSION_STORAGE_KEY = "innovasoft_session";

const AuthContext = createContext(null);

function getStoredSession() {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredSession);

  useEffect(() => {
    let isMounted = true;

    async function validateStoredSession() {
      const storedSession = getStoredSession();
      if (!storedSession?.token) {
        return;
      }

      try {
        const validatedSession = await getSession(storedSession.token);
        if (isMounted) {
          const nextSession = { ...storedSession, ...validatedSession };
          setSession(nextSession);
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
        }
      } catch (error) {
        if (error?.status === 401 && isMounted) {
          setSession(null);
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    }

    validateStoredSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async (username, password) => {
    const loginResponse = await loginUser({ username, password });
    setSession(loginResponse);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(loginResponse));
    return loginResponse;
  };

  const signOut = async () => {
    try {
      if (session?.token) {
        await logoutUser(session.token);
      }
    } finally {
      setSession(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: Boolean(session?.token),
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
