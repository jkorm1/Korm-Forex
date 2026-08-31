"use client";
import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CircleDollarSign,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Trade } from "@/lib/types";
import { calculateAnalytics, withinDays } from "@/lib/analytics";

const RANGE_DAYS: Record<string, number | null> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
  ALL: null,
};

const RANGE_LABEL: Record<string, string> = {
  "7D": "Last 7 days",
  "30D": "Last 30 days",
  "90D": "Last 90 days",
  ALL: "All time",
};

function formatMoney(value: number) {
  return `${value >= 0 ? "+" : "-"}$${Math.abs(value).toLocaleString()}`;
}

function formatPct(value: number) {
  return `${value >= 0 ? "↑" : "↓"} ${Math.abs(value).toFixed(1)}%`;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "green" | "red" | "amber" | "blue" | "neutral";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function StatCard({
  label,
  value,
  detail,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  positive?: boolean;
  icon: typeof TrendingUp;
}) {
  return (
    <Card className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={17} />
        </span>
      </div>
      <strong
        className={
          positive === undefined
            ? ""
            : positive
              ? "value-positive"
              : "value-negative"
        }
      >
        {value}
      </strong>
      <span
        className={`stat-detail ${positive === undefined ? "" : positive ? "positive" : "negative"}`}
      >
        {detail}
      </span>
    </Card>
  );
}

export function DashboardPage({ trades }: { trades: Trade[] }) {
  const [range, setRange] = useState("30D");

  // Split trades into the current window and the equal-length window
  // immediately before it, purely from the sheet's own dates.
  const { current, previous } = useMemo(() => {
    const days = RANGE_DAYS[range];
    if (days === null) {
      return { current: trades, previous: [] as Trade[] };
    }
    const now = new Date();
    return {
      current: trades.filter((t) => withinDays(t.date, days, now)),
      previous: trades.filter(
        (t) =>
          !withinDays(t.date, days, now) && withinDays(t.date, days * 2, now),
      ),
    };
  }, [trades, range]);

  const analytics = useMemo(() => calculateAnalytics(current), [current]);
  const prior = useMemo(() => calculateAnalytics(previous), [previous]);

  const hasPrior = previous.some((t) => t.outcome !== "Pending");
  const plChangePct =
    hasPrior && prior.totalPL !== 0
      ? ((analytics.totalPL - prior.totalPL) / Math.abs(prior.totalPL)) * 100
      : null;
  const winRateChangePts = hasPrior ? analytics.winRate - prior.winRate : null;

  const equity = analytics.equityCurve;
  const pairData = analytics.byPair;
  const outcomeData = [
    { name: "Wins", value: analytics.wins, color: "var(--green)" },
    { name: "Losses", value: analytics.losses, color: "var(--red)" },
    { name: "BE", value: analytics.breakeven, color: "var(--amber)" },
  ];
  const recent = [...current].slice(-5).reverse();

  const totalTradesDetail =
    analytics.pendingCount > 0
      ? `${analytics.pendingCount} awaiting outcome`
      : `Across ${analytics.instrumentCount} instrument${analytics.instrumentCount === 1 ? "" : "s"}`;

  return (
    <div className="dashboard-content">
      <div className="toolbar">
        <div className="range-tabs">
          {["7D", "30D", "90D", "ALL"].map((item) => (
            <button
              key={item}
              className={range === item ? "selected" : ""}
              onClick={() => setRange(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button className="filter-button">
          <SlidersHorizontal size={15} /> Filters{" "}
          <span className="filter-dot" />
        </button>
      </div>
      <div className="stats-grid">
        <StatCard
          label="Total P/L"
          value={formatMoney(analytics.totalPL)}
          detail={
            plChangePct === null
              ? "Not enough closed trades yet"
              : `${formatPct(plChangePct)} vs. prior period`
          }
          positive={analytics.totalPL >= 0}
          icon={CircleDollarSign}
        />
        <StatCard
          label="Win rate"
          value={`${analytics.winRate.toFixed(1)}%`}
          detail={
            winRateChangePts === null
              ? "Not enough closed trades yet"
              : `${formatPct(winRateChangePts)} vs. prior period`
          }
          positive={
            winRateChangePts === null ? undefined : winRateChangePts >= 0
          }
          icon={Trophy}
        />
        <StatCard
          label="Total trades"
          value={String(analytics.totalTrades).padStart(2, "0")}
          detail={totalTradesDetail}
          icon={Activity}
        />
        <StatCard
          label="Current streak"
          value={`${analytics.streak} wins`}
          detail={`Best: ${analytics.bestStreak} wins`}
          positive={analytics.streak > 0}
          icon={TrendingUp}
        />
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Performance overview</span>
          <h2>Your edge, at a glance</h2>
        </div>
        <Badge tone="green">
          <span className="status-dot" /> Live data
        </Badge>
      </div>
      <div className="chart-grid">
        <Card className="equity-card">
          <div className="card-heading">
            <div>
              <h3>Equity curve</h3>
              <p>Net cumulative performance (closed trades)</p>
            </div>
            <div className="chart-value">
              <strong>{formatMoney(analytics.totalPL)}</strong>
              <span>
                {RANGE_LABEL[range]} <TrendingUp size={13} />
              </span>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equity}>
                <defs>
                  <linearGradient id="equityFill" x1="0" x2="0" y1="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--blue)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--blue)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--panel-strong)",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    color: "var(--text)",
                  }}
                  formatter={(v) => [`$${v}`, "Equity"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--blue)"
                  strokeWidth={2.5}
                  fill="url(#equityFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="insight">
            <Zap size={14} />
            {equity.length === 0
              ? "No closed trades for this period yet."
              : analytics.totalPL >= 0
                ? "Your equity curve is trending upward for this period."
                : "Your equity curve is down for this period — worth a review."}
          </p>
        </Card>
        <Card className="outcome-card">
          <div className="card-heading">
            <div>
              <h3>Trade outcomes</h3>
              <p>Win / loss distribution</p>
            </div>
            <button className="more-button" aria-label="More options">
              •••
            </button>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={83}
                  paddingAngle={4}
                  stroke="none"
                >
                  {outcomeData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--panel-strong)",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{analytics.winRate.toFixed(0)}%</strong>
              <span>win rate</span>
            </div>
          </div>
          <div className="legend">
            {outcomeData.map((item) => (
              <div key={item.name}>
                <span
                  className="legend-dot"
                  style={{ background: item.color }}
                />
                {item.name}
                <b>{item.value}</b>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="mini-grid">
        <Card>
          <div className="card-heading">
            <div>
              <h3>P/L by instrument</h3>
              <p>Where your edge is strongest</p>
            </div>
            <BarChart3 size={17} className="muted-icon" />
          </div>
          <div className="bar-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pairData} layout="vertical" barSize={18}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                  width={64}
                />
                <Bar dataKey="value" radius={[0, 5, 5, 0]} fill="var(--blue)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="insight">
            <Zap size={14} />
            {analytics.topPair
              ? `${analytics.topPair.name} is your top performer${
                  analytics.topPair.value < 0 ? " (still net negative)" : ""
                } this period.`
              : "Not enough closed trades yet to identify a top performer."}
          </p>
        </Card>
        <Card>
          <div className="card-heading">
            <div>
              <h3>Setup quality</h3>
              <p>Checklist completion vs. win rate</p>
            </div>
            <ShieldCheck size={17} className="muted-icon" />
          </div>
          <div className="quality-row">
            <div className="quality-score">
              <strong>{analytics.qualityWinRate.toFixed(0)}%</strong>
              <span>Complete setups</span>
            </div>
            <div className="quality-score muted-score">
              <strong>{analytics.incompleteWinRate.toFixed(0)}%</strong>
              <span>Incomplete</span>
            </div>
          </div>
          <div className="progress-line">
            <span
              style={{ width: `${Math.max(analytics.qualityWinRate, 8)}%` }}
            />
            <i style={{ left: `${Math.min(analytics.qualityWinRate, 92)}%` }} />
          </div>
          <p className="insight">
            <Zap size={14} />
            {analytics.qualityWinRate > analytics.incompleteWinRate
              ? "Full checklists are winning more often for you."
              : "No clear edge from full checklists yet in this period."}
          </p>
        </Card>
      </div>
      <Card className="recent-card">
        <div className="card-heading">
          <div>
            <h3>Recent trades</h3>
            <p>Your latest journal activity</p>
          </div>
          <button className="text-button">
            View trade log <span>→</span>
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Instrument</th>
                <th>Side</th>
                <th>Entry</th>
                <th>Outcome</th>
                <th className="align-right">P/L</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No trades in this period.
                  </td>
                </tr>
              ) : (
                recent.map((trade) => {
                  const pending = trade.outcome === "Pending";
                  return (
                    <tr key={trade.id}>
                      <td>{trade.date}</td>
                      <td>
                        <strong>{trade.pair}</strong>
                      </td>
                      <td>
                        <Badge tone={trade.order === "Buy" ? "blue" : "amber"}>
                          {trade.order}
                        </Badge>
                      </td>
                      <td>{trade.entry.toLocaleString()}</td>
                      <td>
                        <Badge
                          tone={
                            trade.outcome === "Win"
                              ? "green"
                              : trade.outcome === "Loss"
                                ? "red"
                                : pending
                                  ? "neutral"
                                  : "amber"
                          }
                        >
                          {trade.outcome}
                        </Badge>
                      </td>
                      <td
                        className={`align-right pl ${
                          pending
                            ? ""
                            : trade.pl >= 0
                              ? "value-positive"
                              : "value-negative"
                        }`}
                      >
                        {pending ? "—" : formatMoney(trade.pl)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
