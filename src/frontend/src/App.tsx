import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Sidebar from "./components/Layout";
import GatePass from "./pages/GatePass";
import NewTransaction from "./pages/NewTransaction";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Transactions from "./pages/Transactions";

const rootRoute = createRootRoute({
  component: () => (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0F1113" }}
    >
      <Toaster position="top-right" theme="dark" />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <GatePass />,
});

const gatePassRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gate-pass",
  component: () => <GatePass />,
});

const newTxnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/new-transaction",
  component: () => <NewTransaction />,
});

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  component: () => <Transactions />,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: () => <Reports />,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => <Settings />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  gatePassRoute,
  newTxnRoute,
  transactionsRoute,
  reportsRoute,
  settingsRoute,
]);

const hashHistory = createHashHistory();

const router = createRouter({ routeTree, history: hashHistory });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
