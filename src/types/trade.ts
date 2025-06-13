export interface Trade {
  id: string;
  indexName: string;
  legCount: number;
  expiry: string;
  ltpRange: number;
  entryType: string;
  entryPrice: number;
  qty: number;
  stopLossPremium: number;
  takeProfitPremium: number;
  stopLoss: number;
  takeProfit: number;
  entrySpotPrice: number;
  lastPointOfAdjustment: number;
  pointOfAdjustment: number; // pending
  pointOfAdjustmentLowerLimit: number; // pending
  pointOfAdjustmentUpperLimit: number; // pending
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
}
export interface TradeFormData {
  index: string;
  legCount: number;
  expiry: string;
  ltpRange: number;
}

export interface OrderFormData {
  entry: number;
  qty: number;
  sl: number;
  target: number;
  orderType: "LIMIT" | "MARKET";
}

export interface EditFormData {
  pointOfAdjustment: number;
  pointOfAdjustmentUpperLimit: number;
  pointOfAdjustmentLowerLimit: number;
}
