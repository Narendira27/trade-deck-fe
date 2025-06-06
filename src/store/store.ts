import { create } from "zustand";
import { type Trade } from "../types/trade";

interface indexData {
  indices: string[];
  expiry: { [index: string]: string[] };
}

interface draggableData {
  id: string;
  index: string;
  ltpRange: string;
  expiry: string;
  isHidden: boolean;
}

interface TradeStoreState {
  trades: Trade[];
  indexData: indexData;
  draggableData: draggableData[];
  setTrades: (data: Trade[]) => void;
  setIndexData: (data: indexData) => void;
  setDraggableData: (data: draggableData[]) => void;
  removeDraggableData: (id: string) => void;
  updateHideStatus: (id: string, isHidden: boolean) => void;
}

const useStore = create<TradeStoreState>((set) => ({
  trades: [],
  indexData: {
    indices: [],
    expiry: {},
  },
  draggableData: [],
  setTrades: (data: Trade[]) => set({ trades: data }),
  setIndexData: (data: indexData) => set({ indexData: data }),
  setDraggableData: (data: draggableData[]) =>
    set((state) => ({
      draggableData: [...state.draggableData, ...data],
    })),
  removeDraggableData: (id) =>
    set((state) => ({
      draggableData: state.draggableData.filter((item) => item.id !== id),
    })),
  updateHideStatus: (id, isHidden) =>
    set((state) => ({
      draggableData: state.draggableData.map((item) =>
        item.id === id ? { ...item, isHidden } : item
      ),
    })),
  // indexPrice: [],
  // setIndexPrice: (data: []) => set({ indexPrice: data }),
}));

export default useStore;
