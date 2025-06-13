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

interface IndexPriceData {
  name: string;
  segment: number;
  id: number;
  price: number;
}

interface CombinedPremiumArray {
  name: string;
  combinedPremium: number;
}

interface SpreadPremiumArray {
  name: string;
  combinedPremium: number;
}
interface optionValuesData {
  id: string;
  combinedPremiumArray: CombinedPremiumArray[];
  spreadPremiumArray: SpreadPremiumArray[];
}

interface TradeStoreState {
  trades: Trade[];
  indexData: indexData;
  draggableData: draggableData[];
  indexPrice: IndexPriceData[];
  optionValues: optionValuesData[];
  setTrades: (data: Trade[]) => void;
  setIndexData: (data: indexData) => void;
  setDraggableData: (data: draggableData[]) => void;
  removeDraggableData: (id: string) => void;
  updateHideStatus: (id: string, isHidden: boolean) => void;
  setIndexPrice: (data: IndexPriceData) => void;
  setOptionValues: (data: optionValuesData[]) => void;
}

const useStore = create<TradeStoreState>((set) => ({
  trades: [],
  indexData: {
    indices: [],
    expiry: {},
  },
  draggableData: [],
  indexPrice: [],
  optionValues: [],
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
  setIndexPrice: (data) =>
    set((state) => {
      const existingIndex = state.indexPrice.findIndex(
        (item) => item.id === data.id
      );
      if (existingIndex !== -1) {
        // Update existing item
        const updated = [...state.indexPrice];
        updated[existingIndex] = {
          ...updated[existingIndex],
          price: data.price,
        };
        return { indexPrice: updated };
      } else {
        // Add new item
        return { indexPrice: [...state.indexPrice, data] };
      }
    }),
  setOptionValues: (data: optionValuesData[]) => {
    set({ optionValues: data });
  },
}));

export default useStore;
