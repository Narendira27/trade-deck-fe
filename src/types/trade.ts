export interface Trade {
  id: string;
  indexName: string;
  entrySide: string;
  legCount: number;
  expiry: string;
  ltpRange: number;
  entryType: string;
  entryPrice: number;
  qty: number;
  currentQty: number;
  stopLossPremium: number;
  takeProfitPremium: number;
  stopLossPoints: number;
  takeProfitPoints: number;
  entrySpotPrice: number;
  lastPointOfAdjustment: number;
  pointOfAdjustment: number;
  pointOfAdjustmentLowerLimit: number;
  pointOfAdjustmentUpperLimit: number;
  entryTriggered: boolean;
  slTriggered: boolean;
  tpTriggered: boolean;
  alive: boolean;
  isDeleted: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  mtm: number;
  isActive: boolean;
  strategySl?: number;
  strategyTrailing?: number;
}

export interface TradeFormData {
  index: string;
  legCount: number;
  expiry: string;
  ltpRange: number;
  entrySide: string;
  pointOfAdjustment: number;
}

export interface OrderFormData {
  entry: number;
  qty: number;
  sl: number;
  target: number;
  slPoints: number;
  tpPoints: number;
  orderType: "LIMIT" | "MARKET";
}

export interface EditFormData {
  pointOfAdjustment: number;
  pointOfAdjustmentUpperLimit: number;
  pointOfAdjustmentLowerLimit: number;
  entryPrice: number;
  stopLossPoints: number;
  stopLossPremium: number;
  takeProfitPoints: number;
  takeProfitPremium: number;
  strategySl: number;
  strategyTrailing: number;
}
