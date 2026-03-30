import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Pencil,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import PrintSlip from "../components/PrintSlip";
import { exportTransactionsCSV } from "../lib/csv";
import {
  clearAllTransactions,
  deleteTransaction,
  getSettings,
  getTransactions,
  updateTransaction,
} from "../lib/storage";
import type { Transaction } from "../types";
import { MATERIAL_TYPES } from "../types";
import { StatusBadge } from "./Dashboard";

const PAGE_SIZE = 10;

function buildPrintHTML(t: Transaction): string {
  const settings = getSettings();
  const entryDate = format(new Date(t.entryTime), "dd/MM/yyyy HH:mm:ss");
  const exitDate = t.exitTime
    ? format(new Date(t.exitTime), "dd/MM/yyyy HH:mm:ss")
    : "—";
  const printedAt = format(new Date(), "dd/MM/yyyy HH:mm:ss");
  const isCompleted = t.status === "completed";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Weight Slip — ${t.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      background: #fff;
      color: #000;
      width: 80mm;
      max-width: 80mm;
      padding: 6mm 4mm;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .company-name { font-size: 14px; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
    .company-sub { font-size: 10px; text-align: center; margin-bottom: 1px; }
    .divider { border-top: 1px dashed #000; margin: 4px 0; }
    .divider-solid { border-top: 2px solid #000; margin: 4px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .label { color: #555; }
    .value { font-weight: bold; text-align: right; }
    .weight-box { border: 2px solid #000; padding: 4px 6px; margin: 6px 0; text-align: center; }
    .net-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .net-value { font-size: 20px; font-weight: bold; margin: 2px 0; }
    .net-unit { font-size: 11px; }
    .stamp { text-align: center; margin-top: 6px; }
    .stamp-text {
      display: inline-block;
      border: 2px solid ${isCompleted ? "#000" : "#666"};
      color: ${isCompleted ? "#000" : "#666"};
      font-size: 14px;
      font-weight: bold;
      padding: 2px 10px;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .sig-line { border-top: 1px solid #000; margin-top: 20px; width: 60%; margin-left: auto; margin-right: auto; }
    .sig-label { text-align: center; font-size: 9px; margin-top: 2px; }
    .footer { font-size: 9px; text-align: center; margin-top: 6px; color: #666; }
    @media print {
      @page { margin: 0; size: 80mm auto; }
      body { width: 80mm; }
    }
  </style>
</head>
<body>
  <div class="company-name">${settings.companyName || "WEIGHBRIDGE"}</div>
  ${settings.address ? `<div class="company-sub">${settings.address}${settings.city ? `, ${settings.city}` : ""}</div>` : ""}
  ${settings.phone ? `<div class="company-sub">Tel: ${settings.phone}</div>` : ""}
  ${settings.weighbridgeName ? `<div class="company-sub">${settings.weighbridgeName}</div>` : ""}
  ${settings.weighbridgeLocation ? `<div class="company-sub">${settings.weighbridgeLocation}</div>` : ""}
  ${settings.licenseNumber ? `<div class="company-sub">Lic No: ${settings.licenseNumber}</div>` : ""}

  <div class="divider-solid"></div>
  <div class="center bold" style="font-size:12px; letter-spacing:1px;">WEIGHT SLIP</div>
  <div class="divider"></div>

  <div class="row"><span class="label">Slip No:</span><span class="value">${t.id}</span></div>
  <div class="row"><span class="label">Entry:</span><span class="value">${entryDate}</span></div>
  ${t.exitTime ? `<div class="row"><span class="label">Exit:</span><span class="value">${exitDate}</span></div>` : ""}
  <div class="divider"></div>

  <div class="row"><span class="label">Vehicle No:</span><span class="value">${t.vehicleNumber}</span></div>
  <div class="row"><span class="label">Driver:</span><span class="value">${t.driverName}</span></div>
  <div class="row"><span class="label">Material:</span><span class="value">${t.material}</span></div>
  <div class="row"><span class="label">Operator:</span><span class="value">${t.operator}</span></div>
  <div class="divider"></div>

  <div class="row"><span class="label">Gross Wt:</span><span class="value">${t.grossWeight > 0 ? `${t.grossWeight.toLocaleString()} ${settings.unit || "KG"}` : "PENDING"}</span></div>
  <div class="row"><span class="label">Tare Wt:</span><span class="value">${t.tareWeight.toLocaleString()} ${settings.unit || "KG"}</span></div>

  <div class="weight-box">
    <div class="net-label">Net Weight</div>
    <div class="net-value">${t.netWeight > 0 ? t.netWeight.toLocaleString() : "---"}</div>
    <div class="net-unit">${settings.unit || "KG"}</div>
  </div>

  ${t.remarks ? `<div class="row"><span class="label">Remarks:</span><span class="value">${t.remarks}</span></div><div class="divider"></div>` : ""}

  <div class="stamp"><span class="stamp-text">${isCompleted ? "COMPLETED" : "PENDING"}</span></div>

  <div class="sig-line"></div>
  <div class="sig-label">Authorised Signature</div>

  <div class="footer">Printed: ${printedAt}</div>
</body>
</html>`;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);
  const [viewTxn, setViewTxn] = useState<Transaction | null>(null);
  const [printTxn, setPrintTxn] = useState<Transaction | null>(null);
  const [editGross, setEditGross] = useState("");
  const [editTare, setEditTare] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editDriver, setEditDriver] = useState("");
  const [editVehicle, setEditVehicle] = useState("");
  const [editMaterial, setEditMaterial] = useState("");
  const [grossError, setGrossError] = useState("");

  const refresh = useCallback(() => setTransactions(getTransactions()), []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.vehicleNumber.toLowerCase().includes(q) ||
      t.driverName.toLowerCase().includes(q) ||
      t.material.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const entryDate = new Date(t.entryTime);
    const matchFrom = !dateFrom || entryDate >= new Date(dateFrom);
    const matchTo = !dateTo || entryDate <= new Date(`${dateTo}T23:59:59`);
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    deleteTransaction(id);
    refresh();
    toast.success("Transaction deleted");
  };

  const handleEdit = (t: Transaction) => {
    setEditTxn(t);
    setEditGross(t.grossWeight > 0 ? t.grossWeight.toString() : "");
    setEditTare(t.tareWeight > 0 ? t.tareWeight.toString() : "");
    setEditRemarks(t.remarks ?? "");
    setEditDriver(t.driverName);
    setEditVehicle(t.vehicleNumber);
    setEditMaterial(t.material);
    setGrossError("");
  };

  const handleEditSave = () => {
    if (!editTxn) return;
    const gross = Number.parseFloat(editGross) || 0;
    const tare = Number.parseFloat(editTare) || 0;
    if (gross > 0 && gross < tare) {
      setGrossError("Last Weight (Gross) must be ≥ First Weight (Tare)");
      return;
    }
    const net = Math.max(0, gross - tare);
    updateTransaction(editTxn.id, {
      grossWeight: gross,
      tareWeight: tare,
      netWeight: net,
      driverName: editDriver,
      vehicleNumber: editVehicle,
      material: editMaterial,
      status: gross > 0 ? "completed" : "pending",
      exitTime: gross > 0 ? new Date().toISOString() : undefined,
      remarks: editRemarks || undefined,
    });
    refresh();
    setEditTxn(null);
    toast.success("Transaction updated");
  };

  const handleClearAll = () => {
    if (
      !confirm(
        "This will permanently delete ALL transaction records. Are you sure?",
      )
    )
      return;
    clearAllTransactions();
    refresh();
    toast.success("All transactions cleared");
  };

  const handlePrint = (t: Transaction) => {
    // Keep printTxn for backwards compatibility
    setPrintTxn(t);
    // Print in a new window for proper thermal printer output
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) {
      toast.error("Popup blocked. Please allow popups for this site.");
      return;
    }
    win.document.write(buildPrintHTML(t));
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      setTimeout(() => win.close(), 500);
    }, 300);
  };

  const editTareNum = Number.parseFloat(editTare) || 0;
  const editGrossNum = Number.parseFloat(editGross) || 0;
  const editNetPreview = Math.max(0, editGrossNum - editTareNum);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#E6ECEF" }}>
            Transactions
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6F7C85" }}>
            {filtered.length} records found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleClearAll}
            size="sm"
            variant="outline"
            className="gap-2"
            style={{ borderColor: "#FF6B6B", color: "#FF6B6B" }}
            data-ocid="transactions.delete_button"
          >
            <Trash2 className="w-4 h-4" /> Clear All Data
          </Button>
          <Button
            onClick={() => exportTransactionsCSV(filtered)}
            size="sm"
            variant="outline"
            className="gap-2"
            style={{ borderColor: "#2A3136", color: "#9AA6AE" }}
            data-ocid="transactions.primary_button"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl p-4 flex flex-wrap gap-3 items-end"
        style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
      >
        <div className="flex-1 min-w-[200px] space-y-1">
          <Label className="text-xs" style={{ color: "#6F7C85" }}>
            Search
          </Label>
          <div className="relative">
            <Search
              className="absolute left-2.5 top-2.5 w-3.5 h-3.5"
              style={{ color: "#6F7C85" }}
            />
            <Input
              placeholder="Vehicle, driver, material..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
              style={{
                background: "#202529",
                border: "1px solid #2A3136",
                color: "#E6ECEF",
              }}
              data-ocid="transactions.search_input"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs" style={{ color: "#6F7C85" }}>
            Status
          </Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="w-[140px]"
              style={{
                background: "#202529",
                border: "1px solid #2A3136",
                color: "#E6ECEF",
              }}
              data-ocid="transactions.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
            >
              <SelectItem value="all" style={{ color: "#E6ECEF" }}>
                All Status
              </SelectItem>
              <SelectItem value="completed" style={{ color: "#E6ECEF" }}>
                Completed
              </SelectItem>
              <SelectItem value="pending" style={{ color: "#E6ECEF" }}>
                Pending
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs" style={{ color: "#6F7C85" }}>
            From
          </Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            style={{
              background: "#202529",
              border: "1px solid #2A3136",
              color: "#E6ECEF",
            }}
            data-ocid="transactions.input"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs" style={{ color: "#6F7C85" }}>
            To
          </Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            style={{
              background: "#202529",
              border: "1px solid #2A3136",
              color: "#E6ECEF",
            }}
            data-ocid="transactions.input"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            setStatusFilter("all");
            setDateFrom("");
            setDateTo("");
            setPage(1);
          }}
          style={{ color: "#6F7C85" }}
        >
          Clear
        </Button>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #2A3136",
                  background: "#202529",
                }}
              >
                {[
                  "Txn ID",
                  "Date/Time",
                  "Vehicle",
                  "Driver",
                  "Material",
                  "Gross (KG)",
                  "Tare (KG)",
                  "Net (KG)",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-3 text-left font-medium"
                    style={{ color: "#6F7C85" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center"
                    style={{ color: "#6F7C85" }}
                    data-ocid="transactions.empty_state"
                  >
                    No transactions match your filters
                  </td>
                </tr>
              ) : (
                paginated.map((t, i) => (
                  <tr
                    key={t.id}
                    className="hover:bg-white/5 transition-colors"
                    style={{ borderBottom: "1px solid #2A313620" }}
                    data-ocid={`transactions.row.${i + 1}`}
                  >
                    <td
                      className="px-3 py-2.5 font-mono"
                      style={{ color: "#22E66A" }}
                    >
                      {t.id}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: "#9AA6AE" }}>
                      {format(new Date(t.entryTime), "dd/MM/yy HH:mm")}
                    </td>
                    <td
                      className="px-3 py-2.5 font-medium"
                      style={{ color: "#E6ECEF" }}
                    >
                      {t.vehicleNumber}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: "#9AA6AE" }}>
                      {t.driverName}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: "#9AA6AE" }}>
                      {t.material}
                    </td>
                    <td
                      className="px-3 py-2.5 font-mono"
                      style={{ color: "#E6ECEF" }}
                    >
                      {t.grossWeight > 0 ? t.grossWeight.toLocaleString() : "—"}
                    </td>
                    <td
                      className="px-3 py-2.5 font-mono"
                      style={{ color: "#E6ECEF" }}
                    >
                      {t.tareWeight.toLocaleString()}
                    </td>
                    <td
                      className="px-3 py-2.5 font-mono font-bold"
                      style={{ color: t.netWeight > 0 ? "#22E66A" : "#6F7C85" }}
                    >
                      {t.netWeight > 0 ? t.netWeight.toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewTxn(t)}
                          className="p-1 rounded hover:bg-white/10 transition-colors"
                          title="View"
                          style={{ color: "#9AA6AE" }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrint(t)}
                          className="p-1 rounded hover:bg-white/10 transition-colors"
                          title="Print Slip"
                          style={{ color: "#9AA6AE" }}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(t)}
                          className="p-1 rounded hover:bg-white/10 transition-colors"
                          title="Edit"
                          style={{ color: "#F2C14E" }}
                          data-ocid={`transactions.edit_button.${i + 1}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="p-1 rounded hover:bg-red-900/20 transition-colors"
                          title="Delete"
                          style={{ color: "#FF6B6B" }}
                          data-ocid={`transactions.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "#2A3136" }}
          >
            <span className="text-xs" style={{ color: "#6F7C85" }}>
              Page {page} of {totalPages} ({filtered.length} records)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded transition-colors disabled:opacity-40"
                style={{ color: "#9AA6AE" }}
                data-ocid="transactions.pagination_prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-7 h-7 rounded text-xs font-medium transition-colors"
                  style={
                    p === page
                      ? { background: "#153C28", color: "#22E66A" }
                      : { color: "#9AA6AE" }
                  }
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded transition-colors disabled:opacity-40"
                style={{ color: "#9AA6AE" }}
                data-ocid="transactions.pagination_next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Dialog
        open={!!editTxn}
        onOpenChange={(open) => !open && setEditTxn(null)}
      >
        <DialogContent
          style={{
            background: "#1B1F22",
            border: "1px solid #2A3136",
            color: "#E6ECEF",
          }}
          data-ocid="transactions.dialog"
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#E6ECEF" }}>
              Edit Transaction — {editTxn?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Weight fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label style={{ color: "#9AA6AE" }}>
                  First Weight (Tare) KG
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={editTare}
                  onChange={(e) => {
                    setEditTare(e.target.value);
                    setGrossError("");
                  }}
                  style={{
                    background: "#202529",
                    border: "1px solid #2A3136",
                    color: "#E6ECEF",
                  }}
                  data-ocid="transactions.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: "#9AA6AE" }}>
                  Last Weight (Gross) KG
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={editGross}
                  onChange={(e) => {
                    setEditGross(e.target.value);
                    setGrossError("");
                  }}
                  style={{
                    background: "#202529",
                    border: "1px solid #2A3136",
                    color: "#E6ECEF",
                  }}
                  data-ocid="transactions.input"
                />
              </div>
            </div>
            {grossError && (
              <p className="text-xs" style={{ color: "#FF6B6B" }}>
                {grossError}
              </p>
            )}
            {(editTare || editGross) && (
              <div
                className="rounded-lg px-3 py-2 text-sm font-mono"
                style={{ background: "#0D2419", border: "1px solid #153C28" }}
              >
                <span style={{ color: "#6F7C85" }}>Net Weight: </span>
                <span className="font-bold" style={{ color: "#22E66A" }}>
                  {editNetPreview.toLocaleString()} KG
                </span>
              </div>
            )}

            {/* Vehicle & Driver */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label style={{ color: "#9AA6AE" }}>Vehicle Number</Label>
                <Input
                  value={editVehicle}
                  onChange={(e) => setEditVehicle(e.target.value)}
                  style={{
                    background: "#202529",
                    border: "1px solid #2A3136",
                    color: "#E6ECEF",
                  }}
                  data-ocid="transactions.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: "#9AA6AE" }}>Driver Name</Label>
                <Input
                  value={editDriver}
                  onChange={(e) => setEditDriver(e.target.value)}
                  style={{
                    background: "#202529",
                    border: "1px solid #2A3136",
                    color: "#E6ECEF",
                  }}
                  data-ocid="transactions.input"
                />
              </div>
            </div>

            {/* Material */}
            <div className="space-y-1.5">
              <Label style={{ color: "#9AA6AE" }}>Material</Label>
              <Select value={editMaterial} onValueChange={setEditMaterial}>
                <SelectTrigger
                  style={{
                    background: "#202529",
                    border: "1px solid #2A3136",
                    color: "#E6ECEF",
                  }}
                  data-ocid="transactions.select"
                >
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent
                  style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
                >
                  {MATERIAL_TYPES.map((m) => (
                    <SelectItem key={m} value={m} style={{ color: "#E6ECEF" }}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label style={{ color: "#9AA6AE" }}>Remarks</Label>
              <Input
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                style={{
                  background: "#202529",
                  border: "1px solid #2A3136",
                  color: "#E6ECEF",
                }}
                data-ocid="transactions.input"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleEditSave}
                style={{ background: "#22E66A", color: "#0B3A20" }}
                data-ocid="transactions.confirm_button"
              >
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditTxn(null)}
                style={{ borderColor: "#2A3136", color: "#9AA6AE" }}
                data-ocid="transactions.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View modal */}
      <Dialog
        open={!!viewTxn}
        onOpenChange={(open) => !open && setViewTxn(null)}
      >
        <DialogContent
          style={{
            background: "#1B1F22",
            border: "1px solid #2A3136",
            color: "#E6ECEF",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#E6ECEF" }}>
              Transaction Details — {viewTxn?.id}
            </DialogTitle>
          </DialogHeader>
          {viewTxn && (
            <div className="space-y-3 pt-2">
              {[
                ["Vehicle Number", viewTxn.vehicleNumber],
                ["Driver", viewTxn.driverName],
                ["Material", viewTxn.material],
                [
                  "Entry Time",
                  format(new Date(viewTxn.entryTime), "dd/MM/yyyy HH:mm:ss"),
                ],
                [
                  "Exit Time",
                  viewTxn.exitTime
                    ? format(new Date(viewTxn.exitTime), "dd/MM/yyyy HH:mm:ss")
                    : "—",
                ],
                ["Gross Weight", `${viewTxn.grossWeight.toLocaleString()} KG`],
                ["Tare Weight", `${viewTxn.tareWeight.toLocaleString()} KG`],
                ["Net Weight", `${viewTxn.netWeight.toLocaleString()} KG`],
                ["Operator", viewTxn.operator],
                ["Remarks", viewTxn.remarks ?? "—"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between border-b pb-2"
                  style={{ borderColor: "#2A3136" }}
                >
                  <span style={{ color: "#6F7C85" }}>{k}</span>
                  <span className="font-medium" style={{ color: "#E6ECEF" }}>
                    {v}
                  </span>
                </div>
              ))}
              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setViewTxn(null);
                    handlePrint(viewTxn);
                  }}
                  size="sm"
                  style={{ background: "#153C28", color: "#22E66A" }}
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Slip
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewTxn(null)}
                  style={{ borderColor: "#2A3136", color: "#9AA6AE" }}
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print slip (hidden until print) */}
      {printTxn && <PrintSlip transaction={printTxn} />}
    </div>
  );
}
