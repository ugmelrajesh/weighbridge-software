import { cn } from "@/lib/utils";
import { Link, useRouter } from "@tanstack/react-router";
import {
  BarChart2,
  List,
  PlusCircle,
  Printer,
  Settings,
  Weight,
} from "lucide-react";
import { getSettings } from "../lib/storage";

const navItems = [
  { to: "/gate-pass", icon: Printer, label: "Gate Pass" },
  { to: "/new-transaction", icon: PlusCircle, label: "New Transaction" },
  { to: "/transactions", icon: List, label: "Transactions" },
  { to: "/reports", icon: BarChart2, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const settings = getSettings();

  return (
    <aside
      className="no-print w-[240px] flex-shrink-0 flex flex-col h-full border-r"
      style={{ background: "#1B1F22", borderColor: "#2A3136" }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-5 py-5 border-b"
        style={{ borderColor: "#2A3136" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "#0B3A20" }}
        >
          <Weight className="w-5 h-5" style={{ color: "#22E66A" }} />
        </div>
        <div>
          <div
            className="font-bold text-sm tracking-wide"
            style={{ color: "#E6ECEF" }}
          >
            WeighMaster
          </div>
          <div className="text-xs" style={{ color: "#6F7C85" }}>
            v2.0 Pro
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active =
            pathname === to || (to === "/gate-pass" && pathname === "/");
          return (
            <Link
              key={to}
              to={to}
              data-ocid={`nav.${label.toLowerCase().replace(/\s+/g, "_")}.link`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                !active && "hover:bg-white/5",
              )}
              style={
                active
                  ? { background: "#153C28", color: "#22E66A" }
                  : { color: "#9AA6AE" }
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "#2A3136" }}>
        <div className="text-xs" style={{ color: "#6F7C85" }}>
          <div className="font-medium mb-1" style={{ color: "#9AA6AE" }}>
            {settings.companyName}
          </div>
          <div>{settings.weighbridgeName}</div>
          <div className="mt-2 flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#22E66A" }}
            />
            System Online
          </div>
        </div>
      </div>
    </aside>
  );
}
