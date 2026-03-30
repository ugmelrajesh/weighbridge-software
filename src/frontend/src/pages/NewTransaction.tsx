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
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { CheckCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  addTransaction,
  generateId,
  getMaterials,
  getTransactions,
  getVehicleTare,
  getVehicleTareRegistry,
  saveVehicleTare,
} from "../lib/storage";
import type { Transaction } from "../types";

export default function NewTransaction() {
  const navigate = useNavigate();
  const materials = getMaterials();
  const [form, setForm] = useState({
    vehicleNumber: "",
    driverName: "",
    material: "",
    grossWeight: "",
    tareWeight: "",
    remarks: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [tareSource, setTareSource] = useState<
    "auto" | "confirmed" | "manual" | null
  >(null);
  const [tareSaved, setTareSaved] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Build vehicle list from registry + transactions
  const getAllVehicleNumbers = (): string[] => {
    const registry = getVehicleTareRegistry();
    const registryKeys = Object.keys(registry);
    const txnVehicles = getTransactions().map((t) =>
      t.vehicleNumber.toUpperCase(),
    );
    const combined = Array.from(new Set([...registryKeys, ...txnVehicles]));
    return combined.sort();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyVehicleSuggestion = (vehicleNum: string) => {
    const savedTare = getVehicleTare(vehicleNum);
    setForm((prev) => ({
      ...prev,
      vehicleNumber: vehicleNum,
      tareWeight: savedTare !== null ? String(savedTare) : prev.tareWeight,
    }));
    if (savedTare !== null) {
      setTareSource("auto");
    } else {
      setTareSource(null);
    }
    setTareSaved(false);
    setShowDropdown(false);
    setActiveIndex(-1);
    if (errors.vehicleNumber)
      setErrors((prev) => ({ ...prev, vehicleNumber: "" }));
  };

  const gross = Number.parseFloat(form.grossWeight) || 0;
  const tare = Number.parseFloat(form.tareWeight) || 0;
  const net = Math.max(0, gross - tare);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.vehicleNumber.trim())
      e.vehicleNumber = "Vehicle number is required";
    if (!form.driverName.trim()) e.driverName = "Driver name is required";
    if (!form.material) e.material = "Material type is required";
    if (!form.tareWeight) e.tareWeight = "Tare weight is required";
    if (gross > 0 && gross < tare)
      e.grossWeight = "Gross weight must be \u2265 tare weight";
    return e;
  };

  const handleVehicleNumberChange = (value: string) => {
    setForm((prev) => ({ ...prev, vehicleNumber: value }));
    if (errors.vehicleNumber)
      setErrors((prev) => ({ ...prev, vehicleNumber: "" }));
    setTareSaved(false);

    // Show autocomplete suggestions from 1+ chars
    if (value.trim().length >= 1) {
      const allVehicles = getAllVehicleNumbers();
      const filtered = allVehicles
        .filter((v) => v.includes(value.trim().toUpperCase()))
        .slice(0, 8);
      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
      setActiveIndex(-1);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }

    // Auto-fill tare weight from vehicle history (4+ chars)
    if (value.trim().length >= 4) {
      const savedTare = getVehicleTare(value.trim());
      if (savedTare !== null) {
        setForm((prev) => ({
          ...prev,
          vehicleNumber: value,
          tareWeight: String(savedTare),
        }));
        setTareSource("auto");
      } else {
        setTareSource(null);
      }
    } else {
      setTareSource(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      applyVehicleSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  const handleTareChange = (value: string) => {
    setForm((prev) => ({ ...prev, tareWeight: value }));
    if (errors.tareWeight) setErrors((prev) => ({ ...prev, tareWeight: "" }));
    setTareSource("manual");
    setTareSaved(false);
  };

  const handleConfirmTare = () => {
    if (!form.vehicleNumber.trim() || !form.tareWeight) return;
    const tareVal = Number.parseFloat(form.tareWeight);
    if (Number.isNaN(tareVal) || tareVal <= 0) return;
    saveVehicleTare(form.vehicleNumber.trim(), tareVal);
    setTareSource("confirmed");
    setTareSaved(true);
    toast.success(
      `Tare weight ${tareVal.toLocaleString()} KG saved for ${form.vehicleNumber.trim().toUpperCase()}`,
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    const now = new Date().toISOString();
    const txn: Transaction = {
      id: generateId(),
      vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
      driverName: form.driverName.trim(),
      material: form.material,
      grossWeight: gross,
      tareWeight: tare,
      netWeight: net,
      entryTime: now,
      exitTime: gross > 0 ? now : undefined,
      status: gross > 0 ? "completed" : "pending",
      operator: "Admin",
      remarks: form.remarks.trim() || undefined,
    };

    addTransaction(txn);
    toast.success(`Transaction ${txn.id} recorded successfully`);
    setTimeout(() => navigate({ to: "/transactions" }), 600);
  };

  const field = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const displayNet = gross > 0 ? net.toLocaleString() : "------";

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "#E6ECEF" }}>
          New Transaction
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#6F7C85" }}>
          Record a new vehicle weighing transaction
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Auto-generated info */}
        <div
          className="rounded-xl px-5 py-4 flex items-center justify-between"
          style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
        >
          <div>
            <div className="text-xs" style={{ color: "#6F7C85" }}>
              Transaction ID
            </div>
            <div
              className="font-mono font-bold text-sm mt-0.5"
              style={{ color: "#22E66A" }}
            >
              {generateId()}
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: "#6F7C85" }}>
              Date &amp; Time
            </div>
            <div
              className="font-medium text-sm mt-0.5"
              style={{ color: "#E6ECEF" }}
            >
              {format(new Date(), "dd/MM/yyyy HH:mm")}
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: "#6F7C85" }}>
              Operator
            </div>
            <div
              className="font-medium text-sm mt-0.5"
              style={{ color: "#E6ECEF" }}
            >
              Admin
            </div>
          </div>
        </div>

        {/* Vehicle & Driver */}
        <div
          className="rounded-xl p-5 space-y-4"
          style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#6F7C85" }}
          >
            Vehicle Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vehicleNumber" style={{ color: "#9AA6AE" }}>
                Vehicle Number *
              </Label>
              {/* Autocomplete wrapper */}
              <div ref={wrapperRef} className="relative">
                <Input
                  id="vehicleNumber"
                  placeholder="e.g. MH-12-AB-4521"
                  value={form.vehicleNumber}
                  onChange={(e) => handleVehicleNumberChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true);
                  }}
                  autoComplete="off"
                  className="uppercase"
                  style={{
                    background: "#202529",
                    border: "1px solid #2A3136",
                    color: "#E6ECEF",
                  }}
                  data-ocid="new_transaction.input"
                />
                {showDropdown && suggestions.length > 0 && (
                  <ul
                    className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden shadow-xl"
                    style={{
                      background: "#1B1F22",
                      border: "1px solid #2A3136",
                      maxHeight: "220px",
                      overflowY: "auto",
                    }}
                  >
                    {suggestions.map((v, idx) => {
                      const registry = getVehicleTareRegistry();
                      const tare = registry[v];
                      return (
                        <li
                          key={v}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyVehicleSuggestion(v);
                          }}
                          className="flex items-center justify-between px-3 py-2 cursor-pointer text-xs transition-colors"
                          style={{
                            background:
                              idx === activeIndex ? "#2A3136" : "transparent",
                            color: "#E6ECEF",
                          }}
                          onMouseEnter={() => setActiveIndex(idx)}
                        >
                          <span className="font-mono font-medium">{v}</span>
                          {tare !== undefined && (
                            <span
                              className="ml-2 text-xs px-1.5 py-0.5 rounded"
                              style={{
                                background: "#0B3A20",
                                color: "#22E66A",
                              }}
                            >
                              {tare.toLocaleString()} KG
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {errors.vehicleNumber && (
                <p
                  className="text-xs"
                  style={{ color: "#FF6B6B" }}
                  data-ocid="new_transaction.error_state"
                >
                  {errors.vehicleNumber}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="driverName" style={{ color: "#9AA6AE" }}>
                Driver Name *
              </Label>
              <Input
                id="driverName"
                placeholder="Full name"
                value={form.driverName}
                onChange={(e) => field("driverName", e.target.value)}
                style={{
                  background: "#202529",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                }}
                data-ocid="new_transaction.input"
              />
              {errors.driverName && (
                <p
                  className="text-xs"
                  style={{ color: "#FF6B6B" }}
                  data-ocid="new_transaction.error_state"
                >
                  {errors.driverName}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="material" style={{ color: "#9AA6AE" }}>
              Material Type *
            </Label>
            <Select
              value={form.material}
              onValueChange={(v) => field("material", v)}
            >
              <SelectTrigger
                style={{
                  background: "#202529",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                }}
                data-ocid="new_transaction.select"
              >
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent
                style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
              >
                {materials.map((m) => (
                  <SelectItem key={m} value={m} style={{ color: "#E6ECEF" }}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.material && (
              <p className="text-xs" style={{ color: "#FF6B6B" }}>
                {errors.material}
              </p>
            )}
          </div>
        </div>

        {/* Weights */}
        <div
          className="rounded-xl p-5 space-y-4"
          style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#6F7C85" }}
          >
            Weight Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="tareWeight" style={{ color: "#9AA6AE" }}>
                  Tare Weight (KG) *
                </Label>
                {tareSource === "auto" && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{ background: "#0B3A20", color: "#22E66A" }}
                  >
                    Auto-filled
                  </span>
                )}
              </div>
              <Input
                id="tareWeight"
                type="number"
                min="0"
                placeholder="Empty vehicle weight"
                value={form.tareWeight}
                onChange={(e) => handleTareChange(e.target.value)}
                style={{
                  background: "#202529",
                  border:
                    tareSource === "auto"
                      ? "1px solid #22E66A55"
                      : "1px solid #2A3136",
                  color: "#E6ECEF",
                }}
                data-ocid="new_transaction.input"
              />
              {errors.tareWeight && (
                <p className="text-xs" style={{ color: "#FF6B6B" }}>
                  {errors.tareWeight}
                </p>
              )}
              {/* Confirm Tare button */}
              {form.tareWeight &&
                Number.parseFloat(form.tareWeight) > 0 &&
                form.vehicleNumber.trim() && (
                  <Button
                    type="button"
                    onClick={handleConfirmTare}
                    disabled={tareSaved}
                    size="sm"
                    className="w-full mt-1 flex items-center gap-1.5"
                    style={{
                      background: tareSaved ? "#0B3A20" : "#1A3A28",
                      border: tareSaved
                        ? "1px solid #22E66A55"
                        : "1px solid #22E66A44",
                      color: tareSaved ? "#22E66A" : "#9AA6AE",
                      fontSize: "0.75rem",
                    }}
                  >
                    <CheckCircle size={13} />
                    {tareSaved
                      ? "Tare Weight Saved"
                      : "Confirm & Save Tare Weight"}
                  </Button>
                )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grossWeight" style={{ color: "#9AA6AE" }}>
                Gross Weight (KG)
              </Label>
              <Input
                id="grossWeight"
                type="number"
                min="0"
                placeholder="Loaded vehicle weight"
                value={form.grossWeight}
                onChange={(e) => field("grossWeight", e.target.value)}
                style={{
                  background: "#202529",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                }}
                data-ocid="new_transaction.input"
              />
              {errors.grossWeight && (
                <p className="text-xs" style={{ color: "#FF6B6B" }}>
                  {errors.grossWeight}
                </p>
              )}
              <p className="text-xs" style={{ color: "#6F7C85" }}>
                Leave empty to save as pending
              </p>
            </div>
          </div>

          {/* Net weight display */}
          <div
            className="rounded-lg p-4 text-center"
            style={{ background: "#0B3A20", border: "1px solid #22E66A33" }}
          >
            <div
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: "#6F7C85" }}
            >
              Calculated Net Weight
            </div>
            <div
              className="text-4xl font-bold digital-display"
              style={{ fontFamily: '"Orbitron", monospace' }}
              data-ocid="new_transaction.canvas_target"
            >
              {displayNet}
            </div>
            <div
              className="text-sm mt-1 digital-display-sm"
              style={{ fontFamily: '"Orbitron", monospace' }}
            >
              KG
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div
          className="rounded-xl p-5 space-y-3"
          style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#6F7C85" }}
          >
            Additional Info
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="remarks" style={{ color: "#9AA6AE" }}>
              Remarks (optional)
            </Label>
            <Textarea
              id="remarks"
              placeholder="Any additional notes..."
              value={form.remarks}
              onChange={(e) => field("remarks", e.target.value)}
              rows={3}
              style={{
                background: "#202529",
                border: "1px solid #2A3136",
                color: "#E6ECEF",
              }}
              data-ocid="new_transaction.textarea"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={submitting}
            data-ocid="new_transaction.submit_button"
            style={{ background: "#22E66A", color: "#0B3A20" }}
          >
            {submitting ? "Saving..." : "Save Transaction"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/transactions" })}
            style={{ borderColor: "#2A3136", color: "#9AA6AE" }}
            data-ocid="new_transaction.cancel_button"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
