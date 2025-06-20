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
  lowestValue?: string;
  myValue1?: string;
  myValue2?: string;
  expiry: string;
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
  showDraggable: boolean;
  setTrades: (data: Trade[]) => void;
  setIndexData: (data: indexData) => void;
  setDraggableData: (data: draggableData[]) => void;
  removeDraggableData: (id: string) => void;
  setIndexPrice: (data: IndexPriceData) => void;
  setOptionValues: (data: optionValuesData[]) => void;
  setShowDraggable: () => void;
  updateDraggableData: (
    id: string,
    updatedData: Partial<draggableData>
  ) => void;
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
  showDraggable: false,
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
  setShowDraggable: () => {
    set((state) => ({
      showDraggable: !state.showDraggable,
    }));
  },

  updateDraggableData: (id, updatedData) =>
    set((state) => ({
      draggableData: state.draggableData.map((item) =>
        item.id === id ? { ...item, ...updatedData } : item
      ),
    })),
}));

export default useStore;
