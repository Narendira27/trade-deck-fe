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

interface optionLotSizeType {
  optionName: string;
  lotSize: number;
}

export interface TradeFilters {
  showClosed: boolean;
  indexName: string;
  entrySide: string;
  entryType: string;
  expiry: string;
  entryTriggered: string;
  dateRange: {
    from: string;
    to: string;
  };
}

interface TradeStoreState {
  trades: Trade[];
  indexData: indexData;
  draggableData: draggableData[];
  indexPrice: IndexPriceData[];
  optionValues: optionValuesData[];
  optionLotSize: optionLotSizeType[];
  showDraggable: boolean;
  filters: TradeFilters;
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
  updateLowestValue: (id: string, lowestValue: string) => void;
  setOptionLotSize: (data: optionLotSizeType[]) => void;
  setFilters: (filters: TradeFilters) => void;
}

const useStore = create<TradeStoreState>((set, get) => ({
  trades: [],
  indexData: {
    indices: [],
    expiry: {},
  },
  draggableData: [],
  indexPrice: [],
  optionValues: [],
  optionLotSize: [],
  showDraggable: false,
  filters: {
    showClosed: false,
    indexName: "",
    entrySide: "",
    entryType: "",
    expiry: "",
    entryTriggered: "",
    dateRange: {
      from: "",
      to: "",
    },
  },
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
  setIndexPrice: (data) => {
    const state = get();
    const existingIndex = state.indexPrice.findIndex(
      (item) => item.id === data.id
    );

    // Only update if price actually changed
    if (
      existingIndex !== -1 &&
      state.indexPrice[existingIndex].price === data.price
    ) {
      return;
    }

    set((state) => {
      if (existingIndex !== -1) {
        const updated = [...state.indexPrice];
        updated[existingIndex] = {
          ...updated[existingIndex],
          price: data.price,
        };
        return { indexPrice: updated };
      } else {
        return { indexPrice: [...state.indexPrice, data] };
      }
    });
  },
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

  updateLowestValue: (id, lowestValue) =>
    set((state) => ({
      draggableData: state.draggableData.map((item) =>
        item.id === id ? { ...item, lowestValue } : item
      ),
    })),
  setOptionLotSize: (data: optionLotSizeType[]) => {
    set({ optionLotSize: data });
  },

  setFilters: (filters: TradeFilters) => set({ filters }),
}));

export default useStore;
