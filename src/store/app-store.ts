import { create } from "zustand";

interface User {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "USER";
  privileges?: string;  // Comma-separated privileges from database
}

interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  hasLoaded: boolean;
  loadFromStorage: () => void;
}

// Simple localStorage helpers
const loadAuthFromStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("oscs-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state || null;
    }
  } catch {
    return null;
  }
  return null;
};

const saveAuthToStorage = (state: Partial<AppState>) => {
  if (typeof window === "undefined") return;
  try {
    const existing = loadAuthFromStorage() || {};
    localStorage.setItem(
      "oscs-storage",
      JSON.stringify({
        state: { ...existing, ...state },
      })
    );
  } catch {
    console.error("Failed to save to localStorage");
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hasLoaded: false,
  loadFromStorage: () => {
    const stored = loadAuthFromStorage();
    if (stored?.user && stored?.token) {
      set({
        user: stored.user,
        token: stored.token,
        isAuthenticated: stored.isAuthenticated ?? true,
        hasLoaded: true,
      });
    } else {
      set({ hasLoaded: true });
    }
  },
  login: (user, token) => {
    saveAuthToStorage({ user, token, isAuthenticated: true });
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    saveAuthToStorage({ user: null, token: null, isAuthenticated: false });
    set({ user: null, token: null, isAuthenticated: false });
  },
  updateUser: (userData) =>
    set((state) => {
      const newUser = state.user ? { ...state.user, ...userData } : null;
      saveAuthToStorage({ user: newUser, isAuthenticated: !!newUser });
      return {
        user: newUser,
      };
    }),
}));
