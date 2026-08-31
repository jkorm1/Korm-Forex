"use client";
import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import type { Trade } from "@/lib/types";

const CHECK_LABELS = [
  "Largest Bar",
  "Space Left",
  "Engulfing",
  "HH",
  "LL",
  "BOS",
  "Same Dir.",
];

function money(value: number) {
  return `${value >= 0 ? "+" : "-"}$${Math.abs(value).toFixed(2)}`;
}

function outcomeTone(outcome: Trade["outcome"]) {
  if (outcome === "Win") return "green";
  if (outcome === "Loss") return "red";
  if (outcome === "Pending") return "neutral";
  return "amber"; // BE
}

function emptyTrade(): Trade {
  return {
    id: "new",
    date: new Date().toISOString().slice(0, 16),
    pair: "XAU/USD",
    order: "Buy",
    sameDirection: false,
    setupQuality: "0/7",
    entry: 0,
    outcome: "Pending",
    pl: 0,
    ratio: 0,
    checklist: Array(7).fill(false),
  };
}

/** Forces P/L sign to match Outcome, same rule the sheet itself uses. */
function signedPl(outcome: Trade["outcome"], pl: number) {
  if (outcome === "Pending") return 0;
  if (outcome === "Loss") return -Math.abs(pl);
  if (outcome === "Win") return Math.abs(pl);
  return pl; // BE - left as entered
}

/** A cell that shows as plain text until clicked, then becomes an input. */
function EditableCell({
  value,
  display,
  type = "text",
  onCommit,
}: {
  value: string | number;
  display: string;
  type?: "text" | "number" | "datetime-local";
  onCommit: (raw: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (!editing) {
    return (
      <td
        className="cell-editable"
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
      >
        {display}
      </td>
    );
  }

  return (
    <td className="cell-editing">
      <input
        autoFocus
        type={type}
        step={type === "number" ? "any" : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft !== String(value)) onCommit(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
      />
    </td>
  );
}

export function TradeLogPage({
  trades,
  onCreate,
  onUpdate,
  onDelete,
}: {
  trades: Trade[];
  onCreate: (trade: Trade) => Promise<void>;
  onUpdate: (trade: Trade) => Promise<void>;
  onDelete: (trade: Trade) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const rows = trades.filter((t) =>
    `${t.date} ${t.pair} ${t.order} ${t.outcome}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  function patch(trade: Trade, changes: Partial<Trade>) {
    const next = { ...trade, ...changes };
    if ("checklist" in changes) {
      next.sameDirection = next.checklist[6];
      next.setupQuality = `${next.checklist.filter(Boolean).length}/7`;
    }
    if ("outcome" in changes || "pl" in changes) {
      next.pl = signedPl(next.outcome, next.pl);
    }
    return next;
  }

  async function addRow() {
    setAdding(true);
    try {
      await onCreate(emptyTrade());
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="dashboard-content">
      <div className="toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            placeholder="Search trades..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="primary-button" onClick={addRow} disabled={adding}>
          <Plus size={16} /> {adding ? "Adding..." : "Add row"}
        </button>
      </div>

      <section className="panel recent-card">
        <div className="card-heading">
          <div>
            <h3>Trade log</h3>
            <p>
              {rows.length} entries - click any cell to edit, just like the
              sheet
            </p>
          </div>
        </div>

        <div className="table-scroll">
          <table className="spreadsheet-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Pair</th>
                <th>Order</th>
                {CHECK_LABELS.map((label) => (
                  <th key={label}>{label}</th>
                ))}
                <th>Setup</th>
                <th>Entry</th>
                <th>Outcome</th>
                <th>P/L ($)</th>
                <th>Ratio (R:R)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <EditableCell
                    value={t.date}
                    display={new Date(t.date).toLocaleString()}
                    type="datetime-local"
                    onCommit={(raw) => onUpdate(patch(t, { date: raw }))}
                  />

                  <td>
                    <select
                      value={t.pair}
                      onChange={(e) =>
                        onUpdate(
                          patch(t, { pair: e.target.value as Trade["pair"] }),
                        )
                      }
                    >
                      <option>XAU/USD</option>
                      <option>NAS100</option>
                    </select>
                  </td>

                  <td>
                    <select
                      value={t.order}
                      onChange={(e) =>
                        onUpdate(
                          patch(t, { order: e.target.value as Trade["order"] }),
                        )
                      }
                    >
                      <option>Buy</option>
                      <option>Sell</option>
                    </select>
                  </td>

                  {t.checklist.map((checked, index) => (
                    <td key={index} className="cell-checkbox">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const checklist = [...t.checklist];
                          checklist[index] = !checklist[index];
                          onUpdate(patch(t, { checklist }));
                        }}
                      />
                    </td>
                  ))}

                  <td className="cell-readonly">{t.setupQuality}</td>

                  <EditableCell
                    value={t.entry}
                    display={String(t.entry)}
                    type="number"
                    onCommit={(raw) =>
                      onUpdate(patch(t, { entry: Number(raw) }))
                    }
                  />

                  <td>
                    <select
                      className={`badge-select badge-${outcomeTone(t.outcome)}`}
                      value={t.outcome}
                      onChange={(e) =>
                        onUpdate(
                          patch(t, {
                            outcome: e.target.value as Trade["outcome"],
                          }),
                        )
                      }
                    >
                      <option>Win</option>
                      <option>Loss</option>
                      <option>BE</option>
                      <option>Pending</option>
                    </select>
                  </td>

                  <EditableCell
                    value={t.pl}
                    display={t.outcome === "Pending" ? "—" : money(t.pl)}
                    type="number"
                    onCommit={(raw) => onUpdate(patch(t, { pl: Number(raw) }))}
                  />

                  <EditableCell
                    value={t.ratio}
                    display={`1:${t.ratio}`}
                    type="number"
                    onCommit={(raw) =>
                      onUpdate(patch(t, { ratio: Number(raw) }))
                    }
                  />

                  <td>
                    <button
                      className="icon-button danger"
                      aria-label={`Delete ${t.pair}`}
                      onClick={() => onDelete(t)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
