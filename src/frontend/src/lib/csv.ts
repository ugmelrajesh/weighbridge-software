import type { Transaction } from "../types";

export function exportTransactionsCSV(
  transactions: Transaction[],
  filename = "weighbridge-transactions.csv",
): void {
  const headers = [
    "Transaction ID",
    "Entry Date/Time",
    "Exit Date/Time",
    "Vehicle Number",
    "Driver Name",
    "Material",
    "Gross Weight (KG)",
    "Tare Weight (KG)",
    "Net Weight (KG)",
    "Status",
    "Operator",
    "Remarks",
  ];

  const rows = transactions.map((t) => [
    t.id,
    t.entryTime,
    t.exitTime ?? "",
    t.vehicleNumber,
    t.driverName,
    t.material,
    t.grossWeight,
    t.tareWeight,
    t.netWeight,
    t.status,
    t.operator,
    t.remarks ?? "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  triggerDownload(csvContent, filename, "text/csv");
}

export function exportReportCSV(
  data: {
    label: string;
    transactions: number;
    grossWeight: number;
    tareWeight: number;
    netWeight: number;
  }[],
  filename = "weighbridge-report.csv",
): void {
  const headers = [
    "Period",
    "Transactions",
    "Gross Weight (KG)",
    "Tare Weight (KG)",
    "Net Weight (KG)",
  ];
  const rows = data.map((d) => [
    d.label,
    d.transactions,
    d.grossWeight,
    d.tareWeight,
    d.netWeight,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  triggerDownload(csvContent, filename, "text/csv");
}

function triggerDownload(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
