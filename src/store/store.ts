import { create } from "zustand";
import { persist } from "zustand/middleware";
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

interface optionValuesData {
  id: string;
  lowestCombinedPremium: number;
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

interface OptionPrice {
  segment: number;
  id: number;
  optionName: string;
  price: number;
}

interface TradeStoreState {
  trades: Trade[];
  indexData: indexData;
  indexPrice: IndexPriceData[];
  optionPrice: OptionPrice[];
  optionValues: optionValuesData[];
  optionLotSize: optionLotSizeType[];
  filters: TradeFilters;
  setTrades: (data: Trade[]) => void;
  setIndexData: (data: indexData) => void;
  setIndexPrice: (data: IndexPriceData) => void;
  setOptionPrice: (data: OptionPrice) => void;
  setOptionValues: (data: optionValuesData[]) => void;
  setOptionLotSize: (data: optionLotSizeType[]) => void;
  setFilters: (filters: TradeFilters) => void;
}

interface DraggableStoreState {
  draggableData: draggableData[];
  showDraggable: boolean;
  setDraggableData: (data: draggableData[]) => void;
  removeDraggableData: (id: string) => void;
  setShowDraggable: () => void;
  updateDraggableData: (
    id: string,
    updatedData: Partial<draggableData>
  ) => void;
  updateLowestValue: (id: string, lowestValue: string) => void;
}

const useStore = create<TradeStoreState>((set, get) => ({
  trades: [],
  indexData: {
    indices: [],
    expiry: {},
  },
  indexPrice: [],
  optionPrice: [],
  optionValues: [],
  optionLotSize: [],
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
  setIndexPrice: (data) => {
    const state = get();
    const existingIndex = state.indexPrice.findIndex(
      (item) => item.id === data.id
    );

    if (
      existingIndex !== -1 &&
      state.indexPrice[existingIndex].price === data.price
    ) {
      return; // No change, don't update
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

  setOptionPrice: (data) => {
    const state = get();
    const existingIndex = state.optionPrice.findIndex(
      (item) => item.id === data.id
    );

    if (
      existingIndex !== -1 &&
      state.optionPrice[existingIndex].price === data.price
    ) {
      return; // No change, don't update
    }


    set((state) => {
      if (existingIndex !== -1) {
        const updatedPrices = [...state.optionPrice];
        updatedPrices[existingIndex] = {
          ...updatedPrices[existingIndex],
          price: data.price,
        };
        return { optionPrice: updatedPrices };
      } else {
        return { optionPrice: [...state.optionPrice, data] };
      }
    });
  },

  setOptionValues: (data: optionValuesData[]) => {
    const state = get();

    // Compare existing and incoming data
    const hasChanges =
      data.length !== state.optionValues.length ||
      data.some((newItem) => {
        const existingItem = state.optionValues.find(
          (item) => item.id === newItem.id
        );
        return (
          !existingItem ||
          existingItem.lowestCombinedPremium !== newItem.lowestCombinedPremium
        );
      });

    if (!hasChanges) {
      return; // No change, don't update
    }

    set({ optionValues: data });
  },
  setOptionLotSize: (data: optionLotSizeType[]) => {
    set({ optionLotSize: data });
  },

  setFilters: (filters: TradeFilters) => set({ filters }),
}));

export const useDraggableStore = create<DraggableStoreState>()(
  persist(
    (set, get) => ({
      draggableData: [],
      showDraggable: false,
      setDraggableData: (data: draggableData[]) =>
        set((state) => ({
          draggableData: [...state.draggableData, ...data],
        })),
      removeDraggableData: (id) =>
        set((state) => ({
          draggableData: state.draggableData.filter((item) => item.id !== id),
        })),
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
    }),
    {
      name: 'draggable-storage',
    }
  )
);

export default useStore;
