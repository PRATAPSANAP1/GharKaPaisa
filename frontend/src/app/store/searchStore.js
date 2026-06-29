import { create } from 'zustand';

export const useSearchStore = create((set) => ({
  searchItem: null,
  setSearchItem: (item) => set({ searchItem: item })
}));
