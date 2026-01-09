import { create } from 'zustand'

export const useBoardStore = create((set) => ({
  currentBoard: null,
  setCurrentBoard: (board) => set({ currentBoard: board }),
  clearCurrentBoard: () => set({ currentBoard: null }),
}))
