import { useState, useEffect } from "react";
import { onAuthChange, signInWithGoogle, logOut, User, isFirebaseConfigured, signInAnonymousUser, checkRedirectResult } from "@/lib/firebase";
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
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        await checkRedirectResult();
      } catch (e) {
        console.error("checkRedirectResult:", e);
      }
      if (cancelled) return;

      localStorage.removeItem(GOOGLE_REDIRECT_KEY);

      unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        const pendingMigration = getMigrationPending();

        if (pendingMigration) {
          const migrationAge = Date.now() - pendingMigration.timestamp;
          if (migrationAge > 30 * 60 * 1000) {
            console.log("Migration expired, clearing...");
            clearMigrationPending();
          } else {
            // Migración anónimo → Google: no crear otra sesión anónima aquí.
            // Si quedó un pending viejo (OAuth cancelado, etc.), hay que bajar loading
            // o la app queda en "Cargando SISTEMICAR..." para siempre.
            // No pongas setUser(null) aquí: durante logOut→redirect el menú aún necesita
            // el usuario en contexto hasta que se ejecute startGoogleSignInRedirect().
            console.log("Migration pending: omitiendo sign-in anónimo hasta Google.");
            setLoading(false);
            return;
          }
        }

        // Crear sesión anónima cuando no estamos esperando Google tras conflicto de enlace
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
          const pending = getMigrationPending();
          // No borrar migración aquí si el uid actual es el de Google y aún debemos copiar datos del uid anónimo guardado.
          if (!pending || pending.oldUid === firebaseUser.uid) {
            clearMigrationPending();
          }
        }

        setUser(firebaseUser);
        setLoading(false);
        
        if (!localStorage.getItem("user_referral_code")) {
          localStorage.setItem("user_referral_code", "FUNDADOR");
        }
      }
    });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
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
