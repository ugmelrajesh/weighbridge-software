import { format } from "date-fns";
import { getSettings } from "../lib/storage";
import type { Transaction } from "../types";

interface Props {
  transaction: Transaction;
}

export default function PrintSlip({ transaction: t }: Props) {
  const settings = getSettings();

  return (
    <div id="print-slip">
      <style>{`
        @media screen {
          #print-slip { display: none; }
        }
        @media print {
          body * { visibility: hidden !important; }
          #print-slip { display: block !important; visibility: visible !important; position: fixed; left: 0; top: 0; width: 100%; max-width: 100%; border: none; }
          #print-slip * { visibility: visible !important; }
        }
        #print-slip {
          font-family: 'Courier New', monospace;
          max-width: 380px;
          margin: 20px auto;
          padding: 20px;
          border: 2px solid #000;
          font-size: 12px;
          line-height: 1.6;
          color: #000;
          background: #fff;
        }
        .slip-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .slip-sub { text-align: center; font-size: 11px; margin-bottom: 2px; }
        .slip-divider { border-top: 1px dashed #000; margin: 10px 0; }
        .slip-double { border-top: 3px double #000; margin: 10px 0; }
        .slip-row { display: flex; justify-content: space-between; padding: 2px 0; }
        .slip-label { font-weight: bold; }
        .slip-weight { font-size: 18px; font-weight: bold; text-align: center; margin: 8px 0; letter-spacing: 2px; }
        .slip-footer { text-align: center; font-size: 10px; margin-top: 8px; }
        .slip-stamp { border: 2px solid #000; padding: 4px 10px; display: inline-block; font-size: 11px; font-weight: bold; }
      `}</style>

      <div className="slip-title">{settings.companyName.toUpperCase()}</div>
      <div className="slip-sub">{settings.address}</div>
      <div className="slip-sub">{settings.city}</div>
      <div className="slip-sub">Tel: {settings.phone}</div>
      <div className="slip-sub">License: {settings.licenseNumber}</div>

      <div className="slip-double" />

      <div
        style={{
          textAlign: "center",
          fontSize: "13px",
          fontWeight: "bold",
          marginBottom: "6px",
        }}
      >
        WEIGHBRIDGE SLIP / WEIGHT CERTIFICATE
      </div>
      <div
        style={{ textAlign: "center", fontSize: "11px", marginBottom: "8px" }}
      >
        {settings.weighbridgeName} — {settings.weighbridgeLocation}
      </div>

      <div className="slip-divider" />

      <div className="slip-row">
        <span className="slip-label">Transaction ID:</span>
        <span>{t.id}</span>
      </div>
      <div className="slip-row">
        <span className="slip-label">Date &amp; Time:</span>
        <span>{format(new Date(t.entryTime), "dd/MM/yyyy HH:mm:ss")}</span>
      </div>
      {t.exitTime && (
        <div className="slip-row">
          <span className="slip-label">Exit Time:</span>
          <span>{format(new Date(t.exitTime), "dd/MM/yyyy HH:mm:ss")}</span>
        </div>
      )}
      <div className="slip-row">
        <span className="slip-label">Vehicle No:</span>
        <span>{t.vehicleNumber}</span>
      </div>
      <div className="slip-row">
        <span className="slip-label">Driver:</span>
        <span>{t.driverName}</span>
      </div>
      <div className="slip-row">
        <span className="slip-label">Material:</span>
        <span>{t.material}</span>
      </div>
      {t.operator && (
        <div className="slip-row">
          <span className="slip-label">Operator:</span>
          <span>{t.operator}</span>
        </div>
      )}

      <div className="slip-divider" />

      <div className="slip-row">
        <span className="slip-label">GROSS WEIGHT:</span>
        <span>
          {t.grossWeight.toLocaleString()} {settings.unit}
        </span>
      </div>
      <div className="slip-row">
        <span className="slip-label">TARE WEIGHT:</span>
        <span>
          {t.tareWeight.toLocaleString()} {settings.unit}
        </span>
      </div>

      <div className="slip-double" />

      <div className="slip-weight">
        NET WEIGHT: {t.netWeight.toLocaleString()} {settings.unit}
      </div>

      <div className="slip-double" />

      {t.remarks && (
        <div className="slip-row">
          <span className="slip-label">Remarks:</span>
          <span>{t.remarks}</span>
        </div>
      )}

      <div className="slip-footer">
        <div style={{ marginBottom: "20px" }}>
          Authorized Signature: ___________________
        </div>
        <div>
          <span className="slip-stamp">
            {t.status === "completed" ? "✓ COMPLETED" : "⏳ PENDING"}
          </span>
        </div>
        <div style={{ marginTop: "12px" }}>
          This is a computer-generated document.
        </div>
        <div>Printed: {format(new Date(), "dd/MM/yyyy HH:mm:ss")}</div>
      </div>
    </div>
  );
}
