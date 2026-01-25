import { create } from "zustand";

export const useAdminStore = create((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  activePeriodFilter: null, // To filter students by period
  setPeriodFilter: (periodId) => set({ activePeriodFilter: periodId }),
}));
