"use client";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Database,
  Menu,
  Plus,
  Settings2,
  Zap,
} from "lucide-react";
import type { Trade } from "@/lib/types";
import { DashboardPage } from "@/components/dashboard-page";
import { TradeLogPage } from "@/components/trade-log-page";
const navItems = [
  { label: "Dashboard", icon: BarChart3 },
  { label: "Trade Log", icon: BookOpen },
  { label: "Add Trade", icon: Plus },
];
function Sidebar({
  active,
  onChange,
  open,
  onClose,
}: {
  active: string;
  onChange: (value: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <Zap size={17} fill="currentColor" />
          </span>
          <span>
            KORM <b>FOREX</b>
          </span>
        </div>
        <div className="workspace">
          <span className="status-dot" /> Live workspace{" "}
          <ChevronDown size={14} />
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${active === label ? "active" : ""}`}
              onClick={() => {
                onChange(label);
                onClose();
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sync-card">
            <div className="sync-icon">
              <Database size={16} />
            </div>
            <div>
              <strong>Sheet synced</strong>
              <span>Google Sheets API</span>
            </div>
            <span className="sync-pulse" />
          </div>
          <button className="nav-item">
            <Settings2 size={18} />
            <span>Settings</span>
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
    </>
  );
}
export default function Page() {
  const [active, setActive] = useState("Dashboard");
  const [open, setOpen] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  useEffect(() => {
    fetch("/api/trades")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setTrades(data.trades))
      .catch(() => undefined);
  }, []);
  async function create(trade: Trade) {
    const response = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trade),
    });
    if (!response.ok) throw new Error("Could not add trade");
    const data = await response.json();
    setTrades((current) => [...current, data.trade]);
  }
  async function update(trade: Trade) {
    const response = await fetch(`/api/trades/${trade.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trade),
    });
    if (!response.ok) throw new Error("Could not update trade");
    setTrades((current) =>
      current.map((item) => (item.id === trade.id ? trade : item)),
    );
  }
  async function remove(trade: Trade) {
    if (!window.confirm("Delete this trade from Google Sheets?")) return;
    const response = await fetch(`/api/trades/${trade.id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Could not delete trade");
    setTrades((current) => current.filter((item) => item.id !== trade.id));
  }
  return (
    <main className="app-shell">
      <Sidebar
        active={active}
        onChange={setActive}
        open={open}
        onClose={() => setOpen(false)}
      />
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div>
            <div className="eyebrow">Workspace / {active}</div>
            <h1>{active === "Dashboard" ? "Good morning, Korm." : active}</h1>
          </div>
        </header>
        {active === "Dashboard" ? (
          <DashboardPage trades={trades} />
        ) : (
          <TradeLogPage
            trades={trades}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />
        )}
      </div>
    </main>
  );
}
