import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  addTransaction,
  generateId,
  getMaterials,
  getSettings,
  getTransactions,
  getVehicleTare,
  getVehicleTareRegistry,
} from "../lib/storage";
import type { Transaction } from "../types";

function getAllVehicleNumbers(): string[] {
  const registry = getVehicleTareRegistry();
  const registryKeys = Object.keys(registry);
  const txVehicles = getTransactions().map((t) =>
    t.vehicleNumber.toUpperCase(),
  );
  return Array.from(new Set([...registryKeys, ...txVehicles])).sort();
}

export default function GatePass() {
  const [materials, setMaterials] = useState<string[]>([]);
  const [gpVehicle, setGpVehicle] = useState("");
  const [gpMaterial, setGpMaterial] = useState("");
  const [gpTare, setGpTare] = useState("");
  const [gpError, setGpError] = useState("");
  const [gpSuccess, setGpSuccess] = useState("");
  const [gpSuggestions, setGpSuggestions] = useState<string[]>([]);
  const [gpShowDropdown, setGpShowDropdown] = useState(false);
  const [gpActiveIndex, setGpActiveIndex] = useState(-1);
  const gpWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMaterials(getMaterials());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        gpWrapperRef.current &&
        !gpWrapperRef.current.contains(e.target as Node)
      ) {
        setGpShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrintGatePass = () => {
    setGpError("");
    setGpSuccess("");

    if (!gpVehicle.trim()) {
      setGpError("Vehicle number is required.");
      return;
    }
    if (!gpMaterial) {
      setGpError("Please select a material.");
      return;
    }
    if (!gpTare || Number(gpTare) <= 0) {
      setGpError("Enter a valid empty vehicle weight.");
      return;
    }

    const now = new Date().toISOString();
    const txn: Transaction = {
      id: generateId(),
      vehicleNumber: gpVehicle.trim().toUpperCase(),
      driverName: "",
      material: gpMaterial,
      grossWeight: 0,
      tareWeight: Number(gpTare),
      netWeight: 0,
      entryTime: now,
      status: "pending",
      operator: "Gate",
      remarks: "Gate Pass Issued",
    };

    addTransaction(txn);

    const s = getSettings();
    const issuedAt = format(new Date(now), "dd/MM/yyyy HH:mm:ss");

    const printWin = window.open("", "_blank", "width=400,height=600");
    if (printWin) {
      printWin.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Gate Pass</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: #fff; margin: 0; padding: 10px; width: 72mm; }
  .gp-company { text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 2px; }
  .gp-title { text-align: center; font-size: 13px; font-weight: bold; letter-spacing: 2px; margin-bottom: 2px; }
  .gp-issued { text-align: center; font-size: 10px; margin-bottom: 6px; }
  .gp-divider { border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 3px 0; font-size: 12px; }
  .lbl { font-weight: bold; width: 50%; }
  .gp-sig { margin-top: 16px; font-size: 11px; }
  .gp-sig-line { margin-top: 4px; }
  .gp-footer { text-align: center; font-size: 10px; margin-top: 10px; }
</style>
</head>
<body>
<div class="gp-company">${s.companyName.toUpperCase()}</div>
<div class="gp-title">GATE PASS</div>
<div class="gp-issued">Issued: ${issuedAt}</div>
<div class="gp-divider"></div>
<table>
  <tr><td class="lbl">Vehicle Number</td><td>${txn.vehicleNumber}</td></tr>
  <tr><td class="lbl">Material</td><td>${txn.material}</td></tr>
  <tr><td class="lbl">Empty Wt (Tare)</td><td>${txn.tareWeight.toLocaleString()} KG</td></tr>
</table>
<div class="gp-divider"></div>
<div class="gp-sig">Authorized Signature:<br/><div class="gp-sig-line">___________________________</div></div>
<div class="gp-footer">Computer generated document</div>
</body>
</html>`);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
        printWin.close();
      }, 250);
    }

    setGpVehicle("");
    setGpMaterial("");
    setGpTare("");
    setGpSuccess("Gate pass printed & added to pending list");
    setTimeout(() => setGpSuccess(""), 4000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#E6ECEF" }}>
          Gate Pass
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#6F7C85" }}>
          Issue a gate pass and add vehicle to pending transactions
        </p>
      </div>

      <div
        className="rounded-xl p-5 max-w-2xl"
        style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
      >
        <div
          className="flex items-center gap-2 mb-4 pb-3 border-b"
          style={{ borderColor: "#2A3136" }}
        >
          <Printer className="w-4 h-4" style={{ color: "#22E66A" }} />
          <span className="font-semibold text-sm" style={{ color: "#E6ECEF" }}>
            Print Gate Pass
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Vehicle Number */}
          <div className="space-y-1.5">
            <label
              htmlFor="gp-vehicle"
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "#6F7C85" }}
            >
              Vehicle Number
            </label>
            <div ref={gpWrapperRef} className="relative">
              <input
                id="gp-vehicle"
                type="text"
                placeholder="e.g. MH-12-AB-1234"
                value={gpVehicle}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setGpVehicle(val);
                  setGpActiveIndex(-1);
                  if (val.length > 0) {
                    const all = getAllVehicleNumbers();
                    const filtered = all
                      .filter((v) => v.toUpperCase().includes(val))
                      .slice(0, 8);
                    setGpSuggestions(filtered);
                    setGpShowDropdown(filtered.length > 0);
                  } else {
                    setGpSuggestions([]);
                    setGpShowDropdown(false);
                  }
                  if (val.length >= 4) {
                    const tare = getVehicleTare(val);
                    if (tare !== null) setGpTare(String(tare));
                  }
                }}
                onKeyDown={(e) => {
                  if (!gpShowDropdown) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setGpActiveIndex((i) =>
                      Math.min(i + 1, gpSuggestions.length - 1),
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setGpActiveIndex((i) => Math.max(i - 1, -1));
                  } else if (e.key === "Enter" && gpActiveIndex >= 0) {
                    e.preventDefault();
                    const selected = gpSuggestions[gpActiveIndex];
                    setGpVehicle(selected);
                    const tare = getVehicleTare(selected);
                    if (tare !== null) setGpTare(String(tare));
                    setGpShowDropdown(false);
                    setGpActiveIndex(-1);
                  } else if (e.key === "Escape") {
                    setGpShowDropdown(false);
                    setGpActiveIndex(-1);
                  }
                }}
                data-ocid="gatepass.input"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                style={{
                  background: "#111518",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                }}
              />
              {gpShowDropdown && gpSuggestions.length > 0 && (
                <ul
                  className="absolute left-0 right-0 z-50 mt-1 rounded-lg overflow-hidden shadow-xl"
                  style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
                >
                  {gpSuggestions.map((v, i) => {
                    const tare = getVehicleTareRegistry()[v];
                    return (
                      <li
                        key={v}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setGpVehicle(v);
                          if (tare !== undefined) setGpTare(String(tare));
                          setGpShowDropdown(false);
                          setGpActiveIndex(-1);
                        }}
                        className="flex items-center justify-between px-3 py-2 cursor-pointer text-sm"
                        style={{
                          background:
                            i === gpActiveIndex ? "#2A3136" : "transparent",
                          color: "#E6ECEF",
                        }}
                      >
                        <span style={{ fontFamily: "monospace" }}>{v}</span>
                        {tare !== undefined && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium ml-2"
                            style={{ background: "#0B3A20", color: "#22E66A" }}
                          >
                            {tare} kg
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Material */}
          <div className="space-y-1.5">
            <label
              htmlFor="gp-material"
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "#6F7C85" }}
            >
              Material
            </label>
            <select
              id="gp-material"
              value={gpMaterial}
              onChange={(e) => setGpMaterial(e.target.value)}
              data-ocid="gatepass.select"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors appearance-none"
              style={{
                background: "#111518",
                border: "1px solid #2A3136",
                color: gpMaterial ? "#E6ECEF" : "#6F7C85",
              }}
            >
              <option value="" disabled>
                Select material…
              </option>
              {materials.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Tare Weight */}
          <div className="space-y-1.5">
            <label
              htmlFor="gp-tare"
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "#6F7C85" }}
            >
              Empty Vehicle Weight (KG)
            </label>
            <input
              id="gp-tare"
              type="number"
              placeholder="e.g. 12000"
              value={gpTare}
              onChange={(e) => setGpTare(e.target.value)}
              data-ocid="gatepass.search_input"
              min={0}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
              style={{
                background: "#111518",
                border: "1px solid #2A3136",
                color: "#E6ECEF",
              }}
            />
          </div>
        </div>

        {gpError && (
          <p
            className="mt-3 text-xs px-3 py-2 rounded-lg"
            style={{ background: "#3B1414", color: "#FF6B6B" }}
            data-ocid="gatepass.error_state"
          >
            {gpError}
          </p>
        )}
        {gpSuccess && (
          <p
            className="mt-3 text-xs px-3 py-2 rounded-lg"
            style={{ background: "#153C28", color: "#43F08C" }}
            data-ocid="gatepass.success_state"
          >
            ✓ {gpSuccess}
          </p>
        )}

        <div className="mt-4">
          <Button
            type="button"
            onClick={handlePrintGatePass}
            data-ocid="gatepass.primary_button"
            className="gap-2 font-medium"
            style={{ background: "#22E66A", color: "#0B3A20" }}
          >
            <Printer className="w-4 h-4" />
            Print Gate Pass
          </Button>
        </div>
      </div>
    </div>
  );
}
