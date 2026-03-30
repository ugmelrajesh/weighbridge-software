export interface Settings {
  companyName: string;
  address: string;
  city: string;
  phone: string;
  weighbridgeName: string;
  weighbridgeLocation: string;
  unit: "KG" | "MT" | "LB";
  licenseNumber: string;
}

export interface Transaction {
  id: string;
  vehicleNumber: string;
  driverName: string;
  material: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  entryTime: string;
  exitTime?: string;
  status: "pending" | "completed";
  operator: string;
  remarks?: string;
}

export const DEFAULT_MATERIAL_TYPES = [
  "Coal",
  "Sand",
  "Gravel",
  "Iron Ore",
  "Wheat",
  "Rice",
  "Cotton",
  "Cement",
  "Limestone",
  "Fertilizer",
  "Other",
] as const;

// Keep for backward compatibility
export const MATERIAL_TYPES = DEFAULT_MATERIAL_TYPES;

export const DEFAULT_SETTINGS: Settings = {
  companyName: "ABC Logistics Pvt. Ltd.",
  address: "12 Industrial Estate, Sector 5",
  city: "Mumbai, Maharashtra 400001",
  phone: "+91 22 4567 8900",
  weighbridgeName: "Weighbridge Unit #1",
  weighbridgeLocation: "Gate No. 1 - Main Entry",
  unit: "KG",
  licenseNumber: "WB-MH-2024-001",
};
