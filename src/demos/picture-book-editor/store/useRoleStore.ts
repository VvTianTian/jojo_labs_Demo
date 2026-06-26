import { create } from "zustand";
import type { EditorRole } from "../types/book";

interface RoleStore {
  currentRole: EditorRole;
  setRole: (role: EditorRole) => void;
  toggleRole: () => void;
}

export const useRoleStore = create<RoleStore>()((set) => ({
  currentRole: "editorial",
  setRole: (role) => set({ currentRole: role }),
  toggleRole: () =>
    set((s) => ({
      currentRole: s.currentRole === "editorial" ? "production" : "editorial",
    })),
}));
