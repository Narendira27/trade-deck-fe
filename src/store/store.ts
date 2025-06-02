import { create } from "zustand";
import { type Trade } from "../types/trade";

interface TradeStoreState {
  trades: Trade[];
  setTrades: (data: Trade[]) => void;
}

const useStore = create<TradeStoreState>((set) => ({
  trades: [],
  setTrades: (data: Trade[]) => set({ trades: data }),
}));

export default useStore;
