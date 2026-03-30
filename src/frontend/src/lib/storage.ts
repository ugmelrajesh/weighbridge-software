import {
  DEFAULT_MATERIAL_TYPES,
  DEFAULT_SETTINGS,
  type Settings,
  type Transaction,
} from "../types";

const KEYS = {
  settings: "wb_settings",
  transactions: "wb_transactions",
  materials: "wb_materials",
  vehicleTare: "wb_vehicle_tare",
} as const;

export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEYS.settings);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
}

export function getMaterials(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.materials);
    if (!raw) return [...DEFAULT_MATERIAL_TYPES];
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0)
      return [...DEFAULT_MATERIAL_TYPES];
    return data;
  } catch {
    return [...DEFAULT_MATERIAL_TYPES];
  }
}

export function saveMaterials(materials: string[]): void {
  localStorage.setItem(KEYS.materials, JSON.stringify(materials));
}

export function addMaterial(name: string): void {
  const all = getMaterials();
  const trimmed = name.trim();
  if (!trimmed || all.includes(trimmed)) return;
  saveMaterials([...all, trimmed]);
}

export function deleteMaterial(name: string): void {
  saveMaterials(getMaterials().filter((m) => m !== name));
}

export function getTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(KEYS.transactions);
    if (!raw) return getSeedTransactions();
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return getSeedTransactions();
    return data;
  } catch {
    return getSeedTransactions();
  }
}

export function saveTransactions(txns: Transaction[]): void {
  localStorage.setItem(KEYS.transactions, JSON.stringify(txns));
}

export function addTransaction(txn: Transaction): void {
  const all = getTransactions();
  // Auto-save vehicle tare weight when a transaction is added
  if (txn.tareWeight > 0) {
    saveVehicleTare(txn.vehicleNumber, txn.tareWeight);
  }
  saveTransactions([txn, ...all]);
}

export function updateTransaction(
  id: string,
  updates: Partial<Transaction>,
): void {
  const all = getTransactions();
  const updated = all.map((t) => (t.id === id ? { ...t, ...updates } : t));
  // If tare weight was updated, save it for the vehicle
  const txn = updated.find((t) => t.id === id);
  if (txn && updates.tareWeight && updates.tareWeight > 0) {
    saveVehicleTare(txn.vehicleNumber, updates.tareWeight);
  }
  saveTransactions(updated);
}

export function deleteTransaction(id: string): void {
  const all = getTransactions();
  saveTransactions(all.filter((t) => t.id !== id));
}

export function clearAllTransactions(): void {
  localStorage.removeItem("wb_transactions");
}

// Vehicle tare weight registry
export function getVehicleTareRegistry(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEYS.vehicleTare);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getVehicleTare(vehicleNumber: string): number | null {
  if (!vehicleNumber.trim()) return null;
  const key = vehicleNumber.trim().toUpperCase();
  // First check saved registry
  const registry = getVehicleTareRegistry();
  if (registry[key] !== undefined) return registry[key];
  // Fall back to last transaction for this vehicle
  const txns = getTransactions();
  const match = txns.find(
    (t) => t.vehicleNumber.toUpperCase() === key && t.tareWeight > 0,
  );
  return match ? match.tareWeight : null;
}

export function saveVehicleTare(vehicleNumber: string, tare: number): void {
  const key = vehicleNumber.trim().toUpperCase();
  const registry = getVehicleTareRegistry();
  registry[key] = tare;
  localStorage.setItem(KEYS.vehicleTare, JSON.stringify(registry));
}

export function deleteVehicleTare(vehicleNumber: string): void {
  const key = vehicleNumber.trim().toUpperCase();
  const registry = getVehicleTareRegistry();
  delete registry[key];
  localStorage.setItem(KEYS.vehicleTare, JSON.stringify(registry));
}

export function setVehicleTareRegistry(data: Record<string, number>): void {
  localStorage.setItem(KEYS.vehicleTare, JSON.stringify(data));
}

export function generateId(): string {
  const all = getTransactions();
  const max = all.reduce((m, t) => {
    const n = Number.parseInt(t.id.replace("WB-", ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `WB-${String(max + 1).padStart(6, "0")}`;
}

function getSeedTransactions(): Transaction[] {
  const now = new Date();
  const seeds: Transaction[] = [
    {
      id: "WB-000001",
      vehicleNumber: "MH-12-AB-4521",
      driverName: "Rajesh Kumar",
      material: "Coal",
      grossWeight: 28450,
      tareWeight: 12200,
      netWeight: 16250,
      entryTime: new Date(now.getTime() - 5 * 3600000).toISOString(),
      exitTime: new Date(now.getTime() - 4.5 * 3600000).toISOString(),
      status: "completed",
      operator: "Admin",
      remarks: "Cleared at main gate",
    },
    {
      id: "WB-000002",
      vehicleNumber: "GJ-05-CD-7832",
      driverName: "Suresh Patel",
      material: "Iron Ore",
      grossWeight: 32100,
      tareWeight: 14300,
      netWeight: 17800,
      entryTime: new Date(now.getTime() - 3 * 3600000).toISOString(),
      exitTime: new Date(now.getTime() - 2.5 * 3600000).toISOString(),
      status: "completed",
      operator: "Admin",
    },
    {
      id: "WB-000003",
      vehicleNumber: "RJ-14-EF-1109",
      driverName: "Mohan Singh",
      material: "Gravel",
      grossWeight: 24800,
      tareWeight: 11500,
      netWeight: 13300,
      entryTime: new Date(now.getTime() - 2 * 3600000).toISOString(),
      exitTime: new Date(now.getTime() - 1.5 * 3600000).toISOString(),
      status: "completed",
      operator: "Admin",
    },
    {
      id: "WB-000004",
      vehicleNumber: "MH-04-GH-5543",
      driverName: "Pradeep Sharma",
      material: "Sand",
      grossWeight: 0,
      tareWeight: 13800,
      netWeight: 0,
      entryTime: new Date(now.getTime() - 0.5 * 3600000).toISOString(),
      status: "pending",
      operator: "Admin",
      remarks: "Awaiting gross weight reading",
    },
    {
      id: "WB-000005",
      vehicleNumber: "DL-07-JK-9981",
      driverName: "Anil Verma",
      material: "Wheat",
      grossWeight: 19200,
      tareWeight: 9800,
      netWeight: 9400,
      entryTime: new Date(now.getTime() - 26 * 3600000).toISOString(),
      exitTime: new Date(now.getTime() - 25.5 * 3600000).toISOString(),
      status: "completed",
      operator: "Admin",
    },
    {
      id: "WB-000006",
      vehicleNumber: "UP-80-LM-3378",
      driverName: "Vikram Yadav",
      material: "Cement",
      grossWeight: 35000,
      tareWeight: 15000,
      netWeight: 20000,
      entryTime: new Date(now.getTime() - 48 * 3600000).toISOString(),
      exitTime: new Date(now.getTime() - 47.5 * 3600000).toISOString(),
      status: "completed",
      operator: "Admin",
    },
    {
      id: "WB-000007",
      vehicleNumber: "MH-12-NP-6612",
      driverName: "Dinesh Rathore",
      material: "Limestone",
      grossWeight: 29700,
      tareWeight: 12600,
      netWeight: 17100,
      entryTime: new Date(now.getTime() - 72 * 3600000).toISOString(),
      exitTime: new Date(now.getTime() - 71 * 3600000).toISOString(),
      status: "completed",
      operator: "Admin",
    },
  ];
  saveTransactions(seeds);
  return seeds;
}
