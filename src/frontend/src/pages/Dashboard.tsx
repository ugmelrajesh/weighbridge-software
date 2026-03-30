import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { format, isThisWeek, isToday } from "date-fns";
import { Activity, Calendar, Hash, Plus, Truck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getMaterials, getSettings, getTransactions } from "../lib/storage";
import type { Transaction } from "../types";

export function StatusBadge({ status }: { status: "pending" | "completed" }) {
  return status === "completed" ? (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: "#153C28", color: "#43F08C" }}
    >
      Completed
    </span>
  ) : (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: "#3B3114", color: "#F2C14E" }}
    >
      Pending
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [liveWeight, setLiveWeight] = useState(0);
  const [isWeighing, setIsWeighing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const settings = getSettings();

  const refresh = useCallback(() => {
    setTransactions(getTransactions());
  }, []);

  useEffect(() => {
    refresh();
    getMaterials();
  }, [refresh]);

  useEffect(() => {
    if (!isWeighing) return;
    const interval = setInterval(() => {
      setLiveWeight((prev) => {
        const delta = (Math.random() - 0.5) * 10;
        return Math.max(0, Math.round(prev + delta));
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isWeighing]);

  const todayTxns = transactions.filter((t) => isToday(new Date(t.entryTime)));
  const weekTxns = transactions.filter((t) =>
    isThisWeek(new Date(t.entryTime)),
  );
  const pendingTxns = transactions.filter((t) => t.status === "pending");
  const todayNet = todayTxns.reduce((s, t) => s + t.netWeight, 0);

  const recentTxns = transactions.slice(0, 5);

  const statCards = [
    {
      label: "Transactions Today",
      value: todayTxns.length.toString(),
      icon: Hash,
      color: "#22E66A",
    },
    {
      label: "Active Loads",
      value: pendingTxns.length.toString(),
      icon: Activity,
      color: "#F2C14E",
    },
    {
      label: "Vehicles (Week)",
      value: weekTxns.length.toString(),
      icon: Truck,
      color: "#69B4FF",
    },
    {
      label: "Total Weight Today",
      value: todayNet > 0 ? `${(todayNet / 1000).toFixed(1)}T` : "0",
      icon: Calendar,
      color: "#FF8A65",
    },
  ];

  const startWeighing = () => {
    setIsWeighing(true);
    setLiveWeight(Math.floor(Math.random() * 5000) + 15000);
  };
  const stopWeighing = () => {
    setIsWeighing(false);
    setLiveWeight(0);
  };

  const displayValue = isWeighing ? liveWeight : null;
  const currentTareFromPending = pendingTxns[0]?.tareWeight ?? 0;
  const currentNet =
    displayValue !== null
      ? Math.max(0, displayValue - currentTareFromPending)
      : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#E6ECEF" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6F7C85" }}>
            {format(new Date(), "EEEE, dd MMMM yyyy")} —{" "}
            {settings.weighbridgeName}
          </p>
        </div>
        <Button
          onClick={() => navigate({ to: "/new-transaction" })}
          data-ocid="dashboard.primary_button"
          className="gap-2 font-medium"
          style={{ background: "#22E66A", color: "#0B3A20" }}
        >
          <Plus className="w-4 h-4" />
          New Transaction
        </Button>
      </div>

      {/* Hero row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Digital weight display */}
        <div
          className="col-span-2 rounded-xl p-6"
          style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#6F7C85" }}
            >
              Live Weight Reading
            </span>
            <div className="flex items-center gap-2">
              {isWeighing ? (
                <span
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "#153C28", color: "#22E66A" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "#22E66A" }}
                  />
                  LIVE
                </span>
              ) : (
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "#202529", color: "#6F7C85" }}
                >
                  IDLE
                </span>
              )}
            </div>
          </div>

          {/* Main display */}
          <div className="flex items-end gap-4 mb-4">
            <div
              className={`text-7xl font-bold leading-none ${
                displayValue !== null ? "digital-display" : "digital-idle"
              }`}
              style={{
                fontFamily: '"Orbitron", "GeistMono", monospace',
                letterSpacing: "-0.02em",
              }}
              data-ocid="dashboard.canvas_target"
            >
              {displayValue !== null
                ? displayValue.toLocaleString().padStart(6, "0")
                : "------"}
            </div>
            <div
              className="text-2xl font-bold pb-1 digital-display-sm"
              style={{ fontFamily: '"Orbitron", monospace' }}
            >
              {settings.unit}
            </div>
          </div>

          {/* Tare / Net row */}
          <div className="flex gap-8">
            <div>
              <span
                className="text-xs uppercase tracking-widest block mb-1"
                style={{ color: "#6F7C85" }}
              >
                Tare
              </span>
              <span
                className="text-2xl font-bold digital-display-sm"
                style={{ fontFamily: '"Orbitron", monospace' }}
              >
                {currentTareFromPending > 0
                  ? currentTareFromPending.toLocaleString()
                  : "------"}
              </span>
            </div>
            <div className="w-px" style={{ background: "#2A3136" }} />
            <div>
              <span
                className="text-xs uppercase tracking-widest block mb-1"
                style={{ color: "#6F7C85" }}
              >
                Net
              </span>
              <span
                className={`text-2xl font-bold ${
                  displayValue !== null ? "digital-display-sm" : "digital-idle"
                }`}
                style={{ fontFamily: '"Orbitron", monospace' }}
              >
                {displayValue !== null ? currentNet.toLocaleString() : "------"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 mt-5">
            {!isWeighing ? (
              <Button
                type="button"
                onClick={startWeighing}
                size="sm"
                data-ocid="dashboard.secondary_button"
                style={{
                  background: "#153C28",
                  color: "#22E66A",
                  border: "1px solid #22E66A44",
                }}
              >
                Start Weighing
              </Button>
            ) : (
              <Button
                type="button"
                onClick={stopWeighing}
                size="sm"
                data-ocid="dashboard.toggle"
                variant="outline"
                style={{ borderColor: "#2A3136", color: "#9AA6AE" }}
              >
                Stop
              </Button>
            )}
            <Button
              type="button"
              onClick={() => navigate({ to: "/new-transaction" })}
              size="sm"
              variant="outline"
              style={{ borderColor: "#2A3136", color: "#9AA6AE" }}
            >
              Record Transaction
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="space-y-3">
          {statCards.map((card, i) => (
            <div
              key={card.label}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{
                background: "#1B1F22",
                border: "1px solid #2A3136",
                borderRight: `3px solid ${card.color}`,
                boxShadow: `2px 0 12px ${card.color}44`,
              }}
              data-ocid={`dashboard.card.${i + 1}`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${card.color}18` }}
              >
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: "#E6ECEF" }}>
                  {card.value}
                </div>
                <div className="text-xs" style={{ color: "#6F7C85" }}>
                  {card.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div
        className="rounded-xl"
        style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "#2A3136" }}
        >
          <span className="font-semibold text-sm" style={{ color: "#E6ECEF" }}>
            Recent Transactions
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/transactions" })}
            style={{ color: "#22E66A" }}
            data-ocid="dashboard.link"
          >
            View All
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid #2A3136" }}>
                {[
                  "Txn ID",
                  "Date/Time",
                  "Vehicle",
                  "Driver",
                  "Material",
                  "Net Weight",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-medium"
                    style={{ color: "#6F7C85" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTxns.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center"
                    style={{ color: "#6F7C85" }}
                    data-ocid="dashboard.empty_state"
                  >
                    No transactions yet
                  </td>
                </tr>
              ) : (
                recentTxns.map((t, i) => (
                  <tr
                    key={t.id}
                    className="hover:bg-white/5 transition-colors"
                    style={{ borderBottom: "1px solid #2A313620" }}
                    data-ocid={`dashboard.row.${i + 1}`}
                  >
                    <td
                      className="px-4 py-3 font-mono"
                      style={{ color: "#22E66A" }}
                    >
                      {t.id}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#9AA6AE" }}>
                      {format(new Date(t.entryTime), "dd/MM/yy HH:mm")}
                    </td>
                    <td
                      className="px-4 py-3 font-medium"
                      style={{ color: "#E6ECEF" }}
                    >
                      {t.vehicleNumber}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#9AA6AE" }}>
                      {t.driverName}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#9AA6AE" }}>
                      {t.material}
                    </td>
                    <td
                      className="px-4 py-3 font-mono font-bold"
                      style={{ color: "#E6ECEF" }}
                    >
                      {t.netWeight > 0
                        ? `${t.netWeight.toLocaleString()} KG`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs py-2" style={{ color: "#6F7C85" }}>
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: "#22E66A" }}
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
