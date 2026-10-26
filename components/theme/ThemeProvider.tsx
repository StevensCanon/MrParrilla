"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "system" | "light" | "dark";

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const STORAGE_KEY = "mrparrilla-theme";
const ThemeContext = createContext<ThemeContextValue>({
  preference: "system",
  setPreference: () => undefined,
});

function establecerTema(preference: ThemePreference) {
  const dark = preference === "dark" || (
    preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.dataset.theme = dark ? "dark" : "light";
  root.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [inicializado, setInicializado] = useState(false);

  useLayoutEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "system" || stored === "light" || stored === "dark") {
        setPreferenceState(stored);
        establecerTema(stored);
      } else {
        establecerTema("system");
      }
    } catch {
      establecerTema("system");
    }
    setInicializado(true);
  }, []);

  useEffect(() => {
    if (!inicializado) return;
    establecerTema(preference);
    try {
      window.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // El tema sigue funcionando en esta sesión si el navegador bloquea el almacenamiento.
    }

    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const actualizar = () => establecerTema("system");
    media.addEventListener("change", actualizar);
    return () => media.removeEventListener("change", actualizar);
  }, [inicializado, preference]);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    establecerTema(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // La selección permanece activa aunque el navegador no permita guardarla.
    }
  }, []);
  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  return useContext(ThemeContext);
}
