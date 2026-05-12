import { useState, useEffect } from "react";
import { onAuthChange, signInWithGoogle, logOut, User, isFirebaseConfigured, signInAnonymousUser } from "@/lib/firebase";
import { getMigrationPending, clearMigrationPending } from "@/lib/persistence";

// Flag legacy (ya no usamos redirect, pero limpiamos por compatibilidad)
const GOOGLE_REDIRECT_KEY = "sistemicar_google_redirect_pending";

interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

const MOCK_USER: MockUser = {
  uid: "user_arquitecto",
  email: "arquitecto@sistemicar.com",
  displayName: "Arquitecto",
  photoURL: null,
};

export function useAuth() {
  const [user, setUser] = useState<User | MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setUser(MOCK_USER);
      setLoading(false);
      if (!localStorage.getItem("user_referral_code")) {
        localStorage.setItem("user_referral_code", "FUNDADOR");
      }
      return () => {};
    }

    // Limpiar cualquier flag de redirect antiguo (ya no usamos redirect)
    localStorage.removeItem(GOOGLE_REDIRECT_KEY);
    
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        const pendingMigration = getMigrationPending();
        
        if (pendingMigration) {
          // Si la migración tiene más de 30 minutos, limpiarla
          const migrationAge = Date.now() - pendingMigration.timestamp;
          if (migrationAge > 30 * 60 * 1000) {
            console.log("Migration expired, clearing...");
            clearMigrationPending();
          } else {
            console.log("Migration pending...");
          }
        }
        
        // Crear sesión anónima de todas formas
        try {
          await signInAnonymousUser();
        } catch (error) {
          console.error("Anonymous auth failed:", error);
          setUser(MOCK_USER);
          setLoading(false);
        }
      } else {
        // Usuario autenticado
        if (!firebaseUser.isAnonymous) {
          clearMigrationPending();
        }
        
        setUser(firebaseUser);
        setLoading(false);
        
        if (!localStorage.getItem("user_referral_code")) {
          localStorage.setItem("user_referral_code", "FUNDADOR");
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (!isFirebaseConfigured()) {
      setUser(MOCK_USER);
      return;
    }
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login error:", error);
      try {
        await signInAnonymousUser();
      } catch (e) {
        console.error("Anonymous fallback failed:", e);
      }
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigured()) {
      setUser(null);
      return;
    }
    try {
      await logOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return { user, loading, login, logout };
}
