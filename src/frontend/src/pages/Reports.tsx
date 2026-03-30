import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { exportReportCSV } from "../lib/csv";
import { getTransactions } from "../lib/storage";
import type { Transaction } from "../types";

type Period = "daily" | "weekly" | "monthly";

interface PeriodData {
  label: string;
  transactions: number;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
}

function buildPeriodData(txns: Transaction[], period: Period): PeriodData[] {
  const now = new Date();
  if (period === "daily") {
    const days = eachDayOfInterval({ start: subDays(now, 13), end: now });
    return days.map((day) => {
      const start = startOfDay(day);
      const end = endOfDay(day);
      const slice = txns.filter((t) => {
        const d = new Date(t.entryTime);
        return d >= start && d <= end;
      });
      return {
        label: format(day, "dd/MM"),
        transactions: slice.length,
        grossWeight: slice.reduce((s, t) => s + t.grossWeight, 0),
        tareWeight: slice.reduce((s, t) => s + t.tareWeight, 0),
        netWeight: slice.reduce((s, t) => s + t.netWeight, 0),
      };
    });
  }
  if (period === "weekly") {
    const weeks = eachWeekOfInterval(
      { start: subWeeks(now, 11), end: now },
      { weekStartsOn: 1 },
    );
    return weeks.map((week) => {
      const start = startOfWeek(week, { weekStartsOn: 1 });
      const end = endOfWeek(week, { weekStartsOn: 1 });
      const slice = txns.filter((t) => {
        const d = new Date(t.entryTime);
        return d >= start && d <= end;
      });
      return {
        label: `W${format(week, "ww")}`,
        transactions: slice.length,
        grossWeight: slice.reduce((s, t) => s + t.grossWeight, 0),
        tareWeight: slice.reduce((s, t) => s + t.tareWeight, 0),
        netWeight: slice.reduce((s, t) => s + t.netWeight, 0),
      };
    });
  }
  // monthly
  const months = eachMonthOfInterval({ start: subMonths(now, 11), end: now });
  return months.map((month) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const slice = txns.filter((t) => {
      const d = new Date(t.entryTime);
      return d >= start && d <= end;
    });
    return {
      label: format(month, "MMM yy"),
      transactions: slice.length,
      grossWeight: slice.reduce((s, t) => s + t.grossWeight, 0),
      tareWeight: slice.reduce((s, t) => s + t.tareWeight, 0),
      netWeight: slice.reduce((s, t) => s + t.netWeight, 0),
    };
  });
}

function SummaryCard({
  label,
  value,
  sub,
}: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
    >
      <div
        className="text-xs uppercase tracking-widest mb-2"
        style={{ color: "#6F7C85" }}
      >
        {label}
      </div>
      <div className="text-3xl font-bold" style={{ color: "#E6ECEF" }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-1" style={{ color: "#6F7C85" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg p-3 text-xs"
      style={{
        background: "#202529",
        border: "1px solid #2A3136",
        color: "#E6ECEF",
      }}
    >
      <p className="font-bold mb-1" style={{ color: "#22E66A" }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toLocaleString()} KG
        </p>
      ))}
    </div>
  );
};

export default function Reports() {
  const [tab, setTab] = useState<Period>("daily");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refresh = useCallback(() => setTransactions(getTransactions()), []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const data = buildPeriodData(transactions, tab);
  const recent = data.slice(-7);

  const totals = data.reduce(
    (acc, d) => ({
      transactions: acc.transactions + d.transactions,
      grossWeight: acc.grossWeight + d.grossWeight,
      tareWeight: acc.tareWeight + d.tareWeight,
      netWeight: acc.netWeight + d.netWeight,
    }),
    { transactions: 0, grossWeight: 0, tareWeight: 0, netWeight: 0 },
  );

  const periodLabel =
    tab === "daily"
      ? "Last 14 Days"
      : tab === "weekly"
        ? "Last 12 Weeks"
        : "Last 12 Months";

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#E6ECEF" }}>
            Reports
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6F7C85" }}>
            Summary analytics and weight statistics
          </p>
        </div>
        <Button
          onClick={() => exportReportCSV(data, `weighbridge-report-${tab}.csv`)}
          size="sm"
          variant="outline"
          className="gap-2"
          style={{ borderColor: "#2A3136", color: "#9AA6AE" }}
          data-ocid="reports.primary_button"
        >
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Period)}>
        <TabsList
          style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
        >
          <TabsTrigger
            value="daily"
            data-ocid="reports.tab"
            style={
              tab === "daily"
                ? { background: "#153C28", color: "#22E66A" }
                : { color: "#9AA6AE" }
            }
          >
            Daily
          </TabsTrigger>
          <TabsTrigger
            value="weekly"
            data-ocid="reports.tab"
            style={
              tab === "weekly"
                ? { background: "#153C28", color: "#22E66A" }
                : { color: "#9AA6AE" }
            }
          >
            Weekly
          </TabsTrigger>
          <TabsTrigger
            value="monthly"
            data-ocid="reports.tab"
            style={
              tab === "monthly"
                ? { background: "#153C28", color: "#22E66A" }
                : { color: "#9AA6AE" }
            }
          >
            Monthly
          </TabsTrigger>
        </TabsList>

        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
          <TabsContent key={p} value={p} className="space-y-5 mt-5">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              <SummaryCard
                label="Total Transactions"
                value={totals.transactions.toString()}
                sub={periodLabel}
              />
              <SummaryCard
                label="Total Gross Weight"
                value={`${(totals.grossWeight / 1000).toFixed(1)} MT`}
                sub={`${totals.grossWeight.toLocaleString()} KG`}
              />
              <SummaryCard
                label="Total Tare Weight"
                value={`${(totals.tareWeight / 1000).toFixed(1)} MT`}
                sub={`${totals.tareWeight.toLocaleString()} KG`}
              />
              <SummaryCard
                label="Total Net Weight"
                value={`${(totals.netWeight / 1000).toFixed(1)} MT`}
                sub={`${totals.netWeight.toLocaleString()} KG`}
              />
            </div>

            {/* Bar chart */}
            <div
              className="rounded-xl p-5"
              style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
            >
              <h2
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: "#6F7C85" }}
              >
                Net Weight Over Time
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={recent}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2A3136"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#6F7C85", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6F7C85", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}T`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="netWeight"
                    name="Net Weight"
                    fill="#22E66A"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="grossWeight"
                    name="Gross Weight"
                    fill="#22E66A33"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Data table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "#1B1F22", border: "1px solid #2A3136" }}
            >
              <table className="w-full text-xs">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #2A3136",
                      background: "#202529",
                    }}
                  >
                    {[
                      "Period",
                      "Transactions",
                      "Gross Weight",
                      "Tare Weight",
                      "Net Weight",
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
                  {data.filter((d) => d.transactions > 0).length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center"
                        style={{ color: "#6F7C85" }}
                        data-ocid="reports.empty_state"
                      >
                        No data for this period
                      </td>
                    </tr>
                  ) : (
                    data
                      .filter((d) => d.transactions > 0)
                      .map((d, i) => (
                        <tr
                          key={d.label}
                          className="hover:bg-white/5"
                          style={{ borderBottom: "1px solid #2A313620" }}
                          data-ocid={`reports.row.${i + 1}`}
                        >
                          <td
                            className="px-4 py-2.5 font-medium"
                            style={{ color: "#E6ECEF" }}
                          >
                            {d.label}
                          </td>
                          <td
                            className="px-4 py-2.5"
                            style={{ color: "#9AA6AE" }}
                          >
                            {d.transactions}
                          </td>
                          <td
                            className="px-4 py-2.5 font-mono"
                            style={{ color: "#9AA6AE" }}
                          >
                            {d.grossWeight.toLocaleString()} KG
                          </td>
                          <td
                            className="px-4 py-2.5 font-mono"
                            style={{ color: "#9AA6AE" }}
                          >
                            {d.tareWeight.toLocaleString()} KG
                          </td>
                          <td
                            className="px-4 py-2.5 font-mono font-bold"
                            style={{ color: "#22E66A" }}
                          >
                            {d.netWeight.toLocaleString()} KG
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
