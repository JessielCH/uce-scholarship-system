import { create } from "zustand";

export const useAdminStore = create((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  activePeriodFilter: null, // Para filtrar estudiantes por periodo
  setPeriodFilter: (periodId) => set({ activePeriodFilter: periodId }),
}));
