import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Download, Plus, Save, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  addMaterial,
  deleteMaterial,
  deleteVehicleTare,
  getMaterials,
  getSettings,
  getVehicleTareRegistry,
  saveSettings,
  saveVehicleTare,
  setVehicleTareRegistry,
} from "../lib/storage";
import type { Settings } from "../types";

type RegistryRow = { key: string; vehicleNumber: string; tare: string };

function buildRows(registry: Record<string, number>): RegistryRow[] {
  return Object.entries(registry).map(([key, tare]) => ({
    key,
    vehicleNumber: key,
    tare: String(tare),
  }));
}

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(getSettings());
  const [materials, setMaterials] = useState<string[]>(getMaterials());
  const [newMaterial, setNewMaterial] = useState("");

  // Vehicle Tare Registry state
  const [rows, setRows] = useState<RegistryRow[]>(() =>
    buildRows(getVehicleTareRegistry()),
  );
  const [newVehicle, setNewVehicle] = useState("");
  const [newTare, setNewTare] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  const field = (key: keyof Settings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(form);
    toast.success("Settings saved successfully");
  };

  const handleAddMaterial = () => {
    const trimmed = newMaterial.trim();
    if (!trimmed) return;
    if (materials.includes(trimmed)) {
      toast.error("Material already exists");
      return;
    }
    addMaterial(trimmed);
    setMaterials(getMaterials());
    setNewMaterial("");
    toast.success(`"${trimmed}" added`);
  };

  const handleDeleteMaterial = (name: string) => {
    deleteMaterial(name);
    setMaterials(getMaterials());
    toast.success(`"${name}" removed`);
  };

  // --- Vehicle Tare Registry handlers ---

  const refreshRows = () => setRows(buildRows(getVehicleTareRegistry()));

  const handleRowChange = (
    idx: number,
    rowField: "vehicleNumber" | "tare",
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [rowField]: value } : r)),
    );
  };

  const handleSaveRow = (idx: number) => {
    const row = rows[idx];
    const vn = row.vehicleNumber.trim().toUpperCase();
    const tare = Number(row.tare);
    if (!vn) {
      toast.error("Vehicle number cannot be empty");
      return;
    }
    if (Number.isNaN(tare) || tare <= 0) {
      toast.error("Enter a valid tare weight");
      return;
    }
    if (vn !== row.key) {
      deleteVehicleTare(row.key);
    }
    saveVehicleTare(vn, tare);
    refreshRows();
    toast.success(`Saved ${vn}`);
  };

  const handleDeleteRow = (key: string) => {
    deleteVehicleTare(key);
    refreshRows();
    toast.success(`Deleted ${key}`);
  };

  const handleAddVehicle = () => {
    const vn = newVehicle.trim().toUpperCase();
    const tare = Number(newTare);
    if (!vn) {
      toast.error("Enter a vehicle number");
      return;
    }
    if (Number.isNaN(tare) || tare <= 0) {
      toast.error("Enter a valid tare weight");
      return;
    }
    saveVehicleTare(vn, tare);
    setNewVehicle("");
    setNewTare("");
    refreshRows();
    toast.success(`Added ${vn}`);
  };

  const handleExport = () => {
    const registry = getVehicleTareRegistry();
    const lines = ["vehicle_number,tare_weight"];
    for (const [vn, tare] of Object.entries(registry)) {
      lines.push(`${vn},${tare}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicle_tare_registry.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported vehicle tare registry");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const dataLines = lines[0]?.toLowerCase().startsWith("vehicle")
        ? lines.slice(1)
        : lines;
      const imported: Record<string, number> = {};
      let errorCount = 0;
      for (const line of dataLines) {
        const parts = line.split(",");
        const vn = parts[0]?.trim().toUpperCase();
        const tare = Number(parts[1]?.trim());
        if (!vn || Number.isNaN(tare) || tare <= 0) {
          errorCount++;
          continue;
        }
        imported[vn] = tare;
      }
      const count = Object.keys(imported).length;
      if (count === 0) {
        toast.error("No valid rows found in CSV");
        return;
      }
      const existing = getVehicleTareRegistry();
      setVehicleTareRegistry({ ...existing, ...imported });
      refreshRows();
      const skipped = errorCount > 0 ? ` (${errorCount} rows skipped)` : "";
      toast.success(
        `Imported ${count} vehicle${count !== 1 ? "s" : ""}${skipped}`,
      );
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#E6ECEF" }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#6F7C85" }}>
          Configure company and weighbridge details
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Company info */}
        <div
          className="rounded-xl p-5 space-y-4"
          style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#6F7C85" }}
          >
            Company Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label style={{ color: "#9AA6AE" }}>Company Name</Label>
              <Input
                value={form.companyName}
                onChange={(e) => field("companyName", e.target.value)}
                style={{
                  background: "#202529",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                }}
                data-ocid="settings.input"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label style={{ color: "#9AA6AE" }}>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => field("address", e.target.value)}
                style={{
                  background: "#202529",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                }}
                data-ocid="settings.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "#9AA6AE" }}>City / State</Label>
              <Input
                value={form.city}
                onChange={(e) => field("city", e.target.value)}
                style={{
                  background: "#202529",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                }}
                data-ocid="settings.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "#9AA6AE" }}>Phone Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => field("phone", e.target.value)}
                style={{
                  background: "#202529",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                }}
                data-ocid="settings.input"
              />
            </div>
          </div>
        </div>

        {/* Weighbridge info */}
        <div
          className="rounded-xl p-5 space-y-4"
          style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#6F7C85" }}
          >
            Weighbridge Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label style={{ color: "#9AA6AE" }}>Weighbridge Name</Label>
              <Input
                value={form.weighbridgeName}
                onChange={(e) => field("weighbridgeName", e.target.value)}
                style={{
                  background: "#202529",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                }}
                data-ocid="settings.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "#9AA6AE" }}>Location / Gate</Label>
              <Input
                value={form.weighbridgeLocation}
                onChange={(e) => field("weighbridgeLocation", e.target.value)}
                style={{
                  background: "#202529",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                }}
                data-ocid="settings.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "#9AA6AE" }}>License Number</Label>
              <Input
                value={form.licenseNumber}
                onChange={(e) => field("licenseNumber", e.target.value)}
                style={{
                  background: "#202529",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                }}
                data-ocid="settings.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "#9AA6AE" }}>Weight Unit</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => field("unit", v as Settings["unit"])}
              >
                <SelectTrigger
                  style={{
                    background: "#202529",
                    border: "1px solid #2A3136",
                    color: "#E6ECEF",
                  }}
                  data-ocid="settings.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
                >
                  <SelectItem value="KG" style={{ color: "#E6ECEF" }}>
                    KG — Kilograms
                  </SelectItem>
                  <SelectItem value="MT" style={{ color: "#E6ECEF" }}>
                    MT — Metric Tonnes
                  </SelectItem>
                  <SelectItem value="LB" style={{ color: "#E6ECEF" }}>
                    LB — Pounds
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="gap-2"
          style={{ background: "#22E66A", color: "#0B3A20" }}
          data-ocid="settings.save_button"
        >
          <Save className="w-4 h-4" /> Save Settings
        </Button>
      </form>

      {/* Materials Management */}
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#6F7C85" }}
        >
          Material Types
        </h2>

        <div className="flex gap-2">
          <Input
            placeholder="Enter new material name"
            value={newMaterial}
            onChange={(e) => setNewMaterial(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddMaterial()}
            style={{
              background: "#202529",
              border: "1px solid #2A3136",
              color: "#E6ECEF",
              flex: 1,
            }}
            data-ocid="settings.material_input"
          />
          <Button
            type="button"
            onClick={handleAddMaterial}
            className="gap-1.5 shrink-0"
            style={{ background: "#22E66A", color: "#0B3A20" }}
            data-ocid="settings.add_material_button"
          >
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>

        <div className="space-y-2">
          {materials.length === 0 && (
            <p className="text-sm" style={{ color: "#6F7C85" }}>
              No materials defined. Add one above.
            </p>
          )}
          {materials.map((m) => (
            <div
              key={m}
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: "#202529", border: "1px solid #2A3136" }}
            >
              <span className="text-sm" style={{ color: "#E6ECEF" }}>
                {m}
              </span>
              <button
                type="button"
                onClick={() => handleDeleteMaterial(m)}
                className="p-1 rounded hover:opacity-80 transition-opacity"
                style={{ color: "#FF6B6B" }}
                title={`Delete ${m}`}
                data-ocid="settings.delete_material_button"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle Tare Registry */}
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
      >
        {/* Header + import/export actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#6F7C85" }}
          >
            Vehicle Tare Registry
          </h2>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleExport}
              style={{
                background: "transparent",
                border: "1px solid #2A3136",
                color: "#9AA6AE",
              }}
              data-ocid="registry.export_button"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => importRef.current?.click()}
              style={{
                background: "transparent",
                border: "1px solid #2A3136",
                color: "#9AA6AE",
              }}
              data-ocid="registry.upload_button"
            >
              <Upload className="w-3.5 h-3.5" /> Import CSV
            </Button>
            <input
              ref={importRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>

        {/* Add new vehicle */}
        <div className="flex gap-2">
          <Input
            placeholder="Vehicle No. (e.g. MH-12-AB-1234)"
            value={newVehicle}
            onChange={(e) => setNewVehicle(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleAddVehicle()}
            style={{
              background: "#202529",
              border: "1px solid #2A3136",
              color: "#E6ECEF",
              flex: 2,
            }}
            data-ocid="registry.input"
          />
          <Input
            placeholder="Tare (kg)"
            type="number"
            min={0}
            value={newTare}
            onChange={(e) => setNewTare(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddVehicle()}
            style={{
              background: "#202529",
              border: "1px solid #2A3136",
              color: "#E6ECEF",
              flex: 1,
            }}
            data-ocid="registry.input"
          />
          <Button
            type="button"
            onClick={handleAddVehicle}
            className="gap-1.5 shrink-0"
            style={{ background: "#22E66A", color: "#0B3A20" }}
            data-ocid="registry.primary_button"
          >
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>

        {/* Column headers */}
        {rows.length > 0 && (
          <div className="grid grid-cols-[1fr_100px_64px] gap-2 px-1">
            <span
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "#6F7C85" }}
            >
              Vehicle Number
            </span>
            <span
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "#6F7C85" }}
            >
              Tare (kg)
            </span>
            <span />
          </div>
        )}

        {/* Rows */}
        <div className="space-y-2">
          {rows.length === 0 && (
            <p
              className="text-sm text-center py-4"
              style={{ color: "#6F7C85" }}
              data-ocid="registry.empty_state"
            >
              No vehicles saved yet.
            </p>
          )}
          {rows.map((row, idx) => (
            <div
              key={row.key}
              className="grid grid-cols-[1fr_100px_64px] gap-2 items-center"
              data-ocid={`registry.item.${idx + 1}`}
            >
              <Input
                value={row.vehicleNumber}
                onChange={(e) =>
                  handleRowChange(
                    idx,
                    "vehicleNumber",
                    e.target.value.toUpperCase(),
                  )
                }
                style={{
                  background: "#202529",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                  fontSize: "0.8125rem",
                }}
              />
              <Input
                type="number"
                min={0}
                value={row.tare}
                onChange={(e) => handleRowChange(idx, "tare", e.target.value)}
                style={{
                  background: "#202529",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                  fontSize: "0.8125rem",
                }}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleSaveRow(idx)}
                  className="p-1.5 rounded hover:opacity-80 transition-opacity"
                  style={{ color: "#22E66A" }}
                  title="Save changes"
                  data-ocid="registry.save_button"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRow(row.key)}
                  className="p-1.5 rounded hover:opacity-80 transition-opacity"
                  style={{ color: "#FF6B6B" }}
                  title="Delete vehicle"
                  data-ocid="registry.delete_button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System info */}
      <div
        className="rounded-xl p-5 space-y-3"
        style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#6F7C85" }}
        >
          System Information
        </h2>
        {[
          ["Application", "WeighMaster Pro v2.0"],
          ["Storage", "Browser LocalStorage (Offline)"],
          ["Status", "Fully Offline — No internet required"],
          ["Platform", "Web (Compatible with USB Pendrive)"],
        ].map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between text-sm border-b pb-2"
            style={{ borderColor: "#2A3136" }}
          >
            <span style={{ color: "#6F7C85" }}>{k}</span>
            <span style={{ color: "#9AA6AE" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
